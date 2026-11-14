# Track B implementation and integration report

> Historical stage report. Its test counts, implementation gaps and deployment statements describe the revision named below. See [UNIFIED-REPORT.md](UNIFIED-REPORT.md) for the latest merged A/B source and newly executed checks; the original evidence is preserved unchanged.

14 November 2026. B1–B5 source implementation is complete in `j1-integration`; **release acceptance is not complete**. This report records executed checks and separates them from prepared tests. No implementation was merged into `main`, no production deployment is claimed, and the reviewer-owned acceptance table has not been marked accepted.

## Delivered scope

| Stage | Implemented behavior | Remaining acceptance |
| --- | --- | --- |
| B1 | Responsive intro/play, 8/20/off timer, 25-second typing window, typed API errors, evidence chips, keyboard flow, accessible meters | Real-browser layout/keyboard checks |
| B2 | Four endings, unscored unsafe pause, debrief, do-over retaining prior turns, local history, helpful-line saving and clipboard sharing | Browser main loop and real screenshots |
| J1 | Real A engine/APIs; authoritative tags, notes, constants and par; rules-only disclosure; actual outcome integration tests | Exact-lock verify, real-provider and deployed browser runs |
| B3 | Scene library, custom-scene form, playbook and validated fragment sharing, progress, Free/Pro gating, coach, real rankings, pricing and waitlist | Browser gating with both build flags and provider-generated scenes |
| B4 | Landing with actual playable demo, measured-results page, cited research with limitations, verified retention copy, local-data clearing, metadata, axe/layout/screenshot suites | Browser axe/screenshots and human review |
| B5 | Pro voice toggle, 3-second calibration, 11.8-second capture, 300 ms RMS loudness, early speech onset, transcript display, server/browser playback and text fallback | Real microphones on phone/laptop over HTTPS and live speech models |
| J2 | Docker/Caddy/Redis delivery, safe deploy script, CI matrix, README, MIT licence and release instructions | Accepted merge, public domain, Docker/HTTPS checks, human completion test |

Voice is off by default. Work on the optional voice stage proceeded because the user explicitly requested the complete B track and A5 was available for review. This is not a claim that checkpoint 2 or production voice acceptance passed.

## Integrated A version and independent review

Integrated `a5-voice-api` through **93e27698737adaedbc43ea4cd1e8a4f10b59426b**, including its metric compatibility follow-up. `src/shared/api.ts`, `src/engine/types.ts` and the supplied evaluation labels are unchanged. The current UI reads canonical measured `count` and `exactSetMatch` fields; `merged: null` is shown as unmeasured.

An independent review found a rules-only safety miss: “I will slap your face.” was not stopped. The integration contains a minimal body-target expansion in the two unsafe patterns, with unsafe and safe-control regressions. The original A branch was not overwritten. This small A-owned correction is explicitly included as a cross-track integration fix; no tag/score contract changed.

Independently checked both before and after the fix:

- All 37 golden vectors match.
- 2,000 seeded random sequences, totaling 6,276 complete transition comparisons and score comparisons, match the executable reference.
- All 137 evaluation replies preserve their metrics and gates; labels were not changed.
- Review covered transition/score/merge, sessions/do-over, custom scenes, coach, daily standings, storage fallback and provider/voice boundaries. No other confirmed blocking code defect was found; this does not certify unrun live-provider behavior.

B review also corrected local deletion reporting, bounded requests, hidden-demo timers, long-text overflow, ambiguous retries, late microphone grants and a voice timer race. Speech onset now uses the first voiced analyser frame; only complete 300 ms windows determine the raised-voice flag. Cleanup covers unsafe outcomes, retry, redo, reset, typing fallback and unmount.

## Actual validation on the integrated source

| Check | Observed result |
| --- | --- |
| `npm run lint` | PASS, zero errors and zero warnings |
| Scoped strict framework typecheck | PASS for B pages/components/lib/voice/E2E with real installed Next/React types |
| `npm test -- src/engine src/lib src/shared src/components src/voice --exclude src/shared/http-contract.test.ts` | PASS, **263 tests / 19 files**, including **23 voice tests** |
| `node --import tsx eval/run.ts` | PASS, 137 replies; all five evaluation gates pass; actual output regenerated |
| Rules test metrics | 63 replies; micro-F1 0.985915; exact-set 0.968254; unhelpful precision 1.000000 |
| Evaluation isolation | Exact byte comparison to supplied labels and source scan PASS; no complete evaluation reply of 4+ characters appears in `src` |
| Playwright discovery | PASS; suites are loadable, not claimed executed |
| Deployment shell checks | `bash -n`, YAML parsing and 13 deployment-script harness cases PASS |
| Formatting and whitespace | Prettier and `git diff --check` PASS for changed B source |
| Stub/debug scan | No `STUB(T0)`, TODO/FIXME, `console.log`, `@ts-ignore` or explicit `: any` in source/test/script/eval directories |

