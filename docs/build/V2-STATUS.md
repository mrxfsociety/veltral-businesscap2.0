# Do-Over v2 — status

Source of truth: `docs/REDESIGN.md`. One checklist per session. Tick items and push after every coherent step. A new session must be able to continue from this file and `git log` alone.

Branch: `v2`, cut from `main` at `ac6fa98`, plus the four reviewed local commits of `codex/unified-product` (`2cf51f7` engine: benign handshakes out of unsafe detection, `2ec6ee4` keyboard-accessible metric tables, two docs commits) that were never pushed.

Rules: own paths only (REDESIGN section 10). `npm run verify` before every push. `git pull --rebase origin v2` before every push. No force-push. Requests to another owner go in the "Requests" section at the bottom.

## Operator notes (production)

### DEPLOY — 15 November 2026, 11:16 Astana (UTC+05:00)

**Final production commit: `b3ff6303448dba2618a3a4599012ad87fd405392`.** The new Veltral design from `17978a5` is live, including the complete `v2` history and a narrowly scoped model-tagging correction. Healthy deployment confirmed at **11:13:30 Astana**. Production: https://veltral.aituconnect.kz.

The operator authorized combining the latest branches, retaining the new design, fixing the discovered regression, and continuing after 11:15 with the deadline at 12:00. `main` already contained all `v2` changes, so `v2` was fast-forwarded to `17978a5`. After verification, the focused fix was pushed atomically to `main` and `v2`; both resolved to `b3ff630`. This subsequent report is pushed to `v2` only, with no redeployment for documentation.

**Backups and environment:** `/opt/do-over/shared/.env.bak.110202`; environment bytes verified unchanged after the final deployment. `NEXT_PUBLIC_PRO_PREVIEW=false`, `DEMO_CODE=ENCORE`, the existing `ENTITLEMENT_SECRET`, and the expected `SITE_URL` were confirmed; `OPENAI_*` untouched. No secret was regenerated. Compose backups: `/opt/do-over/infra/compose.yml.bak.110206`, `.bak.110653`, `.bak.110725`, and `.bak.111159` (final deployment). Source files were backed up outside the repository before the authorized correction.

**Deployment sequence:** `17978a5` became healthy at 11:03:51. A real model-tagging failure initially triggered the previously required rollback; it completed at 11:07:08. The operator then explicitly cancelled rollback, so `17978a5` was restored at 11:07:37. The corrected `b3ff630` is the final release. Brief 502 responses during container replacement cleared on the script's next health retry. Web and Redis containers are healthy; the existing Redis container was preserved.

**Correction:** the model labelled “Fine, you can hold my hand. No candy today.” as `GIVE_IN` on the playground scene, producing `calm_gave_in`. The merger now rejects that label when its complete cited sentence grants only supportive contact or feelings. Genuine concessions, mixed-action sentences, and deterministic rule concessions remain valid. This is a general evidence check, not an exact-reply special case. Unit and server tests reproduce the observed failure and verify that the scene stays ongoing with the limit intact.

**External API results**, from the operator's Mac after the final deployment:

```json
{"ok":true,"commit":"b3ff6303448dba2618a3a4599012ad87fd405392","time":"2026-11-15T06:13:26.140Z","redis":"up","providers":{"openai":true,"anthropic":false},"proPreview":false}
```

```json
{"pro":false,"source":null,"checkout":"code_only","demoCode":"ENCORE"}
```

`/api/daily` returned `dayKey: "2026-11-15"`, `sceneId: "playground-leave"`. `POST /api/session` with `{"kind":"library","sceneId":"car-seat"}` returned **402**.

**Real Chromium browser checks**, fresh private contexts at 1280×900 and 375×812:

| Check | 1280 px | 375 px | Evidence |
| --- | --- | --- | --- |
| New home design and live paper stage | PASS | PASS | Veltral header, new hero, working primary Play action, visible stage. |
| Light/dark theme persists | PASS | PASS | Toggle → navigate to pricing → reload preserves dark; switching back works. |
| Start visible without scrolling | PASS | PASS | Start is inside the initial viewport. |
| Kind reply, stamps, ledger, storm drop | PASS | PASS | HTTP 200, three helpful tags, delta −18, ongoing scene. Desktop slip sits right of the stage. |
| Complete turn slip accessible | PASS | PASS | Desktop slip x934, stage right edge x908. Phone's full ledger and provenance can be revealed by normal page scrolling above the fixed reply dock. |
| Hand-holding regression after fix | PASS | PASS | Exact original phrase → no `GIVE_IN`, `outcome: "ongoing"`, `limitIntact: true`. |
| Negated hatred regression | PASS | PASS | “I would never say I hate you.” → no unsafe pause, ongoing scene, no tags. |
| Locked scene → paywall → ENCORE → play | PASS | PASS | `pro: true`, source `code`; car-seat starts. |
| Return to Free → locked again | PASS | PASS | `pro: false`; car-seat gate returns. |
| Sample week and `/jury` | PASS | PASS | Seven labelled sample-data entries; jury walkthrough opens. |
| Horizontal overflow / captured console errors | PASS | PASS | No overflow on inspected views; no errors captured in monitored contexts. |
| Stripe test checkout | BLOCKED | BLOCKED | No operator-supplied test key is available on the server; checkout remains code-only. |

