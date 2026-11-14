import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createPlayHandlers } from "../src/server/play";
import { Storage } from "../src/server/redis";
import { getEnv } from "../src/server/env";
import { reserveModelCall } from "../src/server/stats";
import { SessionResponseSchema, TurnResponseSchema } from "../src/shared/api";
import {
  createProviderChain,
  type JsonCompleter,
  type JsonProvider,
  type ProviderName,
} from "../src/llm/provider";
import { createOpenAIProvider } from "../src/llm/openai";
import { createAnthropicProvider } from "../src/llm/anthropic";
import { median, type EvaluationResults } from "../eval/metrics";
import { modelReport } from "../eval/report";

const samples = [
  ["store-candy", "You were excited for that sweet. The candy stays here."],
  [
    "playground-leave",
    "That last slide was fun. We are walking to the gate together.",
  ],
  [
    "bedtime",
    "You wish the story could keep going. Shall I tuck your bear in first?",
  ],
  [
    "wrong-cup",
    "That cup feels all wrong today. I'll sit beside you for a moment.",
  ],
  [
    "tablet-off",
    "It is disappointing to end the game. The tablet goes on its shelf.",
  ],
  [
    "dinner-refusal",
    "You can leave those peas. We are sitting at the table for dinner.",
  ],
  [
    "car-seat",
    "You want more room to move. The buckle keeps you safe while we drive.",
  ],
  [
    "getting-dressed",
    "Those sleeves feel tricky. Would the green shirt or yellow shirt help?",
  ],
  ["hit-brother", "You are angry about the toy. I will keep both of you safe."],
  [
    "bath-time",
    "You wish bath time were later. We can carry the little boat together.",
  ],
  [
    "sharing-toy",
    "Waiting is difficult. I can stay with you while the timer runs.",
  ],
  [
    "leaving-party",
    "You wanted more fun with your friends. We can wave from the doorway.",
  ],
  [
    "store-candy",
    "I'll wait right beside you. We are leaving the sweets on this shelf.",
  ],
  [
    "playground-leave",
    "You can hop to the gate or walk beside me. We are leaving now.",
  ],
  [
    "bedtime",
    "I noticed you put the book away gently. I will stay for a short cuddle.",
  ],
  [
    "wrong-cup",
    "The other cup is unavailable. This disappointment is hard right now.",
  ],
  ["tablet-off", "Put the tablet in its case. I can help with the zipper."],
  [
    "car-seat",
    "First your buckle clicks, then our trip begins. I'll help guide the strap.",
  ],
  [
    "getting-dressed",
    "You really wanted your other trousers. Shall we start with socks together?",
  ],
  [
    "leaving-party",
    "Your friend will miss you too. I am ready to hold your hand at the door.",
  ],
] as const;
const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
function request(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
function p90(values: number[]): number | null {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.ceil(sorted.length * 0.9) - 1] : null;
}
async function measure(
  complete: JsonCompleter,
  hasModelResponse?: () => boolean,
) {
  const storage = new Storage();
  const handlers = createPlayHandlers({ storage, complete });
  const latencies: number[] = [];
  let fallbacks = 0;
  let modelTaggedTurns = 0;
  try {
    for (const [sceneId, text] of samples) {
      const sessionResponse = await handlers.session(
        request("/api/session", { kind: "library", sceneId, practice: true }),
      );
      if (!sessionResponse.ok)
        throw new Error(
          `Session handler failed with HTTP ${sessionResponse.status}. No latency result was saved.`,
        );
      const session = SessionResponseSchema.parse(await sessionResponse.json());
      const started = performance.now();
      const response = await handlers.turn(
        request("/api/turn", {
          sessionId: session.sessionId,
          turnIndex: 0,
          text,
          inputMode: "text",
        }),
      );
      const elapsed = performance.now() - started;
      if (!response.ok)
        throw new Error(
          `Turn handler failed with HTTP ${response.status}. No latency result was saved.`,
        );
      const turn = TurnResponseSchema.parse(await response.json());
      if (!hasModelResponse || hasModelResponse()) latencies.push(elapsed);
      else fallbacks += 1;
      if (turn.tagging === "model") modelTaggedTurns += 1;
    }
  } finally {
    storage.close();
  }
  return {
    medianMs: median(latencies),
    p90Ms: p90(latencies),
    samples: latencies.length,
    fallbacks,
    modelTaggedTurns,
  };
}
async function main() {
  const rulesOnly = process.argv.includes("--rules-only");
  const env = getEnv();
  const providers: Partial<Record<ProviderName, JsonProvider>> = {};
  if (!rulesOnly && env.OPENAI_API_KEY && env.OPENAI_MODEL)
    providers.openai = createOpenAIProvider(
      env.OPENAI_API_KEY,
      env.OPENAI_MODEL,
      undefined,
      env.OPENAI_REASONING_EFFORT,
    );
  if (!rulesOnly && env.ANTHROPIC_API_KEY && env.ANTHROPIC_MODEL)
    providers.anthropic = createAnthropicProvider(
      env.ANTHROPIC_API_KEY,
      env.ANTHROPIC_MODEL,
    );
  if (!rulesOnly && !Object.keys(providers).length)
    throw new Error(
      "Live latency needs a configured provider key and model. Use --rules-only to measure the real offline handler.",
    );
  const rules = await measure(async () => null);
  let model: Awaited<ReturnType<typeof measure>> | null = null;
  if (!rulesOnly) {
    let received = false;
    const chain = createProviderChain({
      providers,
      primary: env.LLM_PRIMARY,
      reserveCall: reserveModelCall,
      onAttempt: (attempt) => {
        if (attempt.success) received = true;
      },
    });
    const complete: JsonCompleter = async (input) => {
      received = false;
      return chain(input);
    };
    model = await measure(complete, () => received);
  }
  if (rules.medianMs === null || rules.p90Ms === null)
    throw new Error("No rules latency samples were recorded.");
  const results = JSON.parse(
    await readFile(resolve(root, "eval/results.json"), "utf8"),
  ) as EvaluationResults;
  results.latency = {
    date: new Date().toISOString(),
    rulesMedianMs: rules.medianMs,
    rulesP90Ms: rules.p90Ms,
    modelMedianMs: model?.medianMs ?? null,
    modelP90Ms: model?.p90Ms ?? null,
    rulesSamples: rules.samples,
    modelSamples: model?.samples ?? 0,
    modelFallbacks: model?.fallbacks ?? 0,
    modelTaggedTurns: model?.modelTaggedTurns ?? 0,
  };
  await writeFile(
    resolve(root, "eval/results.json"),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  await writeFile(resolve(root, "docs/MODEL.md"), modelReport(results));
  process.stdout.write(
    `Rules: ${rules.samples} real handler turns, median ${rules.medianMs.toFixed(2)} ms, p90 ${rules.p90Ms.toFixed(2)} ms.\n`,
  );
  process.stdout.write(
    model
      ? `Model: ${model.samples} successful provider responses, ${model.fallbacks} rules fallbacks, ${model.modelTaggedTurns} turns using model tags; median ${model.medianMs?.toFixed(2) ?? "not measured"} ms, p90 ${model.p90Ms?.toFixed(2) ?? "not measured"} ms.\n`
      : "Model latency not measured (--rules-only). Sessions used isolated in-memory storage and were never ranked.\n",
  );
  if (model && model.samples === 0) process.exitCode = 1;
}
main().catch(() => {
  process.stderr.write(
    "Latency measurement failed. Check provider configuration and run npm run eval first; use --rules-only without live credentials. No raw provider error or secret is printed.\n",
  );
  process.exitCode = 1;
});
