import "server-only";
import { z } from "zod";
import { SCENES } from "@/engine/scenes";
import measuredPars from "../../content/par.json";
import { PublicSceneSchema } from "@/shared/api";
import type { PublicScene } from "@/engine/types";

export function getPublicScenes(): PublicScene[] {
  return z.array(PublicSceneSchema).parse(SCENES);
}
export function getScenePars(): Record<string, number> {
  return z.record(z.string(), z.number().int().positive()).parse(measuredPars);
}
export function getCatalog() {
  const pars = getScenePars();
  return getPublicScenes().map((scene) => ({
    scene,
    par: pars[scene.id] ?? null,
  }));
}
