# A3 — Feature APIs

Track A. Branch: `a3-feature-apis`. Target: 75 minutes. Depends on: A2 merged.

Goal: every remaining endpoint is real.

Read first: SPEC sections 7.3, 7.4, 8, 8.2–8.4, 12.2.

## Build

1. `POST /api/custom-scene` per SPEC 7.3, including the unsafe pre-check, clamping, hint clean-up and 24-hour storage. `POST /api/session` with `kind: "custom"` loads it.
2. `POST /api/coach` per SPEC 7.4, including the engine check of every suggestion and the tips fallback.
3. Daily: record finished daily sessions and compute the standing per SPEC 8.3; `GET /api/daily`.
4. `POST /api/waitlist` (validated email, stored in Redis, rate-limited). `GET /api/admin/stats` protected by `ADMIN_KEY`.
5. Rate limits of SPEC 8.4 on every endpoint.
6. Remove every remaining `STUB(T0)`.

## Acceptance

- Tests with a fake provider: custom scene success; unsafe description refused before any model call; `not_a_meltdown`; model unavailable; generated values outside the limits are clamped; a custom session plays through the engine.
- Coach tests: a suggestion containing an unhelpful cue is filtered out; a suggestion whose engine delta is not negative is filtered out; with no model the tip for the worst tag comes back with slots filled.
- Daily tests: a session is counted once; do-over, practice and unsafe sessions are not counted; `beatPct` is null under 20 players and correct at 20; no code path writes synthetic entries.
- With real keys: two real descriptions produce playable scenes (paste the generated titles, limits and hints).
- `grep -R "STUB(T0)" src` finds nothing.
- `npm run verify` passes.
