import { randomUUID, timingSafeEqual } from "node:crypto";
import { applyTurn } from "../engine/transition";
import {
  dayKey,
  dayNumber,
  sceneOfTheDay,
  getScene,
  SceneSchema,
} from "../engine/scenes";
import { parFor } from "../engine/par";
import { mergeTags } from "../engine/merge";
import { ruleTags } from "../engine/rules";
import { tipFor } from "../engine/lines";
import { HELPFUL, TAGS } from "../engine/tags";
import type { Scene, PublicScene, TagHit } from "../engine/types";
import { DEFAULT_CHILD_NAME, proposeCustomScene } from "../llm/customScene";
import { proposeCoach } from "../llm/coach";
import type { JsonCompleter } from "../llm/provider";
import {
  CustomSceneRequestSchema,
  CustomSceneResponseSchema,
  CoachRequestSchema,
  CoachResponseSchema,
  DailyResponseSchema,
  WaitlistRequestSchema,
  WaitlistResponseSchema,
  HealthResponseSchema,
  AdminStatsRequestSchema,
  AdminStatsSchema,
} from "../shared/api";
import { ApiError, enforceRateLimit, json, readJson, route } from "./http";
import { createSessionStore } from "./sessionStore";
import { getStorage, type Storage } from "./redis";
import { getDailyPlayers } from "./daily";
import { addToWaitlist } from "./waitlist";
import { getStats } from "./stats";
import { getEnv } from "./env";

export const UNSAFE_MESSAGE =
  "Let's pause here. This is a practice space, and that reply described hurting or degrading a child, so the scene stops. If moments like this feel close to real life, you are not alone, and talking to someone helps. National Parent & Youth Helpline: call or text 1-855-427-2736, any time. In a mental health crisis, call or text 988.";
