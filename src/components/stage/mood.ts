/*
 * The stage is a direct function of engine state. These two functions are the
 * whole mapping: pure, deterministic, unit-tested. The storm is the arousal
 * number; the child's distance is the connection number.
 */
import type { StageOutcome } from "./types";

export type MoodInput = {
  arousal: number;
  connection: number;
  lastDelta: number;
  outcome?: StageOutcome;
  turn?: number;
};

export type Trend = "rising" | "settling" | "steady";

export type StageMood = {
  /** Number of clouds on strings, 0..5. */
  clouds: number;
  /** 0 = clouds hang high and pale, 1 = low and storm-dark. */
  cloudWeight: number;
  /** Paper rain strands, 0..36. */
  rain: number;
  /** Seconds for one strand to fall; lower = faster. */
  rainSeconds: number;
  lightning: boolean;
  /** The sun (or moon) is up on its stick. */
  sunUp: boolean;
  /** Storm tint over the set, multiply opacity 0..0.38. */
  tint: number;
  /** Amplitude of the whole stage's sway, degrees. */
  sway: number;
  trend: Trend;
  confetti: boolean;
  /** The limit sign lies flat. */
  signDown: boolean;
  /** Colours stay muted (gave in). */
  muted: boolean;
};

export type KidPose =
  "floor" | "stomp" | "crossed" | "headDown" | "loose" | "open" | "holding";

export type KidFace =
  "wail" | "shout" | "pout" | "wobble" | "flat" | "smile" | "pleased";

export type KidMood = {
  pose: KidPose;
  face: KidFace;
  /** Position inside the band, 0..1. */
  intensity: number;
  /** Body shake amplitude in viewBox units. */
  shake: number;
  /** Cheek flush opacity, 0..1. */
  flush: number;
  /** Tears per second; 0 = none. */
  tears: number;
  /** front = steps toward the audience, wing = backs toward the wing. */
  stance: "front" | "mid" | "wing";
  facing: "audience" | "side" | "away";
};

export const CALM_AT = 25;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function unit(value: number, from: number, to: number) {
  return clamp((value - from) / (to - from), 0, 1);
}

function round(value: number, places = 3) {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

export function trendOf(lastDelta: number): Trend {
  return lastDelta > 0 ? "rising" : lastDelta < 0 ? "settling" : "steady";
}

export function stageMood({
  arousal,
  lastDelta,
  outcome = "ongoing",
}: MoodInput): StageMood {
  const a = clamp(Math.round(arousal), 0, 100);
  const clouds = a <= CALM_AT ? 0 : Math.min(5, 1 + Math.floor((a - 26) / 15));
  const rain = a >= 45 ? Math.round(8 + 28 * unit(a, 45, 100)) : 0;
  const stopped = outcome === "stopped_unsafe";
  return {
    clouds,
    cloudWeight: round(unit(a, 26, 100)),
    rain: stopped ? 0 : rain,
    rainSeconds: round(1.7 - 0.95 * unit(a, 45, 100), 2),
    lightning: !stopped && a >= 85,
    sunUp: a <= CALM_AT,
    tint: round(0.38 * unit(a, 20, 100)),
    sway: stopped ? 0 : round(a >= 45 ? 0.25 + 0.95 * unit(a, 45, 100) : 0, 2),
    trend: trendOf(lastDelta),
    confetti: outcome === "calm_limit_held",
    signDown: outcome === "calm_gave_in",
    muted: outcome === "calm_gave_in",
  };
}

export function kidMood({
  arousal,
  connection,
  outcome = "ongoing",
}: MoodInput): KidMood {
  const a = clamp(Math.round(arousal), 0, 100);
  const stance = connection >= 70 ? "front" : connection <= 30 ? "wing" : "mid";
  const flush = round(unit(a, 40, 100));
  let pose: KidPose;
  let face: KidFace;
  let intensity: number;
  let shake = 0;
  let tears = 0;
  if (a >= 85) {
    pose = "floor";
    face = "wail";
    intensity = unit(a, 85, 100);
    shake = 2.2 + 2.2 * intensity;
    tears = 2.5 + 2.5 * intensity;
  } else if (a >= 70) {
    pose = "stomp";
    face = "shout";
    intensity = unit(a, 70, 84);
    shake = 1.2 + 1.4 * intensity;
  } else if (a >= 55) {
    pose = "crossed";
    face = "pout";
    intensity = unit(a, 55, 69);
    shake = 0.4 + 0.6 * intensity;
  } else if (a >= 40) {
    pose = "headDown";
    face = "wobble";
    intensity = unit(a, 40, 54);
    shake = 0.6 + 0.8 * intensity;
    tears = 0.5 + 0.5 * intensity;
  } else if (a > CALM_AT) {
    pose = "loose";
    face = "flat";
    intensity = unit(a, 26, 39);
  } else if (outcome === "calm_gave_in") {
    pose = "holding";
    face = "pleased";
    intensity = 0;
  } else {
    pose = "open";
    face = "smile";
    intensity = 0;
  }
  const facing =
    stance === "front"
      ? "audience"
      : stance === "wing"
        ? "away"
        : pose === "crossed" || pose === "holding"
          ? "side"
          : "audience";
  return {
    pose,
    face,
    intensity: round(intensity),
    shake: round(shake, 2),
    flush,
    tears: round(tears, 2),
    stance,
    facing,
  };
}

/** A one-sentence description for screen readers ("Storm 75, rising. Zoe is stomping."). */
export function describeStage(input: MoodInput, childName: string): string {
  const mood = stageMood(input);
  const kid = kidMood(input);
  const doing: Record<KidPose, string> = {
    floor: "on the floor, kicking and wailing",
    stomp: "stomping and shouting",
    crossed: "standing with arms crossed",
    headDown: "looking down, shoulders shaking",
    loose: "standing quietly, breathing slowly",
    open: "calm, stepping toward you",
    holding: "quiet, holding what they wanted",
  };
  return `Storm ${Math.round(input.arousal)}, ${mood.trend}. ${childName} is ${doing[kid.pose]}.`;
}

/** Deterministic pseudo-random numbers from a string seed (mulberry32 over a string hash). */
export function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable hash of a string into 0..n-1. */
export function pick(seed: string, n: number) {
  return Math.floor(seeded(seed)() * n) % n;
}
