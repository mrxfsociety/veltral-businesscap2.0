import templatesData from "../../content/templates.json";
import tipsData from "../../content/tips.json";
import type { AgeBand, Scene, Tag, TurnResult } from "./types";

export interface ChildLine {
  line: string;
  action: string;
}
export interface ChildLines {
  calmer: ChildLine;
  same: ChildLine;
  angrier: ChildLine;
  resolved: ChildLine;
  gotIt: ChildLine;
}

type Variant = keyof ChildLines;
const templates: Record<AgeBand, Record<Variant, ChildLine[]>> = templatesData;

export interface FilledTip {
  tag: Tag;
  why: string;
  tryInstead: string;
}

function fillSlots(text: string, scene: Scene): string {
  return text.replace(
    /\{(wants|childName|limit)\}/g,
    (_match, key: "wants" | "childName" | "limit") => scene[key],
  );
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

function isPlainText(text: string): boolean {
  const url =
    /\b[a-z][a-z\d+.-]*:\/\/|\b(?:www\.|mailto:|javascript:|data:)|\b[a-z\d-]+(?:\.[a-z\d-]+)*\.[a-z]{2,}(?:\b|\/)/i;
  const markup =
    /[<>`\[\]]|\*{1,2}[^*]+\*{1,2}|_{1,2}[^_]+_{1,2}|(?:^|\n)\s*(?:#{1,6}\s|[-*+]\s)|&(?:lt|gt|#\d+|#x[\da-f]+);/i;
  return !url.test(text) && !markup.test(text);
}

function isValidLine(candidate: unknown): candidate is ChildLine {
  if (typeof candidate !== "object" || candidate === null) return false;
  const value = candidate as Record<string, unknown>;
  return (
    typeof value.line === "string" &&
    value.line.trim().length > 0 &&
    value.line.length <= 120 &&
    isPlainText(value.line) &&
    typeof value.action === "string" &&
    value.action.length <= 80 &&
    isPlainText(value.action)
  );
}

function variantFor(result: TurnResult): Variant {
  if (result.outcome === "calm_gave_in") return "gotIt";
  if (result.outcome === "calm_limit_held") return "resolved";
  if (result.delta <= -4) return "calmer";
  if (result.delta >= 4) return "angrier";
  return "same";
}

function templateFor(variant: Variant, scene: Scene, seed: string): ChildLine {
  const candidates = templates[scene.ageBand][variant]
    .map(({ line, action }) => ({
      line: fillSlots(line, scene),
      action: fillSlots(action, scene),
    }))
    .filter(isValidLine);
  const candidate = candidates[hashSeed(seed) % candidates.length];
  if (!candidate) throw new Error("No valid child-line template is available.");
  return candidate;
}

/** The engine's outcome and delta, never the model, choose the spoken variant. */
export function pickChildLine(
  lines: ChildLines | null,
  scene: Scene,
  result: TurnResult,
  seed: string,
): ChildLine | null {
  if (result.outcome === "stopped_unsafe") return null;
  const variant = variantFor(result);
  const proposed = lines?.[variant];
  const chosen = isValidLine(proposed)
    ? proposed
    : templateFor(variant, scene, seed);
  return {
    line: result.after.arousal >= 80 ? chosen.line.toUpperCase() : chosen.line,
    action: chosen.action,
  };
}

/** Fixed explanatory fallback; these tips are not model-validated coach suggestions. */
export function tipFor(tag: Tag, scene: Scene): FilledTip | null {
  if (!Object.prototype.hasOwnProperty.call(tipsData, tag)) return null;
  const tip = tipsData[tag as keyof typeof tipsData];
  return {
    tag,
    why: fillSlots(tip.why, scene),
    tryInstead: fillSlots(tip.tryInstead, scene),
  };
}
