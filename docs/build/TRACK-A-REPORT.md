# Track A — implementation and verification

14 November 2026. Engineering implementation and the executed A1–A5 checks are complete. This does not claim human label review, team stage acceptance or competition submission.

## Delivered

A1–A5 are implemented on `a5-voice-api`, based on T0 `0927656`. The isolated `codex/integration-review` branch combines A with B `9b6e7d2` and reviewed B corrections. Main and B’s original branch are unchanged. The owner explicitly selected **OpenAI only**; an Anthropic comparison is no longer required.

- Deterministic transitions, scoring, par, day rotation, 19 tag families, normalized exact quotes, merge rules, 60 age/variant templates and 11 tips.
- OpenAI structured responses (`gpt-6-luna`, reasoning `none`, verbosity `low`), strict validation, server-only credentials, daily call caps and 4-second runtime deadline. Model failures use rules and templates; the model never decides state or score.
- Session/turn/do-over, custom scenes, engine-checked coaching, real daily standings, waitlist, protected admin stats and health APIs. Redis persistence and bounded sticky memory fallback retain quotas under pressure.
- Transcription and stored-child-line speech APIs; 12-second/1MB audio validation, in-memory processing and bounded one-hour synthesis cache.

Frozen `src/shared/api.ts`, `src/engine/types.ts`, reference scenes/vectors and `eval/labeled.jsonl` are unchanged. No evaluation reply was copied into source. Scripts and reports are reproducible; secrets remain outside Git and build contexts.

## Executed checks

| Check | Result |
| --- | --- |
| Track A `RUN_REDIS_INTEGRATION=1 npm run verify` | **PASS: 360 tests, 17 files**, including actual Redis, strict types, lint, evaluation and production build |
| Integrated A+B full verify with Redis | **PASS: 399 tests, 26 files**, evaluation and production build |
| Engine reference | All 37 vectors and all 12 pars match; all 279 valid custom age/temperament/arousal combinations have par ≤4 |
| Full rules evaluation | 137 replies (74 dev /63 test); all gates pass |
| Full OpenAI + merge evaluation | All 137 replies predicted; all safety/injection gates pass; no fallback counted as a model prediction |
| B browser review | 26/26; Free-mode6/6; final focused smoke2/2 |
| Secret boundary | Supplied key/password absent from tracked files, Git history and built client bundle; environment files ignored |
| Eval isolation | PASS; labels and frozen API contracts unchanged |

The inherited PostCSS file has one nonfatal lint warning. GitHub Actions currently cannot start because of the account billing lock; this report distinguishes executed local/server checks from unavailable CI.

## Measured accuracy and latency

| Test-split metric | Rules only | Rules + OpenAI |
| --- | ---: | ---: |
| Micro-F1 | 0.9859 | 0.9664 |
| Exact-set match | 0.9683 | 0.9206 |
| Unhelpful-tag precision | 1.0000 | 0.8974 |

SPEC 13 targets are met: rules unhelpful precision ≥85%, combined micro-F1 ≥80%. Rules outperform the model-assisted mode on this small supplied dataset; no claim to the contrary is made. All five recorded gates pass. Human review of labels remains unconfirmed; dev disagreements L005/L007 are listed in STATUS.md without changing labels.

Accuracy collection used an explicitly recorded 30-second per-attempt deadline to obtain every prediction without selection bias. Runtime remains4seconds. The separate latency script measured 20 real handler turns per mode with production deadlines and includes every fallback in timing: rules median 8.19ms/p90 12.04ms; OpenAI median 2014.16ms/p90 2378.90ms. All 20 model requests succeeded in this run. **SPEC 14 medians (<300ms rules, <2500ms model) are met.** These local handler measurements exclude the external browser/network round trip.

Earlier live feature/quality checks had 43 successful JSON calls out of 47, with 4 deadline fallbacks. Successful targeted retries did not erase those failures. `docs/MODEL.md` is generated from the actual measurements and includes per-tag support.

## Real feature and child-line checks

Two descriptions generated playable custom scenes:

