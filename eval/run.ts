import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";
import { getScene } from "../src/engine/scenes";
import { initialState } from "../src/engine/transition";
import { ruleTags } from "../src/engine/rules";
import { mergeTags } from "../src/engine/merge";
import {
  calculateMetrics,
  evaluationGates,
  type EvaluationMode,
  type EvaluationResults,
  type LabeledReply,
  type Prediction,
} from "./metrics";
import { modelReport } from "./report";
import type { ProviderName } from "../src/llm/provider";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
function argument(name: string): string | undefined {
  const inline = process.argv.find((value) => value.startsWith(`${name}=`));
  if (inline !== undefined) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--"))
    throw new Error(`${name} requires a value.`);
  return value;
}
function predictionPath(value: string): string {
  const output = resolve(root, value);
  const insideWork = relative(resolve(root, "work"), output);
  const repositoryWork =
    insideWork !== "" &&
    insideWork !== ".." &&
    !insideWork.startsWith(`..${sep}`) &&
    !isAbsolute(insideWork);
  const workspaceWork =
    basename(dirname(root)) === "work" && dirname(output) === dirname(root);
  if ((!repositoryWork && !workspaceWork) || !output.endsWith(".json"))
    throw new Error(
      "Prediction output must be a .json file under repository work/ or directly in the surrounding workspace work directory.",
    );
  return output;
}

