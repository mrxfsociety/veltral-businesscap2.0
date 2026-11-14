import type { Note, Scene } from "./types";

export const NOTE_TEXT: Record<Note, string> = {
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
  UNSAFE_STOP:
    "This reply described hurting or degrading a child, so the scene stops.",
};

export const NOTE_PRIORITY: readonly Note[] = [
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

export function noteText(note: Note, scene: Scene): string {
  return NOTE_TEXT[note].replaceAll("{childName}", scene.childName);
}
