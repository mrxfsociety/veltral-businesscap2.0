import type { DailyStanding } from "../shared/api";
import { getStorage, type Storage } from "./redis";
import type { StoredSession } from "./sessionStore";

export const DAILY_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export async function getDailyPlayers(
  date: string,
  sceneId: string,
  storage: Storage = getStorage(),
): Promise<number> {
  return Object.keys(
    await storage.getRanking(`daily:${date}:${sceneId}`, DAILY_TTL_MS),
  ).length;
}

/** Call inside the session mutation lock, then save the session. Redis ZADD NX
 * keeps the original first-attempt score even if a save is interrupted. */
export async function recordDaily(
  session: StoredSession,
  points: number,
  storage: Storage = getStorage(),
): Promise<DailyStanding | null> {
  const outcome = session.turns.at(-1)?.result.outcome;
  if (
    session.kind !== "daily" ||
    session.usedDoOver ||
    session.practice ||
    session.counted ||
    !outcome ||
    outcome === "ongoing" ||
    outcome === "stopped_unsafe"
  )
    return null;
  const standing = await storage.addRank(
    `daily:${session.dayKey}:${session.scene.id}`,
    session.id,
    points,
    DAILY_TTL_MS,
  );
  session.counted = true;
  return { dayKey: session.dayKey, ...standing };
}
