# Do-Over model and evaluation report

Generated from eval/results.json by the evaluation runner. The deterministic engine alone decides every outcome. Its values are game design choices, not measurements of real children. Transfer to real life has not been measured.

The supplied dataset has 137 replies (74 dev, 63 test), drafted with AI assistance. Human review of every label has not been confirmed. Rules and prompts are developed using dev only; test is used for reporting and acceptance gates. Labels are unchanged. Undefined precision or recall (zero denominator) is reported as zero.

## Targets and limitations

- Rules-only unhelpful precision on test ≥85%: 100.0% — MET.
- Rules + model micro-F1 on test ≥80%: 96.6% — MET.
- Three weakest supported rules tags on test: DISMISS (80.0% F1), NAME_FEELING (94.1% F1), HOLD_LIMIT (100.0% F1).
- OpenAI only was selected by the owner on 2026-11-14. No cross-provider comparison is required or claimed. Model IDs are supplied through server environment variables; gpt-6-luna uses reasoning effort none and text verbosity low for this focused task.

## Rules only

Measured 2026-11-14T13:00:45.733Z; provider: rules; model: deterministic. Test split: 63 replies. Accuracy-run deadline: 4000 ms per provider attempt; runtime turn deadlines remain 4000/3500 ms.

Micro-F1: 98.6%. Exact-set match: 96.8%. Median call latency: not measured.

| Tag              | Precision | Recall |     F1 | Support |
| ---------------- | --------: | -----: | -----: | ------: |
| NAME_FEELING     |    100.0% |  88.9% |  94.1% |       9 |
| HOLD_LIMIT       |    100.0% | 100.0% | 100.0% |       8 |
| OFFER_CHOICE     |    100.0% | 100.0% | 100.0% |       6 |
| CLEAR_COMMAND    |    100.0% | 100.0% | 100.0% |       5 |
| CONNECT          |    100.0% | 100.0% | 100.0% |       3 |
| LABELED_PRAISE   |    100.0% | 100.0% | 100.0% |       3 |
| WHEN_THEN        |    100.0% | 100.0% | 100.0% |       3 |
| THREAT           |    100.0% | 100.0% | 100.0% |       3 |
| BRIBE            |    100.0% | 100.0% | 100.0% |       3 |
| YELL             |    100.0% | 100.0% | 100.0% |       3 |
| SHAME            |    100.0% | 100.0% | 100.0% |       5 |
| DISMISS          |    100.0% |  66.7% |  80.0% |       3 |
| QUESTION_COMMAND |    100.0% | 100.0% | 100.0% |       3 |
| LECTURE          |    100.0% | 100.0% | 100.0% |       2 |
| NEGATIVE_COMMAND |    100.0% | 100.0% | 100.0% |       2 |
| VAGUE_COMMAND    |    100.0% | 100.0% | 100.0% |       2 |
| GIVE_IN          |    100.0% | 100.0% | 100.0% |       6 |
| NO_RESPONSE      |    100.0% | 100.0% | 100.0% |       1 |
| UNSAFE           |    100.0% | 100.0% | 100.0% |       2 |

Gates: unsafeRecall: PASS; noResponseExact: PASS; yellExact: PASS; promptInjectionUntagged: PASS; complete: PASS.

## Rules + model

Measured 2026-11-14T12:57:24.422Z; provider: openai; model: gpt-6-luna. Test split: 63 replies. Accuracy-run deadline: 30000 ms per provider attempt; runtime turn deadlines remain 4000/3500 ms.

Micro-F1: 96.6%. Exact-set match: 92.1%. Median call latency: 1998.4 ms.

| Tag              | Precision | Recall |     F1 | Support |
| ---------------- | --------: | -----: | -----: | ------: |
| NAME_FEELING     |    100.0% | 100.0% | 100.0% |       9 |
| HOLD_LIMIT       |     88.9% | 100.0% |  94.1% |       8 |
| OFFER_CHOICE     |    100.0% | 100.0% | 100.0% |       6 |
| CLEAR_COMMAND    |    100.0% | 100.0% | 100.0% |       5 |
| CONNECT          |    100.0% | 100.0% | 100.0% |       3 |
| LABELED_PRAISE   |    100.0% | 100.0% | 100.0% |       3 |
| WHEN_THEN        |    100.0% | 100.0% | 100.0% |       3 |
| THREAT           |    100.0% | 100.0% | 100.0% |       3 |
| BRIBE            |    100.0% | 100.0% | 100.0% |       3 |
| YELL             |    100.0% | 100.0% | 100.0% |       3 |
| SHAME            |     83.3% | 100.0% |  90.9% |       5 |
| DISMISS          |    100.0% | 100.0% | 100.0% |       3 |
| QUESTION_COMMAND |     75.0% | 100.0% |  85.7% |       3 |
| LECTURE          |     66.7% | 100.0% |  80.0% |       2 |
| NEGATIVE_COMMAND |    100.0% | 100.0% | 100.0% |       2 |
| VAGUE_COMMAND    |    100.0% | 100.0% | 100.0% |       2 |
| GIVE_IN          |     85.7% | 100.0% |  92.3% |       6 |
| NO_RESPONSE      |    100.0% | 100.0% | 100.0% |       1 |
| UNSAFE           |    100.0% | 100.0% | 100.0% |       2 |

Gates: unsafeRecall: PASS; noResponseExact: PASS; yellExact: PASS; promptInjectionUntagged: PASS; complete: PASS.

## OpenAI development evaluation

| Provider | Model      | Replies | Micro-F1 | Median ms |
| -------- | ---------- | ------: | -------: | --------: |
| openai   | gpt-6-luna |      74 |    98.8% |    2161.5 |

## Full-handler latency

Measured 2026-11-14T12:59:27.295Z: rules-only median 8.2 ms, p90 12.0 ms; model median 2014.2 ms, p90 2378.9 ms. Samples: 20 rules-only, 20 model-configured handler turns, including timeout fallbacks; 20 successful model responses; 0 failed model turns fell back to rules. Model tags were used on 20 turns. Targets: rules median <300 ms MET; model-configured median <2500 ms MET. These measurements use isolated in-memory sessions, not an external production round trip.

## Provider implementation

SDK APIs checked against official documentation on 2026-11-14: [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Anthropic TypeScript structured-output helpers](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/helpers.md), [OpenAI transcription](https://developers.openai.com/api/docs/guides/speech-to-text), and [OpenAI speech](https://developers.openai.com/api/docs/guides/text-to-speech). OpenAI storage is disabled. Responses are schema-validated; SDK retries are disabled. The provider chain uses a 4-second first attempt and a 3.5-second fallback when configured. This deployment configures OpenAI only and falls back to deterministic rules on failure. Model IDs must be configured in the environment; API documentation checks are not a live model benchmark. Model documentation checked on that date: [gpt-6-luna](https://developers.openai.com/api/docs/models/gpt-6-luna). The selected model is not claimed to outperform unmeasured alternatives.

## Reproduce

- npm run eval — offline rules + real merge; fails on hard-gate violations.
- npm run eval:model -- --timeout-ms=30000 — live configured provider + real merge on every row; no fallback result is reported as model accuracy. The extended evaluation deadline is recorded separately from production handler latency.
- npm run eval:model -- --provider=openai --dev-only --timeout-ms=30000 — OpenAI dev accuracy, allowing slow responses without counting a rules fallback as a model prediction.
- NODE_OPTIONS=--conditions=react-server npx tsx scripts/latency.ts — full-handler latency and failure drill report when available.

The test split remains small; per-tag support is shown above so low-support results are visible. Rules cover explicit cues and intentionally miss uncertain semantic meaning.
