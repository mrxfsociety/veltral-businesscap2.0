import { HELPFUL, UNHELPFUL } from "@/engine/tags";
import type { Tag, Temperament } from "@/engine/types";
import { tagTotals } from "./moves";
import type { HistoryEntry } from "./store";

/*
 * This week's plan, level and then-and-now (REDESIGN 8.4–8.5). Pure functions
 * over local history; "this week" is the last seven New York days.
 */

const DAY_MS = 86_400_000;

export function daysBack(today: string, n: number): string {
  return new Date(Date.parse(`${today}T00:00:00Z`) - n * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function inThisWeek(dayKey: string, today: string) {
  return dayKey <= today && dayKey >= daysBack(today, 6);
}

export type PlanScene = { id: string; title: string; temperament: Temperament };

export type PlanItem =
  | { kind: "slip"; tag: Tag; done: boolean }
  | { kind: "move"; tag: Tag; scene: PlanScene | null; done: boolean }
  | { kind: "daily"; done: boolean };

/** Which temperament makes a move land harder in the engine. */
export function temperamentFor(tag: Tag): Temperament {
  if (tag === "OFFER_CHOICE") return "spirited";
  if (tag === "NAME_FEELING" || tag === "CONNECT") return "sensitive";
  return "easygoing";
}

export function weeklyPlan({
  history,
  dailyDone,
  today,
  scenes,
}: {
  history: readonly HistoryEntry[];
  dailyDone: Record<string, true>;
  today: string;
  scenes: readonly PlanScene[];
}): PlanItem[] {
  const daily: PlanItem = { kind: "daily", done: Boolean(dailyDone[today]) };
  if (history.length === 0) return [daily];
  const recent = [...history]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 14);
  const week = history.filter((entry) => inThisWeek(entry.dayKey, today));
  const items: PlanItem[] = [];

  const slipTotals = tagTotals(recent);
  const slip = UNHELPFUL.filter((tag) => tag !== "UNSAFE")
    .map((tag) => ({ tag, count: slipTotals.get(tag) ?? 0 }))
    .filter((item) => item.count > 0)
    .sort(
      (a, b) =>
        b.count - a.count ||
        UNHELPFUL.indexOf(a.tag) - UNHELPFUL.indexOf(b.tag),
    )[0];
  if (slip)
    items.push({
      kind: "slip",
      tag: slip.tag,
      done: week.some((entry) => !(entry.tagCounts[slip.tag] ?? 0)),
    });

  const totals = tagTotals(history);
  const weakest = [...HELPFUL].sort(
    (a, b) =>
      (totals.get(a) ?? 0) - (totals.get(b) ?? 0) ||
      HELPFUL.indexOf(a) - HELPFUL.indexOf(b),
  )[0];
  const wanted = temperamentFor(weakest);
  const played = new Set(recent.map((entry) => entry.sceneId));
  const candidates = scenes.filter((scene) => scene.temperament === wanted);
  items.push({
    kind: "move",
    tag: weakest,
    scene:
      candidates.find((scene) => !played.has(scene.id)) ??
      candidates[0] ??
      null,
    done: week.some((entry) => (entry.tagCounts[weakest] ?? 0) > 0),
  });

  items.push(daily);
  return items;
}

export const LEVELS = [
  0, 500, 1200, 2200, 3500, 5000, 7000, 9500, 12500, 16000,
];

export function levelFor(points: number) {
  let level = 1;
  LEVELS.forEach((threshold, index) => {
    if (points >= threshold) level = index + 1;
  });
  const next = LEVELS[level] ?? null;
  return {
    level,
    points,
    floor: LEVELS[level - 1],
    next,
    toNext: next === null ? 0 : next - points,
  };
}

export function totalPoints(history: readonly HistoryEntry[]) {
  return history.reduce((sum, entry) => sum + (entry.points ?? 0), 0);
}

export type Snapshot = {
  helpfulShare: number | null;
  turnsToCalm: number | null;
  stars: number;
};

function snapshot(entries: readonly HistoryEntry[]): Snapshot {
  const helpful = entries.reduce((sum, entry) => sum + entry.helpful, 0);
  const all = entries.reduce(
    (sum, entry) => sum + entry.helpful + entry.unhelpful,
    0,
  );
  const calm = entries.filter((entry) => entry.outcome === "calm_limit_held");
  return {
    helpfulShare: all ? helpful / all : null,
    turnsToCalm: calm.length
      ? calm.reduce((sum, entry) => sum + entry.turns, 0) / calm.length
      : null,
    stars:
      entries.reduce((sum, entry) => sum + entry.stars, 0) / entries.length,
  };
}

/** First three sessions against the latest three; appears from the fourth session. */
export function thenAndNow(
  history: readonly HistoryEntry[],
):
  | { ready: false; remaining: number }
  | { ready: true; then: Snapshot; now: Snapshot } {
  if (history.length < 4)
    return { ready: false, remaining: 4 - history.length };
  const ordered = [...history].sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at),
  );
  return {
    ready: true,
    then: snapshot(ordered.slice(0, 3)),
    now: snapshot(ordered.slice(-3)),
  };
}
