/*
 * Pixel (lab): the playground at 192×144, drawn into a buffer of palette
 * indices. A pure function of (mood, kid, tick, seed): the same input always
 * gives the same pixels. No opacity, no gradients, whole-pixel positions only.
 */
import type { KidMood, StageMood } from "@/components/stage/mood";
import { seeded } from "@/components/stage/mood";
import { C, CLEAR, FLASH, SHIFTS, shiftFor } from "./palette";
import { KID_H, KID_W, kidSprite } from "./sprites";

export const W = 192;
export const H = 144;
export const HORIZON = 92;

export type PixelFrameInput = {
  mood: StageMood;
  kid: KidMood;
  tick: number;
  seed: string;
  /** Static frame: no pan, no drift, no flash (thumbnails, reduced motion). */
  still?: boolean;
};

type Buf = Uint8Array;

function put(b: Buf, x: number, y: number, c: number) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  b[y * W + x] = c;
}
function rect(b: Buf, x: number, y: number, w: number, h: number, c: number) {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) put(b, i, j, c);
}
/** A checkerboard of `c` over what is there: the only way this style shades. */
function dither(
  b: Buf,
  x: number,
  y: number,
  w: number,
  h: number,
  c: number,
  phase = 0,
) {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++)
      if ((i + j + phase) % 2 === 0) put(b, i, j, c);
}
function disc(b: Buf, cx: number, cy: number, r: number, c: number) {
  for (let j = -r; j <= r; j++)
    for (let i = -r; i <= r; i++)
      if (i * i + j * j <= r * r + r * 0.6) put(b, cx + i, cy + j, c);
}

/** Sky bands per palette shift, top to bottom: [colour, last row]. */
const SKY: readonly (readonly [number, number])[][] = [
  [
    [C.sky, 26],
    [C.peach, 58],
    [C.gold, HORIZON],
  ],
  [
    [C.sky, 60],
    [C.peach, HORIZON],
  ],
  [
    [C.slate, 28],
    [C.mist, HORIZON],
  ],
  [
    [C.storm, 36],
    [C.slate, HORIZON],
  ],
  [
    [C.ink, 26],
    [C.storm, 70],
    [C.slate, HORIZON],
  ],
];

function drawSky(b: Buf, level: number) {
  const bands = SKY[level];
  let top = 0;
  bands.forEach(([c, last], i) => {
    rect(b, 0, top, W, last - top + 1, c);
    const next = bands[i + 1];
    // Two dithered rows hand over to the next band.
    if (next) dither(b, 0, last - 1, W, 2, next[0]);
    top = last + 1;
  });
}

/** The camera pans one whole pixel at a time, back and forth: -8..8. */
export function cameraAt(tick: number) {
  const t = Math.floor(tick / 5) % 32;
  return t < 16 ? t - 8 : 24 - t;
}

function hillY(x: number) {
  return (
    HORIZON -
    9 +
    Math.round(3 * Math.sin(x * 0.045) + 2 * Math.sin(x * 0.13 + 1))
  );
}

function drawHills(b: Buf, off: number) {
  for (let x = 0; x < W; x++) {
    const y = hillY(x + off);
    for (let j = y; j <= HORIZON; j++) put(b, x, j, C.leafDark);
    put(b, x, y, C.leaf);
  }
}

function drawTree(b: Buf, x: number, base: number) {
  rect(b, x + 6, base - 9, 3, 9, C.kraft);
  rect(b, x + 8, base - 9, 1, 9, C.umber);
  disc(b, x + 7, base - 16, 7, C.leaf);
  disc(b, x + 3, base - 12, 4, C.leaf);
  disc(b, x + 11, base - 12, 4, C.leaf);
  // Shadow side: dither on the right and underneath.
  for (let j = base - 23; j <= base - 8; j++)
    for (let i = x + 7; i <= x + 15; i++)
      if (
        b[j * W + i] === C.leaf &&
        (i + j) % 2 === 0 &&
        i + (j - base + 16) > x + 9
      )
        put(b, i, j, C.leafDark);
  put(b, x + 4, base - 19, C.cream);
  put(b, x + 5, base - 20, C.cream);
}

function drawGround(b: Buf) {
  rect(b, 0, HORIZON + 1, W, H - HORIZON - 1, C.leaf);
  for (let y = HORIZON + 2; y < H; y += 6) dither(b, 0, y, W, 2, C.leafDark);
  // Sand under the play area.
  for (let j = -12; j <= 12; j++)
    for (let i = -66; i <= 66; i++)
      if ((i * i) / (66 * 66) + (j * j) / (12 * 12) <= 1)
        put(b, 98 + i, 116 + j, C.kraft);
  dither(b, 40, 106, 116, 4, C.peach);
}

