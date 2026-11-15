import { TAG_ORDER } from "./tags";
import { normalise, originalQuote } from "./text";
import type { Tag, TagHit } from "./types";

function isSupportivePermission(text: string, quote: string): boolean {
  const value = normalise(text);
  const evidence = normalise(quote);
  const index = value.indexOf(evidence);
  if (index < 0) return false;
  // Check the entire cited sentence, including text beyond a short model quote.
  // A second action in that sentence must not be mistaken for comfort alone.
  const start =
    Math.max(
      ...[".", "!", "?", ";"].map((mark) => value.lastIndexOf(mark, index - 1)),
    ) + 1;
  const tail = value.slice(index + evidence.length);
  const nextBoundary = /^[.!?;]*$/u.test(evidence.slice(-1))
    ? 0
    : tail.search(/[.!?;]/u);
  const end =
    nextBoundary < 0 ? value.length : index + evidence.length + nextBoundary;
  const sentence = value.slice(start, end).trim();
  return (
    /^(?:(?:fine|okay|ok|yes|sure)[, ]+)?you (?:can|may) (?:hold|take) my hands?[.!?;]*$/u.test(
      sentence,
    ) ||
    /^(?:(?:fine|okay|ok|yes|sure)[, ]+)?you (?:can|may) (?:have a hug|be (?:sad|mad|angry|upset)|feel (?:sad|mad|angry|upset))[.!?;]*$/u.test(
      sentence,
    )
  );
}

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
    if (hit.tag === "GIVE_IN" && isSupportivePermission(text, quote)) continue;
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