The full UI flow was checked on the new design; final engine regressions were rerun in fresh browser contexts on `b3ff630`. The fix changes only the merger and its tests, not page layouts or entitlement behavior. Final kind replies on both widths showed **“Tagged with the model”**; the hand-holding and negated-hatred replies showed **“Tagged by rules only”** and kept the scene ongoing. The original pre-fix failure showed “Tagged with the model”.

**Verification:** `npm run verify` PASS: lint, typecheck, **587 tests passed**, four opt-in Redis integration tests skipped, all five evaluation gates passed (micro-F1 0.9859, exact match 0.9683, unhelpful precision 1.0), production build PASS. Generated evaluation files were backed up and restored before committing. Separate focused tests: 166 passed; independent review found no blocker.

**Rollback reference only — do not execute without a new operator instruction**, because the operator explicitly requested retaining the new design:

```sh
cd /opt/do-over && ./deploy-main.sh 17978a5c2bca59a6b83309493654e842096a0be1
```

That command reverts only the narrow model fix and preserves the new design. The earlier pre-design release remains `16407b2c0e645c0719413c677478cd4e9c641b1b`.

### DEPLOY — 15 November 2026, 04:22 Astana (UTC+05:00)

Production: https://veltral.aituconnect.kz. Deployed commit: `16407b2c0e645c0719413c677478cd4e9c641b1b`. Previous production commit: `ac6fa98f4daf9fae087a2700352a8552572ed39b`.

- GitHub check: fetched `origin`; both `origin/main` and `origin/v2` resolved to the requested `16407b2c0e645c0719413c677478cd4e9c641b1b`. No push to `main` was needed.
- Environment backed up to `/opt/do-over/shared/.env.bak.040657` before editing. Set `NEXT_PUBLIC_PRO_PREVIEW=false` and `DEMO_CODE=ENCORE`; generated the previously missing `ENTITLEMENT_SECRET` on the server with `openssl rand -hex 32`. No secret values are recorded here. No Stripe key was supplied, so `STRIPE_SECRET_KEY` remains absent and checkout is code-only. All other existing lines, including `OPENAI_*`, `SITE_URL`, and `ADMIN_KEY`, were verified unchanged.
- Copied the operator's existing `do-over-v2/deploy-main.sh` to `/opt/do-over/deploy-main.sh` unchanged. The script backed up compose to `/opt/do-over/infra/compose.yml.bak.040740`, built the requested release, and printed `Healthy commit: 16407b2c0e645c0719413c677478cd4e9c641b1b` at 04:12:35 Astana. One transient 502 during container replacement cleared on the next health retry. Web and Redis containers are healthy; the existing Redis container was preserved. No rollback was performed.
- Runtime checks confirmed the requested commit and environment settings, the new entitlement secret reaching the web container, and the existing OpenAI key preserved. Application code was not edited.

**External API checks — PASS**, run from the operator's Mac, outside the server, at 04:13:44 Astana:

`GET /api/health`:

```json
{"ok":true,"commit":"16407b2c0e645c0719413c677478cd4e9c641b1b","time":"2026-11-14T23:13:44.368Z","redis":"up","providers":{"openai":true,"anthropic":false},"proPreview":false}
```

`GET /api/entitlement` in a fresh session:

```json
{"pro":false,"source":null,"checkout":"code_only","demoCode":"ENCORE"}
```

`POST /api/session` with `{"kind":"library","sceneId":"car-seat"}` returned **402**. `/api/daily` returned `sceneId: "store-candy"` and `dayKey: "2026-11-14"`, so car-seat was correctly locked.

**Real-browser checks**, Chromium in two fresh isolated private contexts, 1280×900 and 375×812:

