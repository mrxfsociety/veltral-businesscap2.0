import { createHash } from "node:crypto";
import { getStorage, type Storage } from "./redis";

const HOUR = 60 * 60 * 1000;
export const RATE_LIMITS = {
  turn: { limit: 120, windowMs: HOUR },
  "custom-scene": { limit: 10, windowMs: 24 * HOUR },
  coach: { limit: 60, windowMs: HOUR },
  transcribe: { limit: 120, windowMs: HOUR },
  waitlist: { limit: 5, windowMs: HOUR },
  // Speech synthesis is billed too; apply the voice-input allowance.
  speak: { limit: 120, windowMs: HOUR },
  // Test checkout and demo code: 10 attempts an hour per address.
  checkout: { limit: 10, windowMs: HOUR },
  redeem: { limit: 10, windowMs: HOUR },
} as const;
export type RateLimitBucket = keyof typeof RATE_LIMITS;

export function clientIp(headers: Headers): string {
  // Caddy appends the real client address to X-Forwarded-For. Taking the last
  // hop prevents a caller-controlled prefix from bypassing the rate limit.
  return (
    headers.get("x-forwarded-for")?.split(",").at(-1)?.trim().slice(0, 128) ||
    "unknown"
  );
}

export async function checkRateLimit(
  bucket: RateLimitBucket,
  ip: string,
  storage: Storage = getStorage(),
) {
  const { limit, windowMs } = RATE_LIMITS[bucket];
  // No raw IP address is retained in either store.
  const digest = createHash("sha256").update(ip).digest("hex");
  return storage.consume(`rl:${bucket}:${digest}`, limit, windowMs);
}
