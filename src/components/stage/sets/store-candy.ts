import type { SceneSet } from "../types";

/*
 * The candy aisle at the checkout. Indoors, daylight: a cream wall, tiled floor.
 *
 *  far   shelving units along the back wall, one behind the sign side.
 *  mid   the checkout belt at stage left and the candy rack just right of the
 *        centre: the thing Mia wants is close but not in the middle.
 *  front the cart crosses the bottom-left corner.
 */
export const storeCandy: SceneSet = {
  timeOfDay: "day",
  wall: "cream",
  floor: "rule",
  floorPattern: "tiles",
  horizon: 228,
  far: [
    { prop: "shelves", x: 44, y: 230, scale: 0.9 },
    { prop: "shelves", x: 136, y: 230, scale: 0.82 },
    { prop: "shelves", x: 262, y: 230, scale: 0.82 },
    { prop: "shelves", x: 356, y: 230, scale: 0.9 },
  ],
  mid: [
    { prop: "checkoutBelt", x: 82, y: 262, scale: 1 },
    { prop: "candyRack", x: 268, y: 262, scale: 1 },
  ],
  front: [{ prop: "cart", x: 58, y: 304, scale: 1.15 }],
  sign: { x: 330, y: 276 },
};
