import type { ChildLines } from "../engine/lines";
import type { ChildState, Scene, TagHit } from "../engine/types";
import { completeJson, type JsonCompleter } from "./provider";
import { TURN_SYSTEM_PROMPT } from "./prompts";
import { TurnModelSchema } from "./schemas";

export interface Exchange {
  parent: string;
  child: string | null;
}
export interface TurnModelInput {
  scene: Scene;
  state: ChildState;
  exchanges: readonly Exchange[];
  text: string;
}
export interface TurnProposal {
  tags: TagHit[];
  lines: ChildLines;
}
export function sceneContext(scene: Scene) {
  return {
    title: scene.title,
    place: scene.place,
    ageBand: scene.ageBand,
    temperament: scene.temperament,
    childName: scene.childName,
    setup: scene.setup,
    limit: scene.limit,
    wants: scene.wants,
  };
}
export async function proposeTurn(
  input: TurnModelInput,
  complete: JsonCompleter = completeJson,
): Promise<TurnProposal | null> {
  const response = await complete({
    system: TURN_SYSTEM_PROMPT,
    user: JSON.stringify({
      scene: sceneContext(input.scene),
      arousal: input.state.arousal,
      exchanges: input.exchanges.slice(-3),
      parentReply: input.text,
    }),
    schema: TurnModelSchema,
    maxOutputTokens: 1_000,
  });
  if (!response) return null;
  return {
    tags: response.tags.map(({ tag, quote }) => ({
      tag,
      quote,
      source: "model",
    })),
    lines: response.lines,
  };
}
