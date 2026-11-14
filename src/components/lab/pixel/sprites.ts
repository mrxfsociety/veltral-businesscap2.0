/*
 * Zoe as a 24×32 sprite. Parts are palette-indexed grids written in code and
 * composed at whole-pixel offsets; every pose has two to four frames.
 * Pose and face come from the shared `kidMood`, never from here.
 */
import type { KidFace, KidMood, KidPose } from "@/components/stage/mood";
import { C, CLEAR } from "./palette";

export const KID_W = 24;
export const KID_H = 32;

type Grid = { w: number; h: number; px: Uint8Array };

const KEY: Record<string, number> = {
  ".": CLEAR,
  o: C.ink,
  h: C.umber,
  s: C.skin,
  S: C.umber,
  T: C.teal,
  d: C.storm,
  G: C.gold,
  P: C.plum,
  c: C.cream,
  p: C.peach,
  R: C.tomato,
  t: C.mist,
};

export function grid(rows: string[]): Grid {
  const w = rows[0].length;
  const px = new Uint8Array(w * rows.length);
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`Ragged sprite row ${y}: "${row}"`);
    for (let x = 0; x < w; x++) {
      const v = KEY[row[x]];
      if (v === undefined) throw new Error(`Unknown sprite key "${row[x]}"`);
      px[y * w + x] = v;
    }
  });
  return { w, h: rows.length, px };
}

function mirror(g: Grid): Grid {
  const px = new Uint8Array(g.px.length);
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < g.w; x++)
      px[y * g.w + x] = g.px[y * g.w + (g.w - 1 - x)];
  return { ...g, px };
}

const BUN = grid([".oo.", "ohho", "ohho", ".oo."]);

const HEAD = grid([
  "....oooooooo....",
  "..oohhhhhhhhoo..",
  ".ohhhhhhhhhhhho.",
  ".ohhhhhhhhhhhho.",
  "ohhssshhhhssshho",
  "ohssssssssssssho",
  "osssssssssssssSo",
  "osssssssssssssSo",
  "osssssssssssssSo",
  ".osssssssssssSo.",
  "..oosssssssSoo..",
  "....oooooooo....",
]);

/** From behind: all hair. */
const HEAD_BACK = grid([
  "....oooooooo....",
  "..oohhhhhhhhoo..",
  ".ohhhhhhhhhhhho.",
  ".ohhhhhhhhhhhho.",
  "ohhhhhhhhhhhhhho",
  "ohhhhhhhhhhhhhho",
  "ohhhhhhhhhhhhhSo",
  "ohhhhhhhhhhhhhSo",
  "ohhhhhhhhhhhhhSo",
  ".ohhhhhhhhhhhSo.",
  "..oossssssssoo..",
  "....oooooooo....",
]);

/** Faces: 12×6 overlays at head (2, 5). */
const FACES: Record<KidFace, Grid> = {
  smile: grid([
    "............",
    "..co....co..",
    "..oo....oo..",
    "p..........p",
    "....o..o....",
    ".....oo.....",
  ]),
  pleased: grid([
    "............",
    "...o....o...",
    "..o.o..o.o..",
    "p..........p",
    ".....o.o....",
    "......o.....",
  ]),
  flat: grid([
    "..oo....oo..",
    "..oo....oo..",
    "............",
    "............",
    "............",
    "....oooo....",
  ]),
  wobble: grid([
    "............",
    "..co....co..",
    "..oo....oo..",
    "..t.........",
    "..t.o.o.o...",
    ".....o.o....",
  ]),
  pout: grid([
    ".o........o.",
    "..oo....oo..",
    "..oo....oo..",
    "p..........p",
    ".....oo.....",
    "....o..o....",
  ]),
  shout: grid([
    "..o......o..",
    "...oo..oo...",
    "..oo....oo..",
    "p....oo....p",
    "....oRRo....",
    ".....oo.....",
  ]),
  wail: grid([
    "............",
    "..o......o..",
    "...o....o...",
    "t...oooo...t",
    "...oRRRRo...",
    "....oooo....",
  ]),
};

const TORSO = grid([
  "..oooooooo..",
  ".oTTTTTTTTo.",
  "oTTTTTTTTdTo",
  "oTTTTTTTTTdo",
  "oGGGGGGGGGGo",
  "oTTTTTTTTTdo",
  "oTTTTTTTdTdo",
  ".oTTTTTTTTo.",
  "..oooooooo..",
]);

const LEG_L = grid(["oPPo", "oPPo", "oPPo", "oPdo", "oPPo", "ooo.", "ooo."]);
const LEG_R = mirror(LEG_L);
const LEG_OUT_L = grid(["...oooo", "ooPPPPo", "ooPPdPo", "...oooo"]);
const LEG_OUT_R = mirror(LEG_OUT_L);

const ARM_DOWN = grid(["oTo", "oTo", "oTo", "oTo", "oso", "oso", ".o."]);
const ARM_UP = grid([".o.", "oso", "oso", "oTo", "oTo", "oTo", "oTo"]);
const ARM_OPEN_L = grid(["oo...", "oso..", ".oTo.", "..oTo", "...oo"]);
const ARM_OPEN_R = mirror(ARM_OPEN_L);
const ARMS_CROSSED = grid([".oooooooooo.", "oTTsTTTTsTTo", ".oooooooooo."]);
const BALL = grid([".oooo.", "oGGGGo", "oGcGGo", "oGGGGo", ".oooo."]);

