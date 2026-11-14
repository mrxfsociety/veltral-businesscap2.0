# Do-Over v2 — "Paper Theatre" redesign and product upgrade

Written 15 November 2026, 01:00 Astana time. Deadline: 12:00 Astana time today.

This document is the source of truth for the v2 work. Where it disagrees with `docs/SPEC.md`, `AGENTS.md` or a file in `docs/build/`, this document wins (section 13 lists what is superseded). `docs/SPEC.md` stays the source of truth for the engine, the server API, safety and the honesty rules. The repository owner authorises every change described here, including the additive changes to `src/shared/api.ts`.

Words used on purpose: **must** = required; **should** = do it unless it costs more than 20 minutes; **may** = optional.

---

## 1. Why this work exists

Do-Over already has the hard part: a deterministic, tested engine that turns a parent's free-text reply into tags, a state change and a truthful outcome. What it does not have is a product around that engine. Today the play screen is a headline, a text box and a card of chips below the fold. It reads as a form.

The jury opens the production link between 12:00 and 15:00 Astana time, in a browser, without an account, tries its own inputs and reads this repository. Weights: 40% does it work, 20% what the user pays for and why they return, 15% problem and user, 15% business potential, 10% originality.

What the organisers' FAQ says that changes the build:

1. A pricing page without a paywall is not enough. A working paywall with a clear price is the minimum; a test-mode checkout the jury can complete is a plus. Showing a promo code on screen is an accepted way to let the jury through.
2. "Why they come back" is judged as subscription renewal, not daily opens. At least one return mechanic must be built, working and visible on the first visit: progress, a personal plan, accumulated data.
3. A flow where the user fails, trains, then solves a similar task better is called "strong proof of value". Do-Over's do-over is exactly that and must be made visible.
4. An LLM product must be more than a wrapper: a structured path, accumulated progress, personalisation over time, game mechanics.
5. A guest mode with clearly labelled demo data is welcome so the jury can see a week of use in three minutes.
6. Dead buttons cost points. Hide or remove what does not work.
7. The repository is read. Keep it clean; no secrets.

Problems observed on production (commit `afb4380`, 15 November, 00:30):

- Production runs an older commit than `main`.
- The 8-second timer starts the instant the first line appears. A first-time visitor loses turn 1 while still reading.
- The result of a turn renders below the reply box, outside the viewport on a laptop. The most valuable moment of the product is invisible without scrolling.
- A turn came back "Tagged by rules only" although `/api/health` reports the OpenAI provider as configured. Model availability in production must be verified.
- `NEXT_PUBLIC_PRO_PREVIEW=true` unlocks everything, so no visitor ever meets a paywall.
- The landing page repeats "we have not measured…" three times. One honest sentence is enough.

The daily scene the jury will see is **`playground-leave`** ("Leaving the playground", Zoe, ages 4–5, spirited, par 3): `dayKey` is the New York date, which becomes 2026-11-15 at 10:00 Astana time. Confirm with `sceneOfTheDay`. This scene gets the most polish.

## 2. Rules that do not bend

1. **The engine is read-only.** `src/engine`, `src/llm`, `content/scenes.json`, `content/par.json`, `eval/`, `docs/reference/` are not edited. The model never decides the outcome.
2. **The interface never invents a number.** Every figure on screen comes from an engine result, `eval/results.json`, a real Redis counter, or a tested pure function over the user's own local history. Sample data is allowed only where section 8.6 says so, and is labelled.
3. **`npm run verify` passes on every push** to the `v2` branch.
4. **Nothing half-wired ships.** A control that does not work is removed.
5. **The core loop needs no account and no payment:** landing page to a finished daily scene in under 90 seconds.
6. **Every level of section 11 is shippable on its own.** If time runs out we ship the last complete level.
7. **No secrets in the repository.** Keys live in the server's environment file.
8. All honesty and safety rules of SPEC section 12 remain in force.

## 3. Art direction: Paper Theatre

### 3.1 The idea

A toy theatre made of cut paper. The parent is rehearsing a scene; a do-over is another take. Every scene is a small pop-up stage: layers of cut paper with real depth, a jointed paper child, weather on strings.

Why this and not 3D or pixel art:

- The metaphor is the product. Rehearsal, scene, take, curtain: the vocabulary is already theatre.
- Paper is gentle. A paper puppet in a paper storm is neither distressing nor cute; it sits between "clinical" and "childish", which is where SPEC section 14 asks us to be.
- Flat cut shapes with shadows are what SVG and CSS render perfectly. Nothing is approximated, so nothing looks cheap. Depth comes from CSS 3D transforms (hinges, parallax, perspective), not from WebGL, and runs at 60 fps on a mid-range phone.
- The scene is a direct function of engine state. The storm is the arousal number. The child's distance is the connection number. A judge sees the engine working.

