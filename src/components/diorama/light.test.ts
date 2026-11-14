import { describe, expect, it } from "vitest";
import { dioramaLight, springEasing } from "./light";

const at = (arousal: number, outcome?: "stopped_unsafe") =>
  dioramaLight({ arousal, connection: 50, lastDelta: 0, outcome });

describe("dioramaLight", () => {
  it("is warm and long-shadowed when calm, cold and flat in a storm", () => {
    const calm = at(20);
    const storm = at(90);
    expect(calm.warmth).toBeGreaterThan(0.8);
    expect(storm.warmth).toBe(0);
    expect(storm.chill).toBe(1);
    expect(calm.shadowLength).toBeGreaterThan(storm.shadowLength);
    expect(calm.shadowOpacity).toBeGreaterThan(storm.shadowOpacity);
    expect(calm.rain).toEqual([0, 0, 0]);
    expect(storm.lightning).toBe(true);
    expect(storm.mist).toBeGreaterThan(0.5);
  });

  it("is monotonic: more storm never means more warmth, less rain or less mist", () => {
    let prev = at(0);
    for (let a = 1; a <= 100; a++) {
      const next = at(a);
      expect(next.warmth).toBeLessThanOrEqual(prev.warmth);
      expect(next.chill).toBeGreaterThanOrEqual(prev.chill);
      expect(next.shadowLength).toBeLessThanOrEqual(prev.shadowLength);
      expect(next.mist).toBeGreaterThanOrEqual(prev.mist);
      expect(next.dolly).toBeLessThanOrEqual(prev.dolly);
      next.rain.forEach((n, i) =>
        expect(n).toBeGreaterThanOrEqual(prev.rain[i]),
      );
      expect(next.rain.reduce((s, n) => s + n, 0)).toBeLessThanOrEqual(60);
      prev = next;
    }
  });

  it("near rain falls faster than far rain", () => {
    const { rainSeconds } = at(80);
    expect(rainSeconds[2]).toBeLessThan(rainSeconds[1]);
    expect(rainSeconds[1]).toBeLessThan(rainSeconds[0]);
  });

  it("stops weather on an unsafe stop", () => {
    const stopped = at(95, "stopped_unsafe");
    expect(stopped.rain).toEqual([0, 0, 0]);
    expect(stopped.mist).toBe(0);
    expect(stopped.lightning).toBe(false);
  });
});

describe("springEasing", () => {
  it("starts at 0, ends at 1 and overshoots when underdamped", () => {
    const { easing, ms } = springEasing(260, 14);
    const values = easing.slice(7, -1).split(", ").map(Number);
    expect(values[0]).toBe(0);
    expect(values.at(-1)).toBe(1);
    expect(Math.max(...values)).toBeGreaterThan(1);
    expect(ms).toBeGreaterThan(300);
  });
});
