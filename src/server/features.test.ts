import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyTurn, initialState } from "../engine/transition";
import { getScene } from "../engine/scenes";
import type { Tag, TurnResult } from "../engine/types";
import type { JsonCompleter, JsonRequest } from "../llm/provider";
import {
  ErrorResponseSchema,
  CoachResponseSchema,
  CustomSceneResponseSchema,
  DailyResponseSchema,
  HealthResponseSchema,
  SessionResponseSchema,
  TurnResponseSchema,
} from "../shared/api";
import { createFeatureHandlers, UNSAFE_MESSAGE } from "./features";
import { createPlayHandlers } from "./play";
import { Storage } from "./redis";
import { createSessionStore, type StoredTurn } from "./sessionStore";
import { getStats } from "./stats";

const NOW = Date.parse("2026-11-14T15:00:00Z");
const generatedScene = {
  title: "The final lap",
  place: "Toy track",
  setup: "The child wants to race again before lunch.",
  openingLine: "Another lap, please!",
  openingAction: "holds the racing car",
  limit: "The race is finished.",
  wants: "one more lap",
  startArousal: 75,
  temperament: "spirited",
  limitHints: ["race is finished", "track is closed", "no more racing"],
  giveInHints: ["one more lap", "you may race again", "keep racing"],
};
function fake(value: unknown | null) {
  let count = 0;
  const complete: JsonCompleter = async <T>(request: JsonRequest<T>) => {
    count++;
    return value === null ? null : request.schema.parse(value);
  };
  return { complete, calls: () => count };
}
function post(path: string, body: unknown, ip = "198.51.100.90") {
  return new Request(`https://doover.example/api/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}
const customInput = {
  description: "My child wanted another race with the toy car before lunch.",
  ageBand: "4-5",
  childName: "Robin",
};
function turn(result: TurnResult, text: string): StoredTurn {
  return {
    turnIndex: result.before.turn,
    text,
    hits: result.tags.map((tag) => ({ tag, source: "rule", quote: text })),
    result,
    child: null,
    tagging: "rules",
    score: null,
    daily: null,
    usedDoOver: false,
  };
}

let storage: Storage;
beforeEach(() => {
  storage = new Storage({ now: () => NOW });
});
afterEach(() => {
  storage.close();
  vi.unstubAllEnvs();
});

async function finishedSession(tags: Tag[] = ["THREAT", "SHAME"]) {
  const scene = getScene("store-candy")!;
  const sessions = createSessionStore(storage);
  const session = await sessions.createSession({
    scene,
    kind: "library",
    dayKey: "2026-11-14",
    par: 3,
  });
  const first = applyTurn(scene, initialState(scene), tags);
  session.turns = [
    turn(first, "An upsetting parent reply."),
    turn(applyTurn(scene, first.after, ["GIVE_IN"]), "A later concession."),
  ];
  await sessions.saveSession(session);
  return session;
}

describe("custom scene handlers", () => {
  it("recognizes the displayed boundary without a model even when generated hints only paraphrase it", async () => {
    const limit = "The wooden cars remain in this box.";
    const output = fake({
      ok: true,
      refusal: null,
      scene: { ...generatedScene, limit },
    });
    const features = createFeatureHandlers({
      storage,
      complete: output.complete,
    });
    const created = CustomSceneResponseSchema.parse(
      await (
        await features.customScene(post("custom-scene", customInput))
      ).json(),
    );
    if (!created.ok) throw new Error("Expected generated scene.");
    const play = createPlayHandlers({ storage, complete: fake(null).complete });
    const started = SessionResponseSchema.parse(
      await (
        await play.session(
          post("session", { kind: "custom", sceneId: created.sceneId }),
        )
      ).json(),
    );
    const reply = TurnResponseSchema.parse(
      await (
        await play.turn(
          post("turn", {
            sessionId: started.sessionId,
            turnIndex: 0,
            text: limit,
            inputMode: "text",
          }),
        )
      ).json(),
    );
    expect(reply.tagging).toBe("rules");
    expect(reply.result.tags).toContain("HOLD_LIMIT");
    expect(reply.result.after.limitIntact).toBe(true);
  });

  it("stores a generated scene, hides hints, and plays it through the engine", async () => {
    const model = fake({ ok: true, refusal: null, scene: generatedScene });
    const handlers = createFeatureHandlers({
      storage,
      complete: model.complete,
    });
    const response = await handlers.customScene(
      post("custom-scene", customInput),
    );
    expect(response.status).toBe(200);
    const created = CustomSceneResponseSchema.parse(await response.json());
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error("Expected generated scene.");
    expect(created.sceneId).toMatch(/^custom-/);
    expect(created.scene).toMatchObject({
      childName: "Robin",
      ageBand: "4-5",
      startArousal: 75,
    });
    expect(created.scene).not.toHaveProperty("limitHints");
    const stored = await createSessionStore(storage).getCustomScene(
      created.sceneId,
    );
    expect(stored?.limitHints).toEqual(generatedScene.limitHints);
    const play = createPlayHandlers({ storage, complete: fake(null).complete });
    const started = SessionResponseSchema.parse(
      await (
        await play.session(
          post("session", { kind: "custom", sceneId: created.sceneId }),
        )
      ).json(),
    );
    const ended = TurnResponseSchema.parse(
      await (
        await play.turn(
          post("turn", {
            sessionId: started.sessionId,
            turnIndex: 0,
            text: "We can do one more lap.",
            inputMode: "text",
          }),
        )
      ).json(),
    );
    expect(ended.result.outcome).toBe("calm_gave_in");
    expect(ended.score?.points).toBe(100);
    expect(ended.daily).toBeNull();
    expect(model.calls()).toBe(1);
  });

  it("rejects unsafe descriptions before any provider call", async () => {
    const model = fake({ ok: true, refusal: null, scene: generatedScene });
    const response = await createFeatureHandlers({
      storage,
      complete: model.complete,
    }).customScene(
      post("custom-scene", {
        ...customInput,
        description: "I'll slap you if you touch the racing car again.",
      }),
    );
    expect(await response.json()).toEqual({
      ok: false,
      reason: "unsafe",
      message: UNSAFE_MESSAGE,
    });
    expect(model.calls()).toBe(0);
  });

  it.each(["unsafe", "not_a_meltdown"] as const)(
    "reports the model's %s refusal",
    async (refusal) => {
      const handlers = createFeatureHandlers({
        storage,
        complete: fake({ ok: false, refusal, scene: null }).complete,
      });
      const body = CustomSceneResponseSchema.parse(
        await (
          await handlers.customScene(post("custom-scene", customInput))
        ).json(),
      );
      expect(body).toMatchObject({ ok: false, reason: refusal });
    },
  );

  it("offers the library when the model is unavailable or has insufficient cleaned hints", async () => {
    for (const output of [
      null,
      {
        ok: true,
        refusal: null,
        scene: {
          ...generatedScene,
          limitHints: ["no", "same hint", "SAME HINT"],
        },
      },
    ]) {
      const handlers = createFeatureHandlers({
        storage,
        complete: fake(output).complete,
      });
      expect(
        await (
          await handlers.customScene(post("custom-scene", customInput))
        ).json(),
      ).toMatchObject({ ok: false, reason: "model_unavailable" });
    }
  });

  it.each(["No. ", "    "])(
    "refuses a generated boundary that cannot be grounded after normalization: %j",
    async (limit) => {
      const handlers = createFeatureHandlers({
        storage,
        complete: fake({
          ok: true,
          refusal: null,
          scene: { ...generatedScene, limit },
        }).complete,
      });
      const response = await handlers.customScene(
        post("custom-scene", customInput),
      );
      expect(response.status).toBe(200);
      expect(
        CustomSceneResponseSchema.parse(await response.json()),
      ).toMatchObject({
        ok: false,
        reason: "model_unavailable",
      });
    },
  );

  it.each([
    [120, 90],
    [-10, 60],
  ] as const)(
    "clamps arousal %s to %s and normalizes hints",
    async (raw, expected) => {
      const hints = [
        "NO",
        " Race  Is Finished ",
        "race is finished",
        "Track Is Closed",
        "No More Racing",
        "time for lunch",
        "park the car",
        "we are leaving",
        "finish the lap",
      ];
      const handlers = createFeatureHandlers({
        storage,
        complete: fake({
          ok: true,
          refusal: null,
          scene: {
            ...generatedScene,
            startArousal: raw,
            limitHints: hints,
            giveInHints: hints,
          },
        }).complete,
      });
      const result = CustomSceneResponseSchema.parse(
        await (
          await handlers.customScene(post("custom-scene", customInput))
        ).json(),
      );
      if (!result.ok) throw new Error("Expected generated scene.");
      const stored = await createSessionStore(storage).getCustomScene(
        result.sceneId,
      );
      expect(stored?.startArousal).toBe(expected);
      expect(stored?.limitHints).toHaveLength(6);
      expect(stored?.limitHints[0]).toBe("race is finished");
      expect(
        stored?.limitHints.every(
          (hint) => hint.length >= 4 && hint === hint.toLowerCase(),
        ),
      ).toBe(true);
    },
  );

  it("rate limits custom generation to ten calls per IP per day", async () => {
    const model = fake(null);
    const handlers = createFeatureHandlers({
      storage,
      complete: model.complete,
    });
    for (let i = 0; i < 10; i++)
      expect(
        (await handlers.customScene(post("custom-scene", customInput))).status,
      ).toBe(200);
    const limited = await handlers.customScene(
      post("custom-scene", customInput),
    );
    expect(limited.status).toBe(429);
    expect(ErrorResponseSchema.parse(await limited.json()).error).toBe(
      "rate_limited",
    );
    expect(model.calls()).toBe(10);
  });
});

describe("coach handlers", () => {
  it("returns only helpful, quote-backed alternatives with engine-computed negative deltas", async () => {
    const session = await finishedSession();
    const suggestions = [
      {
        text: "I'm right here beside the shopping cart.",
        tags: [{ tag: "CONNECT", quote: "I'm right here" }],
      },
      {
        text: "Calm down beside the shopping cart.",
        tags: [{ tag: "CONNECT", quote: "beside the shopping cart" }],
      },
      { text: "The red shopping cart has four wheels.", tags: [] },
    ];
    const handlers = createFeatureHandlers({
      storage,
      complete: fake({ suggestions }).complete,
    });
    const body = CoachResponseSchema.parse(
      await (
        await handlers.coach(
          post("coach", { sessionId: session.id, turnIndex: 0 }),
        )
      ).json(),
    );
    expect(body.source).toBe("model");
    expect(body.suggestions).toHaveLength(1);
    const expected = applyTurn(session.scene, session.turns[0].result.before, [
      "CONNECT",
    ]);
    expect(body.suggestions[0]).toEqual({
      text: suggestions[0].text,
      tags: ["CONNECT"],
      delta: expected.delta,
    });
    expect(body.tip).toBeNull();
  });

  it("rejects invented quotes, including a duplicate tag with one invalid quote", async () => {
    const session = await finishedSession();
    const suggestions = [
      {
        text: "I'm right here beside the shopping cart.",
        tags: [{ tag: "CONNECT", quote: "a quote nobody said" }],
      },
      {
        text: "I'm right here beside the shopping cart.",
        tags: [
          { tag: "CONNECT", quote: "I'm right here" },
          { tag: "CONNECT", quote: "another invented quote" },
        ],
      },
    ];
    const handlers = createFeatureHandlers({
      storage,
      complete: fake({ suggestions }).complete,
    });
    const body = CoachResponseSchema.parse(
      await (
        await handlers.coach(
          post("coach", { sessionId: session.id, turnIndex: 0 }),
        )
      ).json(),
    );
    expect(body.source).toBe("tips");
    expect(body.suggestions).toEqual([]);
  });

  it("filters semantic unhelpful tags even if the rules find no unhelpful cue", async () => {
    const session = await finishedSession();
    const text = "I'm right here beside the shopping cart.";
    const handlers = createFeatureHandlers({
      storage,
      complete: fake({
        suggestions: [
          { text, tags: [{ tag: "SHAME", quote: "beside the shopping cart" }] },
        ],
      }).complete,
    });
    const body = CoachResponseSchema.parse(
      await (
        await handlers.coach(
          post("coach", { sessionId: session.id, turnIndex: 0 }),
        )
      ).json(),
    );
    expect(body.source).toBe("tips");
    expect(body.suggestions).toEqual([]);
  });

  it("fills the worst unhelpful tag's fallback tip without a model", async () => {
    const session = await finishedSession();
    const handlers = createFeatureHandlers({
      storage,
      complete: fake(null).complete,
    });
    const body = CoachResponseSchema.parse(
      await (
        await handlers.coach(
          post("coach", { sessionId: session.id, turnIndex: 0 }),
        )
      ).json(),
    );
    expect(body.source).toBe("tips");
    expect(body.tip?.tag).toBe("SHAME");
    expect(body.tip?.tryInstead).not.toMatch(/\{(?:childName|wants|limit)\}/);
    expect(body.suggestions).toEqual([]);
  });

  it("requires an existing turn in a finished session and skips coaching unsafe endings", async () => {
    const model = fake(null);
    const handlers = createFeatureHandlers({
      storage,
      complete: model.complete,
    });
    const missing = await handlers.coach(
      post("coach", { sessionId: "missing", turnIndex: 0 }),
    );
    expect(missing.status).toBe(404);
    const session = await finishedSession();
    const sessions = createSessionStore(storage);
    expect(
      (
        await handlers.coach(
          post("coach", { sessionId: session.id, turnIndex: 6 }),
        )
      ).status,
    ).toBe(409);
    session.turns = session.turns.slice(0, 1);
    await sessions.saveSession(session);
    expect(
      (
        await handlers.coach(
          post("coach", { sessionId: session.id, turnIndex: 0 }),
        )
      ).status,
    ).toBe(409);
    session.turns.push(
      turn(
        applyTurn(session.scene, session.turns[0].result.after, ["UNSAFE"]),
        "Unsafe ending.",
      ),
    );
    await sessions.saveSession(session);
    expect(
      await (
        await handlers.coach(
          post("coach", { sessionId: session.id, turnIndex: 0 }),
        )
      ).json(),
    ).toEqual({ source: "tips", suggestions: [], tip: null });
    expect(model.calls()).toBe(0);
  });
});

describe("daily, waitlist, health and admin endpoints", () => {
  it("returns the real daily scene and zero players for an empty store", async () => {
    const body = DailyResponseSchema.parse(
      await (
        await createFeatureHandlers({ storage }).daily(
          new Request("https://doover.example/api/daily"),
        )
      ).json(),
    );
    expect(body).toMatchObject({
      dayKey: "2026-11-14",
      dayNumber: 1,
      sceneId: "store-candy",
      par: 3,
      players: 0,
    });
  });

  it("validates and stores the waitlist, counts real writes and rate limits", async () => {
    const handlers = createFeatureHandlers({ storage });
    expect(
      (
        await handlers.waitlist(
          post(
            "waitlist",
            { email: "invalid", plan: "monthly" },
            "198.51.100.91",
          ),
        )
      ).status,
    ).toBe(400);
    expect((await getStats(undefined, storage)).waitlist).toBe(0);
    for (let index = 0; index < 5; index++) {
      const response = await handlers.waitlist(
        post("waitlist", {
          email: `PARENT${index}@example.org`,
          plan: "yearly",
        }),
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
    }
    expect(
      (
        await handlers.waitlist(
          post("waitlist", { email: "parent@example.org", plan: "yearly" }),
        )
      ).status,
    ).toBe(429);
    expect((await getStats(undefined, storage)).waitlist).toBe(5);
    expect(await storage.get("waitlist")).toContainEqual({
      email: "parent0@example.org",
      plan: "yearly",
      at: new Date(NOW).toISOString(),
    });
  });

  it("reports actual memory mode and provider configuration without exposing secrets", async () => {
    vi.stubEnv("OPENAI_API_KEY", "not-a-real-test-secret");
    vi.stubEnv("OPENAI_MODEL", "configured-test-model");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("ANTHROPIC_MODEL", "");
    vi.stubEnv("NEXT_PUBLIC_PRO_PREVIEW", "true");
    vi.stubEnv("GIT_SHA", "test-commit");
    const response = await createFeatureHandlers({ storage }).health(
      new Request("https://doover.example/api/health"),
    );
    const body = HealthResponseSchema.parse(await response.json());
    expect(body).toMatchObject({
      ok: true,
      redis: "memory",
      commit: "test-commit",
      providers: { openai: true, anthropic: false },
      proPreview: true,
    });
    expect(JSON.stringify(body)).not.toMatch(
      /not-a-real-test-secret|configured-test-model/,
    );
  });

  it("protects admin stats and rejects malformed or extra query fields", async () => {
    vi.stubEnv("ADMIN_KEY", "test-admin-secret");
    const handlers = createFeatureHandlers({ storage });
    for (const query of ["", "?key=wrong", "?key=test-admin-secret&extra=1"]) {
      const response = await handlers.adminStats(
        new Request(`https://doover.example/api/admin/stats${query}`),
      );
      expect(response.status).toBe(404);
      expect(await response.text()).not.toContain("test-admin-secret");
    }
    const accepted = await handlers.adminStats(
      new Request(
        "https://doover.example/api/admin/stats?key=test-admin-secret",
      ),
    );
    expect(accepted.status).toBe(200);
    expect(await accepted.json()).toMatchObject({
      sessionsStarted: 0,
      sessionsFinished: 0,
      waitlist: 0,
      modelCalls: 0,
      rulesFallbacks: 0,
    });
    vi.stubEnv("ADMIN_KEY", "");
    expect(
      (
        await handlers.adminStats(
          new Request(
            "https://doover.example/api/admin/stats?key=test-admin-secret",
          ),
        )
      ).status,
    ).toBe(404);
  });
});
