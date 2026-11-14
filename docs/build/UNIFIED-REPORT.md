# Unified A/B implementation and verification

14 November 2026. The latest reviewed A and complete B sources are merged into one product. This is an engineering handoff, **not a team ACCEPTED verdict, competition submission or deployment of the unified revision**.

## Source provenance

The published merge commit is `df32ce672cd4251a942105495e97ce61a34efaa2` (identical tree to local merge `bf90ddd767be17379b485ee373c2477801256cdc`) with two parents:

- Complete B: `8ee802fb990deb98c520b924e590b67e5438c6ea`.
- Reviewed integration: `afb438076ea26d8e80ba680fc050c88b95818392`, including latest A `1b7852dd985a46d7f2b82cceb5ab69d879e78c43`.

Published commit `33c017c057b4076508bbacdec30572b257ff5aa0` (local `a41acb7`) adds the playbook-deletion persistence correction. A failed browser-storage deletion now reports failure, retains the saved line across reload and permits a successful retry. The consolidated [codex/unified-product branch](https://github.com/mrxfsociety/veltral-businesscap2.0/tree/codex/unified-product) and [PR #6](https://github.com/mrxfsociety/veltral-businesscap2.0/pull/6) against `main` are published. Implementation commit `2b41460dec55f246b98094485163d29329c12e11` has tree `f2bf0aa915d34cc04edcfb9017d79dea32a5fc49`, identical to verified local `856a196`. GitHub API publication was used because terminal HTTPS credentials were unavailable; both original parent histories are retained. The later final-review changes and verification are recorded below.

`src/shared/api.ts`, `src/engine/types.ts` and `eval/labeled.jsonl` are byte-unchanged. The merge retains both source histories rather than replacing one track with a snapshot.

Final application revision `2ec6ee408bc2660d11f0a920c6347b6ac7745a1b` adds two reviewed corrections: benign handshake wording no longer stops a scene as unsafe (`2cf51f7`, ten new regression cases), and overflowing metrics tables are named keyboard-focusable regions. Browser assertions now locate the actual tag chips and the application alert, retaining the API and persistence assertions. Full Pro/Free verification and browser runs passed on this application source. [final-integration-checks.json](../evidence/final-integration-checks.json) records the commands, results and remaining boundaries.

## Delivered behaviour and integration decisions

A1–A5 and B1–B5 are present: deterministic engine/scoring, rules and model tagging, Redis and memory storage, custom scenes, coach, rankings, waitlist, the complete play/debrief/retention/trust interface and optional voice. The owner-selected production configuration is OpenAI only; the optional Anthropic adapter remains unused.

The merge preserves the latest model quote and boundary protections, malformed custom-boundary handling, unsafe physical-harm/body-target detection, bounded Redis/memory quotas and real AAC duration/priming/padding checks. Reviewed browser-storage protections reject excessive new growth without destroying legacy data, preserve history/settings around large playbooks and report quota failures. The new deletion fix extends that honest persistence behaviour to removal.

B5 includes calibration, 300 ms loudness windows, early speech-onset timing, 11.8-second capture, cancellation cleanup, transcription, stored-child speech and typing fallback. Voice remains off by default. Synthetic provider audio evidence and unit tests do not establish real-device microphone acceptance.

The existing nginx production configuration and the standalone Caddy option are both preserved. `SITE_URL` and preview flags are consistent at build and runtime. No external production deployment was performed for this unified handoff.

## Checks executed for the unified source

| Check | Actual result |
| --- | --- |
| Clean exact-lock installation | `npm ci`: 411 packages installed |
| Final runtime used | Node 26.9.0; Redis 8.6.2; Chromium 159.0.8154.6 |
| Full `npm run verify` with real Redis enabled | PASS: lint, strict TypeScript, 445 tests in 30 files, no skipped tests, all five evaluation gates and both Pro and Free production builds |
| Reference/par computation | `npm run par` PASS; reference pars retained |
| Evaluation isolation | `npm run check:eval-isolation` PASS |
| Frozen input/contract comparison | API schema, engine types and evaluation labels byte-unchanged |
| HTTP integration | 31 checks, 46 turn requests; all age bands and all outcomes exercised |
| Rendered application | Nine SSR routes checked; Open Graph endpoint HTTP 200; displayed accuracy tables equal the source measurements |
| Browser daily path | Calm ending in three turns, par 3 |
| Browser playbook | Save followed by reload retained the line |
| Browser do-over | Earlier prefix retained; replay treated as unranked |
| Browser voice flow | Calibration cancellation checked |
| Mobile layout | 375 px browser inspection found no horizontal overflow |
| Free production build and browser checks | PASS: full 445-test verify/build with flag false; non-daily scenes and voice gated, daily Start available, free playbook limit shown, shared snapshot read-only |
| Unsafe-stop browser regression | Body-target threat stopped without a score; retry restored turn 1, arousal 75 and connection 50 |
| Independent code review | GPT-6.1 Sol found no new functional defects; 13 storage tests passed independently |
| Full CLI browser/accessibility suite | PASS in both modes: 60 passed / 2 mode-specific skips each; desktop and mobile Chromium, real routes, axe, retention and voice permission/gating |

The reproducible HTTP observations are recorded in [unified-http-smoke.json](../evidence/unified-http-smoke.json). Package scripts use Node's supported `--import tsx` loader to avoid an unnecessary CLI IPC socket. The Open Graph arrow is an SVG rather than a dynamically fetched font glyph, and page metadata avoids duplicating the site name.

The initial focused observations came from the connected browser. The final follow-up completed the entire CLI Playwright/axe suite against local production builds in both configurations, with no model keys. The first attempt lacked the matching Chromium binary; installing it enabled execution. The run then exposed two stale test selectors and a real keyboard-access issue on the overflowing metric tables; all were corrected and both complete suites rerun successfully. Mode-specific skips are complementary: microphone denial runs in Pro, while the voice paywall runs in Free. These browser checks do not establish physical microphone or real iOS Safari acceptance.

## Measurements and prior live-provider evidence

The current JSON records 137 supplied replies, with 74 dev and 63 test. Unified verification reran rules evaluation. The OpenAI measurements remain those already collected by track A; this integration run used no live provider keys.

| Test-split metric | Rules only | Rules + OpenAI |
| --- | ---: | ---: |
| Micro-F1 | 0.985915 | 0.966443 |
| Exact-set match | 0.968254 | 0.920635 |
| Unhelpful precision | 1.000000 | 0.897436 |

Rules outperform the model-assisted mode on this small supplied set. `labelsReviewedByHuman` remains false. L005/L007 dev disagreements are preserved in STATUS.md, and no labels were changed to improve metrics. The model accuracy collection used a recorded 30-second attempt deadline; production uses the four-second deadline. See MODEL.md for the method and per-tag support.

[TRACK-A-REPORT.md](TRACK-A-REPORT.md) and `docs/evidence/` retain actual prior model latency, custom-scene, coach, wrong-key, voice API and deployed HTTPS checks. These are attributed evidence, not reruns on this unified revision. The voice input in those checks was synthetic speech, not a real microphone.

## Production boundary

The existing service is [https://veltral.aituconnect.kz](https://veltral.aituconnect.kz). Health read on **14 November 2026 at 18:19 UTC (23:19 Astana)** reported `afb438076ea26d8e80ba680fc050c88b95818392`. It did not report `bf90ddd`, `a41acb7` or a later unified commit. The user's current request is GitHub publication; no unified deployment is claimed.

The preserved first-release HTTPS timing artifact identifies `fd172030d2a8c4d08db8691b32dd95050121b1c8`. That historical measurement also must not be relabelled as a measurement of the unified build.

## GitHub checks

[Actions run 43622116340](https://github.com/mrxfsociety/veltral-businesscap2.0/actions/runs/43622116340) did not start any verification steps. Its annotation says: "The job was not started because your account is locked due to a billing issue." Container and browser jobs were skipped. This is an account-level blocker, not a passing CI result. The PR is mergeable, but final acceptance and `main` remain unchanged under the repository review protocol.

Tracked-file secret-pattern and generated-artifact checks passed; no environment credentials, dependencies or build output were added.

## Remaining acceptance gates

- Complete real phone and laptop microphone, loudness, denial and playback tests over HTTPS.
- Obtain human review of all labels and independent team stage acceptance.
- If a later deployment is authorized, deploy the exact reviewed unified SHA and verify live health and gameplay against it.
- Competition deck, captain submission and the independent under-90-second human completion test remain team actions; they are not inferred from automated checks.

Earlier TRACK-A, TRACK-B and review reports remain as historical records. This report is the current source for combined implementation and verification status.
