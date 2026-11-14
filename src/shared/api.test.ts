import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import scenes from "../../content/scenes.json";
import type {
  ChildState,
  PublicScene,
  Scene,
  Score,
  TagHit,
  TurnResult,
} from "@/engine/types";
import * as api from "./api";

const scene = api.PublicSceneSchema.parse(scenes[0]);
const state = {
  arousal: 75,
  connection: 50,
  limitIntact: true,
  turn: 0,
  bribed: false,
  lastHelpfulTags: [],
  lastDelta: 0,
} satisfies ChildState;
const result = {
  tags: ["NAME_FEELING"],
  before: state,
  after: { ...state, arousal: 65, turn: 1, lastDelta: -10 },
  delta: -10,
  outcome: "ongoing",
  effects: [{ tag: "NAME_FEELING", value: -10 }],
  notes: [],
} satisfies TurnResult;
const score = {
  outcome: "calm_limit_held",
  stars: 3,
  points: 800,
  turnsToCalm: 3,
  par: 3,
  clean: true,
  statedLimit: true,
  bribed: false,
  unhelpfulCount: 0,
  finalArousal: 25,
  grid: ["good", "good", "good"],
  turningPoint: 0,
} satisfies Score;

const examples: { name: string; schema: z.ZodType; value: unknown }[] = [
  {
    name: "error",
    schema: api.ErrorResponseSchema,
    value: { error: "session_expired", message: "Start a new session." },
  },
  {
    name: "session request",
    schema: api.SessionRequestSchema,
    value: { kind: "daily" },
  },
  {
    name: "library session request",
    schema: api.SessionRequestSchema,
    value: { kind: "library", sceneId: scene.id, practice: true },
  },
  {
    name: "session response",
    schema: api.SessionResponseSchema,
    value: {
      sessionId: "example-session",
      kind: "daily",
      scene,
      state,
      par: 3,
      maxTurns: 8,
      dayKey: "2026-11-14",
      dayNumber: 1,
    },
  },
  {
    name: "turn request",
    schema: api.TurnRequestSchema,
    value: {
      sessionId: "example-session",
      turnIndex: 0,
      text: "You seem upset.",
      inputMode: "text",
      loud: false,
      timedOut: false,
    },
  },
  {
    name: "turn response",
    schema: api.TurnResponseSchema,
    value: {
      turnIndex: 0,
      text: "You seem upset.",
      hits: [{ tag: "NAME_FEELING", source: "rule", quote: "You seem upset" }],
      result,
      child: { line: "Want it.", action: "frowns" },
      tagging: "rules",
      score: null,
      daily: null,
      usedDoOver: false,
    },
  },
  { name: "finished score", schema: api.ScoreSchema, value: score },
  {
    name: "daily standing",
    schema: api.DailyStandingSchema,
    value: { dayKey: "2026-11-14", players: 20, rank: 5, beatPct: 79 },
  },
  {
    name: "unranked standing",
    schema: api.DailyStandingSchema,
    value: { dayKey: "2026-11-14", players: 1, rank: 1, beatPct: null },
  },
  {
    name: "custom request",
    schema: api.CustomSceneRequestSchema,
    value: {
      description: "My child did not want to leave the playground.",
      ageBand: "4-5",
      childName: "Robin",
    },
  },
  {
    name: "custom success",
    schema: api.CustomSceneResponseSchema,
    value: {
      ok: true,
      sceneId: "custom-example",
      scene: { ...scene, id: "custom-example" },
    },
  },
  {
    name: "custom refusal",
    schema: api.CustomSceneResponseSchema,
    value: {
      ok: false,
      reason: "model_unavailable",
      message: "Choose a library scene for now.",
    },
  },
  {
    name: "coach request",
    schema: api.CoachRequestSchema,
    value: { sessionId: "example-session", turnIndex: 0 },
  },
  {
    name: "coach model response",
    schema: api.CoachResponseSchema,
    value: {
      source: "model",
      suggestions: [{ text: "I'm here.", tags: ["CONNECT"], delta: -8 }],
      tip: null,
    },
  },
  {
    name: "coach tip response",
    schema: api.CoachResponseSchema,
    value: {
      source: "tips",
      suggestions: [],
      tip: {
        tag: "THREAT",
        why: "Threats raise pressure.",
        tryInstead: "Restate the limit calmly.",
      },
    },
  },
  {
    name: "daily response",
    schema: api.DailyResponseSchema,
    value: {
      dayKey: "2026-11-14",
      dayNumber: 1,
      sceneId: scene.id,
      title: scene.title,
      par: 3,
      players: 0,
    },
  },
  {
    name: "waitlist request",
    schema: api.WaitlistRequestSchema,
    value: { email: "parent@example.com", plan: "yearly" },
  },
  {
    name: "waitlist response",
    schema: api.WaitlistResponseSchema,
    value: { ok: true },
  },
  {
    name: "health response",
    schema: api.HealthResponseSchema,
    value: {
      ok: true,
      commit: "development",
      time: "2026-11-14T10:00:00.000Z",
      redis: "memory",
      providers: { openai: false, anthropic: false },
      proPreview: true,
    },
  },
  {
    name: "admin request",
    schema: api.AdminStatsRequestSchema,
    value: { key: "test-key" },
  },
  {
    name: "admin stats",
    schema: api.AdminStatsSchema,
    value: {
      dayKey: "2026-11-14",
      sessionsStarted: 0,
      sessionsFinished: 0,
      waitlist: 0,
      modelCalls: 0,
      rulesFallbacks: 0,
    },
  },
  {
    name: "transcription upload",
    schema: api.TranscribeRequestSchema,
    value: { audio: new Blob(["test"], { type: "audio/webm" }) },
  },
  {
    name: "transcription response",
    schema: api.TranscribeResponseSchema,
    value: { text: "I hear you." },
  },
  {
    name: "speech request",
    schema: api.SpeakRequestSchema,
    value: { sessionId: "example-session", turnIndex: -1 },
  },
  {
    name: "speech response",
    schema: api.SpeakResponseSchema,
    value: new Blob(["test"], { type: "audio/mpeg" }),
  },
];

