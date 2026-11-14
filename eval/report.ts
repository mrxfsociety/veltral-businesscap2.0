import type { EvaluationMode, EvaluationResults } from "./metrics";
import { TAG_ORDER } from "../src/engine/tags";

const pct = (value: number): string => `${(value * 100).toFixed(1)}%`;
function modeTable(title: string, mode: EvaluationMode | null): string {
  if (!mode)
    return `## ${title}\n\nNot measured. No live-provider accuracy or latency is claimed.\n`;
  const metrics = mode.test;
  const table = TAG_ORDER.map((tag) => {
    const value = metrics.perTag[tag];
    return `| ${tag} | ${pct(value.precision)} | ${pct(value.recall)} | ${pct(value.f1)} | ${value.support} |`;
  }).join("\n");
  return `## ${title}\n\nMeasured ${mode.date}; provider: ${mode.provider}; model: ${mode.model}. Test split: ${metrics.count} replies. Accuracy-run deadline: ${mode.requestTimeoutMs ?? 4000} ms per provider attempt; runtime turn deadlines remain 4000/3500 ms.\n\nMicro-F1: ${pct(metrics.microF1)}. Exact-set match: ${pct(metrics.exactSetMatch)}. Median call latency: ${metrics.medianLatencyMs === null ? "not measured" : `${metrics.medianLatencyMs.toFixed(1)} ms`}.\n\n| Tag | Precision | Recall | F1 | Support |\n| --- | ---: | ---: | ---: | ---: |\n${table}\n\nGates: ${Object.entries(
    mode.gates,
  )
    .map(([name, passed]) => `${name}: ${passed ? "PASS" : "FAIL"}`)
    .join("; ")}.\n`;
}
export function modelReport(results: EvaluationResults): string {
  const weak = results.rules
    ? TAG_ORDER.filter(
        (tag) => results.rules && results.rules.test.perTag[tag].support > 0,
      )
        .sort(
          (a, b) =>
            (results.rules?.test.perTag[a].f1 ?? 0) -
            (results.rules?.test.perTag[b].f1 ?? 0),
        )
        .slice(0, 3)
        .map(
          (tag) =>
            `${tag} (${pct(results.rules?.test.perTag[tag].f1 ?? 0)} F1)`,
        )
        .join(", ")
    : "not measured";
  const rulesTarget = results.rules
    ? `${pct(results.rules.test.unhelpfulPrecision)} — ${results.rules.test.unhelpfulPrecision >= 0.85 ? "MET" : "MISSED"}`
    : "NOT MEASURED";
  const modelTarget = results.merged
    ? `${pct(results.merged.test.microF1)} — ${results.merged.test.microF1 >= 0.8 ? "MET" : "MISSED"}`
    : "NOT MEASURED";
  const bakeoff = Object.values(results.bakeoff)
    .map(
      (entry) =>
        `| ${entry.provider} | ${entry.model} | ${entry.dev.count} | ${pct(entry.dev.microF1)} | ${entry.dev.medianLatencyMs?.toFixed(1) ?? "not measured"} |`,
    )
    .join("\n");
  const latency = results.latency
    ? `Measured ${results.latency.date}: rules-only median ${results.latency.rulesMedianMs.toFixed(1)} ms, p90 ${results.latency.rulesP90Ms.toFixed(1)} ms; model median ${results.latency.modelMedianMs?.toFixed(1) ?? "not measured"} ms, p90 ${results.latency.modelP90Ms?.toFixed(1) ?? "not measured"} ms. Samples: ${results.latency.rulesSamples ?? "not recorded"} rules-only, ${results.latency.modelSamples ?? "not recorded"} model-configured handler turns, including timeout fallbacks; ${results.latency.modelResponses ?? "not recorded"} successful model responses; ${results.latency.modelFallbacks ?? "not recorded"} failed model turns fell back to rules. Model tags were used on ${results.latency.modelTaggedTurns ?? "not recorded"} turns. Targets: rules median <400 ms ${results.latency.rulesMedianMs < 400 ? "MET" : "MISSED"}; model-configured median <1800 ms ${results.latency.modelMedianMs === null ? "NOT MEASURED" : results.latency.modelMedianMs < 1800 ? "MET" : "MISSED"}. These measurements use isolated in-memory sessions, not an external production round trip.`
    : "Full-handler latency has not been measured yet. Evaluation-call timing is a different measurement.";
  return `# Do-Over model and evaluation report\n\nGenerated from eval/results.json by the evaluation runner. The deterministic engine alone decides every outcome. Its values are game design choices, not measurements of real children. Transfer to real life has not been measured.\n\nThe supplied dataset has ${results.dataset.count} replies (${results.dataset.dev} dev, ${results.dataset.test} test), drafted with AI assistance. Human review of every label has not been confirmed. Rules and prompts are developed using dev only; test is used for reporting and acceptance gates. Labels are unchanged. Undefined precision or recall (zero denominator) is reported as zero.\n\n## Targets and limitations\n\n- Rules-only unhelpful precision on test ≥85%: ${rulesTarget}.\n- Rules + model micro-F1 on test ≥80%: ${modelTarget}.\n- Three weakest supported rules tags on test: ${weak}.\n- OpenAI only was selected by the owner on 2026-11-14. No cross-provider comparison is required or claimed. Model IDs are supplied through server environment variables; gpt-6-luna uses reasoning effort none and text verbosity low for this focused task.\n\n${modeTable("Rules only", results.rules)}\n${modeTable("Rules + model", results.merged)}\n## OpenAI development evaluation\n\n${bakeoff ? `| Provider | Model | Replies | Micro-F1 | Median ms |\n| --- | --- | ---: | ---: | ---: |\n${bakeoff}` : "Not measured yet."}\n\n## Full-handler latency\n\n${latency}\n\n## Provider implementation\n\nSDK APIs checked against official documentation on 2026-11-14: [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Anthropic TypeScript structured-output helpers](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/helpers.md), [OpenAI transcription](https://developers.openai.com/api/docs/guides/speech-to-text), and [OpenAI speech](https://developers.openai.com/api/docs/guides/text-to-speech). OpenAI storage is disabled. Responses are schema-validated; SDK retries are disabled. The provider chain uses a 4-second first attempt and a 3.5-second fallback when configured. This deployment configures OpenAI only and falls back to deterministic rules on failure. Model IDs must be configured in the environment; API documentation checks are not a live model benchmark. Model documentation checked on that date: [gpt-6-luna](https://developers.openai.com/api/docs/models/gpt-6-luna). The selected model is not claimed to outperform unmeasured alternatives.\n\n## Reproduce\n\n- npm run eval — offline rules + real merge; fails on hard-gate violations.\n- npm run eval:model -- --timeout-ms=30000 — live configured provider + real merge on every row; no fallback result is reported as model accuracy. The extended evaluation deadline is recorded separately from production handler latency.\n- npm run eval:model -- --provider=openai --dev-only --timeout-ms=30000 — OpenAI dev accuracy, allowing slow responses without counting a rules fallback as a model prediction.\n- NODE_OPTIONS=--conditions=react-server npx tsx scripts/latency.ts — full-handler latency and failure drill report when available.\n\nThe test split remains small; per-tag support is shown above so low-support results are visible. Rules cover explicit cues and intentionally miss uncertain semantic meaning.\n`;
}
