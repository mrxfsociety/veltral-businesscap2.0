import { HELPFUL, TAG_INFO, UNHELPFUL } from "@/engine/tags";
import type { Tag } from "@/engine/types";
import type { HistoryEntry, PlaybookEntry } from "./store";

/*
 * Moves and slips (REDESIGN 8.2–8.3): pure functions over the browser's own
 * history. Every count comes from saved tagCounts.
 */

export const MOVE_TIERS = [
  { at: 1, name: "Rough cut" },
  { at: 5, name: "Rehearsed" },
  { at: 15, name: "Stage-ready" },
  { at: 30, name: "Second nature" },
] as const;

export type MoveCard = {
  tag: Tag;
  label: string;
  definition: string;
  uses: number;
  tier: string | null;
  next: { name: string; at: number } | null;
  /** The most recent saved playbook line that used this move. */
  lastLine: string | null;
};

export function tagTotals(history: readonly HistoryEntry[]) {
  const totals = new Map<Tag, number>();
  for (const entry of history)
    for (const [tag, count] of Object.entries(entry.tagCounts) as [
      Tag,
      number,
    ][])
      totals.set(tag, (totals.get(tag) ?? 0) + count);
  return totals;
}

export function tierFor(uses: number) {
  let tier: string | null = null;
  let next: { name: string; at: number } | null = null;
  for (const step of MOVE_TIERS) {
    if (uses >= step.at) tier = step.name;
    else {
      next = { name: step.name, at: step.at };
      break;
    }
  }
  return { tier, next };
}

export function moveCards(
  history: readonly HistoryEntry[],
  playbook: readonly PlaybookEntry[] = [],
): MoveCard[] {
  const totals = tagTotals(history);
  const newestFirst = [...playbook].sort(
    (a, b) => Date.parse(b.at) - Date.parse(a.at),
  );
  return HELPFUL.map((tag) => {
    const uses = totals.get(tag) ?? 0;
    return {
      tag,
      label: TAG_INFO[tag].label,
      definition: TAG_INFO[tag].definition,
      uses,
      ...tierFor(uses),
      lastLine:
        newestFirst.find((line) => line.tags.includes(tag))?.text ?? null,
    };
  });
}

export type Slip = { tag: Tag; label: string; count: number };

/** The three most frequent unhelpful tags (NO_RESPONSE and UNSAFE excluded: they have no tip). */
export function topSlips(history: readonly HistoryEntry[], limit = 3): Slip[] {
  const totals = tagTotals(history);
  return UNHELPFUL.filter(
    (tag) =>
      tag !== "UNSAFE" && tag !== "NO_RESPONSE" && (totals.get(tag) ?? 0) > 0,
  )
    .map((tag) => ({
      tag,
      label: TAG_INFO[tag].label,
      count: totals.get(tag) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        UNHELPFUL.indexOf(a.tag) - UNHELPFUL.indexOf(b.tag),
    )
    .slice(0, limit);
}
