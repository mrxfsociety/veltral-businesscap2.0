import type { AgeBand } from "../engine/types";
import { completeJson, type JsonCompleter } from "./provider";
import { CUSTOM_SCENE_SYSTEM_PROMPT } from "./prompts";
import { CustomSceneModelSchema, type CustomSceneModelOutput } from "./schemas";

export interface CustomSceneModelInput {
  description: string;
  ageBand: AgeBand;
  childName?: string;
}
export async function proposeCustomScene(
  input: CustomSceneModelInput,
  complete: JsonCompleter = completeJson,
): Promise<CustomSceneModelOutput | null> {
  const response = await complete({
    system: CUSTOM_SCENE_SYSTEM_PROMPT,
    user: JSON.stringify(input),
    schema: CustomSceneModelSchema,
    maxOutputTokens: 1_000,
  });
  if (!response) return null;
  if (
    response.ok
      ? response.refusal !== null || response.scene === null
      : response.refusal === null || response.scene !== null
  )
    return null;
  return response;
}
