import type { TagHit } from "@/engine/types";

/** Merge overlapping exact quotes without injecting HTML or hiding untagged text. */
export function quoteSegments(text: string, hits: readonly TagHit[]) {
  const intervals: { start: number; end: number }[] = [];
  for (const { quote } of hits) {
    if (!quote) continue;
    let start = text.indexOf(quote);
    while (start !== -1) {
      intervals.push({ start, end: start + quote.length });
      start = text.indexOf(quote, start + Math.max(quote.length, 1));
    }
  }
  intervals.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: typeof intervals = [];
  for (const range of intervals) {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end)
      previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
  }
  const segments: { text: string; marked: boolean }[] = [];
  let cursor = 0;
  for (const range of merged) {
    if (range.start > cursor)
      segments.push({ text: text.slice(cursor, range.start), marked: false });
    segments.push({ text: text.slice(range.start, range.end), marked: true });
    cursor = range.end;
  }
  if (cursor < text.length)
    segments.push({ text: text.slice(cursor), marked: false });
  return segments;
}
