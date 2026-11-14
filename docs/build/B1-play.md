# B1 — Play screen

Track B. Branch: `b1-play`. Target: 90 minutes. Depends on: T0 merged. Works against the T0 stubs; the real engine arrives in J1.

Goal: a parent can play a whole scene on a phone or a laptop.

Read first: SPEC sections 4.3, 5.1, 5.7, 8, 9, 12.3, 14.

## Build

1. Design tokens, layout shell, header (name, links to Scenes, Playbook, Progress, Pricing), footer with the disclaimer.
2. `src/lib/api.ts`: typed client for every endpoint using the shared schemas; maps error bodies to typed errors. `src/lib/store.ts`: the local store of SPEC 9 with try/catch and a version key.
3. `/play`: intro card → playing → ended (a minimal ended card for now; B2 builds the debrief).
4. Playing screen: arousal meter with text value and direction, connection bar, turn counter, child line and action, reply box with a 300-character limit, countdown ring with the timer rules of SPEC 4.3 (8 s, 20 s, off), locked input while waiting, reply bubble with chips (icon + text), underlined quotes, delta, up to two notes in priority order, next child line.
5. Chips, labels and note texts come from the engine exports (`src/engine/tags.ts`, `noteText`) when they exist; until A1 is merged use the tag ids and a local label map marked `// STUB(T0)`.
6. States: loading, network error with retry, `session_expired` → restart, `rate_limited` message, empty hits → "No clear move" chip.
7. Accessibility per SPEC 14: `aria-live` for the child line and the turn result, keyboard flow (Enter sends, focus returns to the box), reduced motion.

## Acceptance

- Playwright: at 375 px and at 1280 px a full scene is played against the stubs to an ended state; the timer set to 8 s sends an empty timed-out turn when nothing is typed; with the timer off nothing is sent.
- Keyboard-only run of a full scene (described step by step in the report).
- Screenshots of intro, playing (after a reply) and ended at 375 px attached to the report or saved under `docs/build/shots/`.
- No horizontal scroll at 375 px. Tap targets at least 44 px.
- `npm run verify` passes.
