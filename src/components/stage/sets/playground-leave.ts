import type { SceneSet } from "../types";

/*
 * The reference set. Late afternoon on a playground.
 *
 *  far   (depth 0.25) trees and a hedge on the horizon line (y ≈ 232). Small
 *        scale so they read as distance. The sky is the golden wall paper.
 *  mid   (depth 0.50) the slide at stage left and the swing at stage right:
 *        the two things Zoe does not want to leave. They frame the centre.
 *  kid   (depth 0.70) Zoe stands in the clear centre band, x 150–250.
 *  front (depth 1.00) the bench and her backpack cross the bottom edge, so the
 *        stage has a near layer that moves most under parallax.
 *  sign  stage right, in front of the swing's right post.
 */
export const playgroundLeave: SceneSet = {
  timeOfDay: "golden",
  floor: "sage",
  floorPattern: "grass",
  horizon: 232,
  far: [
    { prop: "tree", x: 34, y: 234, scale: 0.95 },
    { prop: "tree", x: 102, y: 230, scale: 0.68, flip: true },
    { prop: "hedge", x: 236, y: 234, scale: 0.75 },
    { prop: "tree", x: 300, y: 232, scale: 0.78 },
    { prop: "tree", x: 378, y: 236, scale: 1.05, flip: true },
  ],
  mid: [
    { prop: "slide", x: 78, y: 264, scale: 1.02 },
    { prop: "swing", x: 282, y: 258, scale: 0.86 },
  ],
  front: [
    { prop: "bench", x: 44, y: 304, scale: 1.12 },
    { prop: "backpack", x: 104, y: 300, scale: 1.05 },
  ],
  sign: { x: 330, y: 278 },
};
