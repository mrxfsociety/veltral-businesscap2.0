import { z } from "zod";

/** Frozen T0 contract. Both tracks import these schemas instead of redefining payloads. */
export const TagSchema = z.enum([
  "NAME_FEELING",
  "HOLD_LIMIT",
  "OFFER_CHOICE",
  "CLEAR_COMMAND",
  "CONNECT",
  "LABELED_PRAISE",
  "WHEN_THEN",
  "THREAT",
  "BRIBE",
  "YELL",
  "SHAME",
  "DISMISS",
  "QUESTION_COMMAND",
  "LECTURE",
  "NEGATIVE_COMMAND",
  "VAGUE_COMMAND",
  "GIVE_IN",
  "NO_RESPONSE",
  "UNSAFE",
]);
export const AgeBandSchema = z.enum(["2-3", "4-5", "6-7"]);
export const TemperamentSchema = z.enum(["easygoing", "sensitive", "spirited"]);
export const OutcomeSchema = z.enum([
  "ongoing",
  "calm_limit_held",
  "calm_gave_in",
  "out_of_turns",
  "stopped_unsafe",
]);
export const NoteSchema = z.enum([
  "REPEAT",
  "HIGH_CONNECTION",
  "LOW_CONNECTION",
  "MIXED_MESSAGE",
  "COMMAND_TOO_SOON",
  "CAPPED",
  "VALIDATED_LIMIT",
  "BARE_LIMIT",
  "NO_HELPFUL_MOVE",
  "BRIBE_TAX",
  "GAVE_IN",
  "UNSAFE_STOP",
]);
export const SessionKindSchema = z.enum(["daily", "library", "custom"]);
export const DayKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const identifier = z.string().min(1).max(200);
const count = z.number().int().nonnegative();
const meter = z.number().min(0).max(100);

export const PublicSceneSchema = z.object({
  id: identifier,
  title: z.string().min(1),
  place: z.string().min(1),
  ageBand: AgeBandSchema,
  childName: z.string().min(1),
  setup: z.string().min(1),
  openingLine: z.string().min(1),
  openingAction: z.string(),
  limit: z.string().min(1),
  wants: z.string().min(1),
  startArousal: z.number().min(60).max(90),
  temperament: TemperamentSchema,
});
export const SceneSchema = PublicSceneSchema.extend({
  limitHints: z.array(z.string()),
  giveInHints: z.array(z.string()),
});
export const ChildStateSchema = z.object({
  arousal: meter,
  connection: meter,
  limitIntact: z.boolean(),
  turn: count,
  bribed: z.boolean(),
  lastHelpfulTags: z.array(TagSchema),
  lastDelta: z.number(),
});
export const TagHitSchema = z.object({
  tag: TagSchema,
  source: z.enum(["rule", "model", "both"]),
  quote: z.string(),
});
export const TurnResultSchema = z.object({
  tags: z.array(TagSchema),
  before: ChildStateSchema,
  after: ChildStateSchema,
  delta: z.number(),
  outcome: OutcomeSchema,
  effects: z.array(z.object({ tag: TagSchema, value: z.number() })),
  notes: z.array(NoteSchema),
});
export const ScoreSchema = z.object({
  outcome: OutcomeSchema,
  stars: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  points: count,
  turnsToCalm: count.nullable(),
  par: z.number().int().positive(),
  clean: z.boolean(),
  statedLimit: z.boolean(),
  bribed: z.boolean(),
  unhelpfulCount: count,
  finalArousal: meter,
  grid: z.array(z.enum(["good", "mixed", "bad"])),
  turningPoint: z.number().int().min(-1),
});
export const ChildLineSchema = z.object({
  line: z.string().min(1).max(120),
  action: z.string().max(80),
});
export const DailyStandingSchema = z.object({
  dayKey: DayKeySchema,
  players: count,
  rank: z.number().int().positive(),
  beatPct: meter.nullable(),
});

export const ErrorResponseSchema = z.object({
  error: z.string().min(1),
  message: z.string().min(1),
});
export const SessionRequestSchema = z
  .object({
    kind: SessionKindSchema,
    sceneId: identifier.optional(),
    practice: z.boolean().optional(),
  })
  .strict()
  .refine((value) => value.kind === "daily" || Boolean(value.sceneId), {
    message: "A scene id is required for library and custom sessions.",
    path: ["sceneId"],
  });
export const SessionResponseSchema = z.object({
  sessionId: identifier,
  kind: SessionKindSchema,
  scene: PublicSceneSchema,
  state: ChildStateSchema,
  par: z.number().int().positive(),
  maxTurns: z.literal(8),
  dayKey: DayKeySchema,
  dayNumber: z.number().int(),
});
export const TurnRequestSchema = z
  .object({
    sessionId: identifier,
    turnIndex: count,
    text: z.string(),
    loud: z.boolean().optional(),
    timedOut: z.boolean().optional(),
    inputMode: z.enum(["text", "voice"]),
  })
  .strict();