| Check | 1280 px | 375 px | Evidence |
| --- | --- | --- | --- |
| `/` live paper stage | PASS | PASS | Stage visible; page HTTP 200. |
| `/play` starts and plays a real turn | PASS | PASS | Rehearsal selected initially; tested with No timer. Turn HTTP 200, storm 75 → 57, three helpful tags, reply enabled afterward. |
| Turn stamps inside the stage | PASS | FAIL | Desktop shows all three stamps inside the stage. Mobile renders the feedback slip below the stage; its lower provenance line is partly overlapped by the reply dock in the checked viewport. |
| `/scenes` → locked car-seat → paywall → ENCORE | PASS | PASS | Paywall opens, code grants `pro: true`, and car-seat can start. Stripe trial controls absent as expected with code-only checkout. |
| `/pricing` → Return to Free | PASS | PASS | Entitlement becomes `pro: false`; car-seat is locked again and cannot start. |
| `/progress` → Show a sample week | PASS | PASS | Seven sample labels shown; stored user history unchanged; sample mode off after reload. |
| `/jury` | PASS | PASS | HTTP 200, walkthrough heading visible, `noindex, nofollow`. |
| Horizontal overflow / browser errors | PASS | PASS | No horizontal overflow on checked pages; no page errors or console errors captured. |

**Model versus rules:** both tested turns displayed **"Tagged by rules only"** and returned `tagging: "rules"`, with `NAME_FEELING`, `HOLD_LIMIT`, and `CONNECT` tags. No "Tagged with the model" result was observed. Health reports OpenAI configured, but successful model tagging is **not confirmed**. Web logs contained startup messages and did not establish the fallback cause. OpenAI settings were left unchanged.

The 375 px stamp placement is existing application behavior (`wide && slip` inside the stage, `!wide && slip` below it). It is recorded as a failed layout requirement for the code owner; no application change was made during deployment. Stripe payment processing was not tested because no test key was supplied.

**Repository verification:** `git pull --rebase origin v2`, `npm ci`, and `npm run verify` passed in an isolated worktree: lint, typecheck, 494 tests passed, four opt-in Redis integration tests skipped, evaluation all five gates passed (micro-F1 0.9859, exact match 0.9683, unhelpful precision 1.0), and production build passed. Generated verification files were backed up and restored; this report is the only committed change. This documentation update goes to `v2` only and does not trigger a redeploy.

**Rollback command** (not executed):

```sh
cd /opt/do-over && ./deploy-main.sh ac6fa98f4daf9fae087a2700352a8552572ed39b
```

This switches back to the previous release using the current shared environment. The environment and compose backups are listed above.

## Clock (Astana)

01:00 start · 02:15 STAGE foundation pushed · 06:30 feature freeze · 07:00 `v2` → `main` · 07:30 deployed · 08:00 walkthrough · 09:00 first submission · 11:00 final submission.

---

## STAGE (OPUS-1)

