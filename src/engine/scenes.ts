import { z } from "zod";
import sceneData from "../../content/scenes.json";
import type { Scene } from "./types";

export const SceneSchema: z.ZodType<Scene> = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  place: z.string().min(1),
  ageBand: z.enum(["2-3", "4-5", "6-7"]),
  childName: z.string().min(1),
  setup: z.string().min(1),
  openingLine: z.string().min(1),
  openingAction: z.string(),
  limit: z.string().min(1),
  wants: z.string().min(1),
  startArousal: z.number().int().min(60).max(90),
  temperament: z.enum(["easygoing", "sensitive", "spirited"]),
  limitHints: z
    .array(
      z
        .string()
        .min(4)
        .refine(
          (hint) => hint === hint.toLowerCase(),
          "Hints must be lowercase",
        ),
    )
    .min(3),
  giveInHints: z
    .array(
      z
        .string()
        .min(4)
        .refine(
          (hint) => hint === hint.toLowerCase(),
          "Hints must be lowercase",
        ),
    )
    .min(3),
});

export const SCENES: readonly Scene[] = z
  .array(SceneSchema)
  .length(12)
  .parse(sceneData);
export const scenes = SCENES;
export const DAILY_ROTATION = [
  "store-candy",
  "playground-leave",
  "bedtime",
  "wrong-cup",
  "tablet-off",
  "dinner-refusal",
  "car-seat",
  "getting-dressed",
  "hit-brother",
  "bath-time",
  "sharing-toy",
  "leaving-party",
] as const;
const sceneMap = new Map(SCENES.map((scene) => [scene.id, scene]));
if (
  sceneMap.size !== SCENES.length ||
  DAILY_ROTATION.some((id) => !sceneMap.has(id))
) {
  throw new Error(
    "Scene identifiers must be unique and cover the daily rotation",
  );
}
const DAY_MS = 86_400_000;
const EPOCH = Date.UTC(2026, 10, 14);
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getScene(id: string): Scene | undefined {
  return sceneMap.get(id);
}

export function dayKey(now: Date): string {
  const parts = dateFormatter.formatToParts(now);
  const part = (name: string) =>
    parts.find((item) => item.type === name)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function dayNumber(key: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key))
    throw new RangeError("Expected a YYYY-MM-DD day key");
  const date = new Date(`${key}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== key
  ) {
    throw new RangeError("Invalid calendar day");
  }
  return Math.floor((date.getTime() - EPOCH) / DAY_MS) + 1;
}

export function sceneOfTheDay(key: string): Scene {
  const index =
    (((dayNumber(key) - 1) % DAILY_ROTATION.length) + DAILY_ROTATION.length) %
    DAILY_ROTATION.length;
  const scene = sceneMap.get(DAILY_ROTATION[index]);
  if (!scene) throw new Error("Daily scene is missing");
  return scene;
}