export const TurnResponseSchema = z.object({
  turnIndex: count,
  text: z.string().max(300),
  hits: z.array(TagHitSchema),
  result: TurnResultSchema,
  child: ChildLineSchema.nullable(),
  tagging: z.enum(["model", "rules"]),
  score: ScoreSchema.nullable(),
  daily: DailyStandingSchema.nullable(),
  usedDoOver: z.boolean(),
});
export const CustomSceneRequestSchema = z
  .object({
    description: z.string().trim().min(10).max(500),
    ageBand: AgeBandSchema,
    childName: z.string().trim().max(40).optional(),
  })
  .strict();
export const CustomSceneResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    sceneId: identifier,
    scene: PublicSceneSchema,
  }),
  z.object({
    ok: z.literal(false),
    reason: z.enum(["unsafe", "not_a_meltdown", "model_unavailable"]),
    message: z.string().min(1),
  }),
]);
export const CoachRequestSchema = z
  .object({ sessionId: identifier, turnIndex: count })
  .strict();
export const CoachResponseSchema = z.object({
  source: z.enum(["model", "tips"]),
  suggestions: z
    .array(
      z.object({
        text: z.string().min(1),
        tags: z.array(TagSchema),
        delta: z.number(),
      }),
    )
    .max(3),
  tip: z
    .object({ tag: TagSchema, why: z.string(), tryInstead: z.string() })
    .nullable(),
});
export const DailyResponseSchema = z.object({
  dayKey: DayKeySchema,
  dayNumber: z.number().int(),
  sceneId: identifier,
  title: z.string().min(1),
  par: z.number().int().positive(),
  players: count,
});
export const WaitlistRequestSchema = z
  .object({
    email: z.string().trim().email().max(254),
    plan: z.enum(["monthly", "yearly"]),
  })
  .strict();
export const WaitlistResponseSchema = z.object({ ok: z.literal(true) });
export const HealthResponseSchema = z.object({
  ok: z.boolean(),
  commit: z.string(),
  time: z.string().datetime(),
  redis: z.enum(["up", "memory"]),
  providers: z.object({ openai: z.boolean(), anthropic: z.boolean() }),
  proPreview: z.boolean(),
});
export const AdminStatsRequestSchema = z
  .object({ key: z.string().min(1) })
  .strict();
export const AdminStatsSchema = z.object({
  dayKey: DayKeySchema,
  sessionsStarted: count,
  sessionsFinished: count,
  waitlist: count,
  modelCalls: count,
  rulesFallbacks: count,
});
/** Multipart audio is validated after Request.formData(), never JSON serialized. */
export const TranscribeRequestSchema = z.object({
  audio: z.custom<Blob>(
    (value) => typeof Blob !== "undefined" && value instanceof Blob,
  ),
});
export const TranscribeResponseSchema = z.object({ text: z.string() });
export const SpeakRequestSchema = z
  .object({ sessionId: identifier, turnIndex: z.number().int().min(-1) })
  .strict();
/** Speech responses contain binary audio, not a JSON envelope. */
export const SpeakResponseSchema = z.custom<Blob>(
  (value) => typeof Blob !== "undefined" && value instanceof Blob,
);

export type SessionRequest = z.infer<typeof SessionRequestSchema>;
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
export type TurnRequest = z.infer<typeof TurnRequestSchema>;
export type TurnResponse = z.infer<typeof TurnResponseSchema>;
export type DailyStanding = z.infer<typeof DailyStandingSchema>;
export type CustomSceneRequest = z.infer<typeof CustomSceneRequestSchema>;
export type CustomSceneResponse = z.infer<typeof CustomSceneResponseSchema>;
export type CoachRequest = z.infer<typeof CoachRequestSchema>;
export type CoachResponse = z.infer<typeof CoachResponseSchema>;
export type DailyResponse = z.infer<typeof DailyResponseSchema>;
export type WaitlistRequest = z.infer<typeof WaitlistRequestSchema>;
export type WaitlistResponse = z.infer<typeof WaitlistResponseSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type AdminStatsRequest = z.infer<typeof AdminStatsRequestSchema>;
export type AdminStats = z.infer<typeof AdminStatsSchema>;
export type TranscribeRequest = z.infer<typeof TranscribeRequestSchema>;
export type TranscribeResponse = z.infer<typeof TranscribeResponseSchema>;
export type SpeakRequest = z.infer<typeof SpeakRequestSchema>;
export type SpeakResponse = z.infer<typeof SpeakResponseSchema>;

/* ─── v2 additions (REDESIGN section 7): entitlement and test checkout ─── */
export const EntitlementSourceSchema = z.enum(["stripe_test", "code", "preview"]);
export const EntitlementResponseSchema = z.object({
  pro: z.boolean(),
  source: EntitlementSourceSchema.nullable(),
  checkout: z.enum(["stripe_test", "code_only"]),
  demoCode: z.string().nullable(),
});
export const CheckoutRequestSchema = z
  .object({ plan: z.enum(["monthly", "yearly"]) })
  .strict();
export const CheckoutResponseSchema = z.object({ url: z.string().url() });
export const RedeemRequestSchema = z
  .object({ code: z.string().trim().min(1).max(64) })
  .strict();
export const OkResponseSchema = z.object({ ok: z.literal(true) });

export type EntitlementResponse = z.infer<typeof EntitlementResponseSchema>;
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
export type RedeemRequest = z.infer<typeof RedeemRequestSchema>;
