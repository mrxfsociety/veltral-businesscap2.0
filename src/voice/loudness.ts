/** Levels are digital dBFS relative to the same microphone, not sound-pressure measurements. */
export const SILENCE_DB = -120;
export const WINDOW_MS = 300;
export const LOUD_DELTA_DB = 10;

function boundedSample(value: number): number {
  return Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
}

export function rmsDb(samples: ArrayLike<number>): number {
  if (!samples.length) return SILENCE_DB;
  let sumSquares = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = boundedSample(samples[index]);
    sumSquares += sample * sample;
  }
  return Math.max(
    SILENCE_DB,
    10 * Math.log10(sumSquares / samples.length || 1e-12),
  );
}

/** Complete 300 ms windows, sampled every 50 ms; incomplete tails cannot count as loud windows. */
export function rmsWindowDb(
  samples: ArrayLike<number>,
  sampleRate: number,
  windowMs = WINDOW_MS,
  hopMs = 50,
): number[] {
  if (
    ![sampleRate, windowMs, hopMs].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  ) {
    throw new RangeError("Sample rate and window lengths must be positive.");
  }
  const size = Math.max(1, Math.round((sampleRate * windowMs) / 1000));
  const hop = Math.max(1, Math.round((sampleRate * hopMs) / 1000));
  const results: number[] = [];
  let energy = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = boundedSample(samples[index]);
    energy += sample * sample;
    if (index >= size) {
      const previous = boundedSample(samples[index - size]);
      energy -= previous * previous;
    }
    if (index + 1 >= size && (index + 1 - size) % hop === 0) {
      results.push(
        Math.max(
          SILENCE_DB,
          10 * Math.log10(Math.max(0, energy) / size || 1e-12),
        ),
      );
    }
  }
  return results;
}

export class CalibrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalibrationError";
  }
}

/** Average energy of voiced calibration windows; silence and a saturated microphone are rejected. */
export function calibrateBaseline(windows: readonly number[]): number {
  const valid = windows.filter(
    (value) => Number.isFinite(value) && value >= SILENCE_DB && value <= 0,
  );
  const voiced = valid.filter((value) => value > -60);
  if (voiced.length < 2)
    throw new CalibrationError(
      "We couldn't hear enough speech. Move closer to the microphone and try again.",
    );
  if (voiced.some((value) => value >= -1))
    throw new CalibrationError(
      "The microphone level is too high. Move a little farther away and try again.",
    );
  const meanPower =
    voiced.reduce((sum, value) => sum + 10 ** (value / 10), 0) / voiced.length;
  return Math.max(SILENCE_DB, Math.min(0, 10 * Math.log10(meanPower)));
}

export function isLoud(peakDb: number, baselineDb: number): boolean {
  return (
    Number.isFinite(peakDb) &&
    Number.isFinite(baselineDb) &&
    peakDb >= SILENCE_DB &&
    peakDb <= 0 &&
    baselineDb > SILENCE_DB &&
    baselineDb <= 0 &&
    peakDb - baselineDb >= LOUD_DELTA_DB - 1e-9
  );
}
