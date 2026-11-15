import { describe, expect, it } from "vitest";
import { holdForSilence, isFrozen } from "./clock";

const froze = {
  text: "",
  hits: [{ tag: "NO_RESPONSE" as const, source: "rule" as const, quote: "" }],
};
const spoke = {
  text: "You're sad.",
  hits: [
    {
      tag: "NAME_FEELING" as const,
      source: "rule" as const,
      quote: "You're sad",
    },
  ],
};

describe("two silences in a row", () => {
  it("sends the first silence as froze", () => {
    expect(holdForSilence("", undefined)).toBe(false);
    expect(holdForSilence("", spoke)).toBe(false);
  });

  it("holds the clock on a second silence with nothing typed", () => {
    expect(isFrozen(froze)).toBe(true);
    expect(holdForSilence("", froze)).toBe(true);
    expect(holdForSilence("   ", froze)).toBe(true);
  });

  it("sends whatever was typed, even after a silence", () => {
    expect(holdForSilence("No candy today.", froze)).toBe(false);
  });
});
