# Build plan

Two tracks build in parallel; a reviewer accepts and merges every stage. Rules: `AGENTS.md`. Specification: `docs/SPEC.md`. Review protocol: `ORCHESTRATOR.md`. Progress: `STATUS.md`.

| Order | Track A (engine, model, server) | Track B (interface, pages, delivery) |
| --- | --- | --- |
| 0 | — (server, DNS, keys, label review by the human) | `T0-foundation.md` |
| 1 | `A1-engine.md` | `B1-play.md` |
| 2 | `A2-model-api.md` | `B2-debrief.md` |
| 3 | `J1-integration.md` (both, checkpoint 1) | |
| 4 | `A3-feature-apis.md` | `B3-retention-pro.md` |
| 5 | `A4-accuracy-resilience.md` | `B4-landing-trust.md` |
| 6 | `A5-voice-api.md` (stretch) | `B5-voice-ui.md` (stretch) |
| 7 | `J2-release.md` (both) | |

Prompt for an executor: "You are the executor for track <A|B> of Do-Over. Read AGENTS.md and docs/SPEC.md, then do docs/build/<file>. Work on the branch named in the task file. When every acceptance check passes, push the branch and print the report in the AGENTS.md format."

Prompt for the reviewer: "Review branch <branch> following docs/build/ORCHESTRATOR.md. Executor report: <paste>."
