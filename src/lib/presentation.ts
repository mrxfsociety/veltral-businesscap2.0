// STUB(T0): replaced by imports from track A's tags and noteText exports in J1.
import type { Note, PublicScene, Tag } from "@/engine/types";
export { isHelpfulTag } from "./playbook";
export const TAG_LABELS: Record<Tag, string> = {
  NAME_FEELING: "Named the feeling",
  HOLD_LIMIT: "Held the limit",
  OFFER_CHOICE: "Offered a choice",
  CLEAR_COMMAND: "Clear instruction",
  CONNECT: "Connected",
  LABELED_PRAISE: "Specific praise",
  WHEN_THEN: "When–then",
  THREAT: "Threat",
  BRIBE: "Bribe",
  YELL: "Raised voice",
  SHAME: "Shaming",
  DISMISS: "Dismissed the feeling",
  QUESTION_COMMAND: "Question instead of instruction",
  LECTURE: "Too many words",
  NEGATIVE_COMMAND: "“Stop / don’t”",
  VAGUE_COMMAND: "Vague instruction",
  GIVE_IN: "Gave in",
  NO_RESPONSE: "Froze",
  UNSAFE: "Scene paused",
};
export function tagLabel(tag: Tag): string {
  return TAG_LABELS[tag];
}
const notes: Record<Note, string> = {
  REPEAT: "The same move twice in a row works half as well.",
  HIGH_CONNECTION:
    "{childName} feels close to you right now, so calming words land harder.",
  LOW_CONNECTION:
    "Connection is low, so calming words land softer. Reconnect first.",
  MIXED_MESSAGE:
    "Kind words don't land when they come with a threat, a raised voice or shaming.",
  COMMAND_TOO_SOON:
    "Too upset to follow instructions yet. Connect first, direct later.",
  CAPPED: "A flooded child takes in about three things. The rest was noise.",
  VALIDATED_LIMIT: "Empathy and the limit in one breath.",
  BARE_LIMIT: "The limit alone sounds like another no.",
  NO_HELPFUL_MOVE: "Nothing in that reply helped {childName} calm down.",
  BRIBE_TAX: "The earlier bribe raised the price of every no.",
  GAVE_IN: "The crying stopped because the limit did.",
  UNSAFE_STOP: "This reply paused the scene.",
};
export function noteText(
  note: Note,
  scene: Pick<PublicScene, "childName">,
): string {
  return notes[note].replaceAll("{childName}", scene.childName);
}
const priority: Note[] = [
  "UNSAFE_STOP",
  "GAVE_IN",
  "MIXED_MESSAGE",
  "BRIBE_TAX",
  "COMMAND_TOO_SOON",
  "BARE_LIMIT",
  "NO_HELPFUL_MOVE",
  "VALIDATED_LIMIT",
  "REPEAT",
  "CAPPED",
  "LOW_CONNECTION",
  "HIGH_CONNECTION",
];
export function prioritizeNotes(values: readonly Note[]): Note[] {
  return [...new Set(values)].sort(
    (a, b) => priority.indexOf(a) - priority.indexOf(b),
  );
}
