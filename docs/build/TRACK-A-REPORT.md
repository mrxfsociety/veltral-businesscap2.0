# Track A implementation and verification

14 November 2026, Astana time. This is an executor report, not a reviewer acceptance or a production-release claim.

## Delivery

A1–A5 are implemented together on `a5-voice-api`, based on track B's T0 commit `092765672dba778e0a394ac2f9bd9e3c91b753cc`. T0 was still awaiting acceptance, so the work continued in an isolated clone instead of waiting for each intermediate merge. No push or merge to `main` was performed. Frozen `src/shared/api.ts`, `src/engine/types.ts`, supplied scenes, reference vectors and evaluation labels are unchanged.

The only shared build changes are the required real A scripts, the lockfile, compatible TypeScript 6.0.3, `tsx` for TypeScript command-line scripts, and `server-only` with a Vitest test alias. The current typescript-eslint parser accepts TypeScript below 6.1; unqualified `latest` had selected unsupported TypeScript 7. No UI, deployment or track B source was edited.

## Acceptance evidence

| Area | Executed check | Result |
| --- | --- | --- |
| Clean installation | `npm ci --no-audit --no-fund` | PASS, 409 packages from the committed lockfile |
| Full gate | `npm run verify` | PASS: lint, strict types, 315 unit tests, rules evaluation, production build |
| Redis integration | `RUN_REDIS_INTEGRATION=1 npm test` | PASS: 319 tests, 17 files, no skipped tests |
| Engine vectors | Golden-vector tests | All 37 vectors, every turn and complete score objects match |
| Par | `npm run par` + tests | All 12 reference values match; all 279 valid custom-scene combinations yield par at most 4 |
| Rule evaluation | `npm run eval` | All five gates PASS on all 137 replies; test split 63 replies |
| Rules test results | Generated `eval/results.json` | Micro-F1 0.9859; exact-set 0.9683; unhelpful precision 1.0000 |
| Labels/source isolation | `npm run check:eval-isolation` | Labels unchanged; no complete nontrivial evaluation reply (4+ characters) in source |
| Pure engine | Forbidden-import scan | No React, Next, LLM, server or network imports |
| Server boundary | Built `.next/static` scan | No provider key names, key prefixes, ioredis or server/provider module paths |
| Shared contract | Git diff against T0 | Empty for both frozen files and `eval/labeled.jsonl` |
| Source cleanup | Source scan | No T0 stubs, ts-ignore, explicit any types, console.log or unfinished TODOs in A source |
| Formatting | Prettier check of A files and changed build files | PASS |
| Production HTTP | Next standalone server on localhost | PASS: session, turn, daily prerequisites, no-key fallback, do-over, safety, 400/404/409, custom refusals and protected admin route |
| Complete scene | Standalone HTTP, rules only | Calm with limit held in 3 turns |
| HTTP timing | 20 standalone HTTP turns, library sessions | Median 0.61 ms, p90 0.69 ms on this local machine; not a deployed-network claim |
| Audio validation | 13 duration/format tests plus actual WAV/WebM/MP4 fixtures | 1-second clips accepted, 13-second clips rejected; forged duration metadata rejected |

The default test run skips four tests that launch a real Redis process; the explicit Redis run above executed all four. The inherited T0 PostCSS configuration has one non-fatal ESLint warning. Repository-wide formatting still includes unformatted B/T0 files; A's files were checked separately to preserve ownership and the frozen contract.

## A1 — Engine

Implemented transition, score, breadth-first par, New York day rotation, all 19 tag definitions, conservative rule families, normalized quote mapping, merge exclusions, deterministic child-line selection, 60 age/variant templates and 11 unhelpful tips. Golden vectors and date-boundary tests pass. The weakest supported test tags are DISMISS (precision 1.00, recall 0.6667), NAME_FEELING (precision 1.00, recall 0.8889), then all remaining tags tied at perfect F1. Full per-tag values are generated in `docs/MODEL.md`.

## A2 — Model and play API

Implemented current official OpenAI and Anthropic SDK adapters, structured-output validation, 4-second/3.5-second fallback chain without SDK retries, a daily model-call budget, server-only boundaries and six original prompt examples. State and scores only come from the deterministic engine. Parent input is normalized and truncated to 300 characters before the shared request schema is parsed.

Session mutations are serialized, do-over truncates future turns, unsafe turns are unscored, expired sessions return 404, and client-supplied state/tags/scores are rejected. Sessions expire six hours after creation, including after subsequent writes. Redis loss switches the process to sticky memory fallback rather than reconnecting to stale state.

