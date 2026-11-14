/** Matching text plus offsets back into the untouched reply. */
export function normaliseWithOffsets(text: string): {
  value: string;
  starts: number[];
  ends: number[];
} {
  let value = "";
  const starts: number[] = [];
  const ends: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (/\s/u.test(character)) {
      if (value.endsWith(" ")) {
        ends[ends.length - 1] = index + 1;
        continue;
      }
      value += " ";
      starts.push(index);
      ends.push(index + 1);
    } else {
      const normalised = character
        .replace(/[‘’]/gu, "'")
        .replace(/[“”]/gu, '"')
        .toLowerCase();
      value += normalised;
      for (let unit = 0; unit < normalised.length; unit += 1) {
        starts.push(index);
        ends.push(index + 1);
      }
    }
  }
  return { value, starts, ends };
}

export function normalise(text: string): string {
  return normaliseWithOffsets(text).value.trim();
}

/** Also accepts harmless case, quote and whitespace variation in model quotes. */
export function originalQuote(text: string, quote: string): string | null {
  const needle = normalise(quote);
  if (!needle) return null;
  const normalised = normaliseWithOffsets(text);
  const index = normalised.value.indexOf(needle);
  if (index < 0) return null;
  return text.slice(
    normalised.starts[index],
    normalised.ends[index + needle.length - 1],
  );
}
