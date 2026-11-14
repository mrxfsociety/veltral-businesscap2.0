import type { AgeBand, Outcome } from "@/engine/types";
import type { PaperColor } from "./palette";
import type { PropId } from "./props";

export type TimeOfDay = "day" | "golden" | "evening" | "night";

/** One prop on one plane. x, y = where the prop's bottom centre stands (viewBox 0 0 400 300). */
export type Placement = {
  prop: PropId;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  tint?: PaperColor;
};

export type SceneSet = {
  timeOfDay: TimeOfDay;
  /** The back wall or the sky. Defaults to the sky paper for the time of day. */
  wall?: PaperColor;
  floor: PaperColor;
  /** Where the floor meets the wall, in viewBox units (default 232). */
  horizon?: number;
  /** Optional floor pattern drawn on the sky plane. */
  floorPattern?: "boards" | "tiles" | "grass" | "rug" | "none";
  far: Placement[];
  mid: Placement[];
  front: Placement[];
  /** The limit sign: bottom of its stick. Keep it at stage right. */
  sign: { x: number; y: number };
};

/** Engine state the stage needs. Everything visual is a function of this. */
export type StageState = {
  arousal: number;
  connection: number;
  lastDelta: number;
  turn: number;
};

export type StageOutcome = Outcome | "intro";

export type StageScene = {
  id: string;
  place: string;
  ageBand: AgeBand;
  limit: string;
  childName: string;
  wants?: string;
};
