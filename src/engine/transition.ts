import type {
  ChildState,
  Note,
  Outcome,
  Scene,
  Tag,
  TurnResult,
} from "./types";
import { HELPFUL, HARSH, TAGS, canonicalTags } from "./tags";

export const MAX_TURNS = 8;
export const CALM_AT = 25; // arousal at or below this ends the scene as calm
export const GIVE_IN_AROUSAL = 15; // the child got what they wanted
export const DELTA_MIN = -18; // a child can only come down so fast in one turn
export const DELTA_MAX = 25;
export const MAX_CALMING_TAGS = 3; // only the three strongest calming moves count
export const START_CONNECTION = 50;
export const REPEAT_FACTOR = 0.5; // the same helpful move two turns in a row works half as well

// Arousal change per tag before modifiers. Negative = calmer.
export const BASE_AROUSAL: Partial<Record<Tag, number>> = {
  NAME_FEELING: -12,
  CONNECT: -8,
  OFFER_CHOICE: -10,
  HOLD_LIMIT: 0,
  THREAT: 14,
  YELL: 18,
  SHAME: 16,
  DISMISS: 10,
  BRIBE: -8,
  QUESTION_COMMAND: 5,
  LECTURE: 8,
  NEGATIVE_COMMAND: 7,
  VAGUE_COMMAND: 5,
  NO_RESPONSE: 6,
};

// Connection change per tag. No modifiers apply to connection.
export const BASE_CONNECTION: Partial<Record<Tag, number>> = {
  NAME_FEELING: 12,
  CONNECT: 15,
  OFFER_CHOICE: 5,
  LABELED_PRAISE: 8,
  THREAT: -10,
  YELL: -15,
  SHAME: -20,
  DISMISS: -10,
  LECTURE: -4,
  NEGATIVE_COMMAND: -3,
  NO_RESPONSE: -5,
};

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

function baseArousal(tag: Tag, state: ChildState): number {
  if (tag === "CLEAR_COMMAND") return state.arousal < 60 ? -4 : 4; // a flooded child cannot follow instructions
  if (tag === "WHEN_THEN") return state.arousal < 70 ? -8 : -2;
  if (tag === "LABELED_PRAISE") return state.lastDelta < 0 ? -8 : -2; // praise lands only after the child started calming
  return BASE_AROUSAL[tag] ?? 0;
}

function temperamentFactor(
  temperament: Scene["temperament"],
  tag: Tag,
  value: number,
): number {
  const helpfulCalming = HELPFUL.includes(tag) && value < 0;
  const escalating = value > 0;
  if (temperament === "easygoing") {
    if (helpfulCalming) return 1.15;
    if (escalating) return 0.85;
  }
  if (temperament === "sensitive") {
    if (HARSH.includes(tag)) return 1.3;
    if ((tag === "NAME_FEELING" || tag === "CONNECT") && value < 0) return 1.2;
  }
  if (temperament === "spirited") {
    if (tag === "OFFER_CHOICE") return 1.3;
    if (helpfulCalming) return 0.9;
    if (escalating) return 1.1;
  }
  return 1;
}

function ageFactor(ageBand: Scene["ageBand"], tag: Tag): number {
  if (ageBand === "2-3") {
    if (tag === "WHEN_THEN") return 0.5;
    if (tag === "LECTURE") return 1.25;
  }
  if (ageBand === "6-7") {
    if (tag === "WHEN_THEN") return 1.25;
    if (tag === "SHAME") return 1.2;
  }
  return 1;
}

export function initialState(scene: Scene): ChildState {
  return {
    arousal: scene.startArousal,
    connection: START_CONNECTION,
    limitIntact: true,
    turn: 0,
    bribed: false,
    lastHelpfulTags: [],
    lastDelta: 0,
  };
}