/** A hard dithered shadow cast to the right, longer when the sun is low. */
function drawShadow(b: Buf, x: number, y: number, w: number, long: boolean) {
  const len = long ? w + 14 : Math.ceil(w * 0.6);
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < len - j * 2; i++)
      if ((i + j) % 2 === 0) put(b, x + i + j, y + j, C.leafDark);
}

function drawSlide(b: Buf, x: number, y: number) {
  rect(b, x, y - 30, 2, 30, C.teal);
  rect(b, x + 9, y - 30, 2, 30, C.teal);
  for (let j = y - 26; j < y; j += 5) rect(b, x + 2, j, 7, 1, C.gold);
  rect(b, x - 1, y - 32, 14, 3, C.kraft);
  rect(b, x - 1, y - 30, 14, 1, C.umber);
  // The chute: a thick stepped diagonal with a light edge.
  for (let i = 0; i < 26; i++) {
    const cy = y - 30 + Math.floor(i * 1.1);
    rect(b, x + 12 + i, cy, 2, 3, C.tomato);
    put(b, x + 12 + i, cy, C.peach);
    put(b, x + 13 + i, cy + 2, C.plum);
  }
  rect(b, x + 38, y - 2, 6, 2, C.tomato);
}

function drawSwing(b: Buf, x: number, y: number, tick: number) {
  rect(b, x, y - 34, 34, 2, C.plum);
  for (let j = 0; j < 34; j++) {
    put(b, x + 2 + Math.floor(j / 6), y - 32 + j, C.plum);
    put(b, x + 31 - Math.floor(j / 6), y - 32 + j, C.plum);
  }
  const sway = [0, 1, 0, -1][Math.floor(tick / 6) % 4];
  for (let j = y - 32; j < y - 10; j++) {
    put(b, x + 13 + (j > y - 20 ? sway : 0), j, C.ink);
    put(b, x + 20 + (j > y - 20 ? sway : 0), j, C.ink);
  }
  rect(b, x + 12 + sway, y - 10, 10, 2, C.gold);
}

function drawBench(b: Buf, x: number, y: number) {
  rect(b, x, y - 9, 24, 2, C.kraft);
  rect(b, x, y - 5, 24, 2, C.kraft);
  rect(b, x, y - 7, 24, 1, C.umber);
  rect(b, x + 2, y - 3, 2, 3, C.ink);
  rect(b, x + 20, y - 3, 2, 3, C.ink);
}

/** The limit on a small sign on a post. It lies flat when the parent gives in. */
function drawSign(b: Buf, x: number, y: number, down: boolean) {
  if (down) {
    rect(b, x - 4, y - 2, 18, 3, C.cream);
    rect(b, x - 4, y + 1, 18, 1, C.ink);
    rect(b, x + 14, y - 1, 6, 1, C.kraft);
    return;
  }
  rect(b, x + 4, y - 20, 2, 20, C.kraft);
  rect(b, x - 2, y - 30, 14, 11, C.ink);
  rect(b, x - 1, y - 29, 12, 9, C.cream);
  for (let j = 0; j < 3; j++)
    rect(b, x + 1, y - 27 + j * 3, 8 - (j % 2) * 3, 1, C.slate);
}

function drawCloud(b: Buf, x: number, y: number, light: number, dark: number) {
  const blobs: [number, number, number][] = [
    [6, 6, 5],
    [13, 4, 6],
    [21, 6, 5],
  ];
  blobs.forEach(([cx, cy, r]) => disc(b, x + cx, y + cy, r, light));
  rect(b, x + 2, y + 7, 25, 4, light);
  // Underside: the darker step, dithered where it meets the light.
  rect(b, x + 2, y + 10, 25, 2, dark);
  dither(b, x + 1, y + 8, 27, 2, dark);
}

const CLOUD_TONES: [number, number][] = [
  [C.cream, C.mist],
  [C.cream, C.mist],
  [C.mist, C.slate],
  [C.slate, C.storm],
  [C.storm, C.ink],
];
const CLOUD_SLOTS = [70, 12, 130, 168, 100];

const STANCE_X = { front: 98, mid: 92, wing: 66 } as const;
const STANCE_Y = { front: 128, mid: 124, wing: 118 } as const;

