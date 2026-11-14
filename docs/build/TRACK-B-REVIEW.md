# Track B integration corrections

STAGE: B/J1 review corrections
BRANCH: `codex/integration-review`, based on B `9b6e7d2`
B corrections are committed in the isolated integration branch; B original branch remains unchanged.

## Summary

Fresh read-only fetch confirmed B remains `9b6e7d2`; no new B fixes were available. The root authorized corrections only in the isolated integration checkout. No B remote branch, main, credentials, server deployment or external comments were changed.

All five confirmed findings are corrected:

1. Global, landing, how-it-works and privacy copy now describes the integrated simulation. Privacy names OpenAI only and accurately explains Redis/memory fallback, TTLs, waitlist data, hashed-IP request counters and daily statistics. Voice UI remains honestly unavailable.
2. Presentation labels, note text and priorities use A's pure metadata. How-it-works renders source tag definitions/examples, actual initial state and eight exported engine constants. Human label review and real-life transfer remain explicitly unconfirmed/unmeasured.
3. Pricing privacy link is visibly underlined.
4. Expired-session e2e locator selects the application alert by its message.
5. Playbook growth beyond the storage budget is rejected without replacing old data. Previously persisted valid oversized playbooks remain readable and can shrink. History, daily completion and settings still save when such a playbook exists. Quota-denied playbook saves return an honest storage error and retain prior lines; the debrief explains this to the user.

## Acceptance

- `NEXT_PUBLIC_PRO_PREVIEW=true OPENAI_API_KEY='' ANTHROPIC_API_KEY='' REDIS_URL='' npm run verify` — **PASS** after the final store correction: lint (0 errors, one existing warning), typecheck, 356 unit tests, offline evaluation and production build. Four opt-in Redis integration tests were skipped.
- Store regressions — **12/12 PASS**, including 5,000 valid 300-character lines, preserved history/settings/dailyDone after reload, bounded new growth, failed-save preservation and reduction of a legacy oversized store.
- Full integrated production browser suite, preview true — **26/26 PASS** in local Google Chrome. Includes actual main loop/do-over/history, timers, pricing and how-it-works axe checks, explicit 375/768/1280 layouts, alert restart, and storage-failure UI.
- Production browser checks after a false-preview build — **6/6 PASS**: mobile-width daily flow, library/replay/coach/playbook gates and failed-save UI.
- After the final store guard refinement, focused production browser checks repeated — **2/2 PASS**: daily flow/history at 375px and failed-save UI.
- Prettier check and staged/unstaged `git diff --check` — **PASS**.
- Offline evaluation: 137 replies, 74 dev / 63 test; test micro-F1 0.9859, exact-set match 0.9683, unhelpful precision 1.0000; all safety/injection gates PASS.

## Files changed by this reviewer

`src/app/how-it-works/page.tsx`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/pricing/pricing.tsx`, `src/app/privacy/page.tsx`, `src/components/play/debrief.tsx`, `src/lib/presentation.ts`, `src/lib/store.ts`, `src/lib/store.test.ts`, `e2e/main-loop.spec.ts`, `e2e/retention.spec.ts`.

Root independently synchronized newer A-owned files into the same merge during this work. Tests ran against that integrated source. The reviewer did not edit A-owned source or the index. Standard evaluation commands regenerate the evaluation artifact/report; root will supply the latest measured model artifact after its credentialed validation.

## Deviations and gaps

- A's `noteText` accepts private `Scene`, while B intentionally receives public scene data. The UI adapter therefore formats the canonical exported `NOTE_TEXT` using `childName`, rather than fabricating private fields.
- Storage has a browser-capacity budget, not an unlimited physical capacity. Failed saves preserve old lines and are reported to users.
- B5 voice interface is still absent; these fixes do not claim otherwise.
- Existing nonfatal warnings remain: PostCSS anonymous default export, Vite config loading notice, local metadataBase default and a dynamic-font download warning during Open Graph generation. Full build succeeds.
- Local browser tests used disabled provider keys and memory storage. Credentialed OpenAI validation and deployment belong to the root agent; no claim is made here that production or real-provider tests passed.

Browser artifacts are under `work/b-fix-results/`, `work/b-fix-free-results/` and `work/b-fix-final-results/`. Temporary runner config is under `work/b-fix-playwright.config.ts`, outside the repository.

## Deployment follow-up

The root subsequently connected metadataBase to SITE_URL and passed the public origin as a build argument, so generated social image URLs use the deployed domain. Final A+B backend validation reached 399 passing tests including real Redis. The latest A model accuracy artifact is integrated; it is not a placeholder.
