import type { TurnResponse } from "@/shared/api";

export const STILL_THERE = "Still there? Take your time.";

/** A turn the clock sent with nothing said: stamped "Froze". */
export function isFrozen(turn: Pick<TurnResponse, "text" | "hits">): boolean {
  return !turn.text && turn.hits.some((hit) => hit.tag === "NO_RESPONSE");
}

/**
 * When the clock runs out: the first silence is sent as "froze"; a second one
 * in a row, with nothing typed, pauses the clock instead of freezing again.
 */
export function holdForSilence(
  reply: string,
  previous: Pick<TurnResponse, "text" | "hits"> | undefined,
): boolean {
  return reply.trim() === "" && previous !== undefined && isFrozen(previous);
}
