import type { AgeBand } from "@/engine/types";

const WORDS: Record<string, number> = {
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
};
const NUMBER = "(\\d{1,2}|two|three|four|five|six|seven)";
const PATTERNS = [
  // "4 year old", "4-year-old", "four year old", "4 years old", "4 yr old"
  new RegExp(`\\b${NUMBER}[\\s-]*(?:years?|yrs?)[\\s-]*old\\b`, "i"),
  // "4yo", "4 yo", "4 y/o", "4y.o."
  new RegExp(`\\b${NUMBER}\\s*(?:yo|y/o|y\\.o\\.?)(?![a-z])`, "i"),
  // "age 4", "aged four"
  new RegExp(`\\bage[d]?\\s+${NUMBER}\\b`, "i"),
];

/** The age band a description names ("my 4 year old", "4yo", "four-year-old"), or null. */
export function ageBandFromText(text: string): AgeBand | null {
  for (const pattern of PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const raw = match[1].toLowerCase();
    const age = WORDS[raw] ?? Number(raw);
    if (age === 2 || age === 3) return "2-3";
    if (age === 4 || age === 5) return "4-5";
    if (age === 6 || age === 7) return "6-7";
    return null;
  }
  return null;
}
