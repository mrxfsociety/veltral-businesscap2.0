# Build status

Updated by the reviewer after every review. Times are Astana time.

| Stage | Branch | Owner | Status | Accepted at | Notes |
| --- | --- | --- | --- | --- | --- |
| T0 Foundation | t0-foundation | B | not started | | |
| A1 Engine | a5-voice-api | A | implemented; checks pass | | See TRACK-A-REPORT.md; team acceptance pending |
| B1 Play screen | b1-play | B | not started | | |
| A2 Model and play API | a5-voice-api | A | implemented; checks pass | | See TRACK-A-REPORT.md; team acceptance pending |
| B2 Debrief and do-over | b2-debrief | B | not started | | |
| J1 Integration (checkpoint 1) | j1-integration | A + B | not started | | |
| A3 Feature APIs | a5-voice-api | A | implemented; checks pass | | See TRACK-A-REPORT.md; team acceptance pending |
| B3 Retention and Pro | b3-retention-pro | B | not started | | |
| A4 Accuracy and resilience | a5-voice-api | A | implemented; checks pass | | See TRACK-A-REPORT.md; team acceptance pending |
| B4 Landing and trust | b4-landing-trust | B | not started | | |
| A5 Voice API (stretch) | a5-voice-api | A | implemented; checks pass | | See TRACK-A-REPORT.md; team acceptance pending |
| B5 Voice interface (stretch) | b5-voice-ui | B | not started | | |
| J2 Release | j2-release-a, j2-release-b | A + B | not started | | |

## Decisions

- 2026-11-14: owner selected OpenAI only. Anthropic comparison is not a completion requirement; optional adapter remains unused.
- A1–A5 were delivered in the isolated `a5-voice-api` branch. `codex/integration-review` combines tested A with B and reviewed B fixes; main and the parallel B branch are preserved.
- The existing VPS already serves other applications through nginx. Do-Over uses its own nginx site and a private web/Redis Compose deployment, preserving existing services.

## Label disputes

- Live dev-only OpenAI evaluation added DISMISS alongside the supplied tags for L005 and L007. A human should decide whether ordering crying/screaming to stop warrants that additional tag under the written definitions. Labels are unchanged; these differences remain counted in the metrics.

Lines of `eval/labeled.jsonl` whose label someone questions. A human decides; agents never edit labels.

## Open risks

## Submission checklist

- [ ] Production link opens in a private window with no login and the daily scene can be finished
- [ ] `/api/health` shows the final commit of `main`
- [ ] Repository is public; README is current; no secrets in history
- [ ] `npm run verify` passes on a fresh clone
- [ ] A team member reviewed every label in `eval/labeled.jsonl` and the README says so
- [ ] Pitch deck PDF, 10 slides or fewer
- [ ] Captain submitted the deck, the link and the repository
