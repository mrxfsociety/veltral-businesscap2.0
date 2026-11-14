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
export const EvaluationBlockSchema = z.object({
  date: z.string(),
  provider: z.string().optional(),
  model: z.string().optional(),
  test: z.object({
    n: z.number().int().nonnegative(),
    microF1: fraction,
    exactMatch: fraction,
    perTag: z.record(z.string(), tagMetric),
  }),
});
export type EvaluationBlock = z.infer<typeof EvaluationBlockSchema>;
export function parseEvaluation(raw: unknown): {
  rules: EvaluationBlock | null;
  merged: EvaluationBlock | null;
} {
  const blocks = z
    .object({ rules: z.unknown().optional(), merged: z.unknown().optional() })
    .safeParse(raw);
  if (!blocks.success) return { rules: null, merged: null };
  const rules = EvaluationBlockSchema.safeParse(blocks.data.rules);
  const merged = EvaluationBlockSchema.safeParse(blocks.data.merged);
  return {
    rules: rules.success ? rules.data : null,
    merged: merged.success ? merged.data : null,
  };
}
export function readEvaluation(): {
  rules: EvaluationBlock | null;
  merged: EvaluationBlock | null;
} {
  try {
    const raw: unknown = JSON.parse(
      readFileSync(join(process.cwd(), "eval/results.json"), "utf8"),
    );
    return parseEvaluation(raw);
  } catch {
    return { rules: null, merged: null };
  }
}
