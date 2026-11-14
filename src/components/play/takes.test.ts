import { describe, expect, it } from "vitest";
import {
  formatDelta,
  ledgerFor,
  shiftSentence,
  takeShift,
  tomorrowFrom,
} from "./takes";

describe("ledgerFor", () => {
  it("lists engine effects and marks a total that the rows do not add up to", () => {
    const ledger = ledgerFor({
      effects: [
        { tag: "NAME_FEELING", value: -10.8 },
        { tag: "HOLD_LIMIT", value: 0 },
      ],
      notes: ["VALIDATED_LIMIT", "HIGH_CONNECTION"],
      delta: -17,
    });
    expect(ledger.rows).toHaveLength(2);
    expect(ledger.sumNotes).toEqual(["VALIDATED_LIMIT"]);
    expect(ledger.total).toBe(-17);
    expect(ledger.adjusted).toBe(true);
  });

  it("does not mark a total that the rows add up to", () => {
    const ledger = ledgerFor({
      effects: [
        { tag: "THREAT", value: 15.4 },
        { tag: "DISMISS", value: 11 },
      ],
      notes: [],
      delta: 26,
    });
    expect(ledger.adjusted).toBe(false);
  });
});

describe("formatDelta", () => {
  it("uses a true minus sign and keeps one decimal only when present", () => {
    expect(formatDelta(24)).toBe("+24");
    expect(formatDelta(-18)).toBe("−18");
    expect(formatDelta(-13.8)).toBe("−13.8");
    expect(formatDelta(0)).toBe("0");
  });
});

describe("take comparison", () => {
  it("measures the shift between two engine deltas", () => {
    expect(takeShift(24, -18)).toBe(42);
    expect(shiftSentence(24, -18)).toBe(
      "One sentence moved the storm 42 points.",
    );
    expect(shiftSentence(5, 6)).toBe(
      "This take raised the storm 1 point more. Try another.",
    );
    expect(shiftSentence(3, 3)).toBe(
      "Same storm both times. Try a different move.",
    );
  });
});

describe("tomorrowFrom", () => {
  it("wraps around the rotation", () => {
    const rotation = ["a", "b", "c"];
    expect(tomorrowFrom(rotation, 1)).toBe("b");
    expect(tomorrowFrom(rotation, 3)).toBe("a");
  });
});
