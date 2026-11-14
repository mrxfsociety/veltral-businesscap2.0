import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import scenes from "../../content/scenes.json";
import reference from "../../docs/reference/vectors.json";
import { PublicSceneSchema } from "@/shared/api";
import type { PublicScene } from "@/engine/types";

export function getPublicScenes(): PublicScene[] { return z.array(PublicSceneSchema).parse(scenes); }
export function getScenePars(): Record<string, number> {
  try { return z.record(z.string(), z.number().int().positive()).parse(JSON.parse(readFileSync(join(process.cwd(), "content/par.json"), "utf8"))); }
  catch { return reference.par; }
}
export function getCatalog() { const pars = getScenePars(); return getPublicScenes().map((scene) => ({ scene, par: pars[scene.id] ?? null })); }
