/*
 * Living Diorama (lab): the light, weather and camera of the miniature are a
 * pure function of the engine's storm number, layered on top of the shared
 * `stageMood` so both styles read the same engine state the same way.
 */
import { stageMood, type MoodInput } from "@/components/stage/mood";

export type DioramaLight = {
  /** 1 = full warm low sun, 0 = none. Drives the gold grade, rim light and bloom. */
  warmth: number;
  /** 1 = full cold flat storm light. Drives the grey-blue grade and the overcast sky. */
  chill: number;
  /** Direction the cast shadows fall on the ground, degrees (0 = toward stage right). */
  shadowAngle: number;
  /** Cast-shadow length as a multiple of the object's footprint (1 = just a blob). */
  shadowLength: number;
  /** Cast-shadow opacity, 0..1. Flat storm light gives faint, soft shadows. */
  shadowOpacity: number;
  /** Sun height above its resting point, 0 (set) .. 1 (up). */
  sunHeight: number;
  /** Three rain layers, far → near: strand counts. Total stays under 60. */
  rain: [number, number, number];
  /** Seconds for one strand to fall, far → near (near falls fastest). */
  rainSeconds: [number, number, number];
  /** Rain slant, degrees from vertical. */
  wind: number;
  /** Ground mist opacity, 0..1 (only at high storm). */
  mist: number;
  /** Clouds overhead (0..5) and how dark they are (0..1). */
  clouds: number;
  cloudDark: number;
  /** Opacity of the moving cloud shadows on the ground. */
  cloudShadow: number;
  lightning: boolean;
  /** Camera dolly toward the child in px of world depth (eases in as the child calms). */
  dolly: number;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}
function unit(v: number, from: number, to: number) {
  return clamp((v - from) / (to - from), 0, 1);
}
function r(v: number, places = 3) {
  const f = 10 ** places;
  return Math.round(v * f) / f;
}

export function dioramaLight(input: MoodInput): DioramaLight {
  const a = clamp(Math.round(input.arousal), 0, 100);
  const mood = stageMood(input);
  const stopped = input.outcome === "stopped_unsafe";
  const warmth = r(1 - unit(a, 15, 60));
  const chill = r(unit(a, 30, 90));
  const rainUnit = mood.rain === 0 ? 0 : unit(a, 45, 100);
  const far = mood.rain === 0 ? 0 : Math.round(8 + 10 * rainUnit);
  const mid = mood.rain === 0 ? 0 : Math.round(5 + 12 * rainUnit);
  const near = mood.rain === 0 ? 0 : Math.round(2 + 8 * rainUnit);
  return {
    warmth,
    chill,
    shadowAngle: r(18 + 40 * unit(a, 10, 80), 1),
    shadowLength: r(1 + 2.6 * warmth, 2),
    shadowOpacity: r(0.62 - 0.4 * unit(a, 15, 85)),
    sunHeight: r(1 - unit(a, 10, 45)),
    rain: [far, mid, near],
    rainSeconds: [
      r(1.6 - 0.6 * rainUnit, 2),
      r(1.1 - 0.45 * rainUnit, 2),
      r(0.75 - 0.3 * rainUnit, 2),
    ],
    wind: r(4 + 14 * unit(a, 45, 100), 1),
    mist: stopped ? 0 : r(0.85 * unit(a, 60, 95)),
    clouds: mood.clouds,
    cloudDark: mood.cloudWeight,
    cloudShadow: r(0.32 * unit(a, 26, 80)),
    lightning: mood.lightning,
    dolly: r(90 * (1 - unit(a, 20, 60)), 1),
  };
}

/**
 * A spring as a CSS `linear()` easing: a damped harmonic oscillator sampled
 * into points, so transitions settle with weight without a JS animation loop.
 */
export function springEasing(stiffness: number, damping: number, mass = 1) {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const at = (t: number) => {
    if (zeta < 1) {
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      return (
        1 -
        Math.exp(-zeta * w0 * t) *
          (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
      );
    }
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  };
  // Duration: until the envelope is within 0.1% of rest.
  const duration = Math.min(4, Math.max(0.3, 6.9 / (zeta * w0)));
  const steps = 48;
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    points.push(String(r(at((duration * i) / steps), 4)));
  }
  points[steps] = "1";
  return {
    easing: `linear(${points.join(", ")})`,
    ms: Math.round(duration * 1000),
  };
}