function publicScene(scene: Scene): PublicScene {
  const {
    limitHints: _limitHints,
    giveInHints: _giveInHints,
    ...visible
  } = scene;
  void _limitHints;
  void _giveInHints;
  return visible;
}
function cleanHints(hints: string[]) {
  return [
    ...new Set(
      hints
        .map((hint) => hint.trim().toLowerCase().replace(/\s+/g, " "))
        .filter((hint) => hint.length >= 4),
    ),
  ].slice(0, 6);
}
function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createFeatureHandlers(
  options: { storage?: Storage; complete?: JsonCompleter } = {},
) {
  const storage = () => options.storage ?? getStorage();
  const sessions = () => createSessionStore(storage());
  return {
    customScene: route(async (request) => {
      await enforceRateLimit(request, "custom-scene", storage());
      const input = await readJson(request, CustomSceneRequestSchema);
      const safetyScene = getScene("store-candy")!;
      if (
        ruleTags(input.description, safetyScene).some(
          (hit) => hit.tag === "UNSAFE",
        )
      )
        return json(
          { ok: false, reason: "unsafe", message: UNSAFE_MESSAGE },
          CustomSceneResponseSchema,
        );
      const generated = await proposeCustomScene(input, options.complete);
      if (!generated)
        return json(
          {
            ok: false,
            reason: "model_unavailable",
            message:
              "The scene builder is unavailable. Please choose a scene from the library.",
          },
          CustomSceneResponseSchema,
        );
      if (generated.refusal === "unsafe")
        return json(
          { ok: false, reason: "unsafe", message: UNSAFE_MESSAGE },
          CustomSceneResponseSchema,
        );
      if (!generated.ok || !generated.scene || generated.refusal)
        return json(
          {
            ok: false,
            reason: "not_a_meltdown",
            message:
              "Tell us about a moment when your child was upset and you had to hold a limit.",
          },
          CustomSceneResponseSchema,
        );
      const limitHints = cleanHints(generated.scene.limitHints);
      const giveInHints = cleanHints(generated.scene.giveInHints);
      const displayedLimit = cleanHints([generated.scene.limit])[0];
      // Insufficient grounded hints cannot be invented safely by the server.
      if (!displayedLimit || limitHints.length < 3 || giveInHints.length < 3)
        return json(
          {
            ok: false,
            reason: "model_unavailable",
            message:
              "We couldn't make a reliable scene. Please try another description or the library.",
          },
          CustomSceneResponseSchema,
        );
      // The boundary shown to the player must also work when the model is down.
      const groundedLimitHints = limitHints.some((hint) =>
        displayedLimit.includes(hint),
      )
        ? limitHints
        : cleanHints([displayedLimit, ...limitHints]);
      const scene = SceneSchema.parse({
        ...generated.scene,
        id: `custom-${randomUUID()}`,
        ageBand: input.ageBand,
        childName: input.childName || DEFAULT_CHILD_NAME,
        startArousal: Math.round(
          Math.max(60, Math.min(90, generated.scene.startArousal)),
        ),
        limitHints: groundedLimitHints,
        giveInHints,
      });
      await sessions().saveCustomScene(scene);
      return json(
        { ok: true, sceneId: scene.id, scene: publicScene(scene) },
        CustomSceneResponseSchema,
      );
    }),
    coach: route(async (request) => {
      await enforceRateLimit(request, "coach", storage());
      const input = await readJson(request, CoachRequestSchema);
      const session = await sessions().getSession(input.sessionId);
      if (!session)
        throw new ApiError(
          404,
          "session_expired",
          "This session has expired. Start a new scene.",
        );
      const turn = session.turns[input.turnIndex];
      if (!turn)
        throw new ApiError(
          409,
          "turn_out_of_order",
          "That turn is not available.",
        );
      if (session.turns.at(-1)?.result.outcome === "ongoing")
        throw new ApiError(
          409,
          "session_not_ended",
          "Finish the scene before asking the coach.",
        );
      if (session.turns.at(-1)?.result.outcome === "stopped_unsafe")
        return json(
          { source: "tips", suggestions: [], tip: null },
          CoachResponseSchema,
        );
      const proposed = await proposeCoach(
        {
          scene: session.scene,
          state: turn.result.before,
          text: turn.text,
          exchanges: session.turns
            .slice(Math.max(0, input.turnIndex - 3), input.turnIndex)
            .map((item) => ({
              parent: item.text,
              child: item.child?.line ?? null,
            })),
        },
        options.complete,
      );
      const suggestions = (proposed?.suggestions ?? [])
        .flatMap((candidate) => {
          if (candidate.text.trim().split(/\s+/).length > 20) return [];
          const rules = ruleTags(candidate.text, session.scene);
          if (rules.some((hit) => !HELPFUL.includes(hit.tag))) return [];
          const models: TagHit[] = candidate.tags.map((hit) => ({
            ...hit,
            source: "model",
          }));

          // Every supplied quote must be verified, not merely ignored on failure.
          if (
            models.some(
              (hit) => mergeTags([], [hit], candidate.text).length !== 1,
            )
          )
            return [];
          const hits = mergeTags(rules, models, candidate.text);
          if (hits.some((hit) => !HELPFUL.includes(hit.tag))) return [];
          const result = applyTurn(
            session.scene,
            turn.result.before,
            hits.map((hit) => hit.tag),
          );
          return result.delta < 0
            ? [{ text: candidate.text, tags: result.tags, delta: result.delta }]
            : [];
        })
        .slice(0, 3);
      if (suggestions.length)
        return json(
          { source: "model", suggestions, tip: null },
          CoachResponseSchema,
        );
      const worst = [...turn.result.tags]
        .filter((tag) => !HELPFUL.includes(tag) && tag !== "UNSAFE")
        .sort(
          (a, b) =>
            (turn.result.effects.find((effect) => effect.tag === b)?.value ??
              0) -
              (turn.result.effects.find((effect) => effect.tag === a)?.value ??
                0) || TAGS.indexOf(a) - TAGS.indexOf(b),
        )[0];
      return json(
        {
          source: "tips",
          suggestions: [],
          tip: worst ? tipFor(worst, session.scene) : null,
        },
        CoachResponseSchema,
      );
    }),
    daily: route(async () => {
      const date = dayKey(new Date(storage().now()));
      const scene = sceneOfTheDay(date);
      return json(
        {
          dayKey: date,
          dayNumber: dayNumber(date),
          sceneId: scene.id,
          title: scene.title,
          par: parFor(scene),
          players: await getDailyPlayers(date, scene.id, storage()),
        },
        DailyResponseSchema,
      );
    }),
    waitlist: route(async (request) => {
      await enforceRateLimit(request, "waitlist", storage());
      await addToWaitlist(
        await readJson(request, WaitlistRequestSchema),
        storage(),
      );
      return json({ ok: true }, WaitlistResponseSchema);
    }),
    health: route(async () => {
      const env = getEnv();
      return json(
        {
          ok: true,
          commit: env.GIT_SHA,
          time: new Date(storage().now()).toISOString(),
          redis: await storage().mode(),
          providers: {
            openai: Boolean(env.OPENAI_API_KEY && env.OPENAI_MODEL),
            anthropic: Boolean(env.ANTHROPIC_API_KEY && env.ANTHROPIC_MODEL),
          },
          proPreview: env.NEXT_PUBLIC_PRO_PREVIEW,
        },
        HealthResponseSchema,
      );
    }),
    adminStats: route(async (request) => {
      const parsed = AdminStatsRequestSchema.safeParse(
        Object.fromEntries(new URL(request.url).searchParams),
      );
      const secret = getEnv().ADMIN_KEY;
      if (!secret || !parsed.success || !safeEqual(secret, parsed.data.key))
        throw new ApiError(404, "not_found", "Not found.");
      return json(await getStats(undefined, storage()), AdminStatsSchema);
    }),
  };
}
