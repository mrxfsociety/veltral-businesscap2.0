import tipsData from "../../../content/tips.json";
import { TAGS, UNHELPFUL } from "@/engine/tags";
import type { PublicScene, Tag, TurnResult } from "@/engine/types";

export type FreeTip = { tag: Tag; why: string; tryInstead: string };

type TipText = { why: string; tryInstead: string };
const tips: Partial<Record<Tag, TipText>> = tipsData;

/** Fills {childName}, {wants} and {limit} from the scene, as the engine's own tips do. */
export function fillTip(
  text: string,
  scene: Pick<PublicScene, "childName" | "wants" | "limit">,
): string {
  return text.replace(
    /\{(wants|childName|limit)\}/g,
    (_match, key: "wants" | "childName" | "limit") => scene[key],
  );
}

/**
 * The worst unhelpful move of one turn: giving in first (it ended the limit),
 * otherwise the one the engine scored as the largest rise, ties in tag order.
 */
export function worstUnhelpfulTag(
  result: Pick<TurnResult, "tags" | "effects">,
): Tag | null {
  const candidates = result.tags.filter(
    (tag) => UNHELPFUL.includes(tag) && tag !== "UNSAFE" && tips[tag],
  );
  if (candidates.length === 0) return null;
  if (candidates.includes("GIVE_IN")) return "GIVE_IN";
  const effect = (tag: Tag) =>
    result.effects.find((entry) => entry.tag === tag)?.value ?? 0;
  return [...candidates].sort(
    (a, b) => effect(b) - effect(a) || TAGS.indexOf(a) - TAGS.indexOf(b),
  )[0];
}

/** The fixed tip (content/tips.json) for a turn's worst unhelpful move. */
export function freeTipFor(
  result: Pick<TurnResult, "tags" | "effects">,
  scene: Pick<PublicScene, "childName" | "wants" | "limit">,
): FreeTip | null {
  const tag = worstUnhelpfulTag(result);
  const tip = tag ? tips[tag] : undefined;
  if (!tag || !tip) return null;
  return {
    tag,
    why: fillTip(tip.why, scene),
    tryInstead: fillTip(tip.tryInstead, scene),
  };
}
