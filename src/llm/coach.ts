import type { ChildState, Scene } from "../engine/types";
import { completeJson, type JsonCompleter } from "./provider";
import { COACH_SYSTEM_PROMPT } from "./prompts";
import { CoachModelSchema, type CoachModelOutput } from "./schemas";
import { sceneContext, type Exchange } from "./turn";

export interface CoachModelInput {
  scene: Scene;
  state: ChildState;
  text: string;
  exchanges?: readonly Exchange[];
}
export async function proposeCoach(
  input: CoachModelInput,
  complete: JsonCompleter = completeJson,
): Promise<CoachModelOutput | null> {
  const response = await complete({
    system: COACH_SYSTEM_PROMPT,
    user: JSON.stringify({
      scene: sceneContext(input.scene),
      arousal: input.state.arousal,
      parentReply: input.text,
      exchanges: input.exchanges?.slice(-3) ?? [],
    }),
    schema: CoachModelSchema,
    maxOutputTokens: 650,
  });
  if (!response) return null;
  return {
    suggestions: response.suggestions.filter(
      ({ text }) => text.trim().split(/\s+/u).length <= 20,
    ),
  };
}
