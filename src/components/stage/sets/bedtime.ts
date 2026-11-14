import type { SceneSet } from "../types";

/*
 * Far: the moon in the window establishes night above the folded floor;
 * a small picture on the other wing balances the room without filling it.
 * Mid: Sam's bed and the warm paper lampshade frame the clear child band.
 * Front: the finished book and edge of a rug cross the apron, nearest to us.
 * The bed's right edge stops at x≈132; stage right belongs to the limit sign.
 */
export const bedtime: SceneSet = {
  timeOfDay: "night",
  wall: "plum",
  floor: "kraft",
  floorPattern: "boards",
  horizon: 232,
  far: [
    { prop: "window", x: 77, y: 175, scale: 0.86, tint: "storm" },
    { prop: "pictureFrame", x: 302, y: 161, scale: 0.84 },
  ],
  mid: [
    { prop: "bed", x: 70, y: 267, scale: 0.82 },
    { prop: "lamp", x: 283, y: 260, scale: 0.82, tint: "mustardLight" },
  ],
  front: [
    { prop: "rug", x: 77, y: 306, scale: 1.04, tint: "plum" },
    { prop: "book", x: 89, y: 300, scale: 1.12 },
  ],
  sign: { x: 330, y: 278 },
};
