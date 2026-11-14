# J1 — Integration and checkpoint 1

Both tracks. Branch: `j1-integration`, run by the track B executor with the track A person at hand. Target: 40 minutes. Depends on: A2 and B2 merged.

Goal: the real engine, the real model and the real interface work together in production.

## Build

1. Rebase on `main`. Replace every local label map or stub-shaped assumption in the interface with the engine exports (`tags.ts`, `noteText`, par from the session response). `grep -R "STUB(T0)" src` must find nothing outside endpoints that A3 still owns.
2. Fix every mismatch between the interface and real responses (empty hits, five outcomes, do-over flags, `tagging`, 409 and 404 paths). Show a small "Tagged by rules only" hint when `tagging` is "rules".
3. Playwright suite `e2e/main-loop.spec.ts` that runs in rules-only mode (keys unset) so it is deterministic: landing → play → three scripted replies with known rule tags → assertions on chips and meter direction → finish → debrief → do-over → history.
4. One manual run per scene age band with real keys; note anything odd in the report.

## Acceptance (checkpoint 1)

- On the production domain, in a private window on a phone and on a laptop: the daily scene can be played from the landing page to the debrief with model tagging; a do-over works; reload keeps history.
- The same scene played with three different styles (empathy + limit + choice; threats; giving in) ends in three different outcomes. Paste the three grids.
- `E2E_BASE_URL=https://<domain> npm run e2e` passes.
- `npm run verify` passes.
