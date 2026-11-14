# Build status

Updated 14 November 2026. Times are Astana time (UTC+5). Implementation and executed checks are recorded here; **no stage is marked ACCEPTED without the independent team/reviewer decision**. The unified source is documented in [UNIFIED-REPORT.md](UNIFIED-REPORT.md).

| Stage | Delivery branch | Owner | Status | Accepted at | Evidence / remaining gate |
| --- | --- | --- | --- | --- | --- |
| T0 Foundation | codex/unified-product | B | implemented; unified verification passed | | Frozen contracts unchanged; exact-lock installation and build passed |
| A1 Engine | a5-voice-api → unified product | A | implemented; checks pass | | Golden references, par and five eval gates; team acceptance pending |
| B1 Play screen | codex/unified-product | B | implemented; verified in combined build and focused browser checks | | Daily flow and 375 px layout checked; full browser suite pending |
| A2 Model and play API | a5-voice-api → unified product | A | implemented; checks pass | | Current rules/HTTP checks plus attributed prior live OpenAI evidence |
| B2 Debrief and do-over | codex/unified-product | B | implemented; verified in combined build and focused browser checks | | Three-turn ending, retained do-over prefix and saved-line reload checked |
| J1 Integration | codex/unified-product | A + B | merged; unified verification passed | | 435 tests, 31 HTTP checks; no new production rollout claimed |
| A3 Feature APIs | a5-voice-api → unified product | A | implemented; checks pass | | Custom scenes, coach, real rankings, waitlist and storage regressions |
| B3 Retention and Pro | codex/unified-product | B | implemented; verified with Pro and Free builds | | Playbook persistence, free gates and read-only sharing checked |
| A4 Accuracy and resilience | a5-voice-api → unified product | A | implemented; checks pass | | Current rules plus preserved actual model/Redis/deadline evidence |
| B4 Landing and trust | codex/unified-product | B | implemented; verified in build/HTTP checks | | Nine SSR routes, OG 200 and exact metric tables; full axe suite pending |
| A5 Voice API | a5-voice-api → unified product | A | implemented; checks pass | | Media validation and attributed prior synthetic live-provider audio |
| B5 Voice interface | codex/unified-product | B | implemented; unit/build and focused browser checks pass | | Calibration cancel checked; real phone/laptop microphone acceptance pending |
| J2 Release | codex/unified-product | A + B | published in PR #6; not accepted | | Full browser checks and team acceptance; no deployment requested |

## Decisions

- 2026-11-14: owner selected OpenAI only. Anthropic comparison is not a completion requirement; optional adapter remains unused.
- A1–A5 were delivered in the isolated `a5-voice-api` branch. `codex/integration-review` combines tested A with B and reviewed B fixes; main and the parallel B branch are preserved.
- The existing VPS already serves other applications through nginx. Do-Over uses its own nginx site and a private web/Redis Compose deployment, preserving existing services.

- 2026-11-14: the owner requested a unified working A/B product and GitHub publication. Merge `bf90ddd` retains B `8ee802fb` and review `afb43807` (including latest A `1b7852dd`); `a41acb7` fixes failed playbook deletion persistence. The consolidated branch is `codex/unified-product`, published as [PR #6](https://github.com/mrxfsociety/veltral-businesscap2.0/pull/6). API-published merge `df32ce67` and fix `33c017c0` preserve identical trees and both source histories; implementation `2b41460d` matches verified local `856a196`.
- Unified exact-lock verification passed with 435 tests in 30 files, no skips and real Redis. Human acceptance is deliberately separate from these engineering checks.
- Production health observed at 22:22 Astana still reported `afb43807`. Publishing the unified branch does not deploy it or change the existing nginx service.

## Label disputes

- Live dev-only OpenAI evaluation added DISMISS alongside the supplied tags for L005 and L007. A human should decide whether ordering crying/screaming to stop warrants that additional tag under the written definitions. Labels are unchanged; these differences remain counted in the metrics.

Lines of `eval/labeled.jsonl` whose label someone questions. A human decides; agents never edit labels.

## Open risks

- The CLI browser runner cannot launch Chromium because of an OS sandbox Mach-port denial. Focused connected-browser checks are complete; a full current-revision Playwright/axe pass is not claimed.
- Real phone/laptop microphone and playback acceptance, human label review and independent stage acceptance remain pending.
- GitHub Actions run 43622116340 was blocked before any steps by an account billing restriction; browser/container jobs were skipped. Local passes are not CI passes.
- The current public deployment is the prior review SHA, not the new unified product. No deployment is part of this GitHub-only handoff.

## Submission checklist

- [ ] Production link opens in a private window with no login and the final intended daily scene can be finished
- [ ] `/api/health` shows the final accepted commit of `main`
- [x] Repository publication/PR completed; README current; tracked secret/artifact checks passed and both source histories retained
- [x] Exact-lock clean installation and `npm run verify` pass on the unified checkout, including real Redis
- [ ] Full current-revision browser/accessibility suite completed
- [ ] Real phone and laptop microphone acceptance completed
- [ ] A team member reviewed every label in `eval/labeled.jsonl` and the README says so
- [ ] Independent reviewer/team marked the stages ACCEPTED
- [ ] Pitch deck PDF, 10 slides or fewer
- [ ] Captain submitted the deck, the link and the repository
