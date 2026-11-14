import { describe, expect, it } from "vitest";
import {
  currentStreak,
  helpfulShareSeries,
  mostFrequentTag,
  newYorkDayKey,
  summarizeProgress,
} from "./progress";
import type { HistoryEntry } from "./store";

function entry(index: number, helpful = 3, unhelpful = 1): HistoryEntry {
  return {
    id: `run-${index}`,
    at: new Date(Date.UTC(2026, 10, 1 + index)).toISOString(),
    dayKey: new Date(Date.UTC(2026, 10, 1 + index)).toISOString().slice(0, 10),
    kind: "daily",
    sceneId: "bedtime",
    sceneTitle: "Bedtime",
    outcome: "calm_limit_held",
    stars: 2,
    turns: 5,
    par: 3,
    helpful,
    unhelpful,
    tagCounts: { CONNECT: helpful, THREAT: unhelpful },
  };
}

describe("progress", () => {
  it("counts consecutive days across year, leap-day and DST boundaries", () => {
    expect(
      currentStreak(
        ["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-01"],
        "2027-01-01",
      ),
    ).toBe(3);
    expect(
      currentStreak(["2028-02-28", "2028-02-29", "2028-03-01"], "2028-03-01"),
    ).toBe(3);
    expect(
      currentStreak(["2026-03-07", "2026-03-08", "2026-03-09"], "2026-03-09"),
    ).toBe(3);
  });

  it("allows playing later today but breaks after a missed day and ignores future/invalid keys", () => {
    expect(currentStreak(["2026-11-12", "2026-11-13"], "2026-11-14")).toBe(2);
    expect(currentStreak(["2026-11-12"], "2026-11-14")).toBe(0);
    expect(
      currentStreak(["2026-11-15", "2026-02-30", "garbage"], "2026-11-14"),
    ).toBe(0);
    expect(currentStreak([], "2026-11-14")).toBe(0);
  });

  it("uses the New York calendar rather than the browser or UTC day", () => {
    expect(newYorkDayKey(new Date("2026-11-14T03:00:00Z"))).toBe("2026-11-13");
    expect(newYorkDayKey(new Date("2026-11-14T06:00:00Z"))).toBe("2026-11-14");
  });

  it("charts the latest fourteen sessions oldest first and preserves zero-chip missing data", () => {
    const points = helpfulShareSeries(
      Array.from({ length: 17 }, (_, index) => entry(index)),
    );
    expect(points).toHaveLength(14);
    expect(points[0]?.id).toBe("run-3");
    expect(points[13]?.id).toBe("run-16");
    expect(points.every(({ share }) => share === 0.75)).toBe(true);
    expect(helpfulShareSeries([entry(1, 0, 0)])[0]?.share).toBeNull();
    expect(helpfulShareSeries([entry(1, 0, 2)])[0]?.share).toBe(0);
  });

  it("counts tags from actual history and has honest empty statistics", () => {
    const history = [entry(1, 2, 1), entry(2, 3, 0)];
    expect(mostFrequentTag(history, true)).toEqual({
      tag: "CONNECT",
      count: 5,
    });
    expect(mostFrequentTag(history, false)).toEqual({
      tag: "THREAT",
      count: 1,
    });
    expect(
      summarizeProgress({ history: [], dailyDone: {} }, "2026-11-14"),
    ).toEqual({
      sessionsPlayed: 0,
      currentStreak: 0,
      mostUsedHelpful: null,
      mostFrequentSlip: null,
      series: [],
    });
  });
});
