import Redis from "ioredis";
import { getEnv } from "./env";

type Entry = { value: unknown; expiresAt: number | null };
type Ranking = Record<string, number>;
export type RankingResult = {
  players: number;
  rank: number;
  beatPct: number | null;
};
export type CounterResult = {
  allowed: boolean;
  value: number;
  retryAfter: number;
};

export interface RedisConnection {
  status: string;
  connect(): Promise<unknown>;
  disconnect(): void;
  on(event: "error", listener: (error: Error) => void): unknown;
  ping(): Promise<string>;
  get(key: string): Promise<string | null>;
  pttl(key: string): Promise<number>;
  set(key: string, value: string, expiry: "PX", ttl: number): Promise<unknown>;
  del(key: string): Promise<number>;
  eval(
    script: string,
    keys: number,
    ...args: (string | number)[]
  ): Promise<unknown>;
  hgetall(key: string): Promise<Record<string, string>>;
  zrange(
    key: string,
    from: number,
    to: string,
    withScores: "WITHSCORES",
  ): Promise<string[]>;
  rpush(key: string, value: string): Promise<number>;
}

const COUNTER_SCRIPT = `
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
if current < tonumber(ARGV[1]) then
  current = redis.call('INCR', KEYS[1])
  if current == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[2]) end
  return {1, current, redis.call('PTTL', KEYS[1])}
end
return {0, current, redis.call('PTTL', KEYS[1])}
`;
const HASH_SCRIPT = `
local current = tonumber(redis.call('HGET', KEYS[1], ARGV[1]) or '0')
if tonumber(ARGV[2]) >= 0 and current >= tonumber(ARGV[2]) then return {0, current} end
local value = redis.call('HINCRBY', KEYS[1], ARGV[1], 1)
redis.call('PEXPIRE', KEYS[1], ARGV[3])
return {1, value}
`;
const RANK_SCRIPT = `
redis.call('ZADD', KEYS[1], 'NX', ARGV[1], ARGV[2])
redis.call('PEXPIRE', KEYS[1], ARGV[3])
local points = redis.call('ZSCORE', KEYS[1], ARGV[2])
local players = redis.call('ZCARD', KEYS[1])
local higher = redis.call('ZCOUNT', KEYS[1], '(' .. points, '+inf')
local lower = redis.call('ZCOUNT', KEYS[1], '-inf', '(' .. points)
return {players, higher + 1, lower}
`;

function numericTuple(value: unknown): number[] {
  if (
    !Array.isArray(value) ||
    value.some((part) => !Number.isFinite(Number(part)))
  ) {
    throw new Error("Invalid storage result");
  }
  return value.map(Number);
}

/** One web process owns the fallback. After a Redis failure we stay in memory
 * until restart so requests never alternate between two divergent stores. */
export class Storage {
  private readonly memory = new Map<string, Entry>();
  private readonly locks = new Map<string, Promise<void>>();
  private client: RedisConnection | undefined;
  private initialized: Promise<void> | undefined;
  private failed = false;
  private readonly cleanup: ReturnType<typeof setInterval>;

  constructor(
    private readonly options: {
      url?: string;
      now?: () => number;
      client?: RedisConnection;
      maxEntries?: number;
    } = {},
  ) {
    this.client = options.client;
    this.cleanup = setInterval(() => this.sweep(), 60_000);
    this.cleanup.unref();
  }

  now(): number {
    return (this.options.now ?? Date.now)();
  }

  private sweep(): void {
    for (const [key, entry] of this.memory) {
      if (entry.expiresAt !== null && entry.expiresAt <= this.now())
        this.memory.delete(key);
    }
  }

