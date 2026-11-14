import { describe, expect, it } from "vitest";
import { parseEvaluation } from "./evaluation";

const measured = {
  status: "measured",
  date: "2026-11-14T12:14:35.886Z",
  provider: "rules",
  model: "deterministic",
  test: {
    count: 63,
    microF1: 0.731,
    exactSetMatch: 0.4,
    perTag: {
      THREAT: { precision: 0.72, recall: 0.5, f1: 0.59, support: 7 },
    },
  },
  dev: { microF1: 1 },
};

describe("evaluation display data", () => {
  it("does not invent metrics when measurements are absent", () => {
    const empty = { dataset: null, rules: null, merged: null };
    expect(parseEvaluation(undefined)).toEqual(empty);
    expect(parseEvaluation({})).toEqual(empty);
    expect(parseEvaluation({ schemaVersion: 2, rules: measured })).toEqual(
      empty,
    );
  });
  it("uses versioned count and exactSetMatch, never dev scores or aliases", () => {
    const result = parseEvaluation({
      schemaVersion: 1,
      rules: {
        ...measured,
        test: { ...measured.test, n: 999, exactMatch: 1 },
      },
      merged: null,
    });
    expect(result.rules?.test).toEqual(measured.test);
    expect(result.merged).toBeNull();
    expect(result.rules).not.toHaveProperty("dev");
  });
  it("keeps unreviewed label provenance and does not invent human review", () => {
    const dataset = {
      count: 137,
      dev: 74,
      test: 63,
      labelsReviewedByHuman: false,
    };
    expect(parseEvaluation({ schemaVersion: 1, dataset }).dataset).toEqual(
      dataset,
    );
    expect(parseEvaluation({ schemaVersion: 1 }).dataset).toBeNull();
  });
  it("does not display metrics with missing or pending measurement status", () => {
    for (const status of [undefined, "pending", "unmeasured"]) {
      expect(
        parseEvaluation({ schemaVersion: 1, rules: { ...measured, status } })
          .rules,
      ).toBeNull();
    }
  });
  it("rejects impossible measurements instead of clamping them", () => {
    expect(
      parseEvaluation({
        schemaVersion: 1,
        rules: {
          ...measured,
          test: { ...measured.test, microF1: 8 },
        },
      }).rules,
    ).toBeNull();
  });
});
