import { TAG_INFO, TAGS } from "@/engine/tags";
import { NOTE_PRIORITY, NOTE_TEXT } from "@/engine/notes";
import type { Note, PublicScene, Tag } from "@/engine/types";
export { isHelpfulTag } from "./playbook";
export const TAG_LABELS = Object.fromEntries(
  TAGS.map((tag) => [tag, TAG_INFO[tag].label]),
) as Record<Tag, string>;
export function tagLabel(tag: Tag): string {
  return TAG_INFO[tag].label;
}
// Public scenes omit the engine's private matching hints. The authoritative
// note templates need only the child's name.
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
