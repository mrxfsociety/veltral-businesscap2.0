import { describe, expect, it } from "vitest";
import {
  CalibrationError,
  calibrateBaseline,
  isLoud,
  rmsDb,
  rmsWindowDb,
  SILENCE_DB,
} from "./loudness";

const constant = (amplitude: number, count = 3000) =>
  new Float32Array(count).fill(amplitude);

describe("microphone RMS levels", () => {
  it("keeps silence finite and measures quiet and normal synthetic samples", () => {
    expect(rmsDb(constant(0))).toBe(SILENCE_DB);
    expect(rmsDb(new Float32Array())).toBe(SILENCE_DB);
    expect(rmsDb(constant(0.001))).toBeCloseTo(-60, 4);
    expect(rmsDb(constant(0.1))).toBeCloseTo(-20, 4);
  });
  it("measures RMS rather than a one-sample peak", () => {
    const samples = constant(0, 1000);
    samples[0] = 1;
    expect(rmsDb(samples)).toBeCloseTo(-30, 4);
  });
  it("only evaluates complete 300 ms windows", () => {
    expect(rmsWindowDb(constant(0.1, 299), 1000)).toEqual([]);
    expect(rmsWindowDb(constant(0.1, 300), 1000)).toHaveLength(1);
    expect(rmsWindowDb(constant(0.1, 600), 1000)).toHaveLength(7);
  });
  it("finds sustained loudness even across window boundaries", () => {
    const samples = constant(0.01, 1000);
    samples.fill(0.1, 250, 550);
    const peak = Math.max(...rmsWindowDb(samples, 1000));
    expect(peak).toBeCloseTo(-20, 4);
    expect(isLoud(peak, -40)).toBe(true);
  });
  it("does not turn a short spike into a sustained ten-dB rise", () => {
    const samples = constant(0.1, 1000);
    samples[500] = 1;
    const peak = Math.max(...rmsWindowDb(samples, 1000));
    expect(isLoud(peak, -20)).toBe(false);
  });
  it("uses the inclusive ten-dB threshold", () => {
    expect(isLoud(-30, -40)).toBe(true);
    expect(isLoud(-30.01, -40)).toBe(false);
    expect(isLoud(Number.NaN, -40)).toBe(false);
    expect(isLoud(-20, Number.NEGATIVE_INFINITY)).toBe(false);
  });
  it("bounds clipped samples at zero dBFS", () => {
    expect(rmsDb(constant(1))).toBe(0);
    expect(rmsDb(constant(2))).toBe(0);
    expect(rmsDb(constant(-2))).toBe(0);
    expect(
      rmsDb(new Float32Array([Number.NaN, Number.POSITIVE_INFINITY])),
    ).toBe(SILENCE_DB);
  });
  it("rejects invalid sampling geometry", () => {
    expect(() => rmsWindowDb(constant(0), 0)).toThrow(RangeError);
    expect(() => rmsWindowDb(constant(0), 48000, Number.NaN)).toThrow(
      RangeError,
    );
  });
});

describe("three-second calm calibration", () => {
  it("averages voice energy and excludes silence", () => {
    expect(calibrateBaseline([-120, -80, -30, -30, -30])).toBeCloseTo(-30, 6);
    expect(calibrateBaseline([-40, -20])).toBeCloseTo(
      10 * Math.log10(0.00505),
      6,
    );
  });
  it("does not accept a silent or clipping calibration", () => {
    expect(() => calibrateBaseline([-120, -80, -70])).toThrow(CalibrationError);
    expect(() => calibrateBaseline([-120, -30])).toThrow(CalibrationError);
    expect(() => calibrateBaseline([0, 0, 0])).toThrow(CalibrationError);
  });
});
