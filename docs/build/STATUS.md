# Build status

Updated by the reviewer after every review. Times are Astana time.

| Stage | Branch | Owner | Status | Accepted at | Notes |
| --- | --- | --- | --- | --- | --- |
| T0 Foundation | t0-foundation | B | not started | | |
| A1 Engine | a1-engine | A | not started | | |
| B1 Play screen | b1-play | B | not started | | |
| A2 Model and play API | a2-model-api | A | not started | | |
| B2 Debrief and do-over | b2-debrief | B | not started | | |
| J1 Integration (checkpoint 1) | j1-integration | A + B | not started | | |
| A3 Feature APIs | a3-feature-apis | A | not started | | |
| B3 Retention and Pro | b3-retention-pro | B | not started | | |
| A4 Accuracy and resilience | a4-accuracy | A | not started | | |
| B4 Landing and trust | b4-landing-trust | B | not started | | |
| A5 Voice API (stretch) | a5-voice-api | A | not started | | |
| B5 Voice interface (stretch) | b5-voice-ui | B | not started | | |
| J2 Release | j2-release-a, j2-release-b | A + B | not started | | |

## Decisions

## Label disputes

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
