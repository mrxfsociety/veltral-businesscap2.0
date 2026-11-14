import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

export const EnvSchema = z.object({
  DOMAIN: optionalText,
  SITE_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.url().optional(),
  ),
  REDIS_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .url()
      .refine((value) => /^rediss?:\/\//.test(value))
      .optional(),
  ),
  OPENAI_API_KEY: optionalText,
  OPENAI_MODEL: optionalText,
  OPENAI_REASONING_EFFORT: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(["none", "low", "medium", "high", "xhigh", "max"]).optional(),
  ),
  ANTHROPIC_API_KEY: optionalText,
  ANTHROPIC_MODEL: optionalText,
  LLM_PRIMARY: z.enum(["openai", "anthropic"]).default("openai"),
  MODEL_DAILY_CALL_CAP: z.coerce
    .number()
    .int()
    .min(0)
    .max(10_000_000)
    .default(20_000),
  OPENAI_TRANSCRIBE_MODEL: optionalText,
  OPENAI_TTS_MODEL: optionalText,
  NEXT_PUBLIC_PRO_PREVIEW: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  ADMIN_KEY: optionalText,
  GIT_SHA: z.string().default("development"),
});

export type ServerEnv = z.infer<typeof EnvSchema>;

export function getEnv(
  source: Record<string, string | undefined> = process.env,
): ServerEnv {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path.join("."))),
    ];
    throw new Error(`Invalid server configuration: ${fields.join(", ")}`);
  }
  return result.data;
}
