import type { SceneSet } from "../types";

/* Far: tiled wall and hanging towel pin the room to the back plane.
 * Mid: the bath's inset water, broad bubbles and single underside fold sit
 * in the left wing. Front: the reused rug becomes a bath mat; a large duck
 * on its near edge makes the apron tangible without obscuring the child. */
export const bathTime: SceneSet = {
  timeOfDay: "evening",
  wall: "cream",
  floor: "creamDark",
  floorPattern: "tiles",
  horizon: 232,
  far: [
    { prop: "tiledPanel", x: 78, y: 231, scale: 1.04 },
    { prop: "towelHook", x: 291, y: 180, scale: 1.05 },
  ],
  mid: [{ prop: "bathtub", x: 77, y: 267, scale: 0.88 }],
  front: [
    { prop: "rug", x: 86, y: 306, scale: 1.04, tint: "skyLight" },
    { prop: "rubberDuck", x: 85, y: 298, scale: 1.12 },
  ],
  sign: { x: 330, y: 278 },
};
