import type { SceneSet } from "../types";

/* Far: the evening window and hanging lamp belong to the back wall.
 * Mid: a plate sits on the table's actual top in the left wing; the table
 * cannot cover Lily or the stage-right limit. Front: the near chair crosses
 * the frame and gives the otherwise still dinner room a strong near plane. */
export const dinnerRefusal: SceneSet = {
  timeOfDay: "evening",
  wall: "cream",
  floor: "kraft",
  floorPattern: "boards",
  horizon: 231,
  far: [
    { prop: "window", x: 302, y: 180, scale: 0.8, tint: "stormLight" },
    { prop: "pendantLamp", x: 77, y: 152, scale: 0.92 },
  ],
  mid: [
    { prop: "table", x: 77, y: 267, scale: 0.9 },
    { prop: "dinnerPlate", x: 86, y: 226, scale: 1 },
  ],
  front: [{ prop: "chair", x: 46, y: 305, scale: 1.18 }],
  sign: { x: 330, y: 278 },
};