async function readResults(rows: LabeledReply[]): Promise<EvaluationResults> {
  try {
    const prior: unknown = JSON.parse(
      await readFile(resolve(root, "eval/results.json"), "utf8"),
    );
    if (
      typeof prior === "object" &&
      prior !== null &&
      "schemaVersion" in prior &&
      prior.schemaVersion === 1
    )
      return prior as EvaluationResults;
  } catch {
    /* The first run creates the report. */
  }
  return {
    schemaVersion: 1,
    dataset: {
      count: rows.length,
      dev: rows.filter((row) => row.split === "dev").length,
      test: rows.filter((row) => row.split === "test").length,
      labelsReviewedByHuman: false,
    },
    rules: null,
    merged: null,
    bakeoff: {},
  };
}
async function writeResults(results: EvaluationResults): Promise<void> {
  await writeFile(
    resolve(root, "eval/results.json"),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  await writeFile(resolve(root, "docs/MODEL.md"), modelReport(results));
}
async function main(): Promise<void> {
  const rows = (await readFile(resolve(root, "eval/labeled.jsonl"), "utf8"))
    .trim()
    .split(/\r?\n/u)
    .map((line) => JSON.parse(line) as LabeledReply);
  const modelMode = process.argv.includes("--model");
  const devOnly = process.argv.includes("--dev-only");
  const selected = devOnly ? rows.filter((row) => row.split === "dev") : rows;
  const timeoutArgument = argument("--timeout-ms");
  const requestTimeoutMs =
    timeoutArgument === undefined ? undefined : Number(timeoutArgument);
  if (
    requestTimeoutMs !== undefined &&
    (!Number.isSafeInteger(requestTimeoutMs) ||
      requestTimeoutMs < 1 ||
      requestTimeoutMs > 120_000)
  )
    throw new Error("--timeout-ms must be an integer from 1 to 120000.");
  if (requestTimeoutMs !== undefined && !modelMode)
    throw new Error(
      "--timeout-ms is for live accuracy evaluation only; add --model.",
    );
  const predictionsArgument = argument("--predictions-output");
  const predictionsOutput =
    predictionsArgument === undefined
      ? undefined
      : predictionPath(predictionsArgument);

  const providerArgument = process.argv
    .find((value) => value.startsWith("--provider="))
    ?.slice("--provider=".length);
  if (
    providerArgument !== undefined &&
    providerArgument !== "openai" &&
    providerArgument !== "anthropic"
  )
    throw new Error("Provider must be openai or anthropic.");
  const providerFlag: ProviderName | undefined = providerArgument;
  if (providerFlag && !devOnly)
    throw new Error("Provider bake-off is restricted to --dev-only.");
  if (modelMode && requestTimeoutMs !== undefined)
    process.stdout.write(
      `Accuracy evaluation deadline: ${requestTimeoutMs} ms per provider attempt. Production deadlines and full-handler latency measurements are unchanged.\n`,
    );
  const predictions: Prediction[] = [];
  const usedProviders = new Set<string>();
  const usedModels = new Set<string>();
  let propose: ((row: LabeledReply) => Promise<Prediction>) | undefined;
  if (modelMode) {
    const [
      { createProviderChain },
      { createOpenAIProvider },
      { createAnthropicProvider },
      { proposeTurn },
    ] = await Promise.all([
      import("../src/llm/provider"),
      import("../src/llm/openai"),
      import("../src/llm/anthropic"),
      import("../src/llm/turn"),
    ]);
    const { getEnv } = await import("../src/server/env");
    const {
      OPENAI_API_KEY,
      OPENAI_MODEL,
      OPENAI_REASONING_EFFORT,
      ANTHROPIC_API_KEY,
      ANTHROPIC_MODEL,
      LLM_PRIMARY,
    } = getEnv();
    const openai =
      OPENAI_API_KEY &&
      OPENAI_MODEL &&
      (!providerFlag || providerFlag === "openai")
        ? createOpenAIProvider(
            OPENAI_API_KEY,
            OPENAI_MODEL,
            undefined,
            OPENAI_REASONING_EFFORT,
          )
        : undefined;
    const anthropic =
      ANTHROPIC_API_KEY &&
      ANTHROPIC_MODEL &&
      (!providerFlag || providerFlag === "anthropic")
        ? createAnthropicProvider(ANTHROPIC_API_KEY, ANTHROPIC_MODEL)
        : undefined;
    if (!openai && !anthropic)
      throw new Error(
        "Live evaluation requires a configured provider API key AND model ID. Existing results were not overwritten.",
      );
    const { reserveModelCall } = await import("../src/server/stats");
    const complete = createProviderChain({
      providers: {
        ...(openai ? { openai } : {}),
        ...(anthropic ? { anthropic } : {}),
      },
      primary: providerFlag ?? LLM_PRIMARY,
      reserveCall: reserveModelCall,
      ...(requestTimeoutMs === undefined
        ? {}
        : { timeouts: [requestTimeoutMs, requestTimeoutMs] as const }),
      onAttempt: (attempt) => {
        if (attempt.success) {
          usedProviders.add(attempt.provider);
          usedModels.add(attempt.model);
        }
      },
    });
    propose = async (row) => {
      const scene = getScene(row.sceneId);
      if (!scene) throw new Error(`Unknown scene for ${row.id}.`);
      const rules = ruleTags(row.text, scene, row);
      if (
        rules.some((hit) => hit.tag === "NO_RESPONSE" || hit.tag === "UNSAFE")
      )
        return {
          id: row.id,
          tags: mergeTags(rules, [], row.text).map((hit) => hit.tag),
        };
      const started = performance.now();
      const proposal = await proposeTurn(
        { scene, state: initialState(scene), exchanges: [], text: row.text },
        complete,
      );
      if (!proposal)
        throw new Error(
          `Live model evaluation failed at ${row.id}; no rules fallback is disguised as a model measurement. Existing results were not overwritten.`,
        );
      return {
        id: row.id,
        tags: mergeTags(rules, proposal.tags, row.text).map((hit) => hit.tag),
        latencyMs: performance.now() - started,
      };
    };
  }
  for (const row of selected) {
    if (propose) predictions.push(await propose(row));
    else {
      const scene = getScene(row.sceneId);
      if (!scene) throw new Error(`Unknown scene for ${row.id}.`);
      predictions.push({
        id: row.id,
        tags: mergeTags(ruleTags(row.text, scene, row), [], row.text).map(
          (hit) => hit.tag,
        ),
      });
    }
  }
  const gates = evaluationGates(selected, predictions);
  const provider = modelMode ? [...usedProviders].sort().join(" + ") : "rules";
  const model = modelMode
    ? [...usedModels].sort().join(" + ")
    : "deterministic";
  const date = new Date().toISOString();
  if (predictionsOutput) {
    if (predictions.length !== selected.length || !gates.complete)
      throw new Error("Refusing to save incomplete predictions.");
    await mkdir(dirname(predictionsOutput), { recursive: true });
    await writeFile(
      predictionsOutput,
      `${JSON.stringify({ schemaVersion: 1, date, mode: modelMode ? "merged" : "rules", split: devOnly ? "dev" : "all", provider, model, ...(requestTimeoutMs === undefined ? {} : { requestTimeoutMs }), predictions }, null, 2)}\n`,
    );
    process.stdout.write(
      `Saved ${predictions.length} completed predictions to the work directory.\n`,
    );
  }

  const dev = calculateMetrics(
    selected.filter((row) => row.split === "dev"),
    predictions,
  );
  if (devOnly && !modelMode) {
    const mismatch = selected.flatMap((row) => {
      const actual = predictions.find((item) => item.id === row.id)?.tags ?? [];
      return actual.length === row.tags.length &&
        row.tags.every((tag) => actual.includes(tag))
        ? []
        : [{ id: row.id, expected: row.tags, predicted: actual }];
    });
    process.stdout.write(
      `${JSON.stringify({ dev, gates, mismatch }, null, 2)}\n`,
    );
    if (!Object.values(gates).every(Boolean)) process.exitCode = 1;
    return;
  }
  const results = await readResults(rows);
  if (devOnly) {
    results.bakeoff[providerFlag ?? provider] = {
      date,
      provider,
      model,
      dev,
      ...(requestTimeoutMs === undefined ? {} : { requestTimeoutMs }),
    };
    await writeResults(results);
    process.stdout.write(
      `Dev bake-off ${provider}/${model}: ${dev.count} replies; micro-F1 ${dev.microF1.toFixed(4)}; median ${dev.medianLatencyMs?.toFixed(1) ?? "unmeasured"} ms.\n`,
    );
    return;
  }
  const test = calculateMetrics(
    selected.filter((row) => row.split === "test"),
    predictions,
  );
  const mode: EvaluationMode = {
    status: "measured",
    date,
    provider,
    model,
    ...(requestTimeoutMs === undefined ? {} : { requestTimeoutMs }),
    dev,
    test,
    gates,
  };
  if (modelMode) results.merged = mode;
  else results.rules = mode;
  await writeResults(results);
  process.stdout.write(
    `${modelMode ? "Merged" : "Rules"} evaluation: ${rows.length} replies (${dev.count} dev / ${test.count} test).\nTest micro-F1 ${test.microF1.toFixed(4)}; exact-set match ${test.exactSetMatch.toFixed(4)}; unhelpful precision ${test.unhelpfulPrecision.toFixed(4)}.\n${Object.entries(
      gates,
    )
      .map(([name, passed]) => `${name}: ${passed ? "PASS" : "FAIL"}`)
      .join("\n")}\n`,
  );
  if (!Object.values(gates).every(Boolean)) process.exitCode = 1;
}
main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Evaluation failed."}\n`,
  );
  process.exitCode = 1;
});
