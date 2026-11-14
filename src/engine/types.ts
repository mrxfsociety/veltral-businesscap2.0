export type Tag =
  | "NAME_FEELING" | "HOLD_LIMIT" | "OFFER_CHOICE" | "CLEAR_COMMAND" | "CONNECT" | "LABELED_PRAISE" | "WHEN_THEN"
  | "THREAT" | "BRIBE" | "YELL" | "SHAME" | "DISMISS" | "QUESTION_COMMAND" | "LECTURE"
  | "NEGATIVE_COMMAND" | "VAGUE_COMMAND" | "GIVE_IN" | "NO_RESPONSE" | "UNSAFE";
// HELPFUL = the first seven. HARSH = THREAT, YELL, SHAME. Canonical order = the order above.

export type AgeBand = "2-3" | "4-5" | "6-7";
export type Temperament = "easygoing" | "sensitive" | "spirited";

export interface Scene {
  id: string; title: string; place: string; ageBand: AgeBand; childName: string;
  setup: string; openingLine: string; openingAction: string;
  limit: string;          // the limit the parent is holding, as a short sentence
  wants: string;          // what the child wants, used in template lines
  startArousal: number;   // 60..90
  temperament: Temperament;
  limitHints: string[];   // lowercase phrases that restate the limit (rule tagger)
  giveInHints: string[];  // lowercase phrases that abandon the limit (rule tagger)
}
export type PublicScene = Omit<Scene, "limitHints" | "giveInHints">;

export interface ChildState {
  arousal: number;        // 0..100
  connection: number;     // 0..100, starts at 50
  limitIntact: boolean;
  turn: number;           // turns played so far
  bribed: boolean;
  lastHelpfulTags: Tag[]; // helpful tags of the previous turn
  lastDelta: number;      // arousal change of the previous turn
}

export type Outcome = "ongoing" | "calm_limit_held" | "calm_gave_in" | "out_of_turns" | "stopped_unsafe";
export type Note = "REPEAT" | "HIGH_CONNECTION" | "LOW_CONNECTION" | "MIXED_MESSAGE" | "COMMAND_TOO_SOON" | "CAPPED"
  | "VALIDATED_LIMIT" | "BARE_LIMIT" | "NO_HELPFUL_MOVE" | "BRIBE_TAX" | "GAVE_IN" | "UNSAFE_STOP";

export interface TagHit { tag: Tag; source: "rule" | "model" | "both"; quote: string } // quote = exact substring of the reply, "" for NO_RESPONSE and for YELL from loudness
export interface TurnResult {
  tags: Tag[]; before: ChildState; after: ChildState; delta: number; outcome: Outcome;
  effects: { tag: Tag; value: number }[]; // arousal contribution per tag after modifiers, one decimal
  notes: Note[];
}
export interface Score {
  outcome: Outcome; stars: 1 | 2 | 3; points: number; turnsToCalm: number | null; par: number;
  clean: boolean; statedLimit: boolean; bribed: boolean; unhelpfulCount: number; finalArousal: number;
  grid: ("good" | "mixed" | "bad")[]; turningPoint: number;
}
