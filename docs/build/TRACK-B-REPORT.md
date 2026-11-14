# Track B delivery report

Checked on 14 November 2026. This is an implementation handoff, **not an ACCEPTED release**. No production URL, live model keys, external reviewer decision or track A branch was available.

| Stage | Implementation | Acceptance status |
| --- | --- | --- |
| T0 | Shared types/schemas, marked stub endpoints, Next/Tailwind/tooling, Docker/Caddy/Redis, deployment/CI | 35 contract/route tests pass; full install/verify, Docker and HTTPS checks blocked |
| B1 | Full responsive play screen, timers, typed API, storage, evidence, errors, keyboard flow | Code and pure tests complete; Playwright/keyboard run/screenshots not executed |
| B2 | Four endings, debrief, redo, unsafe pause, history, share and saved lines | Share/store/quote/unsafe tests pass; real browser acceptance pending |
| J1 | Typed integration boundary and rules-only browser suite prepared | Blocked: A1/A2 absent; local presentation map is still marked `STUB(T0)` |
| B3 | Library, replay, playbook/shared, progress, pricing, waitlist, Free/Pro UI, coach/rank display | Unit logic passes; A3/live browser/gating acceptance pending |
| B4 | Landing with actual interactive scene, privacy clear control, measured-data parser, metadata, accessibility/layout/shot suites | Missing real A evaluation/tags/constants; browser/axe/screenshots pending |
| B5 | Not started | SPEC explicitly requires A4/B4 accepted and deployed plus the voice go decision |
| J2 | Delivery infrastructure, README, licence and release test instructions prepared | Not accepted: integration, production checks and human test remain |

## Actual validation

- 71 unit tests in 11 files passed (Vitest 1.6.1, cached Zod 4 distribution bundled with Zod 3.25.76).
- Strict TypeScript 5.9.2 with `noUncheckedIndexedAccess` passed on shared contract, server routes/stubs, browser libraries, React store hook and pure UI tests.
- Full TSX source analysis was attempted with actual React 19.3 types; reported missing Next and CSS-module declarations only. This is not a complete framework typecheck.
- Prettier formatting and `git diff --check` passed on the checked source.
- `bash -n scripts/deploy.sh`, Compose/CI YAML parsing and 13 deployment-script harness cases passed.
- `npm run verify` was actually attempted and stopped at `eslint: command not found` because the full project dependencies cannot be installed in the current terminal.
- `git clone`/`npm view` fail with DNS ENOTFOUND. Existing package cache supports only the targeted checks above; Next.js is absent.
- GitHub Actions runs `43591840681` and `43591840676` failed before any step ran; job log downloads return BlobNotFound. Exact cause could not be established. No billing or permission settings were changed.
- Docker, Next build, Playwright, axe, screenshots, real model calls, production curl and the human <90-second run were **not executed**.

The cached validation runtime is scratch-only and is not checked into the repository. Standard project commands should be used after normal installation; the reported cached-run results do not certify the unresolved dependency versions.

## Independent review fixes

Contract review found and fixed raw reply normalization, empty-score turning point `-1` and missing ownership READMEs. Client review found and fixed blocked local deletion reporting, bounded requests, ambiguous retry warnings, long-text overflow, misleading timer copy, hidden live-demo countdowns and inaccurate daily-ranking copy.

## Needs from track A

1. Replace the seven marked T0 server files with A2/A3 implementations; replace pending `par/eval/eval:model` scripts.
2. Preserve the shared API shapes after T0 acceptance. The pre-acceptance review allows arbitrary raw reply text in the request; the server trims/collapses/truncates to 300 and the response remains capped at 300.
3. Provide engine tag/label/definition/constant exports and `noteText`; replace `src/lib/presentation.ts` with imports in J1. Keep client imports free of network/server dependencies.
4. Provide actual `content/par.json` and `eval/results.json`. The B adapter expects `{rules?:{date,provider?,model?,test:{n,microF1,exactMatch,perTag:{TAG:{precision,recall,f1,support}}}},merged?:same}`. This is a provisional display adapter, not a new frozen API contract; adapt it to A's actual measured output at integration. Missing/invalid results currently display “not available”, never a target or estimate.
5. Verify actual privacy retention/provider behaviour and update the temporary development-preview copy and banner. Remove the banner only once the real simulation is wired and checked.
6. Complete the real rules-only and keyed integration runs, daily ranking boundaries, rate limits and fallback checks.

At the last GitHub inspection, only `main` and the foundation branch were available. There was no track A implementation to review. The supplied engine reference and labelled data have not been altered.

## Dependencies and deviations

- The source kit was recovered from the user's existing local `Downloads/do-over-kit` because remote materialization could not download in the restricted terminal. Original specification/content/eval files were preserved.
- The initially empty GitHub repository was bootstrapped with the kit's ownership rules on `main`; implementation work is confined to stage branches. No implementation was merged into main.
- Continued B implementation on a stacked branch while T0 acceptance was blocked, as the handoff plan permits continuing during review. This does not bypass the acceptance gates.
- The initial dependency resolver workflow is limited to `t0-foundation`; it creates the lockfile once a runner can start. `package-lock.json` remains absent; accepting T0 before resolving it would be incorrect.
- Native `crypto.randomUUID` replaces an external ID generator. `@axe-core/playwright` is the required automated accessibility checker.
- No new authentication, analytics, payment processing or remote messaging was added.

## Claims on the landing page

| Claim | Source or basis |
| --- | --- |
| 48% of parents vs 26% of other adults report overwhelming stress most days | SPEC §17.1, U.S. Surgeon General advisory; 2023 data, published 2024; linked on page |
| Meta-analysis of 77 evaluations found larger effects in programs including practice with the parent's own child | SPEC §17.2, Kaminski et al. 2008; linked and immediately qualified as not measuring Do-Over |
| No measured transfer to home | Explicit current limitation, repeated on page |
| Planned $9.99/month, $59.99/year; no payments | SPEC §10 product hypothesis and actual absence of payment code |
| Today's scene/title/par | `/api/daily`; marked development preview while endpoint is a T0 stub |
| Accuracy | Read from validated `eval/results.json` only; currently unavailable |

## Finishing acceptance

1. Restore a usable dependency installation/CI runner, resolve and commit the lockfile, then run full `npm run verify`.
2. Have the designated reviewer accept T0; integrate A2, run J1 and replace all local placeholder assumptions.
3. Integrate A3/A4, run B3/B4 acceptance including both Pro flag values and actual screenshot/axe checks.
4. Apply the explicit B5 checkpoint decision; no voice button is exposed prematurely.
5. Human deploys accepted main through `scripts/deploy.sh`; run `E2E_BASE_URL`, real health-commit checks and the <90-second human test. Only then mark J2 accepted.
