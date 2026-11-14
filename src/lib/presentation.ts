import { NOTE_PRIORITY, NOTE_TEXT } from "@/engine/notes";
import { HELPFUL, TAG_INFO } from "@/engine/tags";
import type { Note, PublicScene, Tag } from "@/engine/types";
export function isHelpfulTag(tag: Tag): boolean {
  return HELPFUL.includes(tag);
}
export function tagLabel(tag: Tag): string {
  return TAG_INFO[tag].label;
}
export function noteText(
  note: Note,
  scene: Pick<PublicScene, "childName">,
): string {
  return NOTE_TEXT[note].replaceAll("{childName}", scene.childName);
}
const priority: readonly Note[] = ["UNSAFE_STOP", "GAVE_IN", ...NOTE_PRIORITY];
export function prioritizeNotes(values: readonly Note[]): Note[] {
  return [...new Set(values)].sort(
    (a, b) => priority.indexOf(a) - priority.indexOf(b),
  );
}
