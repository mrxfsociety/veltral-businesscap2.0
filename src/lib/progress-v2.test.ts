import { describe, expect, it } from "vitest";
import { sampleWeek } from "./demo-week";
import { moveCards, tierFor, topSlips } from "./moves";
import {
  inThisWeek,
  levelFor,
  temperamentFor,
  thenAndNow,
  totalPoints,
  weeklyPlan,
} from "./plan";
import { currentStreak } from "./progress";
import { HistoryEntrySchema } from "./store";

const today = "2026-11-15";
const scenes = [
  {
    id: "store-candy",
    title: "The candy aisle",
    temperament: "spirited" as const,
  },
  {
    id: "wrong-cup",
    title: "The wrong cup",
    temperament: "sensitive" as const,
  },
  {
    id: "bath-time",
    title: "Out of the bath",
    temperament: "easygoing" as const,
  },
];

describe("moves", () => {
  it("tiers at 1, 5, 15 and 30 uses", () => {
    expect(tierFor(0)).toEqual({
      tier: null,
      next: { name: "Rough cut", at: 1 },
    });
    expect(tierFor(4).tier).toBe("Rough cut");
    expect(tierFor(5).tier).toBe("Rehearsed");
    expect(tierFor(15).tier).toBe("Stage-ready");
    expect(tierFor(30)).toEqual({ tier: "Second nature", next: null });
  });

  it("counts uses from saved tag counts and finds the latest line", () => {
    const { history, playbook } = sampleWeek(today);
    const cards = moveCards(history, playbook);
    expect(cards).toHaveLength(7);
    const named = cards.find((card) => card.tag === "NAME_FEELING")!;
    expect(named.uses).toBe(18);
    expect(named.tier).toBe("Stage-ready");
    expect(named.lastLine).toContain("I'm right here");
    expect(cards.find((card) => card.tag === "LABELED_PRAISE")!.uses).toBe(0);
  });

  it("lists the three most frequent slips", () => {
    const slips = topSlips(sampleWeek(today).history);
    expect(slips.map((slip) => slip.tag)).toEqual([
      "DISMISS",
      "QUESTION_COMMAND",
      "THREAT",
    ]);
  });
});

describe("this week's plan", () => {
  it("shows only today's meltdown before the first scene", () => {
    expect(weeklyPlan({ history: [], dailyDone: {}, today, scenes })).toEqual([
      { kind: "daily", done: false },
    ]);
  });

  it("builds three items from history and ticks them automatically", () => {
    const { history, dailyDone } = sampleWeek(today);
    const plan = weeklyPlan({ history, dailyDone, today, scenes });
    expect(plan.map((item) => item.kind)).toEqual(["slip", "move", "daily"]);
    const slip = plan[0];
    expect(slip.kind === "slip" && slip.tag).toBe("DISMISS");
    expect(slip.done).toBe(true);
    const move = plan[1];
    expect(move.kind === "move" && move.tag).toBe("LABELED_PRAISE");
    expect(move.kind === "move" && move.scene?.temperament).toBe("easygoing");
    expect(move.done).toBe(false);
    expect(plan[2].done).toBe(true);
  });

  it("matches moves to the temperament that rewards them", () => {
    expect(temperamentFor("OFFER_CHOICE")).toBe("spirited");
    expect(temperamentFor("NAME_FEELING")).toBe("sensitive");
    expect(temperamentFor("CONNECT")).toBe("sensitive");
    expect(temperamentFor("WHEN_THEN")).toBe("easygoing");
  });

  it("treats the last seven days as this week", () => {
    expect(inThisWeek("2026-11-09", today)).toBe(true);
    expect(inThisWeek("2026-11-08", today)).toBe(false);
    expect(inThisWeek("2026-11-16", today)).toBe(false);
  });
});

describe("level and then-and-now", () => {
  it("levels by summed engine points", () => {
    expect(levelFor(0)).toMatchObject({ level: 1, next: 500, toNext: 500 });
    expect(levelFor(1200)).toMatchObject({ level: 3, next: 2200 });
    expect(levelFor(20000)).toMatchObject({ level: 10, next: null, toNext: 0 });
    expect(totalPoints(sampleWeek(today).history)).toBe(3090);
  });

  it("waits for a fourth session, then compares first three with latest three", () => {
    const { history } = sampleWeek(today);
    expect(thenAndNow(history.slice(0, 2))).toEqual({
      ready: false,
      remaining: 2,
    });
    const result = thenAndNow(history);
    expect(result.ready).toBe(true);
    if (!result.ready) return;
    expect(result.then.helpfulShare).toBeCloseTo(15 / 29);
    expect(result.now.helpfulShare).toBeCloseTo(29 / 30);
    expect(result.now.stars).toBe(3);
    expect(result.then.turnsToCalm).toBe(6);
    expect(result.now.turnsToCalm).toBeCloseTo(13 / 3);
  });
});

describe("sample week", () => {
  it("is valid history, dated relative to today, with a seven-day streak", () => {
    const { history, dailyDone } = sampleWeek(today);
    history.forEach((entry) =>
      expect(HistoryEntrySchema.parse(entry)).toBeTruthy(),
    );
    expect(history[0].dayKey).toBe(today);
    expect(currentStreak(Object.keys(dailyDone), today)).toBe(7);
  });

  it("keeps old entries without points valid", () => {
    const { history } = sampleWeek(today);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { points, ...old } = history[0];
    expect(HistoryEntrySchema.safeParse(old).success).toBe(true);
  });
});
