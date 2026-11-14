import type { SceneSet } from "../types";

/* Far: lamp and framed picture fix the room's scale at the back wall.
 * Mid: the sofa stays in the left wing, leaving Eli and the sign unblocked.
 * Front: a broad rug crosses the apron; the face-down tablet is nearest us,
 * quiet and visibly switched off. Its dark back never imitates a lit screen. */
export const tabletOff: SceneSet = {
  timeOfDay: "evening",
  wall: "creamDark",
  floor: "kraft",
  floorPattern: "boards",
  horizon: 232,
  far: [
    { prop: "lamp", x: 48, y: 232, scale: 0.9 },
    { prop: "pictureFrame", x: 308, y: 155, scale: 0.98, tint: "sky" },
  ],
  mid: [{ prop: "sofa", x: 76, y: 266, scale: 0.76 }],
  front: [
    { prop: "rug", x: 119, y: 305, scale: 1.18, tint: "teal" },
    { prop: "tabletFaceDown", x: 92, y: 298, scale: 1.18 },
  ],
  sign: { x: 330, y: 278 },
};
