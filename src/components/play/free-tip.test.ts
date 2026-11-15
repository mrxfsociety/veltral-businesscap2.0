import { describe, expect, it } from "vitest";
import { freeTipFor, worstUnhelpfulTag } from "./free-tip";

const zoe = {
  childName: "Zoe",
  wants: "to stay at the playground",
  limit: "It's time to leave the playground",
};

describe("worstUnhelpfulTag", () => {
  it("picks the unhelpful move the engine scored as the largest rise", () => {
    expect(
      worstUnhelpfulTag({
        tags: ["NAME_FEELING", "THREAT", "DISMISS"],
        effects: [
          { tag: "NAME_FEELING", value: -5.4 },
          { tag: "THREAT", value: 15.4 },
          { tag: "DISMISS", value: 11 },
        ],
      }),
    ).toBe("THREAT");
  });

  it("puts giving in first and ignores helpful-only turns", () => {
    expect(
      worstUnhelpfulTag({
        tags: ["BRIBE", "GIVE_IN"],
        effects: [{ tag: "GIVE_IN", value: -60 }],
      }),
    ).toBe("GIVE_IN");
    expect(
      worstUnhelpfulTag({
        tags: ["NAME_FEELING"],
        effects: [{ tag: "NAME_FEELING", value: -12 }],
      }),
    ).toBeNull();
  });
});

describe("freeTipFor", () => {
  it("fills the child's name, the want and the limit with no braces left", () => {
    const tip = freeTipFor(
      { tags: ["THREAT"], effects: [{ tag: "THREAT", value: 15.4 }] },
      zoe,
    );
    expect(tip?.tag).toBe("THREAT");
    expect(tip?.tryInstead).toBe(
      "You are upset, Zoe. I am right here. It's time to leave the playground.",
    );
    expect(`${tip?.why} ${tip?.tryInstead}`).not.toMatch(/[{}[\]]/);
  });

  it("returns null when the turn had no unhelpful move", () => {
    expect(freeTipFor({ tags: [], effects: [] }, zoe)).toBeNull();
  });
});