/** One frame of the stage. */
export function renderPixelFrame(input: PixelFrameInput, out?: Buf): Buf {
  const { mood, kid, seed, still } = input;
  const tick = still ? 0 : input.tick;
  const b = out ?? new Uint8Array(W * H);
  const level = shiftFor(mood.cloudWeight, mood.sunUp);
  const cam = still ? 0 : cameraAt(tick);

  drawSky(b, level);
  if (mood.sunUp) {
    disc(b, 40, 70, 10, C.gold);
    disc(b, 40, 70, 7, C.cream);
    dither(b, 31, 60, 19, 3, C.gold, 1);
  }
  // Clouds: darker palette steps as the storm grows, lower and heavier.
  const [light, dark] = CLOUD_TONES[level];
  const drift = still ? 0 : Math.floor(tick / 8);
  for (let i = 0; i < mood.clouds; i++) {
    const x = ((CLOUD_SLOTS[i] + drift + i * 7) % (W + 40)) - 30;
    const y = 4 + Math.round(mood.cloudWeight * 14) + (i % 2) * 6;
    drawCloud(b, x, y, light, dark);
  }

  // Layer 1 (slowest): far hills. Layer 2: trees. Layer 3: the playground.
  drawHills(b, Math.floor(cam * 0.25) + 40);
  const treeOff = Math.floor(cam * 0.5);
  for (const tx of [-10, 30, 76, 118, 160, 200])
    drawTree(b, tx + treeOff, HORIZON + 2);
  drawGround(b);

  const near = cam;
  const long = mood.sunUp;
  drawShadow(b, 30 + near, 113, 46, long);
  drawShadow(b, 126 + near, 110, 34, long);
  drawShadow(b, 160 + near, 131, 24, long);
  drawSlide(b, 30 + near, 112);
  drawSwing(b, 126 + near, 110, still ? 0 : tick);
  drawSign(b, 176 + near, 110, mood.signDown);
  drawBench(b, 160 + near, 131);

  // The palette shift recolours the set, never the child.
  const shift = SHIFTS[level];
  for (let i = 0; i < b.length; i++) b[i] = shift[b[i]];

  const kx = STANCE_X[kid.stance] + near;
  const ky = STANCE_Y[kid.stance];
  drawShadow(b, kx + 4, ky, 16, long);
  const sprite = kidSprite(kid, tick);
  const flip = kid.facing === "away";
  for (let y = 0; y < KID_H; y++)
    for (let x = 0; x < KID_W; x++) {
      const v = sprite[y * KID_W + (flip ? KID_W - 1 - x : x)];
      if (v !== CLEAR) put(b, kx + x, ky - KID_H + 1 + y, v);
    }

  // Rain: single-pixel streaks, three pixels long, slanting with the wind.
  if (mood.rain > 0) {
    const rnd = seeded(`${seed}:pixel-rain`);
    const speed = Math.max(4, Math.round(H / (mood.rainSeconds * 10)));
    for (let i = 0; i < mood.rain; i++) {
      const x0 = Math.floor(rnd() * W);
      const d = Math.floor(rnd() * H) + tick * speed;
      const y = d % (H + 8);
      // The wind carries a streak one pixel left for every four it falls.
      const x = (((x0 - Math.floor(d / 4)) % W) + W) % W;
      const c = level >= 4 ? C.mist : C.cream;
      put(b, x, y, c);
      put(b, x, y - 1, c);
      put(b, x + 1, y - 2, c);
    }
  }

  // Confetti for a calm ending with the limit held.
  if (mood.confetti && !still) {
    const rnd = seeded(`${seed}:pixel-confetti`);
    const colours = [C.gold, C.tomato, C.teal, C.cream];
    for (let i = 0; i < 28; i++) {
      const x = Math.floor(rnd() * W) + ((Math.floor(tick / 3) + i) % 3) - 1;
      const y = (Math.floor(rnd() * H) + tick * 2) % H;
      put(b, x, y, colours[i % 4]);
    }
  }

  // Lightning: one white frame and a bolt, every few seconds.
  if (mood.lightning && !still) {
    const period = 34 + Math.floor(seeded(`${seed}:bolt`)() * 12);
    if (tick % period === period - 1) {
      for (let i = 0; i < b.length; i++) b[i] = FLASH[b[i]];
      let x = 124;
      for (let y = 0; y < 60; y++) {
        x += [0, 1, -1, 1, 0, -1][Math.floor(y / 6) % 6];
        put(b, x, y, C.ink);
        put(b, x + 1, y, C.ink);
      }
    }
  }
  return b;
}

/** True when this tick is the single lightning frame. */
export function isFlashTick(mood: StageMood, tick: number, seed: string) {
  if (!mood.lightning) return false;
  const period = 34 + Math.floor(seeded(`${seed}:bolt`)() * 12);
  return tick % period === period - 1;
}
