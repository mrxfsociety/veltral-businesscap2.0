import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const labeled = readFileSync("eval/labeled.jsonl", "utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line) as { id: string; text: string });
function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? sources(path)
      : /\.[cm]?[jt]sx?$/.test(path)
        ? [path]
        : [];
  });
}
const collisions = sources("src").flatMap((path) => {
  const source = readFileSync(path, "utf8");
  return labeled
    .filter(({ text }) => text.trim().length >= 4 && source.includes(text))
    .map(({ id }) => ({ id, path }));
});
const baseline = execFileSync(
  "git",
  ["show", "origin/t0-foundation:eval/labeled.jsonl"],
  { encoding: "utf8" },
);
if (baseline !== readFileSync("eval/labeled.jsonl", "utf8"))
  throw new Error("Evaluation labels changed from the supplied foundation.");
if (collisions.length) {
  process.stderr.write(JSON.stringify(collisions, null, 2) + "\n");
  process.exitCode = 1;
} else
  process.stdout.write(
    "PASS: evaluation labels unchanged; no full evaluation reply of 4+ characters occurs in src.\n",
  );
