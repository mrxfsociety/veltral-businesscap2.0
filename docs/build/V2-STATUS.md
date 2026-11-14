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
- [x] Foundation: tokens, fonts (Fraunces, Instrument Sans), grain, shadows in `globals.css`
- [x] Paper primitives in `src/components/paper`: Sheet, Button, Stamp, Kicker, icons
- [x] Header, phone bottom bar, footer in `layout.tsx`; every existing page renders on the new tokens
- [x] `mood.ts` (`stageMood`, `kidMood`) with unit tests incl. monotonicity
- [x] `PaperStage`: planes, proscenium, curtains, pop-up entrance, parallax, weather, limit sign, `size="thumb"`
- [x] `PaperKid`: rig, looks per scene, every pose of REDESIGN 4.3, speech bubble
- [x] Sets: `playground-leave`, `store-candy`, `generic`
- [x] `src/components/stage/README.md` (how to add a prop and a set)
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

[STAGE → ALL] Foundation is on `v2`. Use `import { Sheet, Button, ButtonLink, Stamp, Kicker, Icon, Wordmark } from "@/components/paper"`. Plain pages can use the global classes directly: `.sheet` (`data-lift="2|3"`, `data-tone="cream|kraft"`, `data-tilt`, `data-tape`), `.btn` (`data-variant="secondary|ink|ghost"`, `data-size="small|large"`), `.stamp` (`data-kind="helpful|unhelpful|pass"`), `.kicker`, `.paper`, `.fold`, `.notice`, `.empty-state`. Old classes (`.card`, `.button`, `.button-secondary`, `.chip`, `.grid`, `.stack`, `.row`, `.actions`, `.page-heading`, …) still work and are re-papered. Tokens: `--cream --sheet --ink --ink-2 --rule --tomato --tomato-ink (tomato as small text) --teal --teal-ink --mustard --sky --storm --plum --sage --blush --kraft`, shadows `--shadow-1/2/3`, radii `--radius-1/2/3`, durations `--t-1..4`, `--ease-rail`. Fonts: `var(--font-display)` (Fraunces) and `var(--font-body)` (Instrument Sans). Any element with `data-stage-mode` hides the header, footer and bottom bar.
[STAGE → PAGES] The header now has a "Play today's meltdown" link (aria-label) next to the landing hero's; e2e selectors for that name need scoping. The timer labels on /play will change to "Rehearsal · 20 s", "Real time · 8 s", "No timer" in the play-screen step.
[STAGE → BRAND] The header and footer use `<Wordmark />` from `src/components/paper/primitives.tsx` (text + tomato tape hyphen). When your lockup SVG exists, tell me its path here and I will swap it in.

[STAGE → SETS] The stage, three sets and `src/components/stage/README.md` are on `v2`. Start with the README (worked example: `playground-leave`). Look at every set in storm and calm on `/play/stage-lab` (dev only). Props go in `src/components/stage/props/` and are registered in `props/index.tsx`; sets go one file each in `src/components/stage/sets/` and are registered in `sets/index.ts`. `sets/index.ts` and `props/index.tsx` are shared registries: only add lines, never reorder.
[STAGE → MONEY, PAGES] Thumbnails: `<PaperStage size="thumb" scene={scene} state={{ arousal: scene.startArousal, connection: 50, lastDelta: 0, turn: 0 }} />` from `@/components/stage/paper-stage`. Landing hero: `size="full"` with `bubble={{ line: scene.openingLine, action: scene.openingAction }}` and the scene's start state.
