# Do-Over v2 — status

Source of truth: `docs/REDESIGN.md`. One checklist per session. Tick items and push after every coherent step. A new session must be able to continue from this file and `git log` alone.

Branch: `v2`, cut from `main` at `ac6fa98`, plus the four reviewed local commits of `codex/unified-product` (`2cf51f7` engine: benign handshakes out of unsafe detection, `2ec6ee4` keyboard-accessible metric tables, two docs commits) that were never pushed.

Rules: own paths only (REDESIGN section 10). `npm run verify` before every push. `git pull --rebase origin v2` before every push. No force-push. Requests to another owner go in the "Requests" section at the bottom.

## Operator notes (production)

_PAGES writes the production findings here (step 1)._

## Clock (Astana)

01:00 start · 02:15 STAGE foundation pushed · 06:30 feature freeze · 07:00 `v2` → `main` · 07:30 deployed · 08:00 walkthrough · 09:00 first submission · 11:00 final submission.

---

## STAGE (OPUS-1)

Owns: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/paper/**`, `src/components/stage/**` (except the ten later sets), `src/components/play/**`, `src/app/play/**`, `src/lib/sound.ts`.

Level 0–1
- [x] Branch `v2` created and pushed; `docs/REDESIGN.md` committed; this file created
- [x] `motion` added (14.14.0)
- [ ] Foundation: tokens, fonts (Fraunces, Instrument Sans), grain, shadows in `globals.css`
- [ ] Paper primitives in `src/components/paper`: Sheet, Button, Stamp, Kicker, icons
- [ ] Header, phone bottom bar, footer in `layout.tsx`; every existing page renders on the new tokens
- [ ] `mood.ts` (`stageMood`, `kidMood`) with unit tests incl. monotonicity
- [ ] `PaperStage`: planes, proscenium, curtains, pop-up entrance, parallax, weather, limit sign, `size="thumb"`
- [ ] `PaperKid`: rig, looks per scene, every pose of REDESIGN 4.3, speech bubble
- [ ] Sets: `playground-leave`, `store-candy`, `generic`
- [ ] `src/components/stage/README.md` (how to add a prop and a set)
- [ ] Play screen: playbill, pace selector (Rehearsal preselected on first visit), heads-up strip, reply dock, countdown after the bubble
- [ ] Turn sequence on the stage: slip, underlines, stamps, ledger, storm roll, notes, next line; "Froze"
- [ ] Endings (four), the script (debrief), "Do-over from here" rewind, take comparison

Level 3
- [ ] Sound (`src/lib/sound.ts`), speaker toggle

## MONEY (OPUS-2)

Owns: `src/server/entitlement.ts`, `src/app/api/{entitlement,checkout,redeem}/**`, Pro checks inside existing API handlers, `src/shared/api.ts` (additions), `src/lib/pro.ts`, `src/components/pro-gate.tsx`, `src/components/paywall/**`, `src/app/pricing/**`, `src/app/pro/**`, `.env.example`, `src/app/page.tsx`, `src/app/progress/**`, `src/lib/{progress,moves,plan,demo-week,store}.ts`.

Level 1
- [ ] `stripe` added
- [ ] Entitlement cookie (sign/verify, constant time, tests incl. tampered and expired)
- [ ] `GET /api/entitlement`, `POST /api/redeem`, `POST /api/entitlement/reset`; 402 `pro_required` in existing handlers; rate limits
- [ ] `usePro()` on the client, `isPro()` kept as compatible helper
- [ ] Test checkout: `POST /api/checkout`, `GET /api/checkout/confirm`; refuses non-`sk_test_` keys; no button without key
- [ ] `<Paywall feature>`, `/pricing` (incl. "Return to Free"), `/pro/welcome`
- [ ] E2E: Free → locked scene → paywall → code → unlocked → Return to Free
- [ ] Landing hero with live `PaperStage`

Level 2
- [ ] History `points`; moves, slips, plan, then-and-now, level (pure, tested)
- [ ] Demo week (labelled), `/progress` page
- [ ] Landing sections 2–6

## BRAND then SETS (ASTRA-1)

Owns: `src/app/icon.svg`, `src/app/apple-icon.*`, `src/app/opengraph-image.tsx`, `src/app/manifest.ts`, `public/brand/**`, then `src/components/stage/props/**` and the ten later files in `src/components/stage/sets/**`.

- [ ] Mark, wordmark, lockups, one-colour versions in `public/brand/`
- [ ] `icon.svg`, `apple-icon.png`, 192/512/maskable icons, `scripts/brand.ts`
- [ ] `manifest.ts`, restyled `opengraph-image.tsx`, `public/brand/README.md`
- [ ] Tell STAGE where the lockup component is (Requests below)
- [ ] Sets: bedtime, wrong-cup
- [ ] Sets: tablet-off, dinner-refusal
- [ ] Sets: car-seat, getting-dressed
- [ ] Sets: hit-brother, bath-time
- [ ] Sets: sharing-toy, leaving-party

## PAGES (ASTRA-2)

Owns: `README.md`, `AGENTS.md`, `src/app/{scenes,playbook,replay,how-it-works,privacy,jury}/**`, `src/app/{error,loading,not-found}.tsx`, `src/components/{daily-teaser,live-demo}.tsx`, `src/lib/reminder.ts`, `e2e/**`, `docs/DEPLOY.md`.

- [ ] Production check written under "Operator notes"
- [ ] README rewritten; AGENTS.md points to `docs/REDESIGN.md`
- [ ] `/scenes` as shelves of `PaperStage size="thumb"`; locked scenes open the paywall
- [ ] `/playbook`, `/playbook/shared`, `/replay`, `/how-it-works`, `/privacy`, error, loading, not-found restyled
- [ ] `/jury` (not indexed)
- [ ] `src/lib/reminder.ts` (.ics) with tests, handed to MONEY
- [ ] E2E suite updated, both settings of `NEXT_PUBLIC_PRO_PREVIEW`
- [ ] Production walkthrough (REDESIGN 12) after 07:30

## DECK (OPUS-3)

Owns: `deck/**`.

- [ ] Ten-slide deck
- [ ] Screenshots after 08:00 (take comparison card is the hero screenshot)

---

## Cuts

_Record anything cut, by whom, and why._

## Requests

_Format: `[FROM → TO] request` · answer below it._
