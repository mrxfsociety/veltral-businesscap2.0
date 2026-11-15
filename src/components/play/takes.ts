import { HARSH } from "@/engine/tags";
import { DELTA_MAX, DELTA_MIN } from "@/engine/transition";
import type { Note, Tag, TurnResult } from "@/engine/types";

/*
 * Pure helpers for the play screen. They only rearrange numbers the engine
 * already returned; nothing here invents a figure.
 */

/** Notes whose rule adds a fixed amount after the per-tag effects. */
export const RULE_NOTES: readonly Note[] = [
  "VALIDATED_LIMIT",
  "BARE_LIMIT",
  "NO_HELPFUL_MOVE",
  "BRIBE_TAX",
];

export const CAP_LABEL = `Capped: a storm moves at most ${-DELTA_MIN} down or ${DELTA_MAX} up in one turn`;
export const ROUNDING_LABEL = "Rounding to whole points";

export type LedgerRow =
  | { kind: "tag"; key: string; tag: Tag; value: number; exact: number }
  | {
      kind: "rule" | "cap" | "bound" | "rounding";
      key: string;
      label: string;
      value: number;
    };

export type Ledger = {
  /** Whole-number rows that add up exactly to `total`. */
  rows: LedgerRow[];
  /** Engine notes explained in the ledger itself (the three-move cap). */
  sumNotes: Note[];
  /** The engine's delta for the turn. */
  total: number;
  /** True when a per-tag row was rounded from the engine's tenths. */
  rounded: boolean;
};

/*
 * The fixed amounts the engine adds after the per-tag effects, keyed by the
 * note it returns when the rule fires (src/engine/transition.ts). The golden
 * vector test in takes.test.ts fails if these drift from the engine.
 */
function ruleRow(
  note: Note,
  tags: readonly Tag[],
): { label: string; value: number } | null {
  switch (note) {
    case "VALIDATED_LIMIT":
      return {
        label: "Empathy and the limit together",
        value: tags.some((tag) => HARSH.includes(tag)) ? -3 : -6,
      };
    case "BARE_LIMIT":
      return { label: "The limit alone", value: 3 };
    case "NO_HELPFUL_MOVE":
      return { label: "Nothing helpful", value: 3 };
    case "BRIBE_TAX":
      return { label: "The earlier bribe", value: 5 };
    default:
      return null;
  }
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

/*
 * Whole numbers that stay within one point of each engine value and add up to
 * the rounded sum of those values (largest-remainder rounding).
 */
export function wholeShares(values: readonly number[]): number[] {
  const shares = values.map((value) => Math.round(value));
  const target = Math.round(values.reduce((total, value) => total + value, 0));
  let diff = target - shares.reduce((total, share) => total + share, 0);
  while (diff !== 0) {
    const step = Math.sign(diff);
    let pick = -1;
    for (let i = 0; i < values.length; i += 1) {
      const room = (values[i] - shares[i]) * step;
      if (room <= 0) continue;
      if (pick === -1 || room > (values[pick] - shares[pick]) * step) pick = i;
    }
    if (pick === -1) break;
    shares[pick] += step;
    diff -= step;
  }
  return shares;
}

/*
 * Rebuilds the engine's sum for one turn as whole-number rows: each per-tag
 * effect rounded, the rules the engine reported in its notes, then whatever
 * the one-turn cap and the 0–100 range took away, each on its own labelled
 * row. The rows always add up to `result.delta`.
 */
export function ledgerFor(
  result: Pick<TurnResult, "effects" | "notes" | "delta" | "tags"> & {
    before: Pick<TurnResult["before"], "arousal">;
    after: Pick<TurnResult["after"], "arousal">;
  },
): Ledger {
  const shares = wholeShares(result.effects.map((e) => e.value));
  const rows: LedgerRow[] = result.effects.map(({ tag, value }, i) => ({
    kind: "tag",
    key: tag,
    tag,
    value: shares[i],
    exact: value,
  }));
  const rounded = result.effects.some((e) => !Number.isInteger(e.value));
  // Giving in ends the turn before any rule or cap: its one row is the whole move.
  if (result.notes.includes("GAVE_IN"))
    return { rows, sumNotes: [], total: result.delta, rounded };

  for (const note of result.notes) {
    const rule = ruleRow(note, result.tags);
    if (rule) rows.push({ kind: "rule", key: note, ...rule });
  }
  const shown = rows.reduce((total, row) => total + row.value, 0);

  // The engine caps one turn's move, then keeps the storm inside 0–100.
  const capped = clamp(shown, DELTA_MIN, DELTA_MAX);
  const atBound = result.after.arousal === 0 || result.after.arousal === 100;
  const bound = atBound ? result.delta - capped : 0;
  const cap = result.delta - shown - bound;
  if (cap !== 0)
    rows.push({
      kind: capped !== shown ? "cap" : "rounding",
      key: "cap",
      label: capped !== shown ? CAP_LABEL : ROUNDING_LABEL,
      value: cap,
    });
  if (bound !== 0)
    rows.push({
      kind: "bound",
      key: "bound",
      label:
        result.after.arousal === 100
          ? "The storm tops out at 100"
          : "The storm cannot drop below 0",
      value: bound,
    });

  return {
    rows,
    sumNotes: result.notes.filter((note) => note === "CAPPED"),
    total: result.delta,
    rounded,
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
