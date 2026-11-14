import type { SceneSet } from "../types";

/* Far: daylight through a window and a small dresser define the bedroom.
 * Mid: the folded outfit rests on the blanket, away from the child's band.
 * Front: a pair of shoes is much nearer than the bed, at the stage lip. */
export const gettingDressed: SceneSet = {
  timeOfDay: "day",
  wall: "cream",
  floor: "kraft",
  floorPattern: "boards",
  horizon: 232,
  far: [
    { prop: "window", x: 297, y: 181, scale: 0.83 },
    { prop: "dresser", x: 68, y: 231, scale: 0.82 },
  ],
  mid: [
    { prop: "bed", x: 70, y: 267, scale: 0.82 },
    { prop: "clothes", x: 85, y: 231, scale: 1 },
  ],
  front: [{ prop: "shoes", x: 80, y: 300, scale: 1.25 }],
  sign: { x: 330, y: 278 },
};