// Returns { tags, before, after, delta, outcome, effects, notes }.
// effects: per-tag arousal contribution after modifiers (one decimal).
// notes: codes of the rules that fired, for the debrief.
export function applyTurn(
  scene: Scene,
  state: ChildState,
  tagsIn: Tag[],
): TurnResult {
  const tags = canonicalTags(tagsIn);
  const before = state;
  const has = (t: Tag) => tags.includes(t);
  const notes: Note[] = [];

  if (has("UNSAFE")) {
    const after = {
      ...before,
      turn: before.turn + 1,
      lastHelpfulTags: [],
      lastDelta: 0,
    };
    return {
      tags,
      before,
      after,
      delta: 0,
      outcome: "stopped_unsafe",
      effects: [],
      notes: ["UNSAFE_STOP"],
    };
  }

  if (has("GIVE_IN")) {
    const arousal = Math.min(before.arousal, GIVE_IN_AROUSAL);
    const after = {
      arousal,
      connection: before.connection,
      limitIntact: false,
      turn: before.turn + 1,
      bribed: before.bribed || has("BRIBE"),
      lastHelpfulTags: [],
      lastDelta: arousal - before.arousal,
    };
    return {
      tags,
      before,
      after,
      delta: arousal - before.arousal,
      outcome: "calm_gave_in",
      effects: [{ tag: "GIVE_IN", value: arousal - before.arousal }],
      notes: ["GAVE_IN"],
    };
  }

  const harsh = tags.some((t) => HARSH.includes(t));
  const helpfulPresent = tags.filter((t) => HELPFUL.includes(t));

  let effects: TurnResult["effects"] = [];
  for (const tag of tags) {
    const base = baseArousal(tag, before);
    if (base === 0) continue;
    let m = 1;
    if (HELPFUL.includes(tag) && base < 0) {
      if (before.lastHelpfulTags.includes(tag)) {
        m *= REPEAT_FACTOR;
        if (!notes.includes("REPEAT")) notes.push("REPEAT");
      }
      if (before.connection >= 70) m *= 1.25;
      else if (before.connection <= 30) m *= 0.6;
      if (harsh) m *= 0.5;
    }
    m *= temperamentFactor(scene.temperament, tag, base);
    m *= ageFactor(scene.ageBand, tag);
    effects.push({ tag, value: base * m });
  }
  if (harsh && helpfulPresent.length > 0) notes.push("MIXED_MESSAGE");
  if (
    before.connection >= 70 &&
    effects.some((e) => HELPFUL.includes(e.tag) && e.value < 0)
  )
    notes.push("HIGH_CONNECTION");
  if (
    before.connection <= 30 &&
    effects.some((e) => HELPFUL.includes(e.tag) && e.value < 0)
  )
    notes.push("LOW_CONNECTION");
  if (has("CLEAR_COMMAND") && before.arousal >= 60)
    notes.push("COMMAND_TOO_SOON");

  // Only the strongest MAX_CALMING_TAGS helpful calming effects count.
  const calming = effects
    .filter((e) => HELPFUL.includes(e.tag) && e.value < 0)
    .sort(
      (a, b) => a.value - b.value || TAGS.indexOf(a.tag) - TAGS.indexOf(b.tag),
    );
  if (calming.length > MAX_CALMING_TAGS) {
    const dropped = new Set(calming.slice(MAX_CALMING_TAGS).map((e) => e.tag));
    effects = effects.map((e) => (dropped.has(e.tag) ? { ...e, value: 0 } : e));
    notes.push("CAPPED");
  }

  let sum = effects.reduce((acc, e) => acc + e.value, 0);

  if (has("HOLD_LIMIT") && (has("NAME_FEELING") || has("CONNECT"))) {
    // Empathy plus the limit in one reply. The bonus is not repeated on back-to-back turns.
    if (!before.lastHelpfulTags.includes("HOLD_LIMIT")) {
      sum += harsh ? -3 : -6;
      notes.push("VALIDATED_LIMIT");
    }
  } else if (has("HOLD_LIMIT") && !has("OFFER_CHOICE")) {
    sum += 3;
    notes.push("BARE_LIMIT");
  }
  if (helpfulPresent.length === 0) {
    sum += 3;
    notes.push("NO_HELPFUL_MOVE");
  }
  if (before.bribed) {
    sum += 5;
    notes.push("BRIBE_TAX");
  }

  const delta = clamp(Math.round(sum), DELTA_MIN, DELTA_MAX);
  const arousal = clamp(before.arousal + delta, 0, 100);
  const connectionDelta = tags.reduce(
    (acc, t) => acc + (BASE_CONNECTION[t] ?? 0),
    0,
  );

  const after = {
    arousal,
    connection: clamp(before.connection + connectionDelta, 0, 100),
    limitIntact: before.limitIntact,
    turn: before.turn + 1,
    bribed: before.bribed || has("BRIBE"),
    lastHelpfulTags: helpfulPresent,
    lastDelta: arousal - before.arousal,
  };

  let outcome: Outcome = "ongoing";
  if (after.arousal <= CALM_AT) outcome = "calm_limit_held";
  else if (after.turn >= MAX_TURNS) outcome = "out_of_turns";

  return {
    tags,
    before,
    after,
    delta: arousal - before.arousal,
    outcome,
    effects: effects.map((e) => ({
      tag: e.tag,
      value: Math.round(e.value * 10) / 10,
    })),
    notes,
  };
}
