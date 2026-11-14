import { describe, expect, it } from "vitest";
import { quoteSegments } from "./quotes";
import type { TagHit } from "@/engine/types";

const hit = (quote: string): TagHit => ({
  tag: "NAME_FEELING",
  source: "rule",
  quote,
});

describe("exact quote highlighting", () => {
  it("merges overlapping quotes without repeating characters", () => {
    const parts = quoteSegments("You are sad, and I am here.", [
      hit("You are sad"),
      hit("sad, and I"),
    ]);
    expect(parts).toEqual([
      { text: "You are sad, and I", marked: true },
      { text: " am here.", marked: false },
    ]);
    expect(parts.map((part) => part.text).join("")).toBe(
      "You are sad, and I am here.",
    );
  });
  it("does not underline absent or empty evidence", () => {
    expect(
      quoteSegments("Hello <script>", [hit(""), hit("not present")]),
    ).toEqual([{ text: "Hello <script>", marked: false }]);
  });
  it("highlights repeated literal matches and preserves Unicode", () => {
    expect(
      quoteSegments("I'm here. I'm here. 💚", [hit("I'm here")])
        .map((part) => part.text)
        .join(""),
    ).toBe("I'm here. I'm here. 💚");
    expect(
      quoteSegments("a+a", [hit("a")]).filter((part) => part.marked),
    ).toHaveLength(2);
  });
});
