import { afterEach, describe, expect, it } from "vitest";
import { getScene } from "../engine/scenes";
import { applyTurn, initialState } from "../engine/transition";
import type { StoredSession } from "./sessionStore";
import {
  createSessionStore,
  CUSTOM_TTL_MS,
  SESSION_TTL_MS,
} from "./sessionStore";
import { Storage, type RedisConnection } from "./redis";
import { checkRateLimit, clientIp } from "./rateLimit";
import { getStats, incrementStat, reserveModelCall } from "./stats";
import { getDailyPlayers, recordDaily } from "./daily";
import { addToWaitlist } from "./waitlist";
import { getEnv } from "./env";

const stores: Storage[] = [];
function memory(now?: () => number) {
  const storage = new Storage({ now });
  stores.push(storage);
  return storage;
}
const scene = getScene("store-candy")!;

function finish(session: StoredSession, unsafe = false) {
  session.turns.push({
    turnIndex: 0,
    text: "A test reply",
    hits: [],
    result: applyTurn(session.scene, initialState(session.scene), [
      unsafe ? "UNSAFE" : "GIVE_IN",
    ]),
    child: null,
    tagging: "rules",
    score: null,
    daily: null,
    usedDoOver: false,
  });
}

afterEach(() => {
  for (const store of stores.splice(0)) store.close();
});

describe("session storage and fallback", () => {
  it("retains replies for at most six hours even when a session is saved again", async () => {
    let now = Date.parse("2026-11-14T15:00:00Z");
    const storage = memory(() => now);
    const sessions = createSessionStore(storage);
    const session = await sessions.createSession({
      scene,
      kind: "daily",
      dayKey: "2026-11-14",
      par: 3,
    });
    expect(await storage.mode()).toBe("memory");
    now += SESSION_TTL_MS - 100;
    finish(session);
    await sessions.saveSession(session);
    expect((await sessions.getSession(session.id))?.turns).toHaveLength(1);
    now += 101;
    expect(await sessions.getSession(session.id)).toBeNull();
    await sessions.saveSession(session);
    expect(await sessions.getSession(session.id)).toBeNull();
  });

  it("custom scenes expire after 24 hours and reads are independent clones", async () => {
    let now = 100;
    const sessions = createSessionStore(memory(() => now));
    await sessions.saveCustomScene({ ...scene, id: "custom-test" });
    const first = await sessions.getCustomScene("custom-test");
    first!.title = "An unrelated mutation";
    expect((await sessions.getCustomScene("custom-test"))?.title).toBe(
      scene.title,
    );
    now += CUSTOM_TTL_MS;
    expect(await sessions.getCustomScene("custom-test")).toBeNull();
  });

  it("serializes concurrent session mutations and releases a lock after a rejection", async () => {
    const sessions = createSessionStore(memory());
    const session = await sessions.createSession({
      scene,
      kind: "library",
      dayKey: "2026-11-14",
      par: 3,
    });
    await Promise.all(
      Array.from({ length: 20 }, () =>
        sessions.withSessionLock(session.id, async () => {
          const saved = (await sessions.getSession(session.id))!;
          await Promise.resolve();
          saved.par += 1;
          await sessions.saveSession(saved);
        }),
      ),
    );
    expect((await sessions.getSession(session.id))?.par).toBe(23);
    await expect(
      sessions.withSessionLock(session.id, async () => {
        throw new Error("failure");
      }),
    ).rejects.toThrow("failure");
    await expect(
      sessions.withSessionLock(session.id, async () => "released"),
    ).resolves.toBe("released");
  });

  it("an unreachable Redis server degrades quickly and still stores a full session", async () => {
    const storage = new Storage({ url: "redis://127.0.0.1:1" });
    stores.push(storage);
    const started = performance.now();
    const sessions = createSessionStore(storage);
    const session = await sessions.createSession({
      scene,
      kind: "library",
      dayKey: "2026-11-14",
      par: 3,
    });
    finish(session);
    await sessions.saveSession(session);
    expect(
      (await sessions.getSession(session.id))?.turns.at(-1)?.result.outcome,
    ).toBe("calm_gave_in");
    expect(await storage.mode()).toBe("memory");
    expect(performance.now() - started).toBeLessThan(1500);
  });
});

