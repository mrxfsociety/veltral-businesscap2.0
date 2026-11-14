import { describe, expect, it } from "vitest";
import { rainGain } from "./sound";

describe("rainGain", () => {
  it("is silent below the rain threshold and capped at the top", () => {
    expect(rainGain(0)).toBe(0);
    expect(rainGain(44)).toBe(0);
    expect(rainGain(45)).toBeGreaterThan(0);
    expect(rainGain(100)).toBe(0.16);
  });

  it("never gets quieter as the storm rises", () => {
    let previous = 0;
    for (let storm = 0; storm <= 100; storm++) {
      const gain = rainGain(storm);
      expect(gain).toBeGreaterThanOrEqual(previous);
      previous = gain;
    }
  });
});
