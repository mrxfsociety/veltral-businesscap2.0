import { describe, expect, it } from "vitest";
import {
  calculateMetrics,
  evaluationGates,
  median,
  type LabeledReply,
} from "../../eval/metrics";

const rows: LabeledReply[] = [
  {
    id: "one",
    sceneId: "fixture",
    split: "test",
    text: "example one",
    tags: ["CONNECT", "HOLD_LIMIT"],
  },
  {
    id: "two",
    sceneId: "fixture",
    split: "test",
    text: "example two",
    tags: ["THREAT"],
  },
];
describe("evaluation metrics", () => {
  it("counts false positives, false negatives, exact sets and micro-F1 independently", () => {
    const result = calculateMetrics(rows, [
      { id: "one", tags: ["CONNECT"] },
      { id: "two", tags: ["THREAT", "SHAME"] },
    ]);
    expect(result.perTag.CONNECT).toMatchObject({
      support: 1,
      precision: 1,
      recall: 1,
      f1: 1,
    });
    expect(result.perTag.HOLD_LIMIT).toMatchObject({
      support: 1,
      falseNegative: 1,
    });
    expect(result.perTag.SHAME).toMatchObject({ support: 0, falsePositive: 1 });
    expect(result.microF1).toBeCloseTo(2 / 3);
    expect(result.exactSetMatch).toBe(0);
    expect(result.unhelpfulPrecision).toBe(0.5);
  });
  it("refuses missing predictions", () =>
    expect(() => calculateMetrics(rows, [])).toThrow("missing"));
  it("has an honest empty median", () => expect(median([])).toBeNull());
  it("computes even and odd medians", () => {
    expect(median([4, 2, 9, 8])).toBe(6);
    expect(median([9, 1, 4])).toBe(4);
  });
  it("fails an unsafe recall gate", () => {
    const unsafe: LabeledReply[] = [
      {
        id: "unsafe",
        sceneId: "fixture",
        split: "test",
        text: "unsafe example",
        tags: ["UNSAFE"],
      },
    ];
    expect(
      evaluationGates(unsafe, [{ id: "unsafe", tags: [] }]).unsafeRecall,
    ).toBe(false);
  });
});
