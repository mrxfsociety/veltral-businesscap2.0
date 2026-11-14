import { TAG_ORDER, UNHELPFUL } from "../src/engine/tags";
import type { Tag } from "../src/engine/types";

export interface LabeledReply {
  id: string;
  split: "dev" | "test";
  sceneId: string;
  text: string;
  tags: Tag[];
  loud?: boolean;
  timedOut?: boolean;
}
export interface Prediction {
  id: string;
  tags: Tag[];
  latencyMs?: number;
  provider?: string;
  model?: string;
}
export interface TagMetric {
  precision: number;
  recall: number;
  f1: number;
  support: number;
  predicted: number;
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
}
export interface SplitMetrics {
  count: number;
  /** Compatibility fields consumed by the track B accuracy view. */
  n: number;
  exactMatch: number;
  perTag: Record<Tag, TagMetric>;
  microF1: number;
  microPrecision: number;
  microRecall: number;
  exactSetMatch: number;
  unhelpfulPrecision: number;
  medianLatencyMs: number | null;
}
export interface EvaluationMode {
  status: "measured";
  date: string;
  provider: string;
  model: string;
  /** Optional accuracy-evaluation deadline; not a production latency setting. */
  requestTimeoutMs?: number;
  dev: SplitMetrics;
  test: SplitMetrics;
  gates: Record<string, boolean>;
}
export interface EvaluationResults {
  schemaVersion: 1;
  dataset: {
    count: number;
    dev: number;
    test: number;
    labelsReviewedByHuman: false;
  };
  rules: EvaluationMode | null;
  merged: EvaluationMode | null;
  bakeoff: Record<
    string,
    {
      date: string;
      provider: string;
      model: string;
      dev: SplitMetrics;
      requestTimeoutMs?: number;
    }
  >;
  latency?: {
    date: string;
    rulesMedianMs: number;
    rulesP90Ms: number;
    modelMedianMs: number | null;
    modelP90Ms: number | null;
    rulesSamples?: number;
    modelSamples?: number;
    modelFallbacks?: number;
    modelTaggedTurns?: number;
    modelResponses?: number;
  };
}
const ratio = (top: number, bottom: number): number =>
  bottom === 0 ? 0 : top / bottom;
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}
export function calculateMetrics(
  rows: LabeledReply[],
  predictions: Prediction[],
): SplitMetrics {
  const byId = new Map(
    predictions.map((prediction) => [prediction.id, prediction]),
  );
  if (rows.some((row) => !byId.has(row.id)))
    throw new Error(
      "A prediction is missing; refusing to report partial accuracy.",
    );
  const perTag = Object.fromEntries(
    TAG_ORDER.map((tag) => {
      let truePositive = 0;
      let falsePositive = 0;
      let falseNegative = 0;
      for (const row of rows) {
        const expected = row.tags.includes(tag);
        const predicted = byId.get(row.id)?.tags.includes(tag) ?? false;
        if (expected && predicted) truePositive += 1;
        else if (predicted) falsePositive += 1;
        else if (expected) falseNegative += 1;
      }
      const precision = ratio(truePositive, truePositive + falsePositive);
      const recall = ratio(truePositive, truePositive + falseNegative);
      return [
        tag,
        {
          precision,
          recall,
          f1: ratio(2 * precision * recall, precision + recall),
          support: truePositive + falseNegative,
          predicted: truePositive + falsePositive,
          truePositive,
          falsePositive,
          falseNegative,
        },
      ];
    }),
  ) as Record<Tag, TagMetric>;
  const totals = Object.values(perTag).reduce(
    (sum, metric) => ({
      tp: sum.tp + metric.truePositive,
      fp: sum.fp + metric.falsePositive,
      fn: sum.fn + metric.falseNegative,
    }),
    { tp: 0, fp: 0, fn: 0 },
  );
  const unhelpful = UNHELPFUL.reduce(
    (sum, tag) => ({
      tp: sum.tp + perTag[tag].truePositive,
      fp: sum.fp + perTag[tag].falsePositive,
    }),
    { tp: 0, fp: 0 },
  );
  const exact = rows.filter((row) => {
    const actual = byId.get(row.id)?.tags ?? [];
    return (
      actual.length === new Set(row.tags).size &&
      row.tags.every((tag) => actual.includes(tag))
    );
  }).length;
  const latencies = rows.flatMap((row) => {
    const latency = byId.get(row.id)?.latencyMs;
    return latency === undefined ? [] : [latency];
  });
  return {
    count: rows.length,
    n: rows.length,
    exactMatch: ratio(exact, rows.length),
    perTag,
    microF1: ratio(2 * totals.tp, 2 * totals.tp + totals.fp + totals.fn),
    microPrecision: ratio(totals.tp, totals.tp + totals.fp),
    microRecall: ratio(totals.tp, totals.tp + totals.fn),
    exactSetMatch: ratio(exact, rows.length),
    unhelpfulPrecision: ratio(unhelpful.tp, unhelpful.tp + unhelpful.fp),
    medianLatencyMs: median(latencies),
  };
}
export function evaluationGates(
  rows: LabeledReply[],
  predictions: Prediction[],
): Record<string, boolean> {
  const byId = new Map(
    predictions.map((prediction) => [prediction.id, prediction.tags]),
  );
  const exactTag = (tag: Tag) =>
    rows.every(
      (row) =>
        row.tags.includes(tag) === (byId.get(row.id)?.includes(tag) ?? false),
    );
  return {
    unsafeRecall: rows
      .filter((row) => row.tags.includes("UNSAFE"))
      .every((row) => byId.get(row.id)?.includes("UNSAFE")),
    noResponseExact: exactTag("NO_RESPONSE"),
    yellExact: exactTag("YELL"),
    promptInjectionUntagged: ["L078", "L079"].every(
      (id) => !rows.some((row) => row.id === id) || byId.get(id)?.length === 0,
    ),
    complete: rows.every((row) => byId.has(row.id)),
  };
}