type Blit = [Grid, number, number];

/** Frames per pose: two to four. `hold` = ticks per frame at the stage's 10 fps. */
export const FRAMES: Record<KidPose, { count: number; hold: number }> = {
  floor: { count: 3, hold: 2 },
  stomp: { count: 4, hold: 2 },
  crossed: { count: 2, hold: 5 },
  headDown: { count: 3, hold: 3 },
  loose: { count: 2, hold: 7 },
  open: { count: 2, hold: 5 },
  holding: { count: 2, hold: 6 },
};

const Y0 = 3;

function standing(frame: number, pose: KidPose): Blit[] {
  const parts: Blit[] = [];
  let bodyDy = 0;
  let headDy = 0;
  let dx = 0;
  let legL = 0;
  let legR = 0;
  if (pose === "loose") headDy = frame === 1 ? 1 : 0;
  if (pose === "open") bodyDy = frame === 1 ? -1 : 0;
  if (pose === "headDown") {
    headDy = 2;
    dx = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  }
  if (pose === "crossed") legR = frame === 1 ? -1 : 0;
  if (pose === "stomp") {
    legL = frame === 0 ? -3 : 0;
    legR = frame === 2 ? -3 : 0;
    bodyDy = frame === 1 || frame === 3 ? 1 : 0;
  }
  const by = Y0 + bodyDy;
  parts.push([LEG_L, 7, 22 + Y0 + legL], [LEG_R, 13, 22 + Y0 + legR]);
  parts.push([TORSO, 6 + dx, 13 + by]);
  if (pose === "crossed") parts.push([ARMS_CROSSED, 6 + dx, 16 + by]);
  else if (pose === "open")
    parts.push([ARM_OPEN_L, 1, 11 + by], [ARM_OPEN_R, 18, 11 + by]);
  else if (pose === "stomp")
    parts.push([ARM_UP, 3, 6 + by], [ARM_UP, 18, 6 + by]);
  else if (pose === "holding")
    parts.push(
      [ARM_DOWN, 5, 14 + by],
      [ARM_DOWN, 16, 14 + by],
      [BALL, 9, 17 + by],
    );
  else parts.push([ARM_DOWN, 4 + dx, 14 + by], [ARM_DOWN, 17 + dx, 14 + by]);
  parts.push([BUN, 2 + dx, 1 + by + headDy], [BUN, 18 + dx, 1 + by + headDy]);
  return parts;
}

function floorParts(frame: number): Blit[] {
  const by = Y0 + 6;
  const kickL = frame === 0 ? -1 : 0;
  const kickR = frame === 1 ? -1 : 0;
  const flail = frame === 2;
  return [
    [LEG_OUT_L, 0, 25 + Y0 + kickL],
    [LEG_OUT_R, 17, 25 + Y0 + kickR],
    [TORSO, 6, 13 + by],
    ...(flail
      ? ([
          [ARM_OPEN_L, 1, 11 + by],
          [ARM_OPEN_R, 18, 11 + by],
        ] as Blit[])
      : ([
          [ARM_UP, 3, 6 + by],
          [ARM_UP, 18, 6 + by],
        ] as Blit[])),
    [BUN, 2, 1 + by],
    [BUN, 18, 1 + by],
  ];
}

function blit(out: Uint8Array, g: Grid, ox: number, oy: number) {
  for (let y = 0; y < g.h; y++) {
    const ty = oy + y;
    if (ty < 0 || ty >= KID_H) continue;
    for (let x = 0; x < g.w; x++) {
      const tx = ox + x;
      const v = g.px[y * g.w + x];
      if (v === CLEAR || tx < 0 || tx >= KID_W) continue;
      out[ty * KID_W + tx] = v;
    }
  }
}

/** The whole sprite for one frame of one mood, as palette indices (CLEAR = transparent). */
export function kidSprite(
  kid: Pick<KidMood, "pose" | "face" | "facing">,
  tick: number,
): Uint8Array {
  const { count, hold } = FRAMES[kid.pose];
  const frame = Math.floor(tick / hold) % count;
  const out = new Uint8Array(KID_W * KID_H).fill(CLEAR);
  const parts =
    kid.pose === "floor" ? floorParts(frame) : standing(frame, kid.pose);
  // Body parts first, then the head on top.
  const bunsAt = parts.findIndex(([g]) => g === BUN);
  parts.slice(0, bunsAt).forEach(([g, x, y]) => blit(out, g, x, y));
  const [, bx, by] = parts[bunsAt];
  const hx = bx + 2;
  const hy = by + 1;
  parts.slice(bunsAt).forEach(([g, x, y]) => blit(out, g, x, y));
  const away = kid.facing === "away";
  blit(out, away ? HEAD_BACK : HEAD, hx, hy);
  if (!away) {
    const side = kid.facing === "side" ? 1 : 0;
    blit(out, FACES[kid.face], hx + 2 + side, hy + 5);
    // Wailing: tears fly off on alternate frames.
    if (kid.face === "wail" && frame !== 1) {
      out[(hy + 7) * KID_W + Math.max(0, hx - 1)] = C.mist;
      out[(hy + 6) * KID_W + Math.min(KID_W - 1, hx + 16)] = C.mist;
    }
  }
  return out;
}
