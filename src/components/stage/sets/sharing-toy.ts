import type { SceneSet } from "../types";

/* Far: a sparse toy shelf and framed print establish a playroom wall.
 * Mid: the tipped dump truck rests on a small foreshortened rug; this makes
 * a low play area without filling the child's centre. Front: three larger
 * loose blocks crop against the apron, a clear scale jump from shelf toys. */
export const sharingToy: SceneSet = {
  timeOfDay: "day",
  wall: "cream",
  floor: "kraft",
  floorPattern: "boards",
  horizon: 232,
  far: [
    { prop: "toyShelf", x: 74, y: 232, scale: 0.95 },
    { prop: "pictureFrame", x: 301, y: 163, scale: 0.84 },
  ],
  mid: [
    { prop: "rug", x: 77, y: 269, scale: 0.8, tint: "teal" },
    { prop: "dumpTruck", x: 80, y: 261, scale: 1.06 },
  ],
  front: [{ prop: "blocks", x: 85, y: 300, scale: 1.15 }],
  sign: { x: 330, y: 278 },
};
