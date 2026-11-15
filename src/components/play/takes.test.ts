import { describe, expect, it } from "vitest";
import vectors from "../../../docs/reference/vectors.json";
import { getScene } from "@/engine/scenes";
import { applyTurn, DELTA_MAX, DELTA_MIN, initialState } from "@/engine/transition";
import type { Tag } from "@/engine/types";
import {
  CAP_LABEL,
  formatDelta,
  ledgerFor,
  ROUNDING_LABEL,
  type Ledger,
  wholeShares,
  shiftSentence,
  takeShift,
  tomorrowFrom,
} from "./takes";

const at = (arousal: number) => ({ arousal });

function sumOf(ledger: Ledger) {
  return ledger.rows.reduce((total, row) => total + row.value, 0);
}

describe("ledgerFor", () => {
  it("rounds each effect, adds the rules the engine reported, and caps the rest", () => {
    // spirited child, connection 70+: −10.8 and −13 plus the empathy bonus, capped at −18
    const ledger = ledgerFor({
      tags: ["NAME_FEELING", "HOLD_LIMIT", "OFFER_CHOICE"],
      effects: [
        { tag: "NAME_FEELING", value: -10.8 },
        { tag: "OFFER_CHOICE", value: -13 },
      ],
      notes: ["HIGH_CONNECTION", "VALIDATED_LIMIT"],
      delta: -18,
      before: at(75),
      after: at(57),
    });
    expect(ledger.rows.map((row) => [row.kind, row.value])).toEqual([
      ["tag", -11],
      ["tag", -13],
      ["rule", -6],
      ["cap", 12],
    ]);
    expect(ledger.rows[3]).toMatchObject({ label: CAP_LABEL });
    expect(sumOf(ledger)).toBe(-18);
    expect(ledger.rounded).toBe(true);
  });

  it("halves the empathy bonus when a harsh tag is present", () => {
    const ledger = ledgerFor({
      tags: ["NAME_FEELING", "HOLD_LIMIT", "THREAT"],
      effects: [
        { tag: "NAME_FEELING", value: -6 },
        { tag: "THREAT", value: 14 },
      ],
      notes: ["MIXED_MESSAGE", "VALIDATED_LIMIT"],
      delta: 5,
      before: at(60),
      after: at(65),
    });
    expect(ledger.rows.find((row) => row.kind === "rule")?.value).toBe(-3);
    expect(sumOf(ledger)).toBe(5);
  });

  it("rounds rows so they add up to the engine's rounded sum", () => {
    // −5.4 and −6.5 sum to −11.9, which the engine rounds to −12
    const ledger = ledgerFor({
      tags: ["NAME_FEELING", "OFFER_CHOICE"],
      effects: [
        { tag: "NAME_FEELING", value: -5.4 },
        { tag: "OFFER_CHOICE", value: -6.5 },
      ],
      notes: ["REPEAT"],
      delta: -12,
      before: at(60),
      after: at(48),
    });
    expect(ledger.rows.map((row) => [row.kind, row.value])).toEqual([
      ["tag", -5],
      ["tag", -7],
    ]);
    expect(ROUNDING_LABEL).toBe("Rounding to whole points");
  });

  it("keeps every whole share within one point of the engine value", () => {
    const values = [-8.6, -7.2, 0, -5.7, 0, 0];
    const shares = wholeShares(values);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(Math.round(-21.5));
    shares.forEach((share, i) =>
      expect(Math.abs(share - values[i])).toBeLessThan(1),
    );
  });

  it("names the ceiling when the storm tops out at 100", () => {
    const ledger = ledgerFor({
      tags: ["YELL"],
      effects: [{ tag: "YELL", value: 18 }],
      notes: ["NO_HELPFUL_MOVE"],
      delta: 10,
      before: at(90),
      after: at(100),
    });
    expect(ledger.rows.map((row) => [row.kind, row.value])).toEqual([
      ["tag", 18],
      ["rule", 3],
      ["bound", -11],
    ]);
    expect(sumOf(ledger)).toBe(10);
  });

  it("adds no extra row when the rows already add up", () => {
    const ledger = ledgerFor({
      tags: ["THREAT", "DISMISS"],
      effects: [
        { tag: "THREAT", value: 15 },
        { tag: "DISMISS", value: 11 },
      ],
      notes: ["NO_HELPFUL_MOVE"],
      delta: 25,
      before: at(50),
      after: at(75),
    });
    expect(ledger.rows.map((row) => row.kind)).toEqual(["tag", "tag", "rule", "cap"]);
    expect(sumOf(ledger)).toBe(25);
    expect(ledger.rounded).toBe(false);
  });
});

describe("ledgerFor over the 37 golden vectors", () => {
  for (const vector of vectors.vectors) {
    it(vector.id, () => {
      const scene = getScene(vector.sceneId);
      if (!scene) throw new Error(`Missing scene ${vector.sceneId}`);
      let state = initialState(scene);
      for (const tags of vector.tagSets as Tag[][]) {
        const result = applyTurn(scene, state, tags);
        state = result.after;
        const ledger = ledgerFor(result);
        expect(sumOf(ledger)).toBe(result.delta);
        expect(ledger.total).toBe(result.delta);
        for (const row of ledger.rows) {
          expect(Number.isInteger(row.value)).toBe(true);
          if (row.kind === "cap")
            expect(
              [DELTA_MIN, DELTA_MAX].includes(result.delta) ||
                [0, 100].includes(result.after.arousal),
            ).toBe(true);
          if (row.kind === "bound")
            expect([0, 100]).toContain(result.after.arousal);
          expect(row.kind).not.toBe("rounding");
        }
      }
    });
  }
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
