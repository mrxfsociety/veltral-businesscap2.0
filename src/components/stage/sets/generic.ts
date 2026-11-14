import type { SceneSet } from "../types";

/*
 * Custom scenes (and any library scene without its own set yet) use one of six
 * rooms, picked from keywords in the scene's `place`.
 */
export type RoomId =
  "home" | "kitchen" | "bedroom" | "outdoors" | "shop" | "car";

export const ROOMS: Record<RoomId, SceneSet> = {
  home: {
    timeOfDay: "evening",
    wall: "creamDark",
    floor: "kraft",
    floorPattern: "boards",
    far: [
      { prop: "window", x: 70, y: 170, scale: 0.9 },
      { prop: "pictureFrame", x: 160, y: 150, scale: 1 },
      { prop: "lamp", x: 330, y: 232, scale: 0.95 },
    ],
    mid: [{ prop: "sofa", x: 92, y: 258, scale: 0.95 }],
    front: [
      { prop: "rug", x: 200, y: 300, scale: 1.2 },
      { prop: "plant", x: 30, y: 304, scale: 1.1 },
    ],
    sign: { x: 330, y: 278 },
  },
  kitchen: {
    timeOfDay: "day",
    wall: "cream",
    floor: "rule",
    floorPattern: "tiles",
    far: [
      { prop: "window", x: 160, y: 168, scale: 0.85 },
      { prop: "fridge", x: 52, y: 232, scale: 0.95 },
      { prop: "pictureFrame", x: 290, y: 150, scale: 0.9 },
    ],
    mid: [{ prop: "table", x: 286, y: 262, scale: 1 }],
    front: [{ prop: "chair", x: 46, y: 304, scale: 1.1 }],
    sign: { x: 332, y: 280 },
  },
  bedroom: {
    timeOfDay: "night",
    wall: "stormLight",
    floor: "kraft",
    floorPattern: "boards",
    far: [
      { prop: "window", x: 240, y: 166, scale: 0.85, tint: "storm" },
      { prop: "pictureFrame", x: 110, y: 148, scale: 0.9 },
    ],
    mid: [
      { prop: "bed", x: 78, y: 262, scale: 1 },
      { prop: "lamp", x: 300, y: 262, scale: 0.7 },
    ],
    front: [{ prop: "rug", x: 214, y: 300, scale: 1.1, tint: "teal" }],
    sign: { x: 330, y: 278 },
  },
  outdoors: {
    timeOfDay: "day",
    floor: "sage",
    floorPattern: "grass",
    far: [
      { prop: "tree", x: 40, y: 232, scale: 0.9 },
      { prop: "house", x: 150, y: 232, scale: 0.7 },
      { prop: "tree", x: 330, y: 232, scale: 0.8, flip: true },
    ],
    mid: [{ prop: "fence", x: 270, y: 256, scale: 0.9 }],
    front: [{ prop: "hedge", x: 40, y: 304, scale: 0.9 }],
    sign: { x: 330, y: 278 },
  },
  shop: {
    timeOfDay: "day",
    wall: "cream",
    floor: "rule",
    floorPattern: "tiles",
    far: [
      { prop: "shelves", x: 50, y: 230, scale: 0.85 },
      { prop: "shelves", x: 300, y: 230, scale: 0.85 },
    ],
    mid: [{ prop: "checkoutBelt", x: 90, y: 262, scale: 0.95 }],
    front: [{ prop: "cart", x: 54, y: 304, scale: 1.1 }],
    sign: { x: 330, y: 278 },
  },
  car: {
    timeOfDay: "day",
    floor: "ruleDark",
    floorPattern: "none",
    far: [
      { prop: "house", x: 300, y: 232, scale: 0.9 },
      { prop: "tree", x: 40, y: 232, scale: 0.85 },
    ],
    mid: [{ prop: "car", x: 92, y: 262, scale: 0.95 }],
    front: [{ prop: "hedge", x: 330, y: 306, scale: 1 }],
    sign: { x: 332, y: 280 },
  },
};

const KEYWORDS: [RoomId, RegExp][] = [
  ["car", /\b(car|drive|driveway|parking|seat|garage)\b/i],
  ["shop", /\b(store|shop|market|mall|checkout|supermarket|grocery|aisle)\b/i],
  ["kitchen", /\b(kitchen|breakfast|lunch|dinner|meal|table|snack)\b/i],
  [
    "bedroom",
    /\b(bed|bedroom|bedtime|night|nap|sleep|pajamas?|dress(ing)?)\b/i,
  ],
  [
    "outdoors",
    /\b(park|playground|garden|yard|outside|street|beach|pool|school gate|sidewalk)\b/i,
  ],
];

export function roomFor(place: string): RoomId {
  return KEYWORDS.find(([, pattern]) => pattern.test(place))?.[0] ?? "home";
}

export function genericSet(place: string): SceneSet {
  return ROOMS[roomFor(place)];
}
