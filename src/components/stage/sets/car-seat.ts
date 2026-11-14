import type { SceneSet } from "../types";

/* Far: house and garage stop at the driveway horizon. Mid: the open rear
 * door and empty harness establish the refused seat, entirely in the left
 * wing. Front: a hedge cuts across the apron, making the driveway recede.
 * The seat sits in the car's rear opening, not on top of its bodywork. */
export const carSeat: SceneSet = {
  timeOfDay: "day",
  floor: "rule",
  horizon: 232,
  far: [
    { prop: "house", x: 75, y: 232, scale: 0.85 },
    { prop: "garageDoor", x: 302, y: 232, scale: 0.94 },
  ],
  mid: [
    { prop: "car", x: 80, y: 267, scale: 0.82 },
    { prop: "carSeat", x: 67.7, y: 252.2, scale: 0.58 },
  ],
  front: [{ prop: "hedge", x: 66, y: 306, scale: 1.1 }],
  sign: { x: 330, y: 278 },
};
