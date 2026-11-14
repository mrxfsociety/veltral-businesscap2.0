import { dayKey } from "../engine/scenes";
import { getEnv } from "./env";
import { getStorage, type Storage } from "./redis";

export const STATS_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const STAT_NAMES = [
  "sessionsStarted",
  "sessionsFinished",
  "waitlist",
  "modelCalls",
  "rulesFallbacks",
] as const;
export type StatName = (typeof STAT_NAMES)[number];

export async function incrementStat(
  name: StatName,
  storage: Storage = getStorage(),
  date = dayKey(new Date(storage.now())),
): Promise<void> {
  await storage.incrementHash(`stats:${date}`, name, STATS_TTL_MS);
}

export async function reserveModelCall(
  storage: Storage = getStorage(),
  cap = getEnv().MODEL_DAILY_CALL_CAP,
): Promise<boolean> {
  return storage.incrementHash(
    `stats:${dayKey(new Date(storage.now()))}`,
    "modelCalls",
    STATS_TTL_MS,
    cap,
  );
}

export async function getStats(date?: string, storage: Storage = getStorage()) {
  const key = date ?? dayKey(new Date(storage.now()));
  const values = await storage.getHash(`stats:${key}`, STATS_TTL_MS);
  return {
    dayKey: key,
    sessionsStarted: values.sessionsStarted ?? 0,
    sessionsFinished: values.sessionsFinished ?? 0,
    waitlist: values.waitlist ?? 0,
    modelCalls: values.modelCalls ?? 0,
    rulesFallbacks: values.rulesFallbacks ?? 0,
  };
}
