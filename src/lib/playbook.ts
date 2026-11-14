import type { Tag, TagHit } from "@/engine/types";

export const HELPFUL_TAGS: readonly Tag[] = [
  "NAME_FEELING",
  "HOLD_LIMIT",
  "OFFER_CHOICE",
  "CLEAR_COMMAND",
  "CONNECT",
  "LABELED_PRAISE",
  "WHEN_THEN",
];

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
