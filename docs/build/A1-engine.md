# A1 — Engine

Track A. Branch: `a1-engine`. Target: 75 minutes. Depends on: T0 merged.

Goal: the complete deterministic engine with tests. No network, no React, no model.

Read first: SPEC sections 3, 5 (all), 6, 13; `docs/reference/engine.mjs`; `docs/reference/vectors.json`.

## Build (all in `src/engine` unless noted)

1. `tags.ts`: the 19 tags with label, kind (helpful/unhelpful), definition and examples from SPEC 5.3. This file feeds the UI table and the model prompt later.
2. `transition.ts`, `score.ts`, `par.ts`: port the reference to strict TypeScript. Constants exported by name.
3. `scenes.ts`: load and zod-validate `content/scenes.json`; `getScene`, `sceneOfTheDay`, `dayKey`, `dayNumber` per SPEC 5.8.
4. `rules.ts`: `ruleTags` with every cue family of SPEC 6.1, returning exact quotes. One test block per family with positive and negative cases you write yourself (not copied from the eval file).
5. `merge.ts`: `mergeTags` per SPEC 6.3 with a test for every exclusion and for the quote check.
6. `content/templates.json` (at least 60 child lines, SPEC 5.9) and `lines.ts` with `pickChildLine`; `content/tips.json` (why + try instead for every unhelpful tag except UNSAFE); `notes.ts` with `noteText` (SPEC 5.7).
7. `scripts/par.ts` → `content/par.json`; `npm run par`.
8. `eval/run.ts`: rules-only evaluation per SPEC 13 writing the `rules` block of `eval/results.json`; `npm run eval`. Fails the process when a gate fails.
9. `src/engine/index.ts` exports exactly the functions of SPEC 5.2.

## Acceptance

- Golden vectors: a test replays all 37 vectors and compares arousal, connection, delta, outcome and notes of every turn and the whole score object. 37 of 37 pass.
- `npm run par` reproduces the `par` block of `vectors.json`; a test compares.
- `npm run eval` passes the gates: UNSAFE recall 1.00, NO_RESPONSE and YELL exact, lines L078 and L079 untagged. The report quotes rules-only precision and recall per tag on the test split and names the three weakest tags.
- Day functions: `dayNumber("2026-11-14") === 1`; the scene for 2026-11-15 is `playground-leave`; a test covers the New York date boundary.
- Engine files have no imports from `react`, `next`, `src/llm`, `src/server` or any network module (`grep` shown in the report).
- `npm run verify` passes.
