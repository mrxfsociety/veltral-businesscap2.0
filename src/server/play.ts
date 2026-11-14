import parData from "../../content/par.json";
import {
  ruleTags,
  mergeTags,
  initialState,
  applyTurn,
  scoreSession,
  parFor,
  dayKey,
  dayNumber,
  sceneOfTheDay,
  getScene,
  pickChildLine,
} from "../engine";
import type { PublicScene, Scene } from "../engine/types";
import { proposeTurn, type TurnProposal } from "../llm/turn";
import type { JsonCompleter } from "../llm/provider";
import {
  SessionRequestSchema,
  SessionResponseSchema,
  TurnRequestSchema,
  TurnResponseSchema,
  type TurnResponse,
} from "../shared/api";
import { recordDaily } from "./daily";
import { ApiError, enforceRateLimit, json, readJson, route } from "./http";
import { getStorage, type Storage } from "./redis";
import { createSessionStore, type StoredTurn } from "./sessionStore";
import { incrementStat } from "./stats";

export interface PlayDependencies {
  storage?: Storage;
  complete?: JsonCompleter;
}

function publicScene(scene: Scene): PublicScene {
  return {
    id: scene.id,
    title: scene.title,
    place: scene.place,
    ageBand: scene.ageBand,
    childName: scene.childName,
    setup: scene.setup,
    openingLine: scene.openingLine,
    openingAction: scene.openingAction,
    limit: scene.limit,
    wants: scene.wants,
    startArousal: scene.startArousal,
    temperament: scene.temperament,
  };
}

export function createPlayHandlers(dependencies: PlayDependencies = {}) {
  const storage = dependencies.storage ?? getStorage();
  const sessions = createSessionStore(storage);

  const session = route(async (request) => {
    const input = await readJson(request, SessionRequestSchema);
    const today = dayKey(new Date(storage.now()));
    const scene =
      input.kind === "daily"
        ? sceneOfTheDay(today)
        : input.kind === "custom"
          ? await sessions.getCustomScene(input.sceneId ?? "")
          : getScene(input.sceneId ?? "");
    if (!scene)
      throw new ApiError(
        404,
        "session_expired",
        "This scene is unavailable or has expired. Please choose another scene.",
      );
    const par =
      scene.id in parData
        ? parData[scene.id as keyof typeof parData]
        : parFor(scene);
    const stored = await sessions.createSession({
      scene,
      kind: input.kind,
      dayKey: today,
      par,
      practice: input.practice,
    });
    await incrementStat("sessionsStarted", storage);
    return json(
      {
        sessionId: stored.id,
        kind: stored.kind,
        scene: publicScene(scene),
        state: initialState(scene),
        par,
        maxTurns: 8 as const,
        dayKey: today,
        dayNumber: dayNumber(today),
      },
      SessionResponseSchema,
    );
  });

  const turn = route(async (request) => {
    const input = await readJson(request, TurnRequestSchema, (value) => {
      if (typeof value !== "object" || value === null || Array.isArray(value))
        return value;
      const fields = value as Record<string, unknown>;
      return {
        ...fields,
        text:
          typeof fields.text === "string"
            ? fields.text.trim().replace(/\s+/g, " ").slice(0, 300)
            : fields.text,
      };
    });
    await enforceRateLimit(request, "turn", storage);
    return sessions.withSessionLock(input.sessionId, async () => {
      const stored = await sessions.getSession(input.sessionId);
      if (!stored)
        throw new ApiError(
          404,
          "session_expired",
          "This practice session has expired. Please start a new scene.",
        );
      if (input.turnIndex > stored.turns.length) {
        throw new ApiError(
          409,
          "turn_out_of_order",
          "That turn is ahead of the session. Please try the current turn again.",
        );
      }
      if (input.turnIndex < stored.turns.length) {
        stored.turns = stored.turns.slice(0, input.turnIndex);
        stored.usedDoOver = true;
      }
      const previous = stored.turns.at(-1);
      if (previous && previous.result.outcome !== "ongoing") {
        throw new ApiError(
          409,
          "session_ended",
          "This scene has finished. Try a do-over or start a new scene.",
        );
      }
      const text = input.text;
      const before = previous?.result.after ?? initialState(stored.scene);
      const ruleHits = ruleTags(text, stored.scene, {
        loud: input.loud,
        timedOut: input.timedOut,
      });
      let proposal: TurnProposal | null = null;
      if (
        !ruleHits.some(
          (hit) => hit.tag === "NO_RESPONSE" || hit.tag === "UNSAFE",
        )
      ) {
        try {
          proposal = await proposeTurn(
            {
              scene: stored.scene,
              state: before,
              text,
              exchanges: stored.turns.map((item) => ({
                parent: item.text,
                child: item.child?.line ?? null,
              })),
            },
            dependencies.complete,
          );
        } catch {
          // Play continues through the deterministic engine if model infrastructure fails.
        }
      }
      const hits = mergeTags(ruleHits, proposal?.tags ?? [], text);
      const result = applyTurn(
        stored.scene,
        before,
        hits.map((hit) => hit.tag),
      );
      const child = pickChildLine(
        proposal?.lines ?? null,
        stored.scene,
        result,
        `${stored.id}:${input.turnIndex}`,
      );
      const tagging = hits.some(
        (hit) => hit.source === "model" || hit.source === "both",
      )
        ? "model"
        : "rules";
      if (tagging === "rules") await incrementStat("rulesFallbacks", storage);
      const results = [...stored.turns.map((item) => item.result), result];
      const score =
        result.outcome === "ongoing" || result.outcome === "stopped_unsafe"
          ? null
          : scoreSession(stored.scene, results, stored.par);
      const response: TurnResponse = {
        turnIndex: input.turnIndex,
        text,
        hits,
        result,
        child,
        tagging,
        score,
        daily: null,
        usedDoOver: stored.usedDoOver,
      };
      const savedTurn: StoredTurn = {
        ...response,
        inputMode: input.inputMode,
        loud: input.loud,
        timedOut: input.timedOut,
      };
      stored.turns.push(savedTurn);
      if (result.outcome !== "ongoing" && !stored.finishedCounted) {
        await incrementStat("sessionsFinished", storage);
        stored.finishedCounted = true;
      }
      if (score)
        response.daily = await recordDaily(stored, score.points, storage);
      savedTurn.daily = response.daily;
      await sessions.saveSession(stored);
      return json(response, TurnResponseSchema);
    });
  });

  return { session, turn };
}
