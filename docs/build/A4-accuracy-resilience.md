# A4 — Accuracy and resilience

Track A. Branch: `a4-accuracy`. Target: 60 minutes. Depends on: A3 merged.

Goal: the best honest accuracy we can measure, and proof that the server degrades safely.

Read first: SPEC sections 6, 7.1, 7.2, 12.1, 13, 14.

## Build

1. Improve rules and the turn prompt using the dev split only. Re-run both evaluations; update `eval/results.json` and `docs/MODEL.md`. If a label looks wrong, list it under "Label disputes" in `docs/build/STATUS.md`; do not change it.
2. `scripts/latency.ts`: 20 real turns through the handler; print median and 90th percentile for model mode and rules-only mode; add the numbers to `docs/MODEL.md`.
3. Failure drills, each with an automated test or a documented manual run: wrong API key; provider timeout; Redis down; daily call cap reached; 300-character reply; reply in another language; emoji-only reply; a reply that tries to instruct the model.
4. Security pass: no key or server-only module in the client bundle (search the build output); every route validates its input with the shared schemas; error bodies do not leak stack traces.
5. Child-line quality pass: play three scenes per age band with real keys; fix prompt or templates where a line does not sound like that age or does not react to the parent's words.

## Acceptance

- `docs/MODEL.md` shows final test-split metrics for rules-only and rules + model, the targets of SPEC 13 with met/missed stated plainly, and latency numbers.
- All gates of SPEC 13 hold. The diff of `eval/labeled.jsonl` is empty.
- No eval line appears in `src` (`node` script or `grep` shown in the report).
- The eight failure drills are listed with their result.
- `npm run verify` passes.
