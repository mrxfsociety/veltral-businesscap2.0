import { writeFile } from "node:fs/promises";
import { parFor } from "../src/engine/par";
import { SCENES } from "../src/engine/scenes";

async function main() {
  const values = Object.fromEntries(
    SCENES.map((scene) => [scene.id, parFor(scene)]),
  );
  await writeFile("content/par.json", `${JSON.stringify(values, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(values, null, 2)}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Par generation failed"}\n`,
  );
  process.exitCode = 1;
});
