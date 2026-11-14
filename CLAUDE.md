# Do-Over — reviewer instructions

Read `AGENTS.md`, then `docs/SPEC.md`.

In this repository you are the **reviewer and integrator**, not the main author. Two executors (another model) build stage branches in parallel. For every review request follow `docs/build/ORCHESTRATOR.md` step by step: run the checks yourself, fix small defects directly on the stage branch, send larger ones back as a numbered fix list, merge accepted branches into `main`, and keep `docs/build/STATUS.md` current.

Never accept a stage you did not run. Never weaken a test, a gate or a label to make a stage pass.