describe("frozen API contract", () => {
  for (const { name, schema, value } of examples) {
    it(`parses ${name}`, () => {
      expect(schema.safeParse(value).success).toBe(true);
    });
  }
  it("matches the engine's public types", () => {
    expectTypeOf<z.infer<typeof api.SceneSchema>>().toEqualTypeOf<Scene>();
    expectTypeOf<
      z.infer<typeof api.PublicSceneSchema>
    >().toEqualTypeOf<PublicScene>();
    expectTypeOf<
      z.infer<typeof api.ChildStateSchema>
    >().toEqualTypeOf<ChildState>();
    expectTypeOf<z.infer<typeof api.TagHitSchema>>().toEqualTypeOf<TagHit>();
    expectTypeOf<
      z.infer<typeof api.TurnResultSchema>
    >().toEqualTypeOf<TurnResult>();
    expectTypeOf<z.infer<typeof api.ScoreSchema>>().toEqualTypeOf<Score>();
  });
  it("removes private rule hints from a public scene", () => {
    expect(scene).not.toHaveProperty("limitHints");
    expect(scene).not.toHaveProperty("giveInHints");
  });
  it("rejects client-supplied authority fields", () => {
    expect(
      api.TurnRequestSchema.safeParse({
        sessionId: "session",
        turnIndex: 0,
        text: "Hello",
        inputMode: "text",
        score,
      }).success,
    ).toBe(false);
  });
  it("requires a scene id for non-daily sessions", () => {
    expect(
      api.SessionRequestSchema.safeParse({ kind: "library" }).success,
    ).toBe(false);
  });
  it("lets the server normalize long raw replies", () => {
    expect(
      api.TurnRequestSchema.safeParse({
        sessionId: "session",
        turnIndex: 0,
        text: "  you  ".repeat(100),
        inputMode: "text",
      }).success,
    ).toBe(true);
  });
  it("accepts the engine's empty-session turning point", () => {
    expect(
      api.ScoreSchema.safeParse({ ...score, turningPoint: -1, grid: [] })
        .success,
    ).toBe(true);
    expect(
      api.ScoreSchema.safeParse({ ...score, turningPoint: -2 }).success,
    ).toBe(false);
  });
  it("rejects malformed requests", () => {
    expect(
      api.TurnRequestSchema.safeParse({
        sessionId: "session",
        turnIndex: -1,
        text: "",
        inputMode: "text",
      }).success,
    ).toBe(false);
    expect(
      api.WaitlistRequestSchema.safeParse({ email: "invalid", plan: "monthly" })
        .success,
    ).toBe(false);
    expect(
      api.CustomSceneRequestSchema.safeParse({
        description: "short",
        ageBand: "4-5",
      }).success,
    ).toBe(false);
    expect(
      api.TranscribeRequestSchema.safeParse({ audio: "fake" }).success,
    ).toBe(false);
  });
});
