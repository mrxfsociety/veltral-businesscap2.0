import { describe, expect, it } from "vitest";
import {
  describeStage,
  kidMood,
  pick,
  seeded,
  stageMood,
  trendOf,
} from "./mood";

const base = { connection: 50, lastDelta: 0 };

describe("stageMood", () => {
  it("clears the sky at calm and rises the sun", () => {
    const mood = stageMood({ ...base, arousal: 25 });
    expect(mood.clouds).toBe(0);
    expect(mood.rain).toBe(0);
    expect(mood.sunUp).toBe(true);
    expect(mood.lightning).toBe(false);
  });

  it("hangs 1 + floor((a - 26) / 15) clouds, up to five", () => {
    expect(stageMood({ ...base, arousal: 26 }).clouds).toBe(1);
    expect(stageMood({ ...base, arousal: 40 }).clouds).toBe(1);
    expect(stageMood({ ...base, arousal: 41 }).clouds).toBe(2);
    expect(stageMood({ ...base, arousal: 71 }).clouds).toBe(4);
    expect(stageMood({ ...base, arousal: 86 }).clouds).toBe(5);
    expect(stageMood({ ...base, arousal: 100 }).clouds).toBe(5);
  });

  it("starts rain at 45 and lightning at 85", () => {
    expect(stageMood({ ...base, arousal: 44 }).rain).toBe(0);
    expect(stageMood({ ...base, arousal: 45 }).rain).toBeGreaterThan(0);
    expect(stageMood({ ...base, arousal: 100 }).rain).toBe(36);
    expect(stageMood({ ...base, arousal: 84 }).lightning).toBe(false);
    expect(stageMood({ ...base, arousal: 85 }).lightning).toBe(true);
  });

  it("is monotonic: more arousal never produces less storm", () => {
    let previous = stageMood({ ...base, arousal: 0 });
    for (let a = 1; a <= 100; a++) {
      const next = stageMood({ ...base, arousal: a });
      expect(next.clouds).toBeGreaterThanOrEqual(previous.clouds);
      expect(next.cloudWeight).toBeGreaterThanOrEqual(previous.cloudWeight);
      expect(next.rain).toBeGreaterThanOrEqual(previous.rain);
      expect(next.tint).toBeGreaterThanOrEqual(previous.tint);
      expect(next.sway).toBeGreaterThanOrEqual(previous.sway);
      if (next.rain > 0 && previous.rain > 0)
        expect(next.rainSeconds).toBeLessThanOrEqual(previous.rainSeconds);
      if (previous.lightning) expect(next.lightning).toBe(true);
      previous = next;
    }
  });

  it("caps the tint at 38%", () => {
    expect(stageMood({ ...base, arousal: 100 }).tint).toBeCloseTo(0.38);
    expect(stageMood({ ...base, arousal: 10 }).tint).toBe(0);
  });

  it("drops the sign and mutes colours only when the parent gave in", () => {
    const gaveIn = stageMood({ ...base, arousal: 15, outcome: "calm_gave_in" });
    expect(gaveIn.signDown).toBe(true);
    expect(gaveIn.muted).toBe(true);
    expect(gaveIn.confetti).toBe(false);
    const held = stageMood({
      ...base,
      arousal: 20,
      outcome: "calm_limit_held",
    });
    expect(held.signDown).toBe(false);
    expect(held.confetti).toBe(true);
  });

  it("stops all weather on an unsafe stop", () => {
    const mood = stageMood({ ...base, arousal: 95, outcome: "stopped_unsafe" });
    expect(mood.rain).toBe(0);
    expect(mood.lightning).toBe(false);
    expect(mood.sway).toBe(0);
  });

  it("names the trend from the last delta", () => {
    expect(trendOf(5)).toBe("rising");
    expect(trendOf(-3)).toBe("settling");
    expect(trendOf(0)).toBe("steady");
  });
});

describe("kidMood", () => {
  const poseAt = (arousal: number, outcome?: "calm_gave_in") =>
    kidMood({ ...base, arousal, outcome }).pose;

  it("maps every storm band to its pose", () => {
    expect(poseAt(100)).toBe("floor");
    expect(poseAt(85)).toBe("floor");
    expect(poseAt(84)).toBe("stomp");
    expect(poseAt(70)).toBe("stomp");
    expect(poseAt(69)).toBe("crossed");
    expect(poseAt(55)).toBe("crossed");
    expect(poseAt(54)).toBe("headDown");
    expect(poseAt(40)).toBe("headDown");
    expect(poseAt(39)).toBe("loose");
    expect(poseAt(26)).toBe("loose");
    expect(poseAt(25)).toBe("open");
    expect(poseAt(10, "calm_gave_in")).toBe("holding");
  });

  it("varies shake, flush and tears continuously and never less with more storm", () => {
    let previous = kidMood({ ...base, arousal: 26 });
    for (let a = 27; a <= 100; a++) {
      const next = kidMood({ ...base, arousal: a });
      expect(next.flush).toBeGreaterThanOrEqual(previous.flush);
      if (next.pose === previous.pose) {
        expect(next.shake).toBeGreaterThanOrEqual(previous.shake);
        expect(next.tears).toBeGreaterThanOrEqual(previous.tears);
      }
      previous = next;
    }
    expect(kidMood({ ...base, arousal: 100 }).tears).toBeGreaterThan(
      kidMood({ ...base, arousal: 85 }).tears,
    );
  });

  it("steps forward with high connection and backs away with low", () => {
    expect(
      kidMood({ arousal: 50, connection: 70, lastDelta: 0 }),
    ).toMatchObject({ stance: "front", facing: "audience" });
    expect(
      kidMood({ arousal: 50, connection: 30, lastDelta: 0 }),
    ).toMatchObject({ stance: "wing", facing: "away" });
    expect(kidMood({ arousal: 50, connection: 50, lastDelta: 0 }).stance).toBe(
      "mid",
    );
  });
});

describe("describeStage and seeds", () => {
  it("writes a sentence for screen readers", () => {
    expect(
      describeStage({ arousal: 75, connection: 50, lastDelta: 6 }, "Zoe"),
    ).toBe("Storm 75, rising. Zoe is stomping and shouting.");
  });

  it("is deterministic for a seed", () => {
    const a = seeded("session-1:3");
    const b = seeded("session-1:3");
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(pick("playground-leave", 6)).toBe(pick("playground-leave", 6));
    expect(pick("x", 6)).toBeGreaterThanOrEqual(0);
    expect(pick("x", 6)).toBeLessThan(6);
  });
});