The local verification runtime is scratch-only, with actual cached Next 16.3.4, React 19.2.6, TypeScript 5.9.3 and Vitest 1.6.1. The repository lockfile targets the versions supplied by A, including Next 16.4.6 and TypeScript 6.0.3. The cached checks **do not certify an exact-lockfile installation**. No SDK or Redis module was mocked to make a build pass.

## Failed or unavailable checks

- `npm run verify` was run and did not pass: typechecking cannot resolve `openai`, `@anthropic-ai/sdk` and `ioredis`; the older available Vitest also produces incompatible mock-type diagnostics in A tests. B's scoped framework typecheck passes.
- Actual Next production compilation was attempted and stopped at unresolved official SDK/Redis imports. npm installation is blocked by registry DNS failure in this terminal.
- The HTTP-contract/server/LLM suites are not included in the successful local subset because they require those missing dependencies. A's own 315-test verify and 319-test Redis results are attributed to its separate report, not counted as our integrated result.
- Chrome launch was attempted and failed with SIGABRT/EPERM. Playwright flows, axe scans, screenshots and microphone UX were therefore not executed. No fabricated screenshots were added.
- GitHub Actions jobs on A and B branches failed before any step started; browser/container jobs were skipped. A's report identifies an account billing restriction. No passing remote CI or independently verified billing diagnosis is asserted here.
- The isolation CLI assumes `origin/t0-foundation`, unavailable in the local API-materialized git history. Equivalent byte comparison against the supplied kit plus the same source-collision condition passed.
- Provider keys/model IDs, live transcription/TTS, production domain/VPS access, Docker runtime and the human under-90-second completion exercise were not available or not performed.

## Files and delivery

B owns the page/component/browser/voice sources, E2E suites, deployment files and README. A implementation was imported without replacing B pages. `src/lib/presentation.ts` uses engine exports, the catalogue uses real engine scenes/par, and the T0 development banner and endpoint placeholders are removed. `package-lock.json` comes from A; the temporary lockfile-bootstrap workflow is removed. CI runs exact-lock verify, container smoke and Free/Pro browser jobs when runners are available.

The source kit, reference vectors and original labels remain intact. No `.env`, provider secret, build output or `node_modules` is committed. No authentication, payment processing or analytics was added.

## Remaining handoff

1. Restore a usable exact-lock dependency installation or Actions runner, then run full `npm run verify` and browser suites with both preview flags.
2. Configure provider secrets and model IDs securely, run the measured-model/bake-off/latency checks and two real custom scenes. Do not replace absent model metrics with rules metrics.
3. Perform phone/laptop HTTPS microphone and playback checks, axe/layout checks and real screenshots.
4. Have the designated reviewer accept the staged work and merge it. A person deploys accepted `main`, verifies `/api/health` against its commit, and records the real human completion exercise. The production URL and submission checklist remain pending.

## Executor handoff

```text
STAGE: B1–B5 plus J1 integration and J2 preparation
BRANCH: j1-integration
LAST COMMIT: fd0dcd08dc00449506f37f94be6d88c480c88b30 (implementation checkpoint; this report follows)
SUMMARY: Complete text and optional voice interface with persistence, retention and Free/Pro flows.
         Real A engine/API/metrics integrated, with a reviewed unsafe-rule correction.
         Deployment and browser checks prepared; no production acceptance invented.
ACCEPTANCE:
  - Engine/browser/voice unit subset — PASS — 263 tests in 19 files.
  - Lint, scoped framework typing and rules evaluation — PASS.
  - Exact-lock verify, browser/device and production acceptance — BLOCKED / NOT RUN as detailed above.
VERIFY: FAIL/BLOCKED at unavailable dependency types; not accepted.
FILES: src/app (B pages), src/components, src/lib, src/voice, e2e, delivery, README; imported A source.
DEVIATIONS: Stacked integration while acceptance is pending; optional B5 implemented under full-B user scope; minimal documented A safety correction.
NEEDS FROM THE OTHER TRACK: real provider/model checks and shared review of the integration safety fix.
KNOWN GAPS: exact-lock integrated verify, browser/axe/screenshots, real devices/providers, Docker/HTTPS and human release acceptance.
```
