# Do-Over — rules for every agent working in this repository

Do-Over is a meltdown simulator for parents of 2–7 year olds, built for a hackathon that ends at 12:00 on 15 November 2026 (Astana time). Judges use the production site without an account and read this repository.

**v2 redesign (from 15 November, 01:00 Astana):** the source of truth for the redesign, the season pass, ownership of paths and branches is [`docs/REDESIGN.md`](docs/REDESIGN.md). Where it disagrees with this file or `docs/SPEC.md`, REDESIGN wins (its section 13 lists what it supersedes, including the track ownership and "executors never push to `main`" rules below). Live status and handoffs: [`docs/build/V2-STATUS.md`](docs/build/V2-STATUS.md).

**Source of truth for the engine, server API, safety and honesty rules:** `docs/SPEC.md`. Read it fully before your first task. Task files are in `docs/build/`. The executable reference for the engine is `docs/reference/engine.mjs` with golden vectors in `docs/reference/vectors.json`.

## Who does what

- **Executor, track A** (engine, model layer, server): owns `src/engine`, `src/llm`, `src/server`, `src/app/api`, `content`, `eval`, `scripts/par.ts`, `docs/MODEL.md`.
- **Executor, track B** (interface, pages, delivery): owns everything else under `src/app`, `src/components`, `src/lib`, `src/voice`, `e2e`, `public`, `Dockerfile`, `docker-compose.yml`, `Caddyfile`, `scripts/deploy.sh`, `.github`, `docs/DEPLOY.md`, `README.md`.
- **Shared contract:** `src/shared/api.ts` and `src/engine/types.ts`. Frozen after stage T0. If you believe the contract must change, stop and say so in your report; do not change it on your own.
- **Reviewer:** a different model reviews every stage branch against `docs/build/ORCHESTRATOR.md` and merges it into `main`. Executors never merge into `main` and never push to it.

Do not edit files owned by the other track. If you need something from the other track, write it under "Needs from the other track" in your report.

## Branches and commits

- Start every stage from the latest `main`: `git checkout main && git pull && git checkout -b <branch named in the task file>`.
- Small commits with conventional messages (`feat(engine): …`, `fix(play): …`, `test: …`, `docs: …`). Commit after every coherent step. Push the branch when the acceptance checks pass.
- Never commit secrets, `.env`, build output or `node_modules`.
- New dependencies need a one-line justification in the report. Prefer none: stage T0 installs what both tracks need.

## Hard rules

1. **The model never decides the outcome.** Outcomes come from `src/engine` only (SPEC section 3).
2. **Nothing fake.** No hardcoded results, no scripted demo path, no special-casing of sample or eval inputs, no invented users, counters, testimonials or statistics. Stubs exist only in stage T0, carry the comment `// STUB(T0)`, and are removed by the stage that replaces them.
3. **Evaluation discipline.** Tune on the dev split, report on the test split, never copy lines from `eval/labeled.jsonl` into rules, prompts or examples, never change a label to pass a check (SPEC section 13).
4. **Facts.** Product copy uses only the facts in SPEC section 17, with their links.
5. **Scope.** Build what the task file says. No extra features, no refactors outside your stage. If you finish early, improve tests and edge cases inside your stage.
6. **When blocked for more than 10 minutes**, choose the simplest path that keeps the product honest and working, and record it under "Deviations".
7. **Model ids, SDK calls and versions:** check the provider's or package's current documentation before writing the call. Do not rely on memory for names of models or options.

## Commands

`npm run verify` = lint + typecheck + unit tests + rules-only eval + build. It must pass before you report. Others: `npm run dev`, `npm test`, `npm run par`, `npm run eval`, `npm run eval:model` (needs keys), `npm run e2e`.

## Definition of done for a stage

- Every acceptance check in the task file was actually run and passes; you paste the commands and their real output summaries.
- `npm run verify` passes.
- No `any`, no `@ts-ignore`, no `console.log`, no commented-out code, no TODO left without an entry in the report.
- New behaviour has tests. Changed behaviour has updated tests.

## Report format (print this at the end of every task)

```
STAGE: <id and name>          BRANCH: <branch>          LAST COMMIT: <sha>
SUMMARY: <three lines: what now works>
ACCEPTANCE:
  - <check from the task file> — PASS/FAIL — <command and the key line of its output>
VERIFY: <result of npm run verify>
FILES: <main files added or changed>
DEVIATIONS: <where you departed from SPEC or the task, and why; "none" if none>
NEEDS FROM THE OTHER TRACK: <or "none">
KNOWN GAPS: <honest list; "none" if none>
```