  private read<T>(key: string): T | null {
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= this.now()) {
      this.memory.delete(key);
      return null;
    }
    return structuredClone(entry.value) as T;
  }

  private write(key: string, value: unknown, ttlMs: number | null): void {
    this.sweep();
    // Evict the oldest expiring entry, never an email entry with no expiry.
    if (
      !this.memory.has(key) &&
      this.memory.size >= (this.options.maxEntries ?? 10_000)
    ) {
      const victim = [...this.memory].find(
        ([, entry]) => entry.expiresAt !== null,
      )?.[0];
      if (victim) this.memory.delete(victim);
    }
    this.memory.set(key, {
      value: structuredClone(value),
      expiresAt: ttlMs === null ? null : this.now() + ttlMs,
    });
  }

  private fail(): void {
    this.failed = true;
    this.client?.disconnect();
  }

  private async connection(): Promise<RedisConnection | undefined> {
    if (this.failed || (!this.options.url && !this.client)) return undefined;
    if (!this.initialized) {
      this.initialized = (async () => {
        this.client ??= new Redis(this.options.url!, {
          lazyConnect: true,
          connectTimeout: 250,
          commandTimeout: 250,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 0,
          retryStrategy: () => null,
        });
        this.client.on("error", () => this.fail());
        try {
          if (this.client.status !== "ready") await this.client.connect();
        } catch {
          this.fail();
        }
      })();
    }
    await this.initialized;
    return this.failed ? undefined : this.client;
  }

  private async attempt<T>(
    operation: (redis: RedisConnection) => Promise<T>,
  ): Promise<{ value: T } | null> {
    const client = await this.connection();
    if (!client) return null;
    try {
      return { value: await operation(client) };
    } catch {
      this.fail();
      return null;
    }
  }

  async mode(): Promise<"up" | "memory"> {
    return (await this.attempt((redis) => redis.ping())) ? "up" : "memory";
  }

  async withLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(key) ?? Promise.resolve();
    let release = () => {};
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queued = previous.then(() => next);
    this.locks.set(key, queued);
    await previous;
    try {
      return await operation();
    } finally {
      release();
      if (this.locks.get(key) === queued) this.locks.delete(key);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const remote = await this.attempt(async (redis) => {
      const value = await redis.get(key);
      return { value, ttl: value === null ? 0 : await redis.pttl(key) };
    });
    if (remote) {
      if (remote.value.value === null || remote.value.ttl === -2) {
        this.memory.delete(key);
        return null;
      }
      try {
        const parsed: unknown = JSON.parse(remote.value.value);
        this.write(key, parsed, remote.value.ttl < 0 ? null : remote.value.ttl);
        return structuredClone(parsed) as T;
      } catch {
        return null;
      }
    }
    return this.read<T>(key);
  }

  async set(key: string, value: unknown, ttlMs: number): Promise<void> {
    if (ttlMs <= 0) {
      await this.delete(key);
      return;
    }
    await this.attempt((redis) =>
      redis.set(key, JSON.stringify(value), "PX", Math.ceil(ttlMs)),
    );
    this.write(key, value, ttlMs);
  }

  async delete(key: string): Promise<void> {
    await this.attempt((redis) => redis.del(key));
    this.memory.delete(key);
  }

  async consume(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<CounterResult> {
    return this.withLock(key, async () => {
      const remote = await this.attempt((redis) =>
        redis.eval(COUNTER_SCRIPT, 1, key, limit, windowMs),
      );
      if (remote) {
        const [allowed, value, remaining] = numericTuple(remote.value);
        this.write(key, value, Math.max(0, remaining));
        return {
          allowed: allowed === 1,
          value,
          retryAfter: Math.max(1, Math.ceil(remaining / 1000)),
        };
      }
      const current = this.read<number>(key) ?? 0;
      const remaining = Math.max(
        1,
        (this.memory.get(key)?.expiresAt ?? this.now() + windowMs) - this.now(),
      );
      const allowed = current < limit;
      const value = current + (allowed ? 1 : 0);
      this.write(key, value, remaining);
      return { allowed, value, retryAfter: Math.ceil(remaining / 1000) };
    });
  }

  async incrementHash(
    key: string,
    field: string,
    ttlMs: number,
    cap?: number,
  ): Promise<boolean> {
    return this.withLock(key, async () => {
      const remote = await this.attempt((redis) =>
        redis.eval(HASH_SCRIPT, 1, key, field, cap ?? -1, ttlMs),
      );
      const hash = this.read<Record<string, number>>(key) ?? {};
      if (remote) {
        const [allowed, value] = numericTuple(remote.value);
        hash[field] = value;
        this.write(key, hash, ttlMs);
        return allowed === 1;
      }
      if (cap !== undefined && (hash[field] ?? 0) >= cap) return false;
      hash[field] = (hash[field] ?? 0) + 1;
      this.write(key, hash, ttlMs);
      return true;
    });
  }

  async getHash(key: string, ttlMs: number): Promise<Record<string, number>> {
    const remote = await this.attempt((redis) => redis.hgetall(key));
    if (remote) {
      const values = Object.fromEntries(
        Object.entries(remote.value).map(([name, value]) => [
          name,
          Number(value),
        ]),
      );
      this.write(key, values, ttlMs);
      return values;
    }
    return this.read<Record<string, number>>(key) ?? {};
  }

  async getRanking(key: string, ttlMs: number): Promise<Ranking> {
    const remote = await this.attempt((redis) =>
      redis.zrange(key, 0, "-1", "WITHSCORES"),
    );
    if (remote) {
      const ranking: Ranking = {};
      for (let index = 0; index < remote.value.length; index += 2)
        ranking[remote.value[index]] = Number(remote.value[index + 1]);
      this.write(key, ranking, ttlMs);
      return ranking;
    }
    return this.read<Ranking>(key) ?? {};
  }

  async addRank(
    key: string,
    id: string,
    points: number,
    ttlMs: number,
  ): Promise<RankingResult> {
    return this.withLock(key, async () => {
      // Snapshot first, so an outage retains existing genuine players in this process.
      const ranking = await this.getRanking(key, ttlMs);
      const remote = await this.attempt((redis) =>
        redis.eval(RANK_SCRIPT, 1, key, points, id, ttlMs),
      );
      ranking[id] ??= points;
      this.write(key, ranking, ttlMs);
      if (remote) {
        const [players, rank, lower] = numericTuple(remote.value);
        return {
          players,
          rank,
          beatPct:
            players >= 20 ? Math.round((100 * lower) / (players - 1)) : null,
        };
      }
      const scores = Object.values(ranking);
      return {
        players: scores.length,
        rank: 1 + scores.filter((score) => score > ranking[id]).length,
        beatPct:
          scores.length >= 20
            ? Math.round(
                (100 * scores.filter((score) => score < ranking[id]).length) /
                  (scores.length - 1),
              )
            : null,
      };
    });
  }

  async append(key: string, value: unknown): Promise<void> {
    await this.withLock(key, async () => {
      await this.attempt((redis) => redis.rpush(key, JSON.stringify(value)));
      const list = this.read<unknown[]>(key) ?? [];
      list.push(value);
      this.write(key, list, null);
    });
  }

  close(): void {
    clearInterval(this.cleanup);
    this.client?.disconnect();
  }
}

// All route bundles in the standalone web process must share the same fallback.
const serverGlobal = globalThis as typeof globalThis & {
  __doOverStorage?: Storage;
};
export function getStorage(): Storage {
  return (serverGlobal.__doOverStorage ??= new Storage({
    url: getEnv().REDIS_URL,
  }));
}
