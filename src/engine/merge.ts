import { TAG_ORDER } from "./tags";
import { originalQuote } from "./text";
import type { Tag, TagHit } from "./types";

export function mergeTags(
  ruleHits: TagHit[],
  modelHits: TagHit[],
  text: string,
): TagHit[] {
  const hits = new Map<Tag, TagHit>();
  for (const hit of ruleHits) {
    if (TAG_ORDER.includes(hit.tag) && !hits.has(hit.tag))
      hits.set(hit.tag, { ...hit, source: "rule" });
  }
  for (const hit of modelHits) {
    if (
      !TAG_ORDER.includes(hit.tag) ||
      hit.tag === "YELL" ||
      hit.tag === "NO_RESPONSE"
    )
      continue;
    const quote = originalQuote(text, hit.quote);
    if (quote === null) continue;
    const existing = hits.get(hit.tag);
    hits.set(
      hit.tag,
      existing
        ? { ...existing, source: "both" }
        : { tag: hit.tag, quote, source: "model" },
    );
  }
  const noResponse = hits.get("NO_RESPONSE");
  if (noResponse) return [noResponse];
  const unsafe = hits.get("UNSAFE");
  if (unsafe) return [unsafe];
  if (hits.has("GIVE_IN")) {
    hits.delete("HOLD_LIMIT");
    hits.delete("WHEN_THEN");
  }
  if (hits.has("OFFER_CHOICE")) hits.delete("QUESTION_COMMAND");
  if (hits.has("BRIBE") || hits.has("THREAT")) hits.delete("WHEN_THEN");
  return TAG_ORDER.flatMap((tag) => {
    const hit = hits.get(tag);
    return hit ? [hit] : [];
  });
}
