import type { SceneSet } from "../types";

/*
 * Far: window and fridge anchor the breakfast kitchen to the back wall.
 * Mid: the offered blue cup sits on the low table; the desired red cup is
 * visibly beyond reach on a high shelf. Both leave the child band untouched.
 * Front: the chair clips the apron and repeats the table's paper and scale.
 * The high shelf ends above the sign, never in front of its text.
 */
export const wrongCup: SceneSet = {
  timeOfDay: "day",
  wall: "cream",
  floor: "rule",
  floorPattern: "tiles",
  horizon: 230,
  far: [
    { prop: "window", x: 77, y: 179, scale: 0.88 },
    { prop: "fridge", x: 349, y: 231, scale: 0.79 },
  ],
  mid: [
    { prop: "table", x: 77, y: 267, scale: 0.88 },
    { prop: "cup", x: 85, y: 226, scale: 0.95, tint: "sky" },
    { prop: "wallShelf", x: 304, y: 163, scale: 0.88 },
    { prop: "cup", x: 309, y: 156, scale: 0.84, tint: "tomato" },
  ],
  front: [{ prop: "chair", x: 53, y: 305, scale: 1.18 }],
  sign: { x: 330, y: 278 },
};
