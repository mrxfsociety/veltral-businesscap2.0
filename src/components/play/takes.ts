import type { Note, Tag, TurnResult } from "@/engine/types";

/*
 * Pure helpers for the play screen. They only rearrange numbers the engine
 * already returned; nothing here invents a figure.
 */

/** Notes that change the sum after the per-tag effects (bonuses, taxes, the cap). */
export const SUM_NOTES: readonly Note[] = [
  "VALIDATED_LIMIT",
  "BARE_LIMIT",
  "NO_HELPFUL_MOVE",
  "BRIBE_TAX",
  "CAPPED",
];

export type Ledger = {
  rows: { tag: Tag; value: number }[];
  /** Notes, in engine order, that changed the sum after the rows. */
  sumNotes: Note[];
  /** The engine's delta for the turn. */
  total: number;
  /** True when the rows do not visibly add up to the total. */
  adjusted: boolean;
};

export function ledgerFor(
  result: Pick<TurnResult, "effects" | "notes" | "delta">,
): Ledger {
  const rows = result.effects.map(({ tag, value }) => ({ tag, value }));
  const sum = rows.reduce((total, row) => total + row.value, 0);
  return {
    rows,
    sumNotes: result.notes.filter((note) => SUM_NOTES.includes(note)),
    total: result.delta,
    adjusted: Math.round(sum) !== result.delta,
  };
}

/** "+24", "−18" (true minus sign), "0". One decimal only when the engine gave one. */
export function formatDelta(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded)
    ? String(Math.abs(rounded))
    : Math.abs(rounded).toFixed(1);
  if (rounded > 0) return `+${text}`;
  if (rounded < 0) return `−${text}`;
  return "0";
}

/** How many storm points the second take saved over the first (positive = calmer). */
export function takeShift(firstDelta: number, secondDelta: number): number {
  return firstDelta - secondDelta;
}

/** One sentence on what a do-over changed, from two engine deltas. */
export function shiftSentence(firstDelta: number, secondDelta: number): string {
  const shift = takeShift(firstDelta, secondDelta);
  if (shift > 0)
    return `One sentence moved the storm ${shift} ${shift === 1 ? "point" : "points"}.`;
  if (shift < 0)
    return `This take raised the storm ${-shift} ${shift === -1 ? "point" : "points"} more. Try another.`;
  return "Same storm both times. Try a different move.";
}

/** Tomorrow's daily scene from the rotation and today's day number (1-based). */
export function tomorrowFrom<T>(rotation: readonly T[], dayNumber: number): T {
  const n = rotation.length;
  return rotation[((dayNumber % n) + n) % n];
}
