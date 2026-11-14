// STUB(T0): replaced in stages A2 and A3.
import sceneData from "../../content/scenes.json";
import type { ChildState, Score, TagHit, TurnResult } from "@/engine/types";
import {
  PublicSceneSchema,
  SceneSchema,
  SessionResponseSchema,
  TurnResponseSchema,
  type DailyResponse,
  type SessionRequest,
  type SessionResponse,
  type TurnRequest,
  type TurnResponse,
} from "@/shared/api";

interface StubSession {
  initial: SessionResponse;
  turns: TurnResponse[];
  usedDoOver: boolean;
  expiresAt: number;
}
interface StubMemory {
  sessions: Map<string, StubSession>;
  waitlist: Map<
    string,
    { email: string; plan: "monthly" | "yearly"; at: string }
  >;
}
const host = globalThis as typeof globalThis & { doOverT0?: StubMemory };
const memory: StubMemory = (host.doOverT0 ??= {
  sessions: new Map(),
  waitlist: new Map(),
});
const scenes = SceneSchema.array().parse(sceneData);
const firstScene = SceneSchema.parse(scenes[0]);

export function t0Day(): { dayKey: string; dayNumber: number } {
  const dayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const dayNumber =
    Math.floor(
      (Date.parse(`${dayKey}T00:00:00Z`) - Date.parse("2026-11-14T00:00:00Z")) /
        86_400_000,
    ) + 1;
  return { dayKey, dayNumber };
}

export function t0Daily(): DailyResponse {
  return {
    ...t0Day(),
    sceneId: firstScene.id,
    title: firstScene.title,
    par: 3,
    players: 0,
  };
}

export function t0Session(input: SessionRequest): SessionResponse | null {
  const scene =
    input.kind === "daily"
      ? firstScene
      : scenes.find((item) => item.id === input.sceneId);
  if (!scene || input.kind === "custom") return null;
  const initial = SessionResponseSchema.parse({
    sessionId: crypto.randomUUID(),
    kind: input.kind,
    scene: PublicSceneSchema.parse(scene),
    state: {
      arousal: scene.startArousal,
      connection: 50,
      limitIntact: true,
      turn: 0,
      bribed: false,
      lastHelpfulTags: [],
      lastDelta: 0,
    },
    par: 3,
    maxTurns: 8,
    ...t0Day(),
  });
  memory.sessions.set(initial.sessionId, {
    initial,
    turns: [],
    usedDoOver: false,
    expiresAt: Date.now() + 6 * 60 * 60 * 1000,
  });
  return initial;
}

export function t0Turn(
  input: TurnRequest,
): TurnResponse | "session_expired" | "turn_out_of_order" | "session_ended" {
  const session = memory.sessions.get(input.sessionId);
  if (!session || session.expiresAt < Date.now()) {
    memory.sessions.delete(input.sessionId);
    return "session_expired";
  }
  if (input.turnIndex > session.turns.length) return "turn_out_of_order";
  const previous = session.turns[input.turnIndex - 1];
  if (previous && previous.result.outcome !== "ongoing") return "session_ended";
  if (input.turnIndex < session.turns.length) {
    session.turns = session.turns.slice(0, input.turnIndex);
    session.usedDoOver = true;
  }
  const before: ChildState = previous?.result.after ?? session.initial.state;
  const text = input.text.trim().replace(/\s+/g, " ").slice(0, 300);
  const hits: TagHit[] = [];
  const helpful = /you/i.exec(text);
  const threat = /if/i.exec(text);
  if (helpful)
    hits.push({ tag: "NAME_FEELING", source: "rule", quote: helpful[0] });
  if (threat) hits.push({ tag: "THREAT", source: "rule", quote: threat[0] });
  const desiredDelta = helpful && !threat ? -10 : 10;
  const arousal = Math.max(0, Math.min(100, before.arousal + desiredDelta));
  const after: ChildState = {
    ...before,
    arousal,
    turn: before.turn + 1,
    lastHelpfulTags: helpful ? ["NAME_FEELING"] : [],
    lastDelta: arousal - before.arousal,
  };
  const result: TurnResult = {
    tags: hits.map((hit) => hit.tag),
    before,
    after,
    delta: after.lastDelta,
    outcome:
      arousal <= 25
        ? "calm_limit_held"
        : after.turn >= 8
          ? "out_of_turns"
          : "ongoing",
    effects: hits.map((hit) => ({
      tag: hit.tag,
      value: hit.tag === "THREAT" ? 10 : -10,
    })),
    notes: [],
  };
  const allResults = [...session.turns.map((turn) => turn.result), result];
  const score: Score | null =
    result.outcome === "ongoing"
      ? null
      : {
          outcome: result.outcome,
          stars: 1,
          points: 0,
          turnsToCalm: result.outcome === "calm_limit_held" ? after.turn : null,
          par: 3,
          clean: allResults.every((turn) => !turn.tags.includes("THREAT")),
          statedLimit: false,
          bribed: false,
          unhelpfulCount: allResults.filter((turn) =>
            turn.tags.includes("THREAT"),
          ).length,
          finalArousal: arousal,
          grid: allResults.map((turn) =>
            turn.tags.includes("THREAT")
              ? turn.tags.includes("NAME_FEELING")
                ? "mixed"
                : "bad"
              : turn.tags.length
                ? "good"
                : "bad",
          ),
          turningPoint: 0,
        };
  const response = TurnResponseSchema.parse({
    turnIndex: input.turnIndex,
    text,
    hits,
    result,
    child: { line: "I still want it.", action: "looks up" },
    tagging: "rules",
    score,
    daily: null,
    usedDoOver: session.usedDoOver,
  });
  session.turns.push(response);
  return response;
}

export function t0JoinWaitlist(
  email: string,
  plan: "monthly" | "yearly",
): void {
  memory.waitlist.set(email.toLowerCase(), {
    email,
    plan,
    at: new Date().toISOString(),
  });
}
