/*
 * Pixel (lab): the one palette. Sixteen colours, defined once. Everything on
 * the canvas and in the interface is drawn with these. Shading is a darker
 * palette colour plus dithering; there is no opacity and no gradient.
 *
 * Weather does not add colours: it swaps indices (a palette shift), toward
 * cold blue as the storm grows and toward warm gold at calm.
 */
export const PALETTE = [
  "#1E2740", //  0 ink: outlines, night
  "#39435C", //  1 storm
  "#6B7590", //  2 slate
  "#A9B4C2", //  3 mist: rain, cold highlights
  "#F4ECDD", //  4 cream: clouds, light
  "#8FC1CF", //  5 sky
  "#E2A93B", //  6 gold: sun, stars, trim
  "#F0B49C", //  7 peach: low-sun glow, cheeks
  "#C8431F", //  8 tomato: the slide, a shouting mouth
  "#4A2C22", //  9 umber: hair, trunk shadow, skin shadow
  "#8A5A3C", // 10 skin
  "#A87A4E", // 11 kraft: wood, sand shadow
  "#4F6E4F", // 12 leaf dark
  "#7FA06F", // 13 leaf
  "#2B7A72", // 14 teal: Zoe's top, slide posts
  "#5E3B55", // 15 plum: Zoe's trousers, the swing
] as const;

export const C = {
  ink: 0,
  storm: 1,
  slate: 2,
  mist: 3,
  cream: 4,
  sky: 5,
  gold: 6,
  peach: 7,
  tomato: 8,
  umber: 9,
  skin: 10,
  kraft: 11,
  leafDark: 12,
  leaf: 13,
  teal: 14,
  plum: 15,
} as const;

/** Transparent in sprite grids and layer buffers. Never drawn. */
export const CLEAR = 255;

export type Remap = readonly number[];

const identity: number[] = PALETTE.map((_, i) => i);

function remap(changes: Partial<Record<number, number>>): Remap {
  return identity.map((i) => changes[i] ?? i);
}

/**
 * Palette shifts for the set, from warm calm (0) to full storm (4). The sky
 * has its own bands per level; the child is never shifted, so she stays
 * readable whatever the weather does.
 */
export const SHIFTS: readonly Remap[] = [
  // 0 warm calm: cold greys turn to warm wood and glow
  remap({ [C.mist]: C.peach, [C.slate]: C.kraft, [C.cream]: C.cream }),
  // 1 neutral afternoon
  identity,
  // 2 overcast: colours cool one step
  remap({ [C.peach]: C.mist, [C.gold]: C.kraft }),
  // 3 rain: cold blue
  remap({
    [C.sky]: C.slate,
    [C.peach]: C.slate,
    [C.cream]: C.mist,
    [C.gold]: C.slate,
    [C.leaf]: C.leafDark,
    [C.leafDark]: C.storm,
    [C.kraft]: C.slate,
    [C.tomato]: C.plum,
  }),
  // 4 storm: everything drops toward storm blue; outlines stay ink
  remap({
    [C.sky]: C.storm,
    [C.peach]: C.storm,
    [C.mist]: C.slate,
    [C.cream]: C.mist,
    [C.gold]: C.slate,
    [C.leaf]: C.slate,
    [C.leafDark]: C.storm,
    [C.kraft]: C.slate,
    [C.tomato]: C.plum,
    [C.teal]: C.storm,
    [C.umber]: C.storm,
  }),
];

/** The one-frame lightning flash: every colour jumps to its lightest neighbour. */
export const FLASH: Remap = identity.map((i) =>
  [C.ink, C.storm, C.umber, C.plum].includes(i as 0) ? C.slate : C.cream,
);

/** Which shift the set uses for a given cloud weight (0..1) and sun state. */
export function shiftFor(cloudWeight: number, sunUp: boolean): number {
  if (sunUp) return 0;
  if (cloudWeight < 0.2) return 1;
  if (cloudWeight < 0.45) return 2;
  if (cloudWeight < 0.75) return 3;
  return 4;
}
