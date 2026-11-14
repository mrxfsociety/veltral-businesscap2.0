import type { SceneSet } from "../types";

/* Far: bunting and balloons hang at the back of the room, their strings
 * ending behind the mid plane. Mid: the cake rests on the reused table.
 * Front: a door partly overlaps the table's left edge and a wrapped gift
 * reaches the apron; the doorway makes leaving a tangible part of the set. */
export const leavingParty: SceneSet = {
  timeOfDay: "golden",
  wall: "cream",
  floor: "kraft",
  floorPattern: "boards",
  horizon: 232,
  far: [
    { prop: "bunting", x: 94, y: 155, scale: 1.1 },
    { prop: "balloons", x: 297, y: 234, scale: 0.92 },
  ],
  mid: [
    { prop: "table", x: 85, y: 265, scale: 0.8 },
    { prop: "cake", x: 86, y: 228, scale: 0.95 },
  ],
  front: [
    { prop: "door", x: 42, y: 306, scale: 0.8 },
    { prop: "gift", x: 106, y: 300, scale: 1.05 },
  ],
  sign: { x: 330, y: 278 },
};
