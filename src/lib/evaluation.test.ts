import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
    unhelpfulPrecision: 0.72,
    medianLatencyMs: null,
    perTag: {
      THREAT: { precision: 0.72, recall: 0.5, f1: 0.59, support: 7 },
    },
  },
  dev: { microF1: 1 },
};

describe("evaluation display data", () => {
  it("accepts measured blocks in the checked-in engine evaluation artifact", () => {
    const artifact = JSON.parse(
      readFileSync(join(process.cwd(), "eval/results.json"), "utf8"),
    );
    const parsed = parseEvaluation(artifact);
    for (const mode of ["rules", "merged"] as const) {
      if (artifact[mode]?.status !== "measured") continue;
      expect(
        parsed[mode],
        `${mode} measured results must remain displayable`,
      ).not.toBeNull();
      expect(parsed[mode]?.test.microF1).toBe(artifact[mode].test.microF1);
      expect(parsed[mode]?.test.exactSetMatch).toBe(
        artifact[mode].test.exactSetMatch,
      );
      expect(parsed[mode]?.test.count).toBe(artifact[mode].test.count);
    }
  });
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
  it("preserves measured combined results and their evaluation timeout", () => {
    const merged = {
      ...measured,
      provider: "openai",
      model: "gpt-6-luna",
      requestTimeoutMs: 30_000,
      test: {
        ...measured.test,
        microF1: 0.9664429530201343,
        exactSetMatch: 0.9206349206349206,
        unhelpfulPrecision: 0.8974358974358975,
        medianLatencyMs: 1998.369917000011,
      },
    };
    const result = parseEvaluation({
      schemaVersion: 1,
      rules: measured,
      merged,
    });
    expect(result.merged?.test).toEqual(merged.test);
    expect(result.merged?.requestTimeoutMs).toBe(30_000);
    expect(result.merged?.model).toBe("gpt-6-luna");
    expect(result.rules?.test.medianLatencyMs).toBeNull();
  });
  it("rejects invalid timing and precision rather than inventing replacements", () => {
    for (const test of [
      { ...measured.test, unhelpfulPrecision: 1.1 },
      { ...measured.test, medianLatencyMs: -1 },
    ]) {
      expect(
        parseEvaluation({ schemaVersion: 1, merged: { ...measured, test } })
          .merged,
      ).toBeNull();
    }
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