Three actual no-key HTTP probes gave:

| Parent reply | Tags | Delta / outcome |
| --- | --- | --- |
| I can see you're disappointed. I'm right here. The answer is still no. | NAME_FEELING, HOLD_LIMIT, CONNECT | −18, ongoing |
| If you keep shouting you lose your toys tonight. | THREAT | +18, ongoing |
| Fine, you can take the candy. | GIVE_IN | −60, calm_gave_in |

Real provider comparisons and three live-model replies have not been run: neither provider key/model pair is configured. `eval/results.json` keeps `merged: null`, and the report makes no provider-winner claim.

## A3 — Feature APIs

Custom scenes have unsafe pre-checks before any provider call, age/name authority from the request, arousal clamping, deduplicated lowercase hints, 24-hour retention and rules-engine play. Fewer than three valid hints cause an honest refusal rather than invented hints. Coach suggestions must have every quote verified, no unhelpful tags and a negative engine delta; fallback tips use actual turn effects and filled scene slots.

Daily standings use real sorted-set entries only, preserve the first score, exclude practice/do-over/unsafe sessions and withhold percentages below 20 players. Waitlist email validation/storage, rate limits, real health state and timing-safe admin-key checks are implemented.

Two live generated scenes remain unverified without provider credentials. Fake-provider tests exercise every acceptance branch; they are not reported as live generation.

## A4 — Accuracy and resilience

| Failure drill | Evidence | Result |
| --- | --- | --- |
| Wrong API key | Official adapter transport rejects with auth error; chain test | Safe fallback, no leaked error details; live bad-key request not performed |
| Provider timeout | Aborting deadline and fallback provider tests | PASS |
| Redis unavailable | Real local Redis shut down during the integration test, plus standalone memory scene | PASS |
| Daily call cap reached | Atomic counter and play-handler tests | Rules fallback without model call |
| 300-character / longer reply | Handler tests and HTTP overlong reply | Trimmed/collapsed/truncated to 300 |
| Another language | Handler regression | Valid deterministic response |
| Emoji-only reply | Handler regression | Valid response without fabricated tags |
| Model-directed instruction | Gate examples plus original prompt/helper tests | Rules injection gate PASS; live merged gate pending credentials |

No labels were changed or silently disputed. Human label review has not been asserted. `npm run latency -- --rules-only` measures 20 actual handler calls in isolated, unranked library sessions; live model timing is explicitly unmeasured. Quality review of live child lines across all age bands remains pending keys; fallback templates are tested for age length and safe text.

## A5 — Voice API

Implemented multipart transcription (single audio, bounded body, 1 MB and 12 seconds) and synthesis of stored child lines only (`turnIndex: -1` means opening). Input audio remains in memory and is discarded; synthesized output is cached by session and text hash for at most one hour. Concurrent synthesis requests share one provider call. Limits and model budget apply, with safe errors for UI/browser fallback.

Supported recording containers: WebM/Opus, WAV PCM/float, regular or fragmented MP4/AAC-LC. Actual packet/sample timing is checked, including MediaRecorder WebM files without a duration header. Unsupported formats are rejected clearly. B should stop capture around 11.8 seconds to leave room for encoder padding within the strict 12-second server limit.

Live transcription and playable provider speech are unmeasured without speech model configuration/credentials.

## Needs from track B and the team

- Integrate this branch after the T0 contract is accepted; no contract migration is required.
- Finish B1–B5 and run browser/accessibility/gating checks against these real endpoints.
- Show source `tagging` honestly, handle API errors, and do not imply live-model accuracy while `merged` is null.
- Configure actual provider credentials/model IDs through deployment secrets; run dev bake-off, model evaluation and live latency/audio checks.
- Supply VPS/domain access and run deployment; Docker runtime, production HTTPS and external health have not been verified here.
- Resolve GitHub Actions account billing lock: observed workflow jobs were rejected before starting.
- Human review of dataset labels, independent reviewer acceptance and submission remain outstanding.

## Commands for the remaining credentialed checks

```sh
npm run eval:bakeoff -- --provider=openai
npm run eval:bakeoff -- --provider=anthropic
npm run eval:model
npm run latency
```

Provide environment values securely; never commit `.env` or paste keys into a public issue. The bake-off intentionally exits non-zero when the selected provider is unavailable and does not replace measurements with rules-only output.
