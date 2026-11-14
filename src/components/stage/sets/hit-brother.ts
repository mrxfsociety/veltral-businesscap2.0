import type { SceneSet } from "../types";

/* Far: book cubbies and a small picture belong against the back wall.
 * Mid: the familiar sofa gives the child a living-room scale. Front: the
 * board and three scattered pieces lie on the nearest rug, not in the
 * child's standing space. The contrast in scale creates three real planes. */
export const hitBrother: SceneSet = {
  timeOfDay: "day",
  wall: "cream",
  floor: "kraft",
  floorPattern: "boards",
  horizon: 232,
  far: [
    { prop: "bookshelf", x: 68, y: 232, scale: 0.84 },
    { prop: "pictureFrame", x: 301, y: 163, scale: 0.84, tint: "teal" },
  ],
  mid: [{ prop: "sofa", x: 76, y: 266, scale: 0.76 }],
  front: [
    { prop: "rug", x: 85, y: 306, scale: 1.1, tint: "plum" },
    { prop: "boardGame", x: 91, y: 300, scale: 1.05 },
  ],
  sign: { x: 330, y: 278 },
};