1. **The Watering Can Stays Outside** — limit: The watering can stays outside. Generation 3307ms. Limit hints: the can stays outside, leave the watering can outdoors, keep the can in the garden, the watering can remains outside. Give-in hints: take the can indoors, bring it inside now, let the can come indoors, carry it into the house.
2. **One More Round** — limit: It’s time to put the game away for dinner. Generation 2243ms. Limit hints: the game goes away now, put the game away for dinner, game time is over for dinner, we’re packing up the game. Give-in hints: play one more round, keep playing before dinner, leave the game out for another round, deal another hand first. Its first turn safely used rules after the model deadline.

The coach produced two real suggestions, independently checked by the engine at −18 each. Nine distinct scenes (three per age band) completed with real model child replies. Short toddler phrases and older-child requests/cooperation reacted to the parent’s wording. This qualitative synthetic interaction is not evidence about actual children.

Live checks exposed and fixed false GIVE_IN tags when a parent reflected a wish. The same getting-dressed and bedtime probes now hold the limit and finish in three real model turns. Punctuation-ended hints now match correctly, and custom scenes include their displayed boundary in rules hints when needed, so model loss does not make that boundary unrecognizable.

## Failure drills

| Drill | Observed result |
| --- | --- |
| Wrong key | Real official OpenAI request with intentionally invalid credential: safe HTTP 200 rules fallback in about 621ms; no provider error leaked |
| Provider timeout | Actual live 4-second timeouts safely fell back; automated abort/no-retry tests pass |
| Redis loss | Actual Redis shutdown integration passes; memory stays consistent; quotas cannot be evicted by session churn |
| Daily call cap | Atomic counter/handler tests pass; no model call after cap |
| Long reply | Normalized and truncated to 300 characters; handler and HTTP probes pass |
| Other language | Handler regression passes with deterministic response |
| Emoji only | Valid response, no invented tags |
| Prompt injection | Both supplied injection lines remain untagged in rules and live combined mode |

## Voice

A synthetic 3.80-second WAV phrase was transcribed correctly by `gpt-4o-mini-transcribe` in 1816 ms. `gpt-4o-mini-tts` returned a decodable 5.16-second MP3 of the server-stored opening line in 2566 ms; repeated synthesis came from cache in 1 ms. Input is explicitly **synthetic macOS speech, not a microphone recording**. No audio is retained by application storage.

Tests cover malformed/oversized media, deadlines, failure, rate limits, cache behavior and authentic sample duration. Exactly 12-second AAC MP4 is accepted after validating encoder priming/padding; forged timing and 13-second recordings remain rejected. B5 microphone/playback UI is still separate unfinished B work.

## Deployment and remaining team work

The first integrated release is running at [veltral.aituconnect.kz](https://veltral.aituconnect.kz), with dedicated HTTPS, a non-root web container and private persistent Redis. Existing host applications are preserved. On first release `fd17203`, 20 public HTTPS practice turns all returned 200: median 2034.68ms, p90 2787.47ms, 19 model responses and 1 safe rules fallback. All timings include the fallback; daily players stayed 0→0. The separate warmup also fell back safely. This meets the actual SPEC 14 median target (<2500 ms). Evidence is in `docs/evidence/production-latency.json`; the final refresh and exact current SHA are verified through `/api/health`.

Remaining work outside A implementation: B5 voice UI; human review of the 137 labels; team stage/merge approval and competition submission; resolving GitHub account billing so CI can execute. Optional Anthropic code is unused. TTS model retirement on 6 January 2027 is documented in DEPLOY.md.

## Reproduce

```sh
npm ci
RUN_REDIS_INTEGRATION=1 npm run verify
npm run check:eval-isolation
node --env-file=.env.local --conditions=react-server --import=tsx eval/run.ts --model --dev-only --provider=openai --timeout-ms=30000
node --env-file=.env.local --conditions=react-server --import=tsx eval/run.ts --model --timeout-ms=30000
node --env-file=.env.local --conditions=react-server --import=tsx scripts/latency.ts
node --env-file=.env.local --conditions=react-server --import=tsx scripts/live-smoke.ts
```
