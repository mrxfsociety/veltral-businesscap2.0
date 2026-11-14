import type { AgeBand } from "@/engine/types";
import { pick } from "./mood";
import type { PaperColor } from "./palette";

export type HairStyle = "bob" | "short" | "curly" | "pony" | "buns" | "spiky";

export type KidLook = {
  skin: PaperColor;
  hair: PaperColor;
  hairStyle: HairStyle;
  top: PaperColor;
  bottom: PaperColor;
  /** A stripe or collar on the top, in a second paper. */
  trim: PaperColor;
};

/** One rig, twelve looks: a varied cast, one per library scene. */
export const LOOKS: Record<string, KidLook> = {
  "store-candy": {
    skin: "skin3",
    hair: "hair1",
    hairStyle: "pony",
    top: "tomato",
    bottom: "tealDark",
    trim: "mustard",
  },
  "wrong-cup": {
    skin: "skin1",
    hair: "hair3",
    hairStyle: "curly",
    top: "sky",
    bottom: "storm",
    trim: "sheet",
  },
  "car-seat": {
    skin: "skin4",
    hair: "hair1",
    hairStyle: "short",
    top: "mustard",
    bottom: "storm",
    trim: "tomato",
  },
  "bath-time": {
    skin: "skin2",
    hair: "hair2",
    hairStyle: "bob",
    top: "blush",
    bottom: "plum",
    trim: "sheet",
  },
  "playground-leave": {
    skin: "skin5",
    hair: "hair1",
    hairStyle: "buns",
    top: "teal",
    bottom: "plum",
    trim: "mustard",
  },
  "tablet-off": {
    skin: "skin2",
    hair: "hair2",
    hairStyle: "spiky",
    top: "tomato",
    bottom: "storm",
    trim: "sheet",
  },
  "getting-dressed": {
    skin: "skin3",
    hair: "hair5",
    hairStyle: "bob",
    top: "blush",
    bottom: "blushDark",
    trim: "sheet",
  },
  "sharing-toy": {
    skin: "skin1",
    hair: "hair4",
    hairStyle: "short",
    top: "teal",
    bottom: "kraftDark",
    trim: "mustard",
  },
  bedtime: {
    skin: "skin4",
    hair: "hair2",
    hairStyle: "short",
    top: "skyLight",
    bottom: "sky",
    trim: "mustard",
  },
  "hit-brother": {
    skin: "skin2",
    hair: "hair3",
    hairStyle: "spiky",
    top: "plum",
    bottom: "ink",
    trim: "mustard",
  },
  "dinner-refusal": {
    skin: "skin5",
    hair: "hair1",
    hairStyle: "pony",
    top: "mustard",
    bottom: "plum",
    trim: "sheet",
  },
  "leaving-party": {
    skin: "skin1",
    hair: "hair4",
    hairStyle: "bob",
    top: "tomatoLight",
    bottom: "tomato",
    trim: "sheet",
  },
};

const CAST = Object.values(LOOKS);

/** Library scenes use their own look; custom scenes pick one by a stable hash of the id. */
export function lookFor(sceneId: string): KidLook {
  return LOOKS[sceneId] ?? CAST[pick(sceneId, CAST.length)];
}

export type KidBody = {
  headR: number;
  torsoH: number;
  torsoTop: number;
  torsoBottom: number;
  legL: number;
  legW: number;
  armL: number;
  armW: number;
};

/** Age band changes proportions: toddlers have larger heads and shorter legs. */
export function bodyFor(ageBand: AgeBand): KidBody {
  if (ageBand === "2-3")
    return {
      headR: 19,
      torsoH: 28,
      torsoTop: 25,
      torsoBottom: 30,
      legL: 27,
      legW: 9.5,
      armL: 26,
      armW: 8,
    };
  if (ageBand === "6-7")
    return {
      headR: 16.5,
      torsoH: 38,
      torsoTop: 28,
      torsoBottom: 31,
      legL: 47,
      legW: 10,
      armL: 37,
      armW: 8.5,
    };
  return {
    headR: 17.5,
    torsoH: 33,
    torsoTop: 26,
    torsoBottom: 30,
    legL: 37,
    legW: 9.5,
    armL: 31,
    armW: 8,
  };
}
