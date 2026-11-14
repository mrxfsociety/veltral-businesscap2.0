# Do-Over model and evaluation report

Generated from eval/results.json by the evaluation runner. The deterministic engine alone decides every outcome. Its values are game design choices, not measurements of real children. Transfer to real life has not been measured.

The supplied dataset has 137 replies (74 dev, 63 test), drafted with AI assistance. Human review of every label has not been confirmed. Rules and prompts are developed using dev only; test is used for reporting and acceptance gates. Labels are unchanged. Undefined precision or recall (zero denominator) is reported as zero.

## Targets and limitations

- Rules-only unhelpful precision on test ≥85%: 100.0% — MET.
- Rules + model micro-F1 on test ≥80%: NOT MEASURED.
- Three weakest supported rules tags on test: DISMISS (80.0% F1), NAME_FEELING (94.1% F1), HOLD_LIMIT (100.0% F1).
- Model IDs are supplied through environment variables. No provider winner is claimed without a measured dev bake-off.

## Rules only

Measured 2026-11-14T12:14:35.886Z; provider: rules; model: deterministic. Test split: 63 replies.

Micro-F1: 98.6%. Exact-set match: 96.8%. Median call latency: not measured.

| Tag | Precision | Recall | F1 | Support |
| --- | ---: | ---: | ---: | ---: |
| NAME_FEELING | 100.0% | 88.9% | 94.1% | 9 |
| HOLD_LIMIT | 100.0% | 100.0% | 100.0% | 8 |
| OFFER_CHOICE | 100.0% | 100.0% | 100.0% | 6 |
| CLEAR_COMMAND | 100.0% | 100.0% | 100.0% | 5 |
| CONNECT | 100.0% | 100.0% | 100.0% | 3 |
| LABELED_PRAISE | 100.0% | 100.0% | 100.0% | 3 |
| WHEN_THEN | 100.0% | 100.0% | 100.0% | 3 |
| THREAT | 100.0% | 100.0% | 100.0% | 3 |
| BRIBE | 100.0% | 100.0% | 100.0% | 3 |
| YELL | 100.0% | 100.0% | 100.0% | 3 |
| SHAME | 100.0% | 100.0% | 100.0% | 5 |
| DISMISS | 100.0% | 66.7% | 80.0% | 3 |
| QUESTION_COMMAND | 100.0% | 100.0% | 100.0% | 3 |
| LECTURE | 100.0% | 100.0% | 100.0% | 2 |
| NEGATIVE_COMMAND | 100.0% | 100.0% | 100.0% | 2 |
| VAGUE_COMMAND | 100.0% | 100.0% | 100.0% | 2 |
| GIVE_IN | 100.0% | 100.0% | 100.0% | 6 |
| NO_RESPONSE | 100.0% | 100.0% | 100.0% | 1 |
| UNSAFE | 100.0% | 100.0% | 100.0% | 2 |

Gates: unsafeRecall: PASS; noResponseExact: PASS; yellExact: PASS; promptInjectionUntagged: PASS; complete: PASS.

## Rules + model

Not measured. No live-provider accuracy or latency is claimed.

## Provider comparison (dev only)

Not measured; live provider credentials are required.

## Full-handler latency

Measured 2026-11-14T11:59:16.343Z: rules-only median 0.2 ms, p90 0.5 ms; model median not measured ms, p90 not measured ms. Samples: 20 rules-only, 0 successful model responses; 0 failed model turns fell back to rules. Model tags were used on 0 turns. These measurements use isolated in-memory sessions, not an external production round trip.

## Provider implementation

SDK APIs checked against official documentation on 2026-11-14: [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Anthropic TypeScript structured-output helpers](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/helpers.md), [OpenAI transcription](https://developers.openai.com/api/docs/guides/speech-to-text), and [OpenAI speech](https://developers.openai.com/api/docs/guides/text-to-speech). OpenAI storage is disabled. Responses are schema-validated; SDK retries are disabled. The provider chain uses a 4-second first attempt and a 3.5-second fallback. Model IDs must be configured in the environment; API documentation checks are not a live model benchmark. Documentation candidates checked on that date: [gpt-6-luna](https://developers.openai.com/api/docs/models/gpt-6-luna) and [claude-haiku-5-5](https://platform.claude.com/docs/en/models/haiku-5-5/overview). These are candidates, not a measured winner.

## Reproduce

- npm run eval — offline rules + real merge; fails on hard-gate violations.
- npm run eval:model — live configured provider chain + real merge; no fallback result is reported as model accuracy.
- npm run eval:model -- --provider=openai --dev-only (or anthropic) — isolated dev bake-off.
- NODE_OPTIONS=--conditions=react-server npx tsx scripts/latency.ts — full-handler latency and failure drill report when available.

The test split remains small; per-tag support is shown above so low-support results are visible. Rules cover explicit cues and intentionally miss uncertain semantic meaning.
