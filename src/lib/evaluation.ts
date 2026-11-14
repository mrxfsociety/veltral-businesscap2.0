import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const fraction = z.number().min(0).max(1);
const tagMetric = z.object({
  precision: fraction,
  recall: fraction,
  f1: fraction,
  support: z.number().int().nonnegative(),
});
const DatasetSchema = z.object({
  count: z.number().int().nonnegative(),
  dev: z.number().int().nonnegative(),
  test: z.number().int().nonnegative(),
  labelsReviewedByHuman: z.boolean(),
});

// Read measured test results from the engine's versioned output. Development
// scores, compatibility aliases and target values are never display metrics.
export const EvaluationBlockSchema = z.object({
  status: z.literal("measured"),
  date: z.iso.datetime(),
  provider: z.string().min(1),
  model: z.string().min(1),
  requestTimeoutMs: z.number().int().positive().optional(),
  test: z.object({
    count: z.number().int().positive(),
    microF1: fraction,
    exactSetMatch: fraction,
    unhelpfulPrecision: fraction,
    medianLatencyMs: z.number().nonnegative().nullable(),
    perTag: z.record(z.string(), tagMetric),
  }),
});
export type EvaluationBlock = z.infer<typeof EvaluationBlockSchema>;
export interface EvaluationResults {
  dataset: z.infer<typeof DatasetSchema> | null;
  rules: EvaluationBlock | null;
  merged: EvaluationBlock | null;
}
const emptyResults = (): EvaluationResults => ({
  dataset: null,
  rules: null,
  merged: null,
});

export function parseEvaluation(raw: unknown): EvaluationResults {
  const envelope = z
    .object({
      schemaVersion: z.literal(1),
      dataset: z.unknown().optional(),
      rules: z.unknown().optional(),
      merged: z.unknown().optional(),
    })
    .safeParse(raw);
  if (!envelope.success) return emptyResults();
  const dataset = DatasetSchema.safeParse(envelope.data.dataset);
  const rules = EvaluationBlockSchema.safeParse(envelope.data.rules);
  const merged = EvaluationBlockSchema.safeParse(envelope.data.merged);
  return {
    dataset: dataset.success ? dataset.data : null,
    rules: rules.success ? rules.data : null,
    merged: merged.success ? merged.data : null,
  };
}
export function readEvaluation(): EvaluationResults {
  try {
    const raw: unknown = JSON.parse(
      readFileSync(join(process.cwd(), "eval/results.json"), "utf8"),
    );
    return parseEvaluation(raw);
  } catch {
    return emptyResults();
  }
}
