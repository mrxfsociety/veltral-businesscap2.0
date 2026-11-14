import { describe, expect, it } from "vitest";
import { isPlaybookEligible } from "./playbook";

describe("playbook eligibility", () => {
  it("needs at least one helpful hit and an eight-point improvement", () => {
    expect(isPlaybookEligible([], -18)).toBe(false);
    expect(isPlaybookEligible([{ tag: "CONNECT" }], -7)).toBe(false);
    expect(
      isPlaybookEligible([{ tag: "CONNECT" }, { tag: "HOLD_LIMIT" }], -8),
    ).toBe(true);
  });

  it("does not save a mixed, bribing, or unsafe reply even if its arousal delta is negative", () => {
    expect(
      isPlaybookEligible([{ tag: "CONNECT" }, { tag: "THREAT" }], -10),
    ).toBe(false);
    expect(isPlaybookEligible([{ tag: "BRIBE" }], -8)).toBe(false);
    expect(isPlaybookEligible([{ tag: "UNSAFE" }], -18)).toBe(false);
  });
});