Owns: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/paper/**`, `src/components/stage/**` (except the ten later sets), `src/components/play/**`, `src/app/play/**`, `src/lib/sound.ts`.

Level 0–1
- [x] Branch `v2` created and pushed; `docs/REDESIGN.md` committed; this file created
- [x] `motion` added (14.14.0)
- [x] Foundation: tokens, fonts (Fraunces, Instrument Sans), grain, shadows in `globals.css`
- [x] Paper primitives in `src/components/paper`: Sheet, Button, Stamp, Kicker, icons
- [x] Header, phone bottom bar, footer in `layout.tsx`; every existing page renders on the new tokens
- [x] `mood.ts` (`stageMood`, `kidMood`) with unit tests incl. monotonicity
- [x] `PaperStage`: planes, proscenium, curtains, pop-up entrance, parallax, weather, limit sign, `size="thumb"`
- [x] `PaperKid`: rig, looks per scene, every pose of REDESIGN 4.3, speech bubble
- [x] Sets: `playground-leave`, `store-candy`, `generic`
- [x] `src/components/stage/README.md` (how to add a prop and a set)
- [x] Play screen: playbill, pace selector (Rehearsal preselected on first visit), heads-up strip, reply dock, countdown after the bubble
- [x] Turn sequence on the stage: slip, underlines, stamps, ledger, storm roll, notes, next line; "Froze"
- [x] Endings (four), the script (debrief), "Do-over from here" rewind, take comparison

Level 3
- [x] Sound (`src/lib/sound.ts`), speaker toggle (preference in localStorage `doover:sound`, default on; starts only from Start)

## MONEY (OPUS-2) — taken over by STAGE at 03:50 on the operator's instruction

No MONEY session had pushed by 03:45. STAGE (OPUS-1) now owns these paths. If an OPUS-2 session starts, read this section and `git log` first and coordinate here before editing.

Owns: `src/server/entitlement.ts`, `src/app/api/{entitlement,checkout,redeem}/**`, Pro checks inside existing API handlers, `src/shared/api.ts` (additions), `src/lib/pro.ts`, `src/components/pro-gate.tsx`, `src/components/paywall/**`, `src/app/pricing/**`, `src/app/pro/**`, `.env.example`, `src/app/page.tsx`, `src/app/progress/**`, `src/lib/{progress,moves,plan,demo-week,store}.ts`.

Level 1
- [x] `stripe` added
- [x] Entitlement cookie (sign/verify, constant time, tests incl. tampered and expired)
- [x] `GET /api/entitlement`, `POST /api/redeem`, `POST /api/entitlement/reset`; 402 `pro_required` in existing handlers; rate limits
- [x] `usePro()` on the client, `isPro()` kept as compatible helper
- [x] Test checkout: `POST /api/checkout`, `GET /api/checkout/confirm`; refuses non-`sk_test_` keys; no button without key
- [x] `<Paywall feature>`, `/pricing` (incl. "Return to Free"), `/pro/welcome`
- [x] E2E: Free → locked scene → paywall → code → unlocked → Return to Free (`e2e/paywall.spec.ts`, runs with `NEXT_PUBLIC_PRO_PREVIEW=false`)
- [x] Landing hero with live `PaperStage`

Level 2
- [x] History `points`; moves, slips, plan, then-and-now, level (pure, tested: `src/lib/progress-v2.test.ts`)
- [x] Demo week (labelled), `/progress` page
- [x] Landing sections 2–6 (three live stages, engine-scored sample reply, accuracy, two facts, pass strip)

### MONEY (OPUS-2) audit — 06:31–07:35, after feature freeze (fixes only)

OPUS-2 started at 06:31, found every MONEY item above already delivered by STAGE, and did not rebuild anything. It audited the work against REDESIGN 7–9 and the MONEY brief, fixed three defects, and ran the first real Stripe test-mode checkout.

- [x] Audit: HMAC-SHA256 pass with `timingSafeEqual`; demo code compared through SHA-256 digests with `timingSafeEqual`; cookie `HttpOnly; SameSite=Lax`, `Secure` in production; 402 `pro_required` on session (non-daily library and custom), custom-scene, coach, transcribe, speak; only `sk_test_` keys accepted; no secret in any response (new test), in `.next` (scanned after a build with a test key in the environment: zero hits), in logs (`route()` logs nothing) or in git history (`git log -S sk_test_51`: none). "Planned price" / "Payments are not connected yet": no occurrences left.
- [x] Fix `dc671e1`: a malformed `doover_pro` cookie (`%E0%A4%A`) made `decodeURIComponent` throw → 500 on every Pro-checked endpoint and on `/api/entitlement`. Now it is no pass (Free). Test added.
- [x] Fix `dc671e1`: `GET /api/checkout/confirm` had no rate limit although each call retrieves a session from Stripe. New bucket `confirm`, 20 per hour per address. Test: malformed session ids redirect to `/pricing?checkout=incomplete` without a cookie and without calling Stripe.
- [x] Fix `dc671e1` + `7da492e`: `/pro/welcome` list had no styles (check above each line); at 375 px the global `.actions > * { flex: 1; min-width: 120px }` made "Play today's meltdown" / "Open the scene library" (and on `/pricing` "Open the scene library" / "Return to Free") overlap. Own wrapping rows, one button per row under 520 px.
- [x] **Real Stripe test checkout, local production build** (`NEXT_PUBLIC_PRO_PREVIEW=false`, operator-supplied `sk_test_` key from the session scratchpad, never in the repository): `/pricing` → "Start 7-day trial" (monthly) → `checkout.stripe.com` sandbox, "7 days free" → card 4242 4242 4242 4242, 12/34, 123 → `/api/checkout/confirm` → `/pro/welcome` "Season pass active (test mode)". `/api/entitlement` → `{"pro":true,"source":"stripe_test","checkout":"stripe_test"}`; `document.cookie` does not show `doover_pro`; `POST /api/session` car-seat 200. "Return to Free" → `pro:false`, car-seat 402 again.
- [x] Browser at 1280 and 375: `/`, `/pricing` (Free and pass), `/pro/welcome`, `/progress`, locked `/play/car-seat` booth: no horizontal overflow, no clipped button label, no console error from the pages.
- `npm run verify` before each push: lint, typecheck, 497 passed / 4 skipped (opt-in Redis), eval gates all PASS (micro-F1 0.9859, exact 0.9683, unhelpful precision 1.0), build PASS. Regenerated `eval/results.json` and `docs/MODEL.md` restored, not committed.

Not done / for the operator:
- Production still runs `16407b2`; the three fixes above are on `v2` only.
- `STRIPE_SECRET_KEY` is still absent on the server, so production offers the demo code only. See "[MONEY → OPERATOR]" below.
- Stripe shows the account name "Sandagrip sandbox" at the top of checkout and prices in KZT first (adaptive pricing; a USD toggle is shown). Renaming the public business name to Do-Over in the Stripe dashboard is optional; nothing in code depends on it.
- Known, accepted: a completed `cs_test_…` id can be confirmed again to mint a fresh 30-day pass on another browser. Test mode only; no money moves.

## BRAND then SETS (ASTRA-1)

Owns: `src/app/icon.svg`, `src/app/apple-icon.*`, `src/app/opengraph-image.tsx`, `src/app/manifest.ts`, `public/brand/**`, then `src/components/stage/props/**` and the ten later files in `src/components/stage/sets/**`.

- [x] Mark, wordmark, lockups, one-colour versions in `public/brand/`
- [x] `icon.svg`, `apple-icon.png`, 192/512/maskable icons, `scripts/brand.ts`
- [x] `manifest.ts`, restyled `opengraph-image.tsx`, `public/brand/README.md`
- [x] Tell STAGE where the lockup component is (Requests below)
- [x] Sets: bedtime, wrong-cup
- [x] Sets: tablet-off, dinner-refusal
- [x] Sets: car-seat, getting-dressed
- [x] Sets: hit-brother, bath-time
- [x] Sets: sharing-toy, leaving-party

## PAGES (ASTRA-2)

Owns: `README.md`, `AGENTS.md`, `src/app/{scenes,playbook,replay,how-it-works,privacy,jury}/**`, `src/app/{error,loading,not-found}.tsx`, `src/components/{daily-teaser,live-demo}.tsx`, `src/lib/reminder.ts`, `e2e/**`, `docs/DEPLOY.md`.

- [ ] Production check written under "Operator notes"
- [x] README rewritten; AGENTS.md points to `docs/REDESIGN.md` — done by STAGE at 03:15 (PAGES had not started); old README archived as `docs/build/V1-README.md`; `/privacy` gained the season-pass cookie and Stripe test-mode section (REDESIGN 7.5)
- [x] `/scenes` as shelves of `PaperStage size="thumb"`; locked scenes open the paywall (POLISH item 5)
- [ ] `/playbook`, `/playbook/shared`, `/replay`, `/how-it-works`, `/privacy`, error, loading, not-found restyled
- [x] `/jury` (not indexed) — built by STAGE at 06:10 because PAGES had not started; footer link added
- [ ] `src/lib/reminder.ts` (.ics) with tests, handed to MONEY
- [x] E2E suite updated, both settings of `NEXT_PUBLIC_PRO_PREVIEW` (STAGE, 03:50)
- [ ] Production walkthrough (REDESIGN 12) after 07:30

## DECK (OPUS-3)

Owns: `deck/**`.

- [ ] Ten-slide deck
- [ ] Screenshots after 08:00 (take comparison card is the hero screenshot)

## POLISH (Opus 5.5, branch `polish` from `fix/rule-negation`)

Owns for this pass: `src/components/play/{turn-slip,takes,debrief,free-tip,play-experience}*`, `src/app/progress/**`, `src/lib/progress*.ts`, `src/llm/customScene.ts`, `src/app/replay/**`, `src/app/scenes/**`. Not touched: paywall, pricing, pro, checkout, entitlement.

- [x] 1. Ledger adds up: whole-number rows, rule rows from the engine's notes (empathy and the limit −6/−3, the limit alone +3, nothing helpful +3, the earlier bribe +5), a labelled cap row; rows sum to `result.delta` on all 37 golden vectors (`takes.test.ts`)
- [x] 2. Free "try instead" on the turning point: for a Free player, the fixed tip (`content/tips.json`) for the turning point's worst unhelpful move, filled with the scene, and "Do-over from here with this" that rewinds and pre-fills the reply (`free-tip.ts`, tested); the coach stays in the season pass
- [x] 3. No raw placeholders: `/progress` fills tip slots from the most recent catalogue scene in local history (or the sample week's), else plain words ("your child", "the limit", "that") with the vocative dropped (`src/lib/tip-slots.ts`, tested over every tip)
- [x] 4. Your own scene reads like a scene: the model now receives the name the scene will use (default "Sam") and is asked for a second-person, named setup and a sentence-case title; a tested tidy-up names a generic "a (fictional) child" and sentence-cases Title Case; `/replay` preselects the age band from "4 year old", "4yo", "four-year-old", "aged six" until the parent picks one (`src/app/replay/age.ts`, tested). Not checked against the live model locally (no key here)
- [x] 5. `/scenes` is three shelves of miniature stages (`PaperStage size="thumb"` at each scene's starting storm), a Today flag, star icons; the full-width "Play today's meltdown" bar is gone; a click anywhere on a locked card opens the paywall; checked at 375, 768, 1280 with no horizontal scroll; Lighthouse desktop performance on `/scenes` (production build) 99 and 99 over two runs; also ticks PAGES' `/scenes` item
- [x] 6. Two silences in a row pause the clock: after a "froze" turn, a second expiry with nothing typed sends nothing, holds the clock and shows "Still there? Take your time." in the dock; typing (25 s window) or Send resumes (`clock.ts`, unit-tested; new e2e in `main-loop.spec.ts`, passing on desktop and mobile)

---

## Cuts

_Record anything cut, by whom, and why._

## Requests

_Format: `[FROM → TO] request` · answer below it._

[STAGE → ALL] Foundation is on `v2`. Use `import { Sheet, Button, ButtonLink, Stamp, Kicker, Icon, Wordmark } from "@/components/paper"`. Plain pages can use the global classes directly: `.sheet` (`data-lift="2|3"`, `data-tone="cream|kraft"`, `data-tilt`, `data-tape`), `.btn` (`data-variant="secondary|ink|ghost"`, `data-size="small|large"`), `.stamp` (`data-kind="helpful|unhelpful|pass"`), `.kicker`, `.paper`, `.fold`, `.notice`, `.empty-state`. Old classes (`.card`, `.button`, `.button-secondary`, `.chip`, `.grid`, `.stack`, `.row`, `.actions`, `.page-heading`, …) still work and are re-papered. Tokens: `--cream --sheet --ink --ink-2 --rule --tomato --tomato-ink (tomato as small text) --teal --teal-ink --mustard --sky --storm --plum --sage --blush --kraft`, shadows `--shadow-1/2/3`, radii `--radius-1/2/3`, durations `--t-1..4`, `--ease-rail`. Fonts: `var(--font-display)` (Fraunces) and `var(--font-body)` (Instrument Sans). Any element with `data-stage-mode` hides the header, footer and bottom bar.
[STAGE → PAGES] The header now has a "Play today's meltdown" link (aria-label) next to the landing hero's; e2e selectors for that name need scoping. The timer labels on /play will change to "Rehearsal · 20 s", "Real time · 8 s", "No timer" in the play-screen step.
[STAGE → BRAND] The header and footer use `<Wordmark />` from `src/components/paper/primitives.tsx` (text + tomato tape hyphen). When your lockup SVG exists, tell me its path here and I will swap it in.

[STAGE → SETS] The stage, three sets and `src/components/stage/README.md` are on `v2`. Start with the README (worked example: `playground-leave`). Look at every set in storm and calm on `/play/stage-lab` (dev only). Props go in `src/components/stage/props/` and are registered in `props/index.tsx`; sets go one file each in `src/components/stage/sets/` and are registered in `sets/index.ts`. `sets/index.ts` and `props/index.tsx` are shared registries: only add lines, never reorder.
[STAGE → MONEY, PAGES] Thumbnails: `<PaperStage size="thumb" scene={scene} state={{ arousal: scene.startArousal, connection: 50, lastDelta: 0, turn: 0 }} />` from `@/components/stage/paper-stage`. Landing hero: `size="full"` with `bubble={{ line: scene.openingLine, action: scene.openingAction }}` and the scene's start state.

[STAGE → PAGES] Play screen and script are on `v2` (REDESIGN 5–6). e2e changes you will need in `e2e/**`:
  1. Pace labels are now "Rehearsal · 20 s", "Real time · 8 s", "No timer" (radio inputs named `pace`). `begin(page, "Timer off")` → `"No timer"`. On a first visit (no history, never picked) Rehearsal is preselected.
  2. After Send a turn plays a ~2.4 s sequence on the stage; the textarea is disabled until it ends (any key or tap skips). `toBeEditable()` waits for it. On the final turn the scene ends **after** the sequence, so `finish()` must wait for `getByTestId("debrief").or(page.getByLabel("What do you say?"))` instead of asserting editable first.
  3. The countdown starts when the child's line has finished appearing (about 0.8–1.4 s after Start or after a turn), so an 8 s timeout fires ~1.5 s later than before.
  4. `data-testid="arousal-value"` is a visually hidden span holding the engine's current value as "57 · settling" immediately after the response (the visible number rolls). `reply-N` is on the slip during play and on each script card; `review-turn-N` and "Do-over from here" are kept.
  5. Unchanged names: "What do you say?", "Send reply", "Listening…", "Start", "Share result", "Try this turn again", "Restart scene", "Retry this turn".
[STAGE → MONEY] When `usePro()` lands I will switch `play-experience.tsx` and `debrief.tsx` from `isPro()`; the paywall should open from the voice toggle and "What could I have said?" (both currently `ProGate`). Tell me the component name and props here.
[BRAND → STAGE] Brand ready: `BrandLockup` in `public/brand/lockup.tsx`. From `src/components/paper/primitives.tsx`, import `{ BrandLockup }` from `"../../../public/brand/lockup"`; your `Wordmark` can return `<BrandLockup decorative />` inside the labelled home link. Defaults to 32px high and automatically uses `/brand/lockup-horizontal-simple.svg`; full master `/brand/lockup-horizontal.svg`, reversed `/brand/lockup-horizontal-reversed.svg`. Please swap your header/footer wrapper; BRAND did not edit those owned paths. Candidate A selected for the clean 16px aperture and continuous silhouette. Full candidate comparison and rules: `public/brand/README.md`.
[BRAND verification] `node --import tsx scripts/brand.ts` PASS (180/192/512/maskable exports, SVG budgets). `npm run verify` PASS after rebasing the latest STAGE play/sound work: 465 tests / 33 files, real Redis, no skipped tests, five evaluation gates, lint/types/production build. Authored marks and outlined Fraunces lockups inspected in Chromium at native 16/32 and large sizes, cream and plum. OG HTTP200, 1200×630, local licensed Fraunces fonts; no runtime CDN. Read-only eval artifacts regenerated by verify are not included in the commit.
[BRAND/SETS → STAGE] Reference browser QA found two existing shared-stage issues: under reduced motion, speech-bubble per-letter class/style differs between server and hydration; the long playground opening line can overflow its bubble at calm20. Please fix in your speech component. Both references have no page overflow at1280/375. SETS will keep using the published planes/types and leave these owner files untouched.

[SETS pair 1] `bedtime`, then `wrong-cup` delivered. Reused window/frame/bed/lamp/rug and fridge/table/chair; added only book, cup and shelf. Reused window/fridge/bed now respect the four-paper budget; the night window contains a moon. Three planes, clear child band, stage-right sign. Browser checked both scenes side by side with playground at 1280/375, full/thumb, storm85/calm20; red cup shifted right after inspection so the storm bubble does not hide it. No horizontal page overflow. Rendered-prop tests enforce <=25 paths, 2–4 palette papers and all three populated planes. `npm run verify`: 467 tests / 34 files, real Redis, all gates/types/lint/build PASS.
[SETS → STAGE] Long storm opening lines clip above the proscenium in bedtime (desktop) and wrong-cup (375px), independently of props. Please constrain/fit the shared speech bubble to the stage; SETS left that owner path untouched and proceeds to the next pair as instructed.

[STAGE → OPERATOR] Season pass is on `v2`. Server environment for production (in `/opt/do-over/shared/.env`): `NEXT_PUBLIC_PRO_PREVIEW=false`, `ENTITLEMENT_SECRET=<openssl rand -hex 32>` (required in production, otherwise nobody can open the pass), `DEMO_CODE=ENCORE`, `STRIPE_SECRET_KEY=sk_test_…` (optional; any key not starting with `sk_test_` is refused). `docker-compose.yml` now passes these three to the container and defaults `NEXT_PUBLIC_PRO_PREVIEW` to `false`.
[STAGE → PAGES] The paywall opens from anywhere with `openPaywall(feature)` from `@/lib/pro`; `<ProGate>` now shows a lock and a "See the season pass" button that opens it, so `/scenes`, `/replay` and `/playbook` already gate correctly. Use `usePro()` (reactive) instead of `isPro()` in new code. e2e: with `NEXT_PUBLIC_PRO_PREVIEW=false` a locked scene at `/play/<id>` shows the ticket booth; the demo code field is labelled "Demo code" and the button "Open the pass"; dev default code is ENCORE.

[STAGE → BRAND/SETS] Done: header and footer now use `BrandLockup` (via `Wordmark`); the bubble no longer branches on reduced motion during render (no hydration mismatch); long lines shrink to fit (font scales with line length and stage width, long lines get a wider bubble). Sun-ray and curly-hair coordinates are rounded so server and client render the same path.
[SETS pair 2] `tablet-off`, then `dinner-refusal` delivered. Reused sofa/lamp/frame/rug and window/table/chair; added tablet back, pendant and dinner plate. Sofa now uses four papers. Browser checked 1280/375, full/thumb, storm85/calm20 side by side with playground: tablet camera/back and plate remain legible, distinct depths, centre and sign clear, no horizontal overflow. `npm run verify` after rebasing season-pass, landing and progress: 492 tests / 36 files, real Redis, five eval gates/types/lint/production build PASS. Shared speech fix rechecked: all 16 desktop/mobile states now fit, header/footer load the new lockup.

[SETS → STAGE] Reduced-motion browser recheck: the per-letter speech mismatch is fixed. A remaining `Cloud` mismatch in `weather.tsx` has SSR `translateY(-190px)` versus client `transform: none` (initial=false). Please keep its initial markup identical too. All speech lines now fit and no page overflows.

[SETS pair 3] `car-seat`, then `getting-dressed` delivered. Empty harness sits inside the car rear opening; garage/house recede behind the driveway, hedge crosses the apron. Bedroom reuses the bed/window, with visible dresser, folded outfit and foreground shoes. Reused home/house/car props now have explicit single facets and bounded palettes (including bookshelf prepared for the next pair). Browser checked 1280/375, full/thumb, storm85/calm20 against playground: harness, drawers and clothes remain legible, child/sign clear, no horizontal overflow. `npm run verify`: 494 tests / 36 files, real Redis, five eval gates/types/lint/production build PASS.

[SETS pair 4] `hit-brother`, then `bath-time` delivered. Board and scattered pieces sit on a reused near rug, bookshelf/sofa establish the room; tiled wall/towel, bubbly bath, duck and reused bath mat establish three bathroom planes. All new props use <=25 paths, 2–4 papers and one facet. Browser checked both against playground at 1280/375, full/thumb, storm85/calm20; no horizontal overflow or page errors. Spot checks of the first four scenes after reused-prop facet repairs show no composition regression. `npm run verify`: 496 tests / 36 files, real Redis, five eval gates/types/lint/production build PASS.
[SETS → STAGE] Follow-up to the speech fit: all lines now remain within the stage, but some calm lines (for example car-seat) still extend beyond the drawn paper bubble. Please size the shared bubble to its text as well as constraining it to the proscenium. Scene props do not overlap it.

[SETS pair 5 / complete] `sharing-toy`, then `leaving-party` delivered. Reused rug, picture, table and door; toy shelf/truck/blocks and paper flags/balloons/cake/gift complete the remaining scenes. Browser checked the final pair against playground at 1280/375, full/thumb, storm85/calm20: truck is distinct from shelf toys, door overlaps only the table end, cake/candles and party decorations remain readable. All ten sets have now passed the 80-view matrix with no runtime page errors or horizontal overflow; final 20-view contact sheet inspected. All props are handwritten SVG using the stage palette, <=25 paths and one facet; all ten three-plane definitions are registered. `npm run verify`: 498 tests / 36 files, real Redis, five eval gates/types/lint/production build PASS. BRAND and all five SETS pairs delivered on v2; shared Cloud hydration and paper-bubble fit follow-ups remain with STAGE above.

[STAGE → PAGES, OPERATOR] PAGES had not pushed by 05:30, so STAGE updated `e2e/**` for the deliberate v2 changes (pace labels, the turn sequence via `e2e/helpers.ts` `turnOrDebrief`, stamps `[data-kind]`, the season-pass gate, the new /progress) and removed two tests whose UI was removed on purpose (the pricing waitlist form, the landing live demo). Run e2e against a production build, not `next dev`: with two workers the dev server pushes HMR rebuilds into open pages and they reload in a loop. Recipe: `NEXT_PUBLIC_PRO_PREVIEW=true npm run build`, `NEXT_PUBLIC_PRO_PREVIEW=true npx next start -p 3000 -H 127.0.0.1`, then `NEXT_PUBLIC_PRO_PREVIEW=true E2E_BASE_URL=http://127.0.0.1:3000 npx playwright test --project=desktop`. Result 05:45: desktop project passes (paywall specs skip with preview on).

[STAGE → OPERATOR, ALL] e2e at ~03:50 against production builds, desktop and mobile projects: preview on 56 passed / 6 skipped / 0 failed; Free mode 60 passed / 2 skipped / 0 failed (includes `e2e/paywall.spec.ts`: locked scene → ENCORE → play → Return to Free, and a wrong code refused). Free-mode recipe: `NEXT_PUBLIC_PRO_PREVIEW=false npm run build`, then `NEXT_PUBLIC_PRO_PREVIEW=false ENTITLEMENT_SECRET=<any long value> DEMO_CODE=ENCORE npx next start -p 3000 -H 127.0.0.1`, then `NEXT_PUBLIC_PRO_PREVIEW=false E2E_BASE_URL=http://127.0.0.1:3000 npx playwright test`. Restart the server between full runs: two runs from one address exceed the 120 turns/hour rate limit and later tests get 429.

[MONEY → OPERATOR] Test checkout verified locally against Stripe test mode (07:15). To turn it on in production, add one line to `/opt/do-over/shared/.env`: `STRIPE_SECRET_KEY=<the sk_test_… key the owner supplied in the MONEY session; not recorded here>`. Keep `NEXT_PUBLIC_PRO_PREVIEW=false`, `DEMO_CODE=ENCORE`, `ENTITLEMENT_SECRET` (already set) and `SITE_URL=https://veltral.aituconnect.kz` (Stripe returns to `${SITE_URL}/api/checkout/confirm`). The key is read at runtime and the compose file loads the whole env file, so no rebuild is needed for the key alone: `docker compose --env-file /opt/do-over/shared/.env -f /opt/do-over/infra/compose.yml up -d --force-recreate --no-build web`. To ship the three MONEY fixes as well, deploy the `v2` head instead (`./deploy-main.sh <sha>`), which also picks up the key. Check afterwards: `curl -s https://veltral.aituconnect.kz/api/entitlement` → `"checkout":"stripe_test"`; `/pricing` shows two "Start 7-day trial" buttons. Never use an `sk_live_` key: the server refuses it and falls back to code-only.
