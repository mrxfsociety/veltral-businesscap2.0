import type { Tag, TagHit } from "@/engine/types";
import { HELPFUL } from "@/engine/tags";

export const HELPFUL_TAGS = HELPFUL;

export function isHelpfulTag(tag: Tag): boolean {
  return HELPFUL_TAGS.includes(tag);
}

export function isPlaybookEligible(
  hits: readonly Pick<TagHit, "tag">[],
  delta: number,
): boolean {
  return (
    hits.length > 0 && delta <= -8 && hits.every(({ tag }) => isHelpfulTag(tag))
  );
}