describe("rate limiting and model budget", () => {
  it("retains active quotas and statistics while session entries are evicted", async () => {
    const storage = new Storage({ maxEntries: 3 });
    stores.push(storage);
    for (let index = 0; index < 5; index++)
      await checkRateLimit("waitlist", "same-client", storage);
    expect(await reserveModelCall(storage, 1)).toBe(true);
    for (let index = 0; index < 12; index++) {
      await storage.set(`session:capacity-${index}`, { turn: index }, 60_000);
      await incrementStat("sessionsStarted", storage);
    }
    expect(
      (await checkRateLimit("waitlist", "same-client", storage)).allowed,
    ).toBe(false);
    expect(await reserveModelCall(storage, 1)).toBe(false);
    expect(await getStats(undefined, storage)).toMatchObject({
      sessionsStarted: 12,
      modelCalls: 1,
    });
    expect(await storage.get("session:capacity-0")).toBeNull();
    expect(await storage.get("session:capacity-11")).toEqual({ turn: 11 });
  });

  it("fails closed at protected capacity without losing existing data or adding keys", async () => {
    let now = Date.parse("2026-11-14T12:00:00Z");
    const storage = new Storage({ maxEntries: 3, now: () => now });
    stores.push(storage);
    await storage.consume("rl:existing", 1, 60_000);
    await reserveModelCall(storage, 1);
    const email = { email: "capacity@example.org", plan: "monthly" };
    await storage.append("waitlist", email);
    await expect(
      storage.set("session:overflow", { turns: [] }, 60_000),
    ).rejects.toThrow("Memory storage capacity reached");
    for (let index = 0; index < 10; index++) {
      const key = `rl:overflow-${index}`;
      expect((await storage.consume(key, 1, 60_000)).allowed).toBe(false);
      expect(await storage.get(key)).toBeNull();
    }
    expect(
      await storage.incrementHash("stats:overflow", "modelCalls", 60_000, 1),
    ).toBe(false);
    expect(await storage.get("stats:overflow")).toBeNull();
    expect(await storage.get("session:overflow")).toBeNull();
    expect(await storage.get("waitlist")).toEqual([email]);
    expect((await storage.consume("rl:existing", 1, 60_000)).allowed).toBe(
      false,
    );
    expect(await reserveModelCall(storage, 1)).toBe(false);
    now += 60_001;
    expect((await storage.consume("rl:after-expiry", 1, 60_000)).allowed).toBe(
      true,
    );
    expect(await reserveModelCall(storage, 1)).toBe(false);
    expect(await storage.get("waitlist")).toEqual([email]);
  });

  it("keeps Redis authoritative at mirror capacity and denies unknown quotas after failure", async () => {
    let online = true;
    const client: RedisConnection = {
      status: "ready",
      connect: async () => undefined,
      disconnect: () => undefined,
      on: () => undefined,
      ping: async () => "PONG",
      get: async () => null,
      pttl: async () => 60_000,
      set: async () => "OK",
      del: async () => 1,
      eval: async () => {
        if (!online) throw new Error("Redis unavailable");
        return [1, 1, 60_000];
      },
      hgetall: async () => ({}),
      zrange: async () => [],
      rpush: async () => 1,
    };
    const storage = new Storage({ maxEntries: 1, client });
    stores.push(storage);
    expect((await storage.consume("rl:cached", 1, 60_000)).allowed).toBe(true);
    expect((await storage.consume("rl:uncached", 1, 60_000)).allowed).toBe(
      true,
    );
    expect(
      await storage.incrementHash("stats:uncached", "modelCalls", 60_000, 1),
    ).toBe(true);
    await expect(
      storage.set("session:uncached", { turns: [] }, 60_000),
    ).resolves.toBeUndefined();
    expect(await storage.mode()).toBe("up");
    // Free capacity before the outage: an uncached remote quota is still unknown.
    await storage.delete("rl:cached");
    online = false;
    expect((await storage.consume("rl:uncached", 1, 60_000)).allowed).toBe(
      false,
    );
    expect(
      await storage.incrementHash("stats:uncached", "modelCalls", 60_000, 1),
    ).toBe(false);
    expect((await storage.consume("rl:cached", 1, 60_000)).allowed).toBe(false);
    expect(await storage.get("rl:uncached")).toBeNull();
    await storage.incrementHash("stats:partial", "sessionsStarted", 60_000);
    expect(
      await storage.incrementHash("stats:partial", "modelCalls", 60_000, 1),
    ).toBe(false);
    expect(await storage.mode()).toBe("memory");
  });

  it("enforces an atomic allowance without extending the rate window", async () => {
    let now = 1_000;
    const storage = memory(() => now);
    const results = await Promise.all(
      Array.from({ length: 150 }, () =>
        checkRateLimit("turn", "test-client", storage),
      ),
    );
    expect(results.filter((result) => result.allowed)).toHaveLength(120);
    now += 30 * 60 * 1000;
    expect(await checkRateLimit("turn", "test-client", storage)).toMatchObject({
      allowed: false,
      retryAfter: 1800,
    });
    expect(
      (await checkRateLimit("turn", "second-client", storage)).allowed,
    ).toBe(true);
    now += 30 * 60 * 1000;
    expect((await checkRateLimit("turn", "test-client", storage)).allowed).toBe(
      true,
    );
  });

  it("applies the five-post waitlist and ten-scene allowances independently", async () => {
    const storage = memory();
    for (let index = 0; index < 5; index++)
      expect((await checkRateLimit("waitlist", "same", storage)).allowed).toBe(
        true,
      );
    expect((await checkRateLimit("waitlist", "same", storage)).allowed).toBe(
      false,
    );
    for (let index = 0; index < 10; index++)
      expect(
        (await checkRateLimit("custom-scene", "same", storage)).allowed,
      ).toBe(true);
    expect(
      (await checkRateLimit("custom-scene", "same", storage)).allowed,
    ).toBe(false);
  });

  it("rejects spoofed client prefixes by choosing the final proxy address", () => {
    expect(
      clientIp(new Headers({ "x-forwarded-for": "spoofed, 192.0.2.8" })),
    ).toBe("192.0.2.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });

  it("reserves no more calls than the cap and resets on the New York day boundary", async () => {
    let now = Date.parse("2026-11-15T04:59:00Z");
    const storage = memory(() => now);
    const reserved = await Promise.all(
      Array.from({ length: 30 }, () => reserveModelCall(storage, 7)),
    );
    expect(reserved.filter(Boolean)).toHaveLength(7);
    expect(await getStats(undefined, storage)).toMatchObject({
      dayKey: "2026-11-14",
      modelCalls: 7,
    });
    now += 60_000;
    expect(await reserveModelCall(storage, 7)).toBe(true);
    expect(await getStats(undefined, storage)).toMatchObject({
      dayKey: "2026-11-15",
      modelCalls: 1,
    });
  });

  it("zero budget makes no calls and stats and waitlist contain actual events only", async () => {
    const storage = memory();
    expect(await reserveModelCall(storage, 0)).toBe(false);
    expect((await getStats(undefined, storage)).sessionsStarted).toBe(0);
    await incrementStat("sessionsStarted", storage);
    await addToWaitlist(
      { email: "PARENT@example.com", plan: "monthly" },
      storage,
    );
    expect(await getStats(undefined, storage)).toMatchObject({
      modelCalls: 0,
      sessionsStarted: 1,
      waitlist: 1,
    });
    expect(await storage.get("waitlist")).toEqual([
      { email: "parent@example.com", plan: "monthly", at: expect.any(String) },
    ]);
  });
});

describe("daily standings", () => {
  it("never seeds players, counts once, preserves the first score and handles ties", async () => {
    const storage = memory();
    expect(await getDailyPlayers("2026-11-14", scene.id, storage)).toBe(0);
    const sessions = createSessionStore(storage);
    const first = await sessions.createSession({
      scene,
      kind: "daily",
      dayKey: "2026-11-14",
      par: 3,
    });
    finish(first);
    expect(await recordDaily(first, 100, storage)).toMatchObject({
      players: 1,
      rank: 1,
      beatPct: null,
    });
    expect(await recordDaily(first, 900, storage)).toBeNull();
    first.counted = false;
    expect(await recordDaily(first, 900, storage)).toMatchObject({
      players: 1,
      rank: 1,
    });
    const second = await sessions.createSession({
      scene,
      kind: "daily",
      dayKey: "2026-11-14",
      par: 3,
    });
    finish(second);
    expect(await recordDaily(second, 200, storage)).toMatchObject({
      players: 2,
      rank: 1,
    });
    expect(
      await storage.addRank("daily:2026-11-14:store-candy", "tied", 200, 1000),
    ).toMatchObject({ players: 3, rank: 1 });
  });

  it("excludes practice, do-overs, custom, ongoing, and unsafe sessions", async () => {
    const storage = memory();
    const sessions = createSessionStore(storage);
    for (const variant of [
      "practice",
      "do-over",
      "custom",
      "ongoing",
      "unsafe",
    ]) {
      const session = await sessions.createSession({
        scene,
        kind: variant === "custom" ? "custom" : "daily",
        dayKey: "2026-11-14",
        par: 3,
        practice: variant === "practice",
      });
      session.usedDoOver = variant === "do-over";
      if (variant !== "ongoing") finish(session, variant === "unsafe");
      expect(await recordDaily(session, 100, storage)).toBeNull();
    }
    expect(await getDailyPlayers("2026-11-14", scene.id, storage)).toBe(0);
  });

  it("uses fewer scores for beat percentage only at twenty genuine sessions", async () => {
    const storage = memory();
    for (let index = 0; index < 19; index++) {
      expect(
        (await storage.addRank("ranking", `session-${index}`, index, 10000))
          .beatPct,
      ).toBeNull();
    }
    expect(await storage.addRank("ranking", "session-19", 19, 10000)).toEqual({
      players: 20,
      rank: 1,
      beatPct: 100,
    });
    expect(await storage.addRank("ranking", "session-10", 1000, 10000)).toEqual(
      { players: 20, rank: 10, beatPct: 53 },
    );
  });
});

describe("server configuration", () => {
  it("validates provider settings without assuming model IDs or leaking secrets", () => {
    expect(getEnv({})).toMatchObject({
      MODEL_DAILY_CALL_CAP: 20000,
      LLM_PRIMARY: "openai",
      NEXT_PUBLIC_PRO_PREVIEW: false,
    });
    expect(
      getEnv({ OPENAI_MODEL: "", REDIS_URL: "" }).OPENAI_MODEL,
    ).toBeUndefined();
    expect(
      getEnv({ NEXT_PUBLIC_PRO_PREVIEW: "true" }).NEXT_PUBLIC_PRO_PREVIEW,
    ).toBe(true);
    expect(() =>
      getEnv({ REDIS_URL: "https://credential@private.invalid" }),
    ).toThrow("Invalid server configuration: REDIS_URL");
    expect(() => getEnv({ MODEL_DAILY_CALL_CAP: "-1" })).toThrow(
      "MODEL_DAILY_CALL_CAP",
    );
  });
});
