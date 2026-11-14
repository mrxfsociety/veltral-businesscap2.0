import { spawn, type ChildProcess } from "node:child_process";
import { createConnection, createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import Redis from "ioredis";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Storage } from "./redis";

/** Opt-in because the default verification must also run without Redis installed.
 * RUN_REDIS_INTEGRATION=1 npx vitest run src/server/redis.integration.test.ts */
describe.skipIf(process.env.RUN_REDIS_INTEGRATION !== "1")(
  "real Redis storage and outage drill",
  () => {
    let processHandle: ChildProcess;
    let direct: Redis;
    let storage: Storage;

    beforeAll(async () => {
      const probe = createServer();
      await new Promise<void>((resolve) =>
        probe.listen(0, "127.0.0.1", resolve),
      );
      const address = probe.address();
      if (!address || typeof address === "string")
        throw new Error("No local TCP port");
      await new Promise<void>((resolve, reject) =>
        probe.close((error) => (error ? reject(error) : resolve())),
      );
      processHandle = spawn(
        "redis-server",
        [
          "--port",
          String(address.port),
          "--bind",
          "127.0.0.1",
          "--save",
          "",
          "--appendonly",
          "no",
        ],
        { stdio: "ignore" },
      );
      let spawnError: Error | undefined;
      processHandle.once("error", (error) => {
        spawnError = error;
      });
      const url = `redis://127.0.0.1:${address.port}`;
      let ready = false;
      for (let attempt = 0; attempt < 120; attempt++) {
        if (spawnError) throw spawnError;
        try {
          await new Promise<void>((resolve, reject) => {
            const socket = createConnection(address.port, "127.0.0.1");
            socket.once("connect", () => {
              socket.end();
              resolve();
            });
            socket.once("error", reject);
          });
          ready = true;
          break;
        } catch {
          await delay(25);
        }
      }
      if (!ready) throw new Error("Local Redis did not start");
      direct = new Redis(url, {
        lazyConnect: true,
        retryStrategy: () => 25,
        maxRetriesPerRequest: 1,
      });
      direct.on("error", () => {});
      await direct.connect();
      storage = new Storage({ url });
      expect(await storage.mode()).toBe("up");
    });

    afterAll(() => {
      storage?.close();
      direct?.disconnect();
      processHandle?.kill();
    });

    it("writes native expiring counters and hashes with atomic caps", async () => {
      const allowed = await Promise.all(
        Array.from({ length: 40 }, () =>
          storage.consume("integration:rate", 9, 60000),
        ),
      );
      expect(allowed.filter((result) => result.allowed)).toHaveLength(9);
      expect(await direct.get("integration:rate")).toBe("9");
      expect(await direct.pttl("integration:rate")).toBeGreaterThan(50000);
      const reserved = await Promise.all(
        Array.from({ length: 40 }, () =>
          storage.incrementHash("integration:stats", "modelCalls", 60000, 5),
        ),
      );
      expect(reserved.filter(Boolean)).toHaveLength(5);
      expect(await direct.type("integration:stats")).toBe("hash");
      expect(await storage.getHash("integration:stats", 60000)).toEqual({
        modelCalls: 5,
      });
    });

    it("uses sorted sets with NX and stable tie-aware ranks for twenty real entries", async () => {
      await Promise.all(
        Array.from({ length: 20 }, (_, index) =>
          storage.addRank(
            "integration:daily",
            `session-${index}`,
            index,
            60000,
          ),
        ),
      );
      expect(await direct.type("integration:daily")).toBe("zset");
      expect(await direct.zcard("integration:daily")).toBe(20);
      expect(
        await storage.addRank("integration:daily", "session-10", 1000, 60000),
      ).toEqual({ players: 20, rank: 10, beatPct: 53 });
      expect(await direct.zscore("integration:daily", "session-10")).toBe("10");
    });

    it("uses JSON with an actual expiry and native persistent waitlist entries", async () => {
      await storage.set("integration:session", { reply: "saved" }, 60000);
      expect(await storage.get("integration:session")).toEqual({
        reply: "saved",
      });
      expect(await direct.pttl("integration:session")).toBeGreaterThan(50000);
      await storage.append("integration:waitlist", {
        email: "test@example.invalid",
      });
      expect(await direct.type("integration:waitlist")).toBe("list");
      expect(await direct.pttl("integration:waitlist")).toBe(-1);
      expect(
        JSON.parse((await direct.lrange("integration:waitlist", 0, -1))[0]),
      ).toEqual({ email: "test@example.invalid" });
    });

    it("keeps mirrored sessions and real rankings when Redis goes down mid-session", async () => {
      const exited = new Promise<void>((resolve) =>
        processHandle.once("exit", () => resolve()),
      );
      processHandle.kill("SIGTERM");
      await exited;
      expect(await storage.mode()).toBe("memory");
      expect(await storage.get("integration:session")).toEqual({
        reply: "saved",
      });
      expect(
        (await storage.consume("integration:rate", 9, 60000)).allowed,
      ).toBe(false);
      expect(
        await storage.incrementHash(
          "integration:stats",
          "modelCalls",
          60000,
          5,
        ),
      ).toBe(false);
      expect(
        await storage.addRank("integration:daily", "session-20", 20, 60000),
      ).toEqual({ players: 21, rank: 1, beatPct: 100 });
      await storage.set(
        "integration:session",
        { reply: "saved after outage" },
        60000,
      );
      expect(await storage.get("integration:session")).toEqual({
        reply: "saved after outage",
      });
    });
  },
);
