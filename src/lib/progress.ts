import type { Tag } from "@/engine/types";
import { isHelpfulTag } from "./playbook";
import { isDayKey, type BrowserStore, type HistoryEntry } from "./store";

const DAY_MS = 86_400_000;

export function newYorkDayKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Yesterday's streak remains active until the current New York day is missed. */
export function currentStreak(
  dayKeys: readonly string[],
  today = newYorkDayKey(),
): number {
  if (!isDayKey(today)) return 0;
  const days = new Set(dayKeys.filter(isDayKey));
  let timestamp = Date.parse(`${today}T00:00:00Z`);
  if (!days.has(today)) timestamp -= DAY_MS;
  let streak = 0;
  while (days.has(new Date(timestamp).toISOString().slice(0, 10))) {
    streak += 1;
    timestamp -= DAY_MS;
  }
  return streak;
}

export interface HelpfulSharePoint {
  id: string;
  at: string;
  sceneTitle: string;
  helpful: number;
  total: number;
  share: number | null;
}

/** Oldest-to-newest chart points; no detected chips is missing data, not a zero. */
export function helpfulShareSeries(
  history: readonly HistoryEntry[],
): HelpfulSharePoint[] {
  return [...history]
    .sort((left, right) => Date.parse(right.at) - Date.parse(left.at))
    .slice(0, 14)
    .reverse()
    .map((entry) => {
      const total = entry.helpful + entry.unhelpful;
      return {
        id: entry.id,
        at: entry.at,
        sceneTitle: entry.sceneTitle,
        helpful: entry.helpful,
        total,
        share: total === 0 ? null : entry.helpful / total,
      };
    });
}

export interface FrequentTag {
  tag: Tag;
  count: number;
}

export function mostFrequentTag(
  history: readonly HistoryEntry[],
  helpful: boolean,
): FrequentTag | null {
  const counts = new Map<Tag, number>();
  for (const entry of history) {
    for (const [tag, value] of Object.entries(entry.tagCounts) as [
      Tag,
      number,
    ][]) {
      if (isHelpfulTag(tag) === helpful && value > 0) {
        counts.set(tag, (counts.get(tag) ?? 0) + value);
      }
    }
  }
  const best = [...counts].sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  )[0];
  return best ? { tag: best[0], count: best[1] } : null;
}

export function bestStarsForScene(
  history: readonly HistoryEntry[],
  sceneId: string,
): number {
  return history.reduce(
    (best, entry) =>
      entry.sceneId === sceneId ? Math.max(best, entry.stars) : best,
    0,
  );
}

export function summarizeProgress(
  store: Pick<BrowserStore, "history" | "dailyDone">,
  today = newYorkDayKey(),
) {
  return {
    sessionsPlayed: store.history.length,
    currentStreak: currentStreak(Object.keys(store.dailyDone), today),
    mostUsedHelpful: mostFrequentTag(store.history, true),
    mostFrequentSlip: mostFrequentTag(store.history, false),
    series: helpfulShareSeries(store.history),
  };
}
