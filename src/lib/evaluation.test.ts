import { describe, expect, it } from "vitest";
import { parseEvaluation } from "./evaluation";
describe("evaluation display data", () => {
  it("does not invent metrics when measurements are absent", () => {
    expect(parseEvaluation(undefined)).toEqual({ rules: null, merged: null });
    expect(parseEvaluation({})).toEqual({ rules: null, merged: null });
  });
  it("preserves measured values exactly and reports only the test split", () => {
    const block = {
      date: "2026-11-14",
      test: {
        n: 63,
        microF1: 0.731,
        exactMatch: 0.4,
        perTag: {
          THREAT: { precision: 0.72, recall: 0.5, f1: 0.59, support: 7 },
        },
      },
      dev: { microF1: 1 },
    };
    const result = parseEvaluation({ rules: block });
    expect(result.rules?.test).toEqual(block.test);
    expect(result.merged).toBeNull();
    expect(result.rules).not.toHaveProperty("dev");
  });
  it("rejects impossible measurements instead of clamping them", () => {
    expect(
      parseEvaluation({
        rules: {
          date: "today",
          test: { n: 1, microF1: 8, exactMatch: 1, perTag: {} },
        },
      }).rules,
    ).toBeNull();
  });
});
