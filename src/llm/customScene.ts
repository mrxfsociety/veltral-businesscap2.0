import type { AgeBand } from "../engine/types";
import { completeJson, type JsonCompleter } from "./provider";
import { CUSTOM_SCENE_SYSTEM_PROMPT } from "./prompts";
import { CustomSceneModelSchema, type CustomSceneModelOutput } from "./schemas";

export interface CustomSceneModelInput {
  description: string;
  ageBand: AgeBand;
  childName?: string;
}

/** The name a custom scene uses when the parent gives none. */
export const DEFAULT_CHILD_NAME = "Sam";

type ModelScene = NonNullable<CustomSceneModelOutput["scene"]>;

/**
 * "Leaving For Grandma's House" → "Leaving for grandma's house". Only a title
 * the model wrote in Title Case is changed; the child's name, "I" and
 * all-caps words such as "TV" keep their capitals.
 */
export function sentenceCaseTitle(title: string, childName: string): string {
  const trimmed = title.trim().replace(/[.]+$/, "");
  const words = trimmed.split(/\s+/);
  const lettered = words.filter((word) => /^[A-Za-z]/.test(word));
  const titleCase =
    lettered.length >= 2 && lettered.every((word) => /^[A-Z]/.test(word));
  if (!titleCase) return trimmed;
  return words
    .map((word, index) => {
      if (index === 0) return word;
      const bare = word.replace(/[^A-Za-z']/g, "");
      if (bare === childName || bare === "I" || /^[A-Z]{2,}$/.test(bare))
        return word;
      return word.toLowerCase();
    })
    .join(" ");
}

const GENERIC_CHILD =
  /^(?:a|an|the|your|our)\s+(?:(?:fictional|young|little|small|upset|tired|\d+-year-old)\s+)*(?:child|kid|toddler|preschooler|boy|girl|son|daughter)\b/i;

/**
 * The setup is read by the parent about their own child, so it names the
 * child: "A fictional young child is watching cartoons" → "Sam is watching
 * cartoons". The prompt asks for this; this catches the model forgetting.
 */
export function namedSetup(setup: string, childName: string): string {
  return setup
    .trim()
    .replace(GENERIC_CHILD, childName)
    .replace(/\bfictional\s+/gi, "");
}

function tidyScene(scene: ModelScene, childName: string): ModelScene {
  return {
    ...scene,
    title: sentenceCaseTitle(scene.title, childName),
    setup: namedSetup(scene.setup, childName),
  };
}

export async function proposeCustomScene(
  input: CustomSceneModelInput,
  complete: JsonCompleter = completeJson,
): Promise<CustomSceneModelOutput | null> {
  // The model needs the name the scene will use, or it writes "a child".
  const childName = input.childName?.trim() || DEFAULT_CHILD_NAME;
  const response = await complete({
    system: CUSTOM_SCENE_SYSTEM_PROMPT,
    user: JSON.stringify({ ...input, childName }),
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
  return response.scene
    ? { ...response, scene: tidyScene(response.scene, childName) }
    : response;
}