Vocabulary used in the interface: scene, take, turn, stage, curtain, the script (debrief), your lines (playbook), season pass (Pro). The measured quantity is called **Storm** in the interface (the engine calls it arousal; `/how-it-works` explains the mapping).

### 3.2 Never

These are the marks of a generated, generic product. None of them may appear.

- AI-generated raster images, anywhere. Every visual is vector or CSS, authored in code.
- Emoji used as icons or decoration. (The share text's coloured squares are content and stay.)
- Purple-to-blue gradients, gradient text, glass or blur cards, neon glow.
- Inter, Roboto, Arial or the system font stack. Icon packs (Lucide, Heroicons, Font Awesome).
- A row of three cards with icon, title and text. Fake testimonials, logos, counters.
- Pure white `#fff`, pure black `#000`, generic shadows such as `0 10px 30px rgba(0,0,0,.1)`.
- `linear` or `ease` timing. Elements that fade in from nowhere.
- Pill-shaped everything. Paper has cut corners.
- Stock photos. Photos of children.

### 3.3 Palette (construction paper)

Define as CSS custom properties in `src/app/globals.css`. Check every text pair with axe; if a pair fails AA, change lightness, never hue.

| Token | Value | Use |
| --- | --- | --- |
| `--cream` | `#F4ECDD` | The table: app background |
| `--sheet` | `#FBF6EA` | Sheets and cards |
| `--ink` | `#1E2740` | Text, outlines |
| `--ink-2` | `#56607A` | Secondary text |
| `--rule` | `#D9CDB8` | Hairlines, fold lines |
| `--tomato` | `#C8431F` | The one interface accent: primary button, rising storm, unhelpful stamp |
| `--teal` | `#2B7A72` | Helpful stamp, calm, success |
| `--mustard` | `#E2A93B` | Stars, sun, streak |
| `--sky` | `#A8CBD3` | Calm sky |
| `--storm` | `#39435C` | Storm clouds, storm tint |
| `--plum` | `#5E3B55` | Curtains, season pass |
| `--sage` | `#98AE95` | Grass, plants |
| `--blush` | `#F0B49C` | Cheeks, soft props |
| `--kraft` | `#C4A075` | Proscenium, sticks, cardboard |

Skin papers: `#F3D3BC #E3B48F #C68E6A #9A6748 #6E4530`. Hair papers: `#2A1F1B #5A3B24 #A8662E #D9A441 #B5452E`.

The interface chrome uses ink, cream, sheet and tomato only. The other colours belong to the stage and to semantic marks (teal = helpful, tomato = unhelpful, always with an icon and a word, never colour alone).

### 3.4 Type

Two families, loaded with `next/font/google` (check the current Next.js font documentation for names and variable axes before writing the import):

- **Fraunces** (variable) for display, the child's lines and numerals. Headlines: weight about 640, soft axis raised, letter-spacing −0.02em; the second line of a headline in italic. Numerals use `font-variant-numeric: tabular-nums`.
- **Instrument Sans** for interface and body text, weights 400, 500, 600.

Scale: h1 `clamp(2.4rem, 6vw, 4.5rem)`; h2 `clamp(1.7rem, 3.4vw, 2.6rem)`; body 16–17px, line-height 1.55; kicker labels 12px, weight 600, uppercase, letter-spacing 0.12em. The child's line scales from 28px (calm) to 56px (storm ≥ 85).

### 3.5 Material

- **Grain.** One SVG `feTurbulence` texture as a data URI, multiplied over paper surfaces at 6–10% opacity through a `.paper` utility. It must be visible when you look for it and invisible when you do not.
- **Shadows.** Paper casts two shadows: a tight contact line and a soft ambient one, tinted with ink, light from the top left. Tokens `--shadow-1` (resting), `--shadow-2` (raised), `--shadow-3` (lifted). On the stage use `filter: drop-shadow()` so shadows follow the cut shape, with offset proportional to the layer's depth.
- **Edges.** Radius 2–6px. Hero sheets may sit rotated up to 1.2°. Set pieces are drawn with slightly irregular paths, as if cut with scissors. An SVG displacement filter may roughen edges on static layers only, never on animated ones.
- **Folds.** A pop-up piece shows its hinge: a hairline in `--rule` and a faint shade on the folded side.

### 3.6 Icons

A small set of our own cut-paper glyphs in one file, `src/components/paper/icons.tsx`: check, cross, rewind, star, cloud, sun, moon, lock, ticket, flame, speaker, microphone, play, copy, share, arrow. Solid shapes, 24px grid, `currentColor`.

### 3.7 Motion

One library is allowed for animation: `motion` (check its current documentation). Paper moves in four ways and no others:

| Move | Used for | Feel |
| --- | --- | --- |
| **Hinge** | Stage layers and pop-up cards entering | `rotateX` from the floor, spring (stiffness 260, damping 22), 80 ms stagger |
| **Rail** | Sheets and set pieces sliding in from the wings | `translateX` with 2° sway, 420 ms, `cubic-bezier(.2,.8,.2,1)` |
| **String** | Clouds, sun, moon, the limit sign | Drop with a pendulum settle, spring (stiffness 120, damping 8) |
| **Stamp** | Tags, stars | Scale 1.4 → 1 with ±6° rotation, spring (stiffness 600, damping 28) |

Durations: 120, 240, 420, 700 ms. Text may fade. Exits reverse the entrance. Only `transform` and `opacity` animate. With `prefers-reduced-motion`, all movement is replaced by a 150 ms cross-fade and the weather is static.

### 3.8 Sound (level 3)

Synthesised with Web Audio, no audio files: a paper rustle, a stamp thud, a soft chime at calm, and rain whose volume follows the storm number. A speaker toggle is always visible during play; the choice is stored in settings. Sound starts only after the Start button.

### 3.9 Voice of the copy

Short, warm, dry. Speaks to a tired adult as an equal. No exclamation marks from us (the child has enough). No "unlock your potential", no "journey", no "AI-powered". Examples: "You froze. It happens. That is why we rehearse." · "Take 2." · "One sentence moved the storm 26 points."

## 4. The stage

All of this lives in `src/components/stage/`. It is presentational: it receives engine state and renders. It never calls the API and never computes an outcome.

### 4.1 Structure

```
<PaperStage scene set mood phase>
  proscenium      kraft arch, static, on top
  curtains        plum paper, states: closed | open | falling
  plane sky       depth 0.00   wall or sky, sun or moon
  plane far       depth 0.25   far set pieces
  clouds          depth 0.40   weather on strings
  plane mid       depth 0.50   main set pieces, the limit sign
  plane kid       depth 0.70   <PaperKid>
  plane front     depth 1.00   foreground pieces, rain
  overlay         HTML: speech bubble, stamps, ledger (real text, accessible)
</PaperStage>
```

Each plane is an absolutely positioned inline SVG (`viewBox="0 0 400 300"`), `transform-origin: bottom`, shadow offset proportional to depth. The stage keeps a 4:3 ratio on phones and 16:10 from 1024px, maximum width 920px.

- **Pop-up entrance.** On Start the curtains part (700 ms) and the planes hinge up from the floor, back to front.
- **Parallax.** Pointer position shifts each plane by `depth × 14px` horizontally and `depth × 6px` vertically, inside a container with CSS `perspective`. On touch devices a slow idle drift replaces it. Off under reduced motion.
- **The limit sign.** The scene's limit ("It's time to leave the playground") stands on a small paper sign on a stick at stage right while `limitIntact` is true. On `GIVE_IN` it falls flat.

### 4.2 Mood: one pure function

`src/components/stage/mood.ts` exports `stageMood({ arousal, connection, lastDelta, outcome, turn })` and `kidMood(...)`. Both are pure, deterministic and unit-tested (including monotonicity: more arousal never produces less rain). Anything that looks random (lightning timing, small pose variety) is seeded from the session id and turn index.

| Engine value | What the stage does |
| --- | --- |
| arousal ≤ 25 | No clouds. Sun rises on its stick (moon and stars in night scenes). Warm light. |
| arousal 26–100 | Clouds: `1 + floor((a − 26) / 15)`, up to 5; they hang lower and darken from cream to `--storm`. |
| arousal ≥ 45 | Rain: up to 36 paper strands, faster as it rises. |
| arousal ≥ 85 | Lightning: a paper zigzag and an 80 ms flash every few seconds. |
| arousal, continuous | Storm tint over the set (multiply, up to 38% opacity). Slight sway of the whole stage. |
| connection ≥ 70 | The child steps toward the front of the stage and faces the audience. |
| connection ≤ 30 | The child backs toward the wing and turns away. |
| lastDelta | Label next to the number: "rising", "settling" or "steady". |

### 4.3 The child: `PaperKid`

A jointed paper doll drawn in SVG: head, hair, torso, two arms, two legs, face pieces. Limbs rotate at their joints with springs. About 40 paths. One rig, twelve looks.

- **Looks** (`kids.ts`): for each scene id a skin paper, hair shape and colour, top and bottom colours. A varied cast. Custom scenes pick a look by a stable hash of the scene id. Age band changes proportions: toddlers have larger heads and shorter legs.
- **Mood** from `kidMood`:

| Storm | Pose | Face |
| --- | --- | --- |
| ≥ 85 | On the floor, kicking | Wailing, tears flying, cheeks flushed |
| 70–84 | Standing, stomping, arms up | Shouting, brows down |
| 55–69 | Arms crossed, turned a little away | Pout |
| 40–54 | Head down, shoulders shaking | Wobbling mouth, a tear |
| 26–39 | Standing, arms loose, slow breath | Flat mouth, eyes up |
| ≤ 25, limit held | Arms open, small step forward | Small smile |
| ≤ 25, gave in | Holding the wanted thing, looking away | Pleased |

Shake amplitude, cheek flush and tear rate vary continuously with the number inside each band.

- **Speech bubble.** A cut-paper bubble in the HTML overlay. Its outline is spiky in a storm and round when calm. The line appears letter by letter (capped at 600 ms). The engine already upper-cases the line at ≥ 80; do not restyle the casing. The italic action sits under it as a stage direction. The existing `aria-live` announcement of the line is kept.

### 4.4 Sets

A set is data plus a small library of props.

```ts
type SceneSet = {
  timeOfDay: "day" | "golden" | "evening" | "night";
  wall: PaperColor; floor: PaperColor;
  far: Placement[]; mid: Placement[]; front: Placement[];
  sign: { x: number; y: number };
};
type Placement = { prop: PropId; x: number; y: number; scale?: number; flip?: boolean; tint?: PaperColor };
```

Props are SVG components of at most 25 paths, two to four paper colours, one fold or shadow detail, in `src/components/stage/props/`. Sets are in `src/components/stage/sets/`, one file per scene, plus `generic.ts`.

| Scene | Time | Far | Mid | Front |
| --- | --- | --- | --- | --- |
| `playground-leave` | golden | trees, low sun | slide, swing | bench, backpack |
| `store-candy` | day | shelves | candy rack, checkout belt | shopping cart |
| `wrong-cup` | day | window, fridge | table, blue cup, red cup on a high shelf | chair |
| `car-seat` | day | house, garage door | car with open door, car seat | hedge |
| `bath-time` | evening | tiled wall, towel hook | bathtub with bubbles | rubber duck, bath mat |
| `tablet-off` | evening | lamp, picture frame | sofa | rug, tablet face down |
| `getting-dressed` | day | window, dresser | bed with clothes | shoes |
| `sharing-toy` | day | toy shelf | rug, dump truck | blocks |
| `bedtime` | night | window with moon | bed, glowing lamp | book |
| `hit-brother` | day | bookshelf | sofa | board game scattered on the rug |
| `dinner-refusal` | evening | window, pendant lamp | table, plate | chair |
| `leaving-party` | golden | bunting, balloons | cake table | door, gift |

Custom scenes use `generic.ts`, which picks one of six rooms (home, kitchen, bedroom, outdoors, shop, car) from keywords in the scene's `place`.

The first two sets are built by the stage lead as reference quality. The other ten follow that pattern exactly.

**Thumbnails.** `<PaperStage>` accepts `size="thumb"`: static, no weather animation, no parallax. The scene shelf, the landing page and the debrief reuse it.

### 4.5 Budgets

No WebGL. The stage adds at most 40 rain elements. SVG filters are never applied to moving layers. The play page stays interactive on a phone with the keyboard open. The stage is `aria-hidden`; a visually hidden sentence describes the state ("Storm 75, rising. Zoe is stomping.").

## 5. The play screen

The site header and footer are hidden during play. A small "Leave" control and the sound toggle remain.

### 5.1 Layout

- **Phone (375px).** Stage on top, full width. The reply dock is fixed to the bottom above the safe area. When the keyboard opens (`visualViewport`), the stage shrinks to about 30% of the viewport height and stays visible. The page never scrolls horizontally.
- **Laptop (≥ 1024px).** Stage centred. Reply dock directly under the stage as one wide paper slip. A narrow column to the right, "The script so far", lists earlier turns.
- The result of a turn appears **on the stage**, never below the dock.

### 5.2 The playbill (intro state)

Closed curtains with a paper playbill pinned to them: place, child's name, age band and temperament, the setup sentence, the limit on its sign, par, the pace selector, the voice toggle (season pass), the line about replies being sent to an AI model, the disclaimer, and Start.

Pace selector: **Rehearsal · 20 s**, **Real time · 8 s**, **No timer**. If the browser has no history and the user has never changed the setting, Rehearsal is preselected; otherwise the stored setting is used. After a first calm ending, the debrief invites: "Ready for real time? Eight seconds."

### 5.3 Heads-up strip

Inside the top of the proscenium: "Take 1 · Turn 2 of 8" on the left; the Storm number large in Fraunces with its trend word; under it a thin thread for Connection with its number. `data-testid="arousal-value"` stays on the number.

### 5.4 Reply dock

Label "What do you say?" (kept, the tests use it), textarea up to 300 characters, the countdown ring around the Send button, "Send reply" (kept), character count, microphone button in voice mode. The timer rules of SPEC section 4.3 are unchanged, with one addition: the countdown starts when the child's bubble has finished appearing, not before.

### 5.5 What happens after Send

Target 2.4 seconds in total. Any tap or key press skips to the end state. Under reduced motion the end state appears at once.

1. The input locks. The reply flies up to the stage as a paper slip.
2. The quoted parts are underlined, left to right.
3. Each tag is stamped onto the slip: teal with a check for helpful, tomato with a cross for unhelpful, 140 ms apart. An empty list stamps "No clear move".
4. **The ledger.** One row per entry of `result.effects`, with the tag's label and its value ("Named the feeling −14"). Then the notes that changed the sum, as plain sentences. Then the total, which is `result.delta`. The interface shows only numbers the engine returned; if the rows do not visibly add up to the total, the total row is labelled "after bonuses and caps".
5. The Storm number rolls to the new value, the big delta ("−18") lands beside it, the weather and the child move to the new mood.
6. Up to two notes (priority order of SPEC section 5.7) slide in from the wings as torn strips.
7. The child's next line appears. The countdown restarts.

A timed-out, empty turn is stamped "Froze" with the line "You froze. It happens. That is why we rehearse."

The small provenance line ("Tagged by rules only" or "Tagged with the model") stays on the slip.

### 5.6 States

Loading (curtains closed, "Setting the stage…"), session lost (offer a restart), rate limited (explain, show when to retry), provider down (play continues in rules-only mode and says so). Every existing error path keeps working.

## 6. Endings, the script, and the rewind

### 6.1 Endings

| Outcome | What the stage does | Title (unchanged) |
| --- | --- | --- |
| `calm_limit_held` | Clouds lift on their strings, the sun or moon rises, paper confetti, the child steps forward. Stars are stamped one by one. The limit sign still stands. | "Calm, and the limit held." |
| `calm_gave_in` | The storm stops abruptly. The limit sign falls flat. Colours stay muted. No confetti. | "Quiet, but the limit is gone." |
| `out_of_turns` | The curtain comes down on the storm. | "Still melting down." |
| `stopped_unsafe` | Everything stops. House lights up, plain sheet, the text and resources of SPEC section 12.2. No score, no share, no flourish. | "Let's pause here." |

### 6.2 The script (debrief)

- Header: title, stars, "Calm in 3 · par 3", the grid squares, points.
- The turns hang as cards on a clothesline. Each card shows the turn number, a small weather mark and the delta. The turning point carries a mustard flag.
- An open card shows the reply with underlines, stamps, the ledger, every note, and the child's answer.
- On every card: **"Do-over from here"**. On eligible cards: "Save to playbook". On the card with the largest rise: "What could I have said?" (season pass).
- Daily scene only: the standing, exactly as SPEC section 8.3.
- Share: the text of SPEC section 4.3, unchanged.
- "Tomorrow: {title of tomorrow's scene}", computed on the server from the rotation.
- Buttons: Play again, Scenes, Replay your own.
- `data-testid="debrief"`, `reply-N` and `review-turn-N` are kept.

### 6.3 The rewind (the signature moment)

"Do-over from here" does not reload anything. The stage rewinds: the later cards flutter off the line, the Storm number runs backwards to its value before that turn, the weather and the child return to that moment, a paper clapperboard snaps "Take 2", and the dock unlocks. About 900 ms.

### 6.4 Take comparison (the proof)

The client keeps the turns a do-over replaced, in memory only. When the replayed turn has a result, the script shows both takes side by side:

> **Take 1** "Stop crying or we're never coming back." · Threat, Dismissed the feeling · **+24**
> **Take 2** "You're sad to leave. It's time to go. Slide or swing for the last turn?" · Named the feeling, Held the limit, Offered a choice · **−18**
> One sentence moved the storm 42 points.

Both numbers are engine results already received. This card is the single best screenshot of the product and goes into the pitch deck.

## 7. Money: paywall, entitlement, test checkout

Free and season pass (Pro) follow the table in SPEC section 10 unchanged: $9.99 a month or $59.99 a year. New: a 7-day free trial on both plans.

### 7.1 Entitlement

- A signed, `httpOnly`, `Secure`, `SameSite=Lax` cookie `doover_pro`: `base64url(payload) + "." + base64url(HMAC-SHA256(payload, ENTITLEMENT_SECRET))`, payload `{ v: 1, src: "stripe_test" | "code", iat, exp }`, 30 days. Constant-time comparison. Unit-tested, including tampered and expired cookies. Code in `src/server/entitlement.ts`.
- The server enforces it. Without entitlement: `POST /api/session` for a library scene other than today's and for custom scenes, `POST /api/custom-scene`, `POST /api/coach`, `POST /api/transcribe` and `POST /api/speak` answer 402 `{ error: "pro_required" }`. The playbook limit stays a client rule (the playbook is local).
- The client reads `GET /api/entitlement` once and caches it. `usePro()` replaces the build-time `isPro()`; `isPro()` stays as a thin compatible helper so existing call sites keep compiling.
- `NEXT_PUBLIC_PRO_PREVIEW=true` still unlocks everything for local development and tests. **Production sets it to `false`.**

### 7.2 New endpoints (additive, schemas in `src/shared/api.ts`)

```ts
// GET /api/entitlement
EntitlementResponse = { pro: boolean; source: "stripe_test" | "code" | "preview" | null;
                        checkout: "stripe_test" | "code_only"; demoCode: string | null }
// POST /api/checkout            { plan: "monthly" | "yearly" } → { url: string }     503 checkout_unavailable without a key
// GET  /api/checkout/confirm    ?session_id=…  → verifies the session with Stripe, sets the cookie, redirects to /pro/welcome
// POST /api/redeem              { code: string } → { ok: true }                      400 invalid_code
// POST /api/entitlement/reset   → { ok: true }   clears the cookie
```

Rate limit: 10 checkout or redeem calls per hour per IP.

### 7.3 Test checkout

- The official `stripe` package (read the current Checkout documentation before writing the call). One Checkout Session in subscription mode with inline `price_data` (999 or 5999 cents, month or year), `trial_period_days: 7`, success URL `/api/checkout/confirm?session_id={CHECKOUT_SESSION_ID}`, cancel URL `/pricing`. No webhooks: the confirm route retrieves the session and checks that it is complete.
- **The server refuses any key that does not start with `sk_test_`.** A real charge is impossible by construction.
- Without `STRIPE_SECRET_KEY` the checkout button is not rendered and only the code path is offered.
- **Demo code.** `DEMO_CODE` in the environment (production value: `ENCORE`). The paywall shows it: "Reviewing Do-Over? Enter ENCORE to open the season pass on this device. Demo access, no payment."
- Wherever checkout is offered, a visible notice: "Test mode. No real charge. Card 4242 4242 4242 4242, any future date, any CVC."
- `/pro/welcome`: "Season pass active (test mode)", what is now open, a button to today's scene.
- `/pricing` shows the current state and a "Return to Free" control (calls reset) so a reviewer can see both sides.

### 7.4 Where the paywall appears

One component, `<Paywall feature>`, a paper ticket booth as a modal sheet. It opens when a Free visitor taps a locked scene, "What could I have said?", "Replay your own", the voice toggle, or tries to save a sixth playbook line. After the first finished daily scene of the day, the script shows one quiet card: "Had a real one today? Replay it here." linking to the paywall.

The paywall states what the pass includes, the two prices with the yearly saving, the trial, the test notice, the checkout button, and the demo code line. No dark patterns, no countdown timers, no pre-ticked boxes.

### 7.5 Copy that changes

"Planned price" and "Payments are not connected yet" are removed. `/privacy` gains: the entitlement cookie; checkout is handled by Stripe in test mode; no card data reaches our server.

## 8. Reasons to return and to renew

All of this is computed from the browser's local history by pure, tested functions in `src/lib/`. It must be visible on the first visit: an empty state that shows what will fill up is part of the design.

### 8.1 History

`HistoryEntrySchema` gains an optional `points` (integer 0–1000) written from the engine's `Score.points`. Old entries without it stay valid. The store key stays `doover:v1`.

### 8.2 Moves

The seven helpful tags are seven moves. For each: total uses (from `tagCounts`), a tier, and the definition from `src/engine/tags.ts`. Tiers at 1, 5, 15 and 30 uses: "Rough cut", "Rehearsed", "Stage-ready", "Second nature". Shown as seven paper cards that flip; the back shows the definition and the user's most recent saved playbook line that used the move.

### 8.3 Slips

The three most frequent unhelpful tags, each with the "why" and "try instead" from `content/tips.json` (read on the server and passed down; slots filled with neutral placeholders).

### 8.4 This week's plan

Three items, recomputed from history, each with a check that fills in automatically:

1. **Swap your top slip.** The most frequent unhelpful tag of the last 14 sessions, with its "try instead". Done when a session this week contains none of it.
2. **Grow your weakest move.** The least-used helpful tag, with a recommended scene where the engine makes that move stronger (spirited children respond to choices; sensitive children to naming the feeling and to closeness). Done when the move appears in a session this week.
3. **Today's meltdown.** Done when today's daily scene is finished.

With no history the plan shows item 3 and explains that the other two appear after the first scene.

### 8.5 Streak, level, then and now

- **Streak**: the existing calculation, shown as tear-off calendar pages for the last 14 days.
- **Level**: from the sum of `points`, thresholds `0, 500, 1200, 2200, 3500, 5000, 7000, 9500, 12500, 16000`.
- **Then and now**: the first three sessions against the latest three: share of helpful stamps, average turns to calm, average stars. Appears from the fourth session; before that it says how many are left.

### 8.6 Demo week

On `/progress`, a switch: "Show a sample week". It loads a fixed set of sample history through the same functions, so the jury sees a streak, a plan and a then-and-now without playing for seven days. While it is on, a banner on every card reads "Sample data. Not your results." It never touches stored history and switches off on reload.

### 8.7 Reminders and install (level 2)

- "Remind me daily" on `/progress` downloads an `.ics` file: a daily repeating 5-minute event at a chosen time with the link to `/play`.
- A web app manifest and icons so the product can be added to a phone's home screen.

## 9. Screens

**Navigation.** Header: logo, Scenes, Progress, Your lines, Season pass, and the button "Play today's meltdown". On phones a bottom bar with four items: Today, Scenes, Progress, Lines. Hidden during play.

**Landing (`/`).**
1. Hero. Headline "You know what to say. *Until they scream.*" The sentence from SPEC section 4.2. The primary button. "Do-Over #N · {title} · par {par}". Beside it (above it on phones) a live `<PaperStage>` of today's scene at its starting storm, with the child's opening line.
2. How it works, as three small live stages, not pictures: a storm; a stamped reply with its ledger, computed by the engine on the server from one labelled sample reply; a rewind.
3. No mystery score: two sentences on the engine, the measured accuracy from `eval/results.json`, link to `/how-it-works`.
4. Why rehearse: the two facts of SPEC section 17 with their links, and once: "We have not measured whether practice here changes what happens at home. It is a place to rehearse."
5. Free and season pass in one strip, linking to `/pricing`.
6. Footer: links, the disclaimer, "Jury guide".

**Scenes (`/scenes`).** Three shelves (ages 2–3, 4–5, 6–7) of miniature stages. Each shows title, place, temperament, par and best stars. Today's scene carries a "Today" flag. Locked scenes show a paper ticket mark and open the paywall.

**Progress (`/progress`).** Streak, level, this week's plan, moves, slips, then and now, session list, the demo-week switch, the reminder.

**Your lines (`/playbook`).** Saved lines as script pages. Copy, delete, share with a co-parent. Behaviour unchanged.

**Replay your own (`/replay`).** The existing form on a sheet. Behaviour unchanged.

**Pricing (`/pricing`), How it works, Privacy.** Restyled; content rules unchanged except section 7.5.

**Jury guide (`/jury`).** Not indexed. Four steps with links: play today's scene; do a turn over; open a locked scene and pass the paywall with the test card or the code; open Progress and switch on the sample week. One line on what is real (everything) and what is labelled (test checkout, sample week).

**Not found, error, loading.** In the same material. A lost session offers a restart.

## 10. Engineering

**Branch.** All work happens on `v2`, cut from `main`. `git pull --rebase origin v2` before every push. No force-push. `v2` is merged into `main` only after the walkthrough in section 12 passes.

**Ownership.** One owner per path. Do not edit a path you do not own; ask its owner in `docs/build/V2-STATUS.md`.

| Session | Owns |
| --- | --- |
| **STAGE** (lead) | `src/app/globals.css`, `src/app/layout.tsx`, `src/components/paper/**`, `src/components/stage/**` except the ten later sets, `src/components/play/**`, `src/app/play/**`, `src/lib/sound.ts` |
| **MONEY** | `src/server/entitlement.ts`, `src/app/api/{entitlement,checkout,redeem}/**`, the Pro checks inside existing API handlers, `src/shared/api.ts` (additions), `src/lib/pro.ts`, `src/components/pro-gate.tsx`, `src/components/paywall/**`, `src/app/pricing/**`, `src/app/pro/**`, `.env.example`, `src/app/page.tsx` (landing), `src/app/progress/**`, `src/lib/{progress,moves,plan,demo-week,store}.ts` |
| **BRAND** then **SETS** | `src/app/icon.svg`, `src/app/apple-icon.*`, `src/app/opengraph-image.tsx`, `src/app/manifest.ts`, `public/brand/**`, then `src/components/stage/props/**` and the ten later files in `src/components/stage/sets/**` |
| **PAGES** | `README.md`, `AGENTS.md`, `src/app/{scenes,playbook,replay,how-it-works,privacy,jury}/**`, `src/app/{error,loading,not-found}.tsx`, `src/components/{daily-teaser,live-demo}.tsx`, `src/lib/reminder.ts`, `e2e/**`, `docs/DEPLOY.md` |
| **DECK** | `deck/**` |

**Dependencies.** Only two new ones: `motion` (STAGE) and `stripe` (MONEY). Each is added in the first ten minutes of that session and pushed at once, so the lockfile conflicts once at most.

**Tests.** New pure functions have unit tests (mood, plan, moves, entitlement signing, demo week). Existing accessible names and test ids listed in sections 5 and 6 are kept. Where copy changes on purpose, the test changes in the same commit. One new end-to-end test covers Free → locked scene → paywall → code → unlocked scene.

**Environment.** New names, documented in `.env.example`: `ENTITLEMENT_SECRET`, `STRIPE_SECRET_KEY` (test keys only), `DEMO_CODE`. Production also sets `NEXT_PUBLIC_PRO_PREVIEW=false`.

**Handoff.** `docs/build/V2-STATUS.md` holds one checklist per session. Tick items and push after every coherent step. A new session on a fresh account must be able to continue from this file and `git log` alone.

## 11. Levels and clock

Each level is complete and shippable before the next begins. If the clock runs out, ship the last complete level.

| Level | Contents |
| --- | --- |
| **0. Safety net** | Current `main` deployed to production. Model tagging verified in production. README shortened. |
| **1. Must** | Tokens, type and material on every page. The stage with the playground and candy sets and the generic set. The play screen, the turn sequence, the endings, the script, the rewind, the take comparison. Entitlement, paywall, demo code, test checkout. Landing hero. |
| **2. Should** | Moves, slips, plan, then and now, demo week. The other ten sets. Scene shelf with thumbnails. Jury guide. Manifest and reminder. |
| **3. Nice** | Sound. Share image. Device-tilt parallax. |

Clock, Astana time:

| Time | Event |
| --- | --- |
| 01:00 | Start. Level 0 in parallel. |
| 02:15 | STAGE has pushed tokens, paper primitives, the stage API and one reference set. PAGES and SETS begin their visual work. |
| 06:30 | Feature freeze. Only fixes after this. |
| 07:00 | `v2` merged into `main`. `npm run verify` and end-to-end tests pass. |
| 07:30 | Deployed. `/api/health` shows the new commit. |
| 08:00 | First jury walkthrough on a laptop and a phone. Deck screenshots taken. |
| 09:00 | First complete submission sent (deck, link, repository). Resubmitting is allowed until 12:00. |
| 10:10 | The daily scene has changed to the playground. Second walkthrough. |
| 11:00 | Final submission. Nothing is deployed after 11:15. |

## 12. Done means this walkthrough passes

In a private window, at 1280px and at 375px:

1. `/` shows a live stage and one obvious button.
2. `/play`: playbill, Start, curtains, the child's first line. Nothing is lost before the visitor can read it.
3. A kind reply that holds the limit: stamps, ledger, the storm drops, the weather clears, all without scrolling.
4. A threat: the storm rises and says why. Nonsense: "No clear move". An unsafe line: the pause screen.
5. An ending within 90 seconds of opening the landing page.
6. The script, "Do-over from here", the rewind, the take comparison.
7. Scenes: a locked scene opens the paywall. The demo code opens the pass; the test card does too when Stripe is configured. A library scene then plays. "Return to Free" locks it again.
8. Progress: plan, moves and streak show real data after one scene; the sample week is labelled.
9. `/api/health` reports the commit at the head of `main`. No console errors. No horizontal scroll. Keyboard-only play works.

## 13. What this supersedes

- SPEC section 4.3 (timer default for a first visit; where the result of a turn appears; debrief layout).
- SPEC section 4.8 and section 10 (payments: now a test-mode checkout and a demo code; `NEXT_PUBLIC_PRO_PREVIEW` is `false` in production; "Planned price" wording removed).
- SPEC section 8 (five additive endpoints and the 402 error).
- SPEC section 9 (optional `points` in history).
- SPEC section 12.1, fourth bullet, and section 18 ("payments" is no longer out of scope; real payments still are).
- SPEC section 14, visual direction (replaced by section 3 here).
- SPEC section 15 (new folders `src/components/paper`, `src/components/stage`, `src/components/paywall`, `deck`).
- `AGENTS.md`: track ownership, the frozen-contract rule for the additions above, and "executors never push to `main`" are replaced by section 10 here.
