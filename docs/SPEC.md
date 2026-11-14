# Do-Over — product and engineering specification

Version 1.0 · 14 November 2026 · Source of truth for the build. If a task file, a prompt or a code comment disagrees with this document, this document wins. If this document disagrees with `docs/reference/vectors.json`, the vectors win.

Words used on purpose: **must** = required for acceptance; **should** = do it unless it costs more than 20 minutes; **may** = optional.

---

## 1. Product

**One sentence.** Do-Over is a meltdown simulator: a parent of a 2–7 year old practises the hardest 60 seconds of parenting against a simulated child, sees every reply tagged and its effect on the child's arousal, and can redo any moment.

**One user.** A working parent in the United States, 28–42, with a child aged 2–7. They have read about "gentle parenting" and know they should name the feeling and hold the limit. In the third minute of screaming they threaten, bribe or yell anyway, and feel guilty at night.

**One pain.** Knowing what to say is not the same as being able to say it under pressure. Books, courses and scripts give knowledge. Nothing gives repetitions.

**The promise on the landing page.** "You know what to say. Until they scream." Practise it here, where nothing is at stake.

**What it is not.** Not therapy, not medical advice, not a diagnosis, not a chatbot that gives parenting advice on any topic. It is a practice tool with a transparent scoring engine.

**What is sold (hypothesis, not validated).** Free: the meltdown of the day with do-overs. Pro, $9.99 a month or $59.99 a year: the scene library, "replay your own meltdown", voice mode, coach suggestions, unlimited playbook. Payments are not connected during the hackathon; see section 10.

**Why they come back tomorrow.** A new shared scene every day with a par and a streak; their real child melts down again and "replay your own" turns that moment into a scene; the playbook grows with lines that worked.

## 2. Hackathon constraints

- Deadline: 12:00 on 15 November 2026, Astana time (UTC+5). Judges open the production URL themselves and read the public repository.
- Judging weights: 40% does it work (end-to-end in production, core value real and not hardcoded, quality of UX and code); 20% what the user pays for and why they return; 15% problem and user; 15% business potential; 10% originality.
- Hard rules: web only (responsive web is fine), B2C, US adults 25–45, usable end-to-end with no sign-up or login, public GitHub repository.

Consequences for the build:

1. A judge must reach a finished scene in under 90 seconds from the landing page, on a laptop or a phone, with no account.
2. The outcome of a scene must be computed, never scripted. A judge who types anything gets a truthful reaction.
3. Every number shown anywhere comes from the engine, from `eval/results.json`, from real counters in Redis, or from a cited source in section 17. No invented users, testimonials, counters or statistics.
4. The product must keep working when the model provider is down (rules-only mode).

## 3. Architecture rule

**The model never decides the outcome.**

- A deterministic engine (`src/engine`, pure TypeScript, no network, no React) tags the parent's reply with rules, merges in tags proposed by a model, and updates the child's state with a tested transition function.
- The model does two things only: (a) proposes semantic tags, each backed by an exact quote from the parent's reply, and (b) writes candidate lines for the child. The engine picks which candidate line is spoken, based on the state it computed.
- With no model available the product still works: rules tag the reply and template lines speak for the child. The UI says which mode produced a result.

One turn, end to end:

```
parent reply ──► ruleTags (regex, instant) ─────────────┐
            └──► model call: tags+quotes, 5 child lines ─┤
                                                         ▼
                          mergeTags (quote check, exclusions)
                                                         ▼
                   applyTurn(scene, state, tags)  ← deterministic, tested
                                                         ▼
          pick child line by outcome/delta, style by arousal
                                                         ▼
                 response: hits, result, child line, score
```

## 4. User journey and screens

All routes work without an account. English only. Mobile first (375 px wide), then 768 and 1280.

### 4.1 Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/play` | Today's meltdown (the daily scene) |
| `/play/[sceneId]` | A library scene or a custom scene |
| `/scenes` | Scene library |
| `/replay` | "Replay your own meltdown" form |
| `/playbook` | Saved lines; `/playbook/shared#d=…` read-only shared view |
| `/progress` | Streak and history |
| `/pricing` | Free vs Pro, waitlist |
| `/how-it-works` | Tags, engine, measured accuracy, limits of the claim |
| `/privacy` | What is stored and where |

### 4.2 Landing (`/`)

Above the fold: headline "You know what to say. Until they scream."; one sentence "Do-Over is a 3-minute meltdown simulator for parents of 2–7 year olds. Practise the moment before it happens. No account needed."; primary button "Play today's meltdown" → `/play`; under it "Do-Over #N · {scene title} · par {par}".

Below: (1) How it works in three steps — "They melt down", "You answer in 8 seconds", "See what your words did, then do it over" — each with a real screenshot or a live mini-demo, never a mock-up image of features that do not exist. (2) Why practise — only facts from section 17, each with its source link, and the sentence "We have not measured whether practice here changes what happens at home. It is a place to rehearse." (3) What is under the hood — two sentences on the engine and the measured tagging accuracy read from `eval/results.json`, link to `/how-it-works`. (4) Pricing teaser → `/pricing`. (5) Footer: How it works, Pricing, Privacy, the disclaimer from section 12.3.

### 4.3 Play (`/play`, `/play/[sceneId]`)

States: `intro` → `playing` → `ended`.

**Intro card.** Place, child name and age band, setup text, the limit ("Your limit: No candy today"), par, timer setting (8 s default; 20 s; off), button "Start". One line: "Your replies are sent to an AI model to tag them. Don't include real names." On start the client calls `POST /api/session`.

**Playing.** Top: arousal meter (0–100, the hero element) with a text value and direction ("75 · rising"); a thinner connection bar; turn counter "Turn 2 of 8". Middle: the child's line in large type with the action in italics ("drops to the floor"). Bottom: the reply box (max 300 characters), Send button, the countdown ring, and in voice mode the microphone button.

Timer rules: the countdown runs until the first keystroke (or the start of speech). If nothing starts within the limit, the client sends the turn with `timedOut: true` and empty text. Once typing has started the parent has 25 more seconds; then whatever is typed is sent. With the timer off nothing is sent automatically.

After Send: the input locks; within about 2 seconds the reply appears as a bubble with tag chips (helpful = green with a check icon, unhelpful = red with a cross icon; never colour alone), the quote that triggered each chip is underlined in the reply, the meter animates to the new value with the delta ("−14"), up to two note lines explain why (section 5.7), and the child's next line appears. Then the timer restarts.

**Ended.** One of four endings:

| Outcome | Title | Sub-line |
| --- | --- | --- |
| `calm_limit_held` | "Calm, and the limit held." | "{turns} turns · par {par}" |
| `calm_gave_in` | "Quiet, but the limit is gone." | "The crying stopped because the limit did." |
| `out_of_turns` | "Still melting down." | "Real ones end too. Try a do-over." |
| `stopped_unsafe` | "Let's pause here." | Supportive text and resources from section 12.2; no score, no share. |

Then the debrief:

- Stars (1–3), turns vs par, the grid of squares.
- Every turn: the reply with underlined quotes, chips, delta, notes, the child's answer. The turning point (section 5.6) is marked "Turning point".
- On every turn: "Do-over from here" (replays from that turn with the earlier turns kept) and, on turns whose chips are all helpful and whose delta is ≤ −8, "Save to playbook".
- On the turn with the largest rise: "What could I have said?" → coach suggestions (section 7.4). Marked Pro.
- Daily scene only: standing ("Player 14 of 31 today" and, with 20 or more players, "Calmer than 62% of today's players").
- Share button copies:

```
Do-Over #2 · Leaving the playground
🟩🟨🟩🟩 Calm in 4 (par 3) ★★★
https://{domain}/play
```

Squares: green U+1F7E9 good, yellow U+1F7E8 mixed, red U+1F7E5 bad. For other outcomes the second line reads "Not calm after 8" or "Gave in on turn 3".

- Buttons: "Play again", "Scene library", "Replay your own".

### 4.4 Library (`/scenes`)

Twelve cards grouped by age band: title, place, temperament, par, best stars from local history. The daily scene is marked "Today". Pro gate per section 10.

### 4.5 Replay your own (`/replay`)

Form: "What happened today?" (10–500 characters, one or two sentences), age band, optional child name (default: a neutral nickname, never required). Submit → `POST /api/custom-scene` → on success go to `/play/{sceneId}`. Custom scenes are never ranked. Refusals show the message returned by the server. Pro gate per section 10.

### 4.6 Playbook (`/playbook`)

List of saved lines: text, chips, scene title, date. Copy, delete. "Share with a co-parent" builds a link `/playbook/shared#d=<base64url of JSON>`; the data lives only in the URL fragment and never reaches the server. Free limit 5 lines (section 10).

### 4.7 Progress (`/progress`)

From local history: current streak (consecutive day keys with a finished daily scene), sessions played, a small chart of "share of helpful chips" over the last 14 sessions, most-used helpful tag, most frequent slip, list of past sessions (date, scene, stars, turns). Empty state invites to play.

### 4.8 Pricing (`/pricing`)

Two columns, Free and Pro, from the table in section 10. Prices labelled "Planned price". A clear notice: "Payments are not connected yet. During the preview every Pro feature is unlocked." Email field + plan choice → `POST /api/waitlist`. No fake checkout, no card form.

### 4.9 How it works (`/how-it-works`)

Rendered from code, not retyped: the tag table from `src/engine/tags.ts`; the state model and the numbers from the engine constants; the accuracy table from `eval/results.json` (date, number of lines, per-tag precision, recall, F1, on the test split, for rules-only and rules+model); how the labelled set was made (drafted with an AI assistant, every label reviewed by a team member — say this only if it is true at submission, otherwise say what is true); limits ("We have not measured transfer to real life").

### 4.10 Privacy (`/privacy`)

Written from what the code actually does; see section 12.4. Check the code before writing.

## 5. Engine

Everything in this section is implemented in `src/engine`, is pure and synchronous, and is covered by unit tests. `docs/reference/engine.mjs` is an executable reference; `docs/reference/vectors.json` holds 37 golden vectors and the par of every scene. The TypeScript engine must reproduce every vector exactly.

### 5.1 Types

```ts
type Tag =
  | "NAME_FEELING" | "HOLD_LIMIT" | "OFFER_CHOICE" | "CLEAR_COMMAND" | "CONNECT" | "LABELED_PRAISE" | "WHEN_THEN"
  | "THREAT" | "BRIBE" | "YELL" | "SHAME" | "DISMISS" | "QUESTION_COMMAND" | "LECTURE"
  | "NEGATIVE_COMMAND" | "VAGUE_COMMAND" | "GIVE_IN" | "NO_RESPONSE" | "UNSAFE";
// HELPFUL = the first seven. HARSH = THREAT, YELL, SHAME. Canonical order = the order above.

type AgeBand = "2-3" | "4-5" | "6-7";
type Temperament = "easygoing" | "sensitive" | "spirited";

interface Scene {
  id: string; title: string; place: string; ageBand: AgeBand; childName: string;
  setup: string; openingLine: string; openingAction: string;
  limit: string;          // the limit the parent is holding, as a short sentence
  wants: string;          // what the child wants, used in template lines
  startArousal: number;   // 60..90
  temperament: Temperament;
  limitHints: string[];   // lowercase phrases that restate the limit (rule tagger)
  giveInHints: string[];  // lowercase phrases that abandon the limit (rule tagger)
}
type PublicScene = Omit<Scene, "limitHints" | "giveInHints">;

interface ChildState {
  arousal: number;        // 0..100
  connection: number;     // 0..100, starts at 50
  limitIntact: boolean;
  turn: number;           // turns played so far
  bribed: boolean;
  lastHelpfulTags: Tag[]; // helpful tags of the previous turn
  lastDelta: number;      // arousal change of the previous turn
}

type Outcome = "ongoing" | "calm_limit_held" | "calm_gave_in" | "out_of_turns" | "stopped_unsafe";
type Note = "REPEAT" | "HIGH_CONNECTION" | "LOW_CONNECTION" | "MIXED_MESSAGE" | "COMMAND_TOO_SOON" | "CAPPED"
  | "VALIDATED_LIMIT" | "BARE_LIMIT" | "NO_HELPFUL_MOVE" | "BRIBE_TAX" | "GAVE_IN" | "UNSAFE_STOP";

interface TagHit { tag: Tag; source: "rule" | "model" | "both"; quote: string } // quote = exact substring of the reply, "" for NO_RESPONSE and for YELL from loudness
interface TurnResult {
  tags: Tag[]; before: ChildState; after: ChildState; delta: number; outcome: Outcome;
  effects: { tag: Tag; value: number }[]; // arousal contribution per tag after modifiers, one decimal
  notes: Note[];
}
interface Score {
  outcome: Outcome; stars: 1 | 2 | 3; points: number; turnsToCalm: number | null; par: number;
  clean: boolean; statedLimit: boolean; bribed: boolean; unhelpfulCount: number; finalArousal: number;
  grid: ("good" | "mixed" | "bad")[]; turningPoint: number;
}
```

### 5.2 Public functions

```ts
ruleTags(text: string, scene: Scene, opts?: { loud?: boolean; timedOut?: boolean }): TagHit[]
mergeTags(ruleHits: TagHit[], modelHits: TagHit[], text: string): TagHit[]
initialState(scene: Scene): ChildState
applyTurn(scene: Scene, state: ChildState, tags: Tag[]): TurnResult
scoreSession(scene: Scene, turns: TurnResult[], par: number): Score
parFor(scene: Scene): number
dayKey(now: Date): string                 // "YYYY-MM-DD" in America/New_York
dayNumber(dayKey: string): number         // 1 on 2026-11-14
sceneOfTheDay(dayKey: string): Scene
getScene(id: string): Scene | undefined
pickChildLine(lines: ChildLines | null, scene: Scene, result: TurnResult, seed: string): { line: string; action: string } | null
noteText(note: Note, scene: Scene): string
```

### 5.3 Tags

Definitions are normative for the rule tagger, the model prompt and the labelled set. Keep them in one place, `src/engine/tags.ts`, and build the UI table and the model prompt from that file.

| Tag | UI label | Definition | Examples |
| --- | --- | --- | --- |
| NAME_FEELING | Named the feeling | Names or reflects the child's feeling or wish without judging it. | "You're so sad." "You really wanted that chocolate." |
| HOLD_LIMIT | Held the limit | States or restates the scene's limit as a fact, without a threat. | "We're not buying candy today." "It's time to go." |
| OFFER_CHOICE | Offered a choice | Offers two or more concrete options that are all acceptable within the limit. | "Do you want to carry the bananas or the apples?" |
| CLEAR_COMMAND | Clear instruction | One direct, specific, positively stated instruction: what to do. | "Hold my hand." "Put the pillow back on the couch." |
| CONNECT | Connected | Offers closeness or presence. | "I'm right here." "Come here, buddy. I've got you." |
| LABELED_PRAISE | Specific praise | Praises a specific thing the child just did. | "Thank you for using a quiet voice." |
| WHEN_THEN | When–then | States a normal next step as following cooperation, in "when/first … then …" form. Not a new reward. | "When you're buckled, then we'll turn on your song." |
| THREAT | Threat | Announces a punishment or loss if the child does not comply; includes counting and threatening to leave the child behind. | "If you don't get up, no TV tonight." "I'm leaving without you." |
| BRIBE | Bribe | Offers a new reward to make the meltdown stop. | "If you stop crying I'll buy you a toy." |
| YELL | Raised voice | Shouting. Text: at least 8 letters and at least 70% of them uppercase, or three or more exclamation marks in a row. Voice: the loudness flag. Rule tagger only. | "GET IN THE SEAT NOW" |
| SHAME | Shaming | Attacks or belittles the child, compares them, blames them, or uses onlookers to embarrass them. | "You're acting like a baby." "Everyone is staring at you." |
| DISMISS | Dismissed the feeling | Denies, minimises or orders away the feeling. Includes "stop crying" and "calm down". | "You're fine." "It's just a cup." |
| QUESTION_COMMAND | Question instead of instruction | An instruction phrased as a question or softened with "okay?", or a rhetorical "why" question. A question that offers a choice is OFFER_CHOICE, not this. | "Can you please get up?" "Let's go now, okay?" |
| LECTURE | Too many words | Explaining, reasoning or moralising in the heat of the moment: more than 30 words, or five or more sentences, or reproach markers such as "how many times", "I told you", "you need to understand". | — |
| NEGATIVE_COMMAND | "Stop / don't" | Tells the child what not to do about a behaviour. "Stop crying" is DISMISS, not this. | "Stop screaming." "Don't push your plate." |
| VAGUE_COMMAND | Vague instruction | An instruction too vague to follow. | "Be good." "Behave." "Come on." |
| GIVE_IN | Gave in | Abandons the scene's limit. | "Fine, you can have it." "Okay, five more minutes." |
| NO_RESPONSE | Froze | Empty reply, or the timer ran out with nothing typed. Rule tagger only. | — |
| UNSAFE | Scene paused | Describes or threatens physical punishment or violence, swears at or degrades the child, says they hate the child or wish the child did not exist. | — |

Each unhelpful tag also has a one-line "why" and a "try instead" template in `content/tips.json` (written in stage A1), used by the debrief when no model is available. The "try instead" may use `{childName}`, `{wants}`, `{limit}`.

### 5.4 Transition

Constants: `MAX_TURNS = 8`, `CALM_AT = 25`, `GIVE_IN_AROUSAL = 15`, `DELTA_MIN = −18`, `DELTA_MAX = +25`, `MAX_CALMING_TAGS = 3`, `REPEAT_FACTOR = 0.5`, `START_CONNECTION = 50`.

`initialState(scene)` = arousal `scene.startArousal`, connection 50, limitIntact true, turn 0, bribed false, lastHelpfulTags [], lastDelta 0.

`applyTurn(scene, state, tags)`:

1. Put the tags in canonical order without duplicates.
2. If UNSAFE is present: outcome `stopped_unsafe`, delta 0, turn + 1, state otherwise unchanged (lastHelpfulTags [], lastDelta 0). Stop.
3. If GIVE_IN is present: arousal becomes `min(arousal, 15)`, limitIntact false, turn + 1, bribed updated, connection unchanged, outcome `calm_gave_in`. Stop.
4. Base arousal effect per tag (negative = calmer):

| Tag | Base | Connection |
| --- | --- | --- |
| NAME_FEELING | −12 | +12 |
| CONNECT | −8 | +15 |
| OFFER_CHOICE | −10 | +5 |
| HOLD_LIMIT | 0 | 0 |
| CLEAR_COMMAND | −4 if arousal < 60, else +4 | 0 |
| LABELED_PRAISE | −8 if lastDelta < 0, else −2 | +8 |
| WHEN_THEN | −8 if arousal < 70, else −2 | 0 |
| THREAT | +14 | −10 |
| YELL | +18 | −15 |
| SHAME | +16 | −20 |
| DISMISS | +10 | −10 |
| BRIBE | −8 | 0 |
| QUESTION_COMMAND | +5 | 0 |
| LECTURE | +8 | −4 |
| NEGATIVE_COMMAND | +7 | −3 |
| VAGUE_COMMAND | +5 | 0 |
| NO_RESPONSE | +6 | −5 |

5. Modifiers, multiplied onto each tag's effect. "Helpful calming" = a helpful tag whose base is negative.
   - Repetition: helpful calming tag that is in `state.lastHelpfulTags` → × 0.5. Note `REPEAT`.
   - Connection (value before the turn): ≥ 70 → helpful calming × 1.25 (note `HIGH_CONNECTION`); ≤ 30 → helpful calming × 0.6 (note `LOW_CONNECTION`).
   - Mixed message: any harsh tag in the same turn → helpful calming × 0.5. Note `MIXED_MESSAGE` when at least one helpful tag is present.
   - Temperament: easygoing → helpful calming × 1.15, any effect with a positive base × 0.85. Sensitive → THREAT, YELL, SHAME × 1.3; NAME_FEELING and CONNECT × 1.2. Spirited → OFFER_CHOICE × 1.3; other helpful calming × 0.9; any effect with a positive base × 1.1.
   - Age: "2-3" → WHEN_THEN × 0.5, LECTURE × 1.25. "6-7" → WHEN_THEN × 1.25, SHAME × 1.2.
   - Note `COMMAND_TOO_SOON` when CLEAR_COMMAND is present and arousal ≥ 60.
6. Cap: only the three strongest helpful calming effects count; the others become 0. Note `CAPPED`. Ties are broken by canonical tag order.
7. Sum the effects, then add:
   - HOLD_LIMIT together with NAME_FEELING or CONNECT, and HOLD_LIMIT was not in `lastHelpfulTags` → −6 (−3 if a harsh tag is present). Note `VALIDATED_LIMIT`.
   - HOLD_LIMIT with none of NAME_FEELING, CONNECT, OFFER_CHOICE → +3. Note `BARE_LIMIT`.
   - No helpful tag at all → +3. Note `NO_HELPFUL_MOVE`.
   - `state.bribed` is true (a bribe on an earlier turn) → +5. Note `BRIBE_TAX`.
8. `delta = clamp(Math.round(sum), −18, +25)`; `arousal = clamp(arousal + delta, 0, 100)`; the reported delta is `after.arousal − before.arousal`.
9. Connection: add the connection column for every tag present, no modifiers, clamp 0..100.
10. `bribed = bribed || BRIBE present`; `lastHelpfulTags` = helpful tags of this turn; `lastDelta` = reported delta; `turn + 1`.
11. Outcome: arousal ≤ 25 → `calm_limit_held`; else turn ≥ 8 → `out_of_turns`; else `ongoing`.

The rules encode a simple teaching model, to be stated plainly on `/how-it-works`: connect before you direct; empathy and the limit together work better than either alone; choices help; harsh words escalate and cancel kind ones; bribes work now and cost later; a flooded child can take in about three things. The numbers are design choices made for a practice game, not measurements of real children.

### 5.5 Par

`parFor(scene)` = the minimum number of turns in which the scene can end `calm_limit_held`, found by breadth-first search over every set of one to three helpful tags per turn. Precompute into `content/par.json` with `npm run par`; a unit test recomputes and compares. Expected values: car-seat, tablet-off, hit-brother = 4; the other nine scenes = 3.

### 5.6 Scoring

`scoreSession(scene, turns, par)`:

- `turnsToCalm` = number of turns if the outcome is `calm_limit_held`, else null.
- `unhelpfulCount` = number of unhelpful tags over all turns; `clean` = it is 0; `statedLimit` = HOLD_LIMIT appeared at least once; `bribed` = BRIBE appeared.
- Stars: 3 if `calm_limit_held`, not bribed, `turnsToCalm ≤ par + 1`, no THREAT, YELL or SHAME anywhere, and `statedLimit`. 2 if `calm_limit_held` and not bribed. Otherwise 1.
- Points: `calm_limit_held` → `max(300, 1000 − 100 × (turnsToCalm − 1) − 30 × unhelpfulCount − (bribed ? 200 : 0))`; `out_of_turns` → `clamp(4 × (startArousal − finalArousal), 0, 250)`; `calm_gave_in` → 100; `stopped_unsafe` → 0.
- Grid cell per turn: "good" = at least one helpful tag and no unhelpful tag; "mixed" = both; "bad" = everything else.
- Turning point: when the outcome is `calm_limit_held`, the turn with the most negative delta; otherwise the turn with the most positive delta; first one on ties.

### 5.7 Notes shown to the player

| Note | Text |
| --- | --- |
| REPEAT | "The same move twice in a row works half as well." |
| HIGH_CONNECTION | "{childName} feels close to you right now, so calming words land harder." |
| LOW_CONNECTION | "Connection is low, so calming words land softer. Reconnect first." |
| MIXED_MESSAGE | "Kind words don't land when they come with a threat, a raised voice or shaming." |
| COMMAND_TOO_SOON | "Too upset to follow instructions yet. Connect first, direct later." |
| CAPPED | "A flooded child takes in about three things. The rest was noise." |
| VALIDATED_LIMIT | "Empathy and the limit in one breath." |
| BARE_LIMIT | "The limit alone sounds like another no." |
| NO_HELPFUL_MOVE | "Nothing in that reply helped {childName} calm down." |
| BRIBE_TAX | "The earlier bribe raised the price of every no." |
| GAVE_IN | "The crying stopped because the limit did." |

Show at most two notes per turn during play (priority: MIXED_MESSAGE, BRIBE_TAX, COMMAND_TOO_SOON, BARE_LIMIT, NO_HELPFUL_MOVE, VALIDATED_LIMIT, REPEAT, CAPPED, LOW_CONNECTION, HIGH_CONNECTION) and all of them in the debrief.

### 5.8 Scenes and the day

`content/scenes.json` holds the twelve scenes. Validate it with zod at load. Daily rotation order:

`store-candy, playground-leave, bedtime, wrong-cup, tablet-off, dinner-refusal, car-seat, getting-dressed, hit-brother, bath-time, sharing-toy, leaving-party`

`dayKey` is the calendar date in America/New_York. `dayNumber` = whole days from 2026-11-14 plus 1. `sceneOfTheDay` = rotation[(dayNumber − 1) mod 12].

### 5.9 Child lines

`ChildLines = { calmer, same, angrier, resolved, gotIt }`, each `{ line: string; action: string }`.

`pickChildLine(lines, scene, result, seed)`:

- `stopped_unsafe` → null.
- `calm_gave_in` → `gotIt`; `calm_limit_held` → `resolved`; otherwise delta ≤ −4 → `calmer`; delta ≥ +4 → `angrier`; else `same`.
- If `lines` is null or the chosen entry is invalid (empty, longer than 120 characters, contains a URL or markup), use a template from `content/templates.json`: at least four templates per age band and per variant (60 or more in total), with the slots `{wants}` and `{childName}`, chosen by a stable hash of `seed`.
- Styling by code so the text always matches the meter: when `after.arousal ≥ 80` the line is upper-cased.

Templates must sound like a child of that age: two to five words at 2–3 ("NO! MINE! WANT IT!"), short sentences at 4–5, arguments about fairness at 6–7.

## 6. Tagging

### 6.1 Rule tagger

`ruleTags` works on a normalised copy of the text (lowercase, straight quotes, single spaces) and returns hits with the exact matched substring of the original text as the quote. It must be fast, deterministic and conservative: when unsure, do not tag; the model covers meaning. Minimum cue families (extend them on the dev split only):

- NO_RESPONSE: the trimmed text is empty. If `timedOut` is true but text was typed, tag the text normally.
- UNSAFE: first-person threats or acts of physical punishment ("I'll smack/spank/hit/slap/whip you", "give you a spanking", "something to cry about"), "I hate you", "wish I never had you", "wish you were never born", swearing at the child. Must not fire on the limit itself ("Hitting is not okay", "I won't let you hit").
- YELL: the definition in 5.3, or `opts.loud`.
- THREAT: "if you don't/keep … (no …/you lose/I'll take/I'm leaving)", "or else", "count to three", "one… two…", "leaving without you", "no TV/tablet/dessert/toys/soccer … tonight/tomorrow/for a week", "one more … and …", "I mean it" after a consequence.
- BRIBE: "if you stop/get/come/leave/eat … I'll buy/give/get/put …", "you can have dessert/a cookie/a toy … if", "we can get ice cream" tied to compliance.
- SHAME: "brat", "baby", "selfish", "spoiled", "rude", "sore loser", "bad boy/girl", "what is wrong with you", "like a normal kid", "big girls/boys don't", "everyone is staring/looking/watching", "people are watching", "you never listen", "because of you", "nobody will", "embarrassing me".
- DISMISS: "you're fine", "it's just/only …", "not a big deal", "not that bad", "nothing to cry about", "stop crying", "calm down", "get over it".
- QUESTION_COMMAND: a sentence ending in "?" that starts with can/could/will/would/won't/why and contains no " or " choice; or an instruction ending in ", okay?" / ", ok?" / ", all right?".
- LECTURE: the definition in 5.3.
- NEGATIVE_COMMAND: a sentence starting with stop / don't / do not / quit / no more / "no …ing", about a behaviour. Exclude "stop crying", "don't worry", "you don't have to".
- VAGUE_COMMAND: a whole sentence that is "be good", "be nice", "behave (yourself)", "be a good boy/girl", "come on", "cut it out", "knock it off", "settle down", "enough".
- GIVE_IN: any `scene.giveInHints` phrase, or "fine, you can", "okay, you can", "just this once", unless a negation ("no", "not", "no more", "isn't", "won't") appears within the three words before it.
- HOLD_LIMIT: any `scene.limitHints` phrase, or "the answer is no", "the answer is still no".
- NAME_FEELING: "you're/you are/you feel/you seem (so/really) sad|mad|angry|upset|frustrated|disappointed|tired|furious|scared", "you (really) wanted/want/wish/love/were hoping", "you don't like", "it's/it feels (so) hard|sad|unfair|disappointing", "that's/that was (so) hard|sad|disappointing|a big surprise".
- OFFER_CHOICE: "do you want (to) X or Y", "you can X or Y", "should I … or …", "X or Y?" where both sides are options for the child. Exclude "or else", "or I'll", "or no", "or the/there's …" consequences.
- CLEAR_COMMAND: a sentence that starts (optionally after "please") with a concrete action verb — hold, put, sit, stand, walk, come, take, give, get in, get up, drink, lie down — and is not a question and does not start with stop/don't. "Come here" is CONNECT and "take your time" is not an instruction; neither is CLEAR_COMMAND.
- CONNECT: "I'm (right) here", "I've got you", "come here", "I'm not going anywhere", "I'll wait", "sit (right here/next to you/with you)", "want a hug", "I love you".
- LABELED_PRAISE: "thank you for …ing", "great/good/nice job …ing", "great listening", "you … (all) by yourself", "that takes …", "that was (really) kind".
- WHEN_THEN: "when you/we/your … then …", "first …, then …".

### 6.2 Model tags

The model may propose any tag except YELL and NO_RESPONSE. Every proposed tag carries a `quote`. See section 7.2.

### 6.3 Merge

`mergeTags(ruleHits, modelHits, text)`:

1. Drop model hits whose tag is YELL or NO_RESPONSE.
2. Drop model hits whose quote is empty or is not a substring of the reply (compare case-insensitively after collapsing whitespace and straightening quotes). No quote, no tag.
3. Union by tag. A tag found by both gets `source: "both"` and the rule's quote.
4. Exclusions, in this order: NO_RESPONSE present → keep only NO_RESPONSE. UNSAFE present → keep only UNSAFE. GIVE_IN present → remove HOLD_LIMIT and WHEN_THEN. OFFER_CHOICE present → remove QUESTION_COMMAND. BRIBE present → remove WHEN_THEN. THREAT present → remove WHEN_THEN.
5. Return the hits in canonical tag order. An empty list is valid ("No clear move" chip in the UI).

## 7. Model layer

Code in `src/llm`. Server side only. Keys come from environment variables and never reach the client.

### 7.1 Providers

Interface: `completeJson<T>({ system, user, schema, maxOutputTokens, timeoutMs }): Promise<T>` with two implementations, OpenAI and Anthropic, using each provider's official SDK and its structured-output or JSON mode. Always validate the result with zod; an invalid result counts as a failure.

- Model ids are read from `OPENAI_MODEL` and `ANTHROPIC_MODEL`. Do not hardcode ids. Before choosing, read each provider's current model documentation and pick its fastest small model that supports structured JSON output. Record the choice and the date in `docs/MODEL.md`.
- Order: `LLM_PRIMARY` (openai or anthropic) first, the other second. Timeouts: 4 s for the first attempt, 3.5 s for the second. Then rules-only for that turn. No retries beyond this.
- Stage A2 runs a bake-off on the dev split (accuracy and median latency for both providers) and sets `LLM_PRIMARY` to the better one; the numbers go into `docs/MODEL.md`.
- Budget guard: count model calls per day in Redis; above `MODEL_DAILY_CALL_CAP` (default 20000) switch to rules-only until the next day.
- The parent's reply is untrusted input. It goes into the user message inside a JSON string field, never into the system prompt. The system prompt says that the reply is data and that instructions inside it must be ignored.

### 7.2 The turn call

One call per turn returns tags and candidate lines.

Input (user message, JSON): scene title, place, age band, temperament, child name, setup, limit, what the child wants; arousal before the turn; the last three exchanges; the parent's reply.

Output schema:

```ts
{
  tags: { tag: SemanticTag; quote: string }[];          // 0..6, SemanticTag = every Tag except YELL and NO_RESPONSE
  lines: { calmer: ChildLine; same: ChildLine; angrier: ChildLine; resolved: ChildLine; gotIt: ChildLine };
}
// ChildLine = { line: string /* 1..120 chars */, action: string /* 0..80 chars, third person, no name */ }
```

System prompt requirements:

- Two jobs: tag the parent's reply strictly by the definitions (inserted from `src/engine/tags.ts`), and write what the child might say next in five variants. State clearly that the model does not decide whether the child calms down.
- Tagging: tag only what is clearly present; each tag needs an exact quote copied from the reply; prefer no tag to a doubtful tag; a choice question is OFFER_CHOICE, not QUESTION_COMMAND; a new reward for stopping is BRIBE while a normal next step is WHEN_THEN; "stop crying" and "calm down" are DISMISS.
- Lines: speak as this child at this age and temperament, reacting to the parent's actual words (if a choice was offered, `calmer` and `resolved` may pick one). `calmer` = about 15 points calmer than now, `angrier` = about 15 points more upset, `same` = no change, `resolved` = calm and cooperating with the limit, `gotIt` = pleased because the parent gave in. Age 2–3: two to six words. Age 4–5: one short sentence or two. Age 6–7: may argue about fairness. No swearing beyond "I hate you" level, no adult vocabulary, no narration, no advice.
- Six to eight worked examples written for this prompt. They must not be copied from `eval/labeled.jsonl`.

### 7.3 Custom scene

`POST /api/custom-scene` → one model call that turns the parent's description into a scene.

Output schema: `{ ok: boolean; refusal: "unsafe" | "not_a_meltdown" | null; scene: { title, place, setup, openingLine, openingAction, limit, wants, startArousal, temperament, limitHints, giveInHints } | null }`.

Server rules: run the UNSAFE rule cues on the description first and refuse without calling the model if they fire. Clamp `startArousal` to 60..90. Lowercase the hints, keep 3 to 6 of each, drop hints shorter than 4 characters. Set `id = "custom-" + random id`, `ageBand` and `childName` from the request. Store the scene with the session data for 24 hours. With no model available return `{ ok: false, reason: "model_unavailable" }` and the UI offers the library instead. Refusal messages: unsafe → the text and resources of section 12.2; not_a_meltdown → "Tell us about a moment when your child was upset and you had to hold a limit."

### 7.4 Coach suggestions

`POST /api/coach` for one turn of a finished session. One model call proposes up to three alternative replies for that moment, each at most 20 words, each with tags and quotes. The server then checks every suggestion with the engine: quotes must match, `ruleTags` must find no unhelpful tag, and `applyTurn` from the state before that turn must give a negative delta. Only suggestions that pass are returned, with the delta the engine computed ("would have moved the meter by −14"). With no model, or when nothing passes, return the tip for the turn's worst unhelpful tag from `content/tips.json` with its slots filled.

## 8. Server API

All request and response shapes live in `src/shared/api.ts` as zod schemas with inferred types. Both tracks import from there; nobody redefines them. Errors: `{ error: string; message: string }` with status 400 (validation), 404 (`session_expired`), 409 (`turn_out_of_order`, `session_ended`), 429 (`rate_limited`), 500.

```ts
// POST /api/session
SessionRequest  = { kind: "daily" | "library" | "custom"; sceneId?: string; practice?: boolean }
SessionResponse = { sessionId: string; kind: "daily" | "library" | "custom"; scene: PublicScene; state: ChildState;
                    par: number; maxTurns: 8; dayKey: string; dayNumber: number }

// POST /api/turn
TurnRequest  = { sessionId: string; turnIndex: number; text: string; loud?: boolean; timedOut?: boolean; inputMode: "text" | "voice" }
TurnResponse = { turnIndex: number; text: string; hits: TagHit[]; result: TurnResult;
                 child: { line: string; action: string } | null; tagging: "model" | "rules";
                 score: Score | null; daily: DailyStanding | null; usedDoOver: boolean }
DailyStanding = { dayKey: string; players: number; rank: number; beatPct: number | null }

// POST /api/custom-scene
CustomSceneRequest  = { description: string; ageBand: AgeBand; childName?: string }
CustomSceneResponse = { ok: true; sceneId: string; scene: PublicScene }
                    | { ok: false; reason: "unsafe" | "not_a_meltdown" | "model_unavailable"; message: string }

// POST /api/coach
CoachRequest  = { sessionId: string; turnIndex: number }
CoachResponse = { source: "model" | "tips"; suggestions: { text: string; tags: Tag[]; delta: number }[];
                  tip: { tag: Tag; why: string; tryInstead: string } | null }

// GET /api/daily
DailyResponse = { dayKey: string; dayNumber: number; sceneId: string; title: string; par: number; players: number }

// POST /api/waitlist
WaitlistRequest  = { email: string; plan: "monthly" | "yearly" }
WaitlistResponse = { ok: true }

// GET /api/health
HealthResponse = { ok: boolean; commit: string; time: string; redis: "up" | "memory";
                   providers: { openai: boolean; anthropic: boolean }; proPreview: boolean }

// GET /api/admin/stats?key=ADMIN_KEY   (team only)
AdminStats = { dayKey: string; sessionsStarted: number; sessionsFinished: number; waitlist: number; modelCalls: number; rulesFallbacks: number }

// Voice (stage 5): POST /api/transcribe (multipart "audio") → { text: string };  POST /api/speak { sessionId: string; turnIndex: number } → audio of the child line stored for that turn (turnIndex -1 = the opening line)
```

### 8.1 Turn handling

1. Load the session; missing → 404.
2. `turnIndex` greater than the number of stored turns → 409. Smaller → this is a do-over: drop the stored turns from `turnIndex` on and set `usedDoOver = true`.
3. If the (remaining) last turn already ended the scene → 409.
4. Trim the text, collapse whitespace, cut to 300 characters.
5. `ruleHits = ruleTags(text, scene, { loud, timedOut })`.
6. If the rule hits contain NO_RESPONSE or UNSAFE, skip the model. Otherwise make the turn call (7.2) with the provider chain.
7. `hits = mergeTags(ruleHits, modelHits, text)`; `result = applyTurn(scene, stateBeforeThisTurn, tags of hits)`.
8. `child = pickChildLine(modelLines, scene, result, sessionId + ":" + turnIndex)`.
9. Store the turn. If the outcome is not `ongoing`, compute the score. If the session is the daily scene, was not a do-over, is not marked practice, has not been counted and did not end `stopped_unsafe`, record it (8.3) and return the standing.
10. `tagging` is "model" when model tags were used for this turn, otherwise "rules".

The server is the only authority on state: the client never sends state, tags or scores.

### 8.2 Storage on the server

Redis through `ioredis`, URL in `REDIS_URL`. If Redis cannot be reached, fall back to an in-memory map in the single web process and report `redis: "memory"` in the health check.

| Key | Content | TTL |
| --- | --- | --- |
| `session:{id}` | scene (full), kind, dayKey, turns, usedDoOver, counted, practice | 6 h |
| `custom:{sceneId}` | generated scene | 24 h |
| `daily:{dayKey}:{sceneId}` | sorted set: member = sessionId, score = points | 14 d |
| `waitlist` | list of `{ email, plan, at }` | none |
| `stats:{dayKey}` | hash of counters | 30 d |
| `rl:{bucket}:{ip}` | rate-limit counters | window |

### 8.3 Daily standing

`players` = size of the day's sorted set; `rank` = 1 + number of sessions with more points; `beatPct` = round(100 × sessions with fewer points ÷ (players − 1)) when players ≥ 20, otherwise null. Never seed, pad or estimate these numbers. The client sets `practice: true` after the first finished daily scene of the day in that browser, so only first attempts are ranked.

### 8.4 Rate limits

Per IP (from `X-Forwarded-For` set by the proxy): 120 turns per hour, 10 custom scenes per day, 60 coach calls per hour, 120 transcriptions per hour, 5 waitlist posts per hour. Over the limit → 429 with a friendly message.

## 9. Storage in the browser

`localStorage`, one key `doover:v1`, read and written through `src/lib/store.ts` with try/catch (private mode must not break play):

```ts
{
  settings: { timer: 8 | 20 | 0; voice: boolean; calmBaselineDb: number | null },
  history: { id: string; at: string; dayKey: string; kind: "daily" | "library" | "custom"; sceneId: string; sceneTitle: string;
             outcome: Outcome; stars: number; turns: number; par: number; helpful: number; unhelpful: number;
             tagCounts: Partial<Record<Tag, number>> }[],   // newest first, max 200
  playbook: { id: string; at: string; text: string; tags: Tag[]; sceneTitle: string }[],
  dailyDone: Record<string /* dayKey */, true>,
  waitlistJoined: boolean
}
```

## 10. Free and Pro

| Feature | Free | Pro (planned: $9.99 a month or $59.99 a year) |
| --- | --- | --- |
| Meltdown of the day, do-overs, debrief, share | Yes | Yes |
| Progress and streak | Yes | Yes |
| Scene library | Today's scene only | All scenes |
| Replay your own meltdown | No | Yes |
| Coach suggestions | No | Yes |
| Voice mode | No | Yes |
| Playbook | 5 lines | Unlimited |

Gating is real code: one `isPro()` helper and one `<ProGate feature="…">` component. `NEXT_PUBLIC_PRO_PREVIEW=true` (the production setting for the hackathon) unlocks everything and shows a small "Pro preview" badge on gated features. With the flag false a gated feature shows a paywall card that links to `/pricing`. An end-to-end test covers both settings. There is no payment code and no fake checkout.

## 11. Voice mode (stage 5, stretch)

Requires HTTPS. Off by default; a toggle on the intro card.

- Input: hold-to-talk or tap-to-talk using `MediaRecorder`; up to 12 seconds; the audio is posted to `/api/transcribe`, which calls the provider's speech-to-text model (id from `OPENAI_TRANSCRIBE_MODEL`; check the current documentation) and returns text. The transcript is shown in the reply bubble and can be seen before the result arrives.
- Loudness: a Web Audio `AnalyserNode` measures RMS level in the browser. On first use a 3-second calibration ("Say hello in your normal voice") stores the calm baseline in settings. A reply whose loudest 300 ms window is 10 dB or more above the baseline is sent with `loud: true` and gets the YELL tag. A live level bar shows this while speaking.
- Output: the child's line is spoken through `/api/speak`, which only speaks lines the server itself produced for that session (provider text-to-speech, id from `OPENAI_TTS_MODEL`, with a young, upset delivery instruction when the model supports one; check the documentation), cached by text hash for the session; playback volume scales with arousal. Fallback: the browser's `speechSynthesis` with a higher pitch. No recorded crying samples unless their licence is checked and recorded in the README.
- Nothing is stored: audio is forwarded for transcription and discarded.

## 12. Safety, honesty, privacy

### 12.1 Honesty rules

- No hardcoded outcomes, no scripted demo path, no special-casing of sample inputs.
- No invented users, counters, ratings, testimonials, logos or press mentions.
- Every factual claim in the product comes from section 17 and links to its source.
- The pricing page says payments are not connected. Gated features say "Pro preview".
- `/how-it-works` shows measured accuracy, including where it is weak, and says that transfer to real life is not measured.

### 12.2 Unsafe replies and unsafe descriptions

When a reply is tagged UNSAFE the scene stops. Show, without judgement:

"Let's pause here. This is a practice space, and that reply described hurting or degrading a child, so the scene stops. If moments like this feel close to real life, you are not alone, and talking to someone helps. National Parent & Youth Helpline: call or text 1-855-427-2736, any time. In a mental health crisis, call or text 988."

Buttons: "Try this turn again" (a do-over of that turn) and "Back to scenes". The session is not scored, ranked or shared. The same text is used when a custom-scene description is refused as unsafe.

### 12.3 Disclaimer (footer and intro card)

"Do-Over is a practice tool. It is not therapy, medical advice or a diagnosis. The child is simulated and the scoring is a simplified model."

### 12.4 Privacy facts the page must state (verify against the code)

- No account, no advertising, no third-party analytics or tracking cookies.
- Replies and scene descriptions are sent to an AI provider (name the configured ones) to be tagged; they are kept on our server for up to 6 hours (custom scenes 24 hours) to run the session and are then deleted automatically.
- Daily ranking stores a random session id and a score, nothing else.
- History, playbook and settings stay in the browser's local storage; "Clear my data" on `/privacy` removes them.
- A shared playbook link carries its content in the link itself.
- The waitlist stores the email address and chosen plan.
- Voice audio is forwarded for transcription and not stored.

## 13. Evaluation

`eval/labeled.jsonl`: 137 parent replies, each `{ id, split: "dev" | "test", sceneId, text, tags, loud?, timedOut? }`. The file was drafted with an AI assistant; a team member reviews every label before submission and the README says exactly who did what.

Rules for everyone, including agents:

- Tune rules and prompts on the dev split only. Report on the test split.
- Never copy eval lines into rules, prompts or few-shot examples. Never special-case an eval line.
- Never change a label to make a metric pass. If a label looks wrong, list it under "Label disputes" in `docs/build/STATUS.md` for a human to decide.

Commands:

- `npm run eval` — rules only, offline, deterministic; runs in CI. Writes the `rules` block of `eval/results.json`.
- `npm run eval:model` — rules + model through the real merge, needs keys; not in CI. Writes the `merged` block, with provider, model id, date and median latency.

Metrics per split and mode: per-tag precision, recall, F1 and support; micro-averaged F1; exact-set match rate. `docs/MODEL.md` is generated from `eval/results.json`.

Gates (must hold on all 137 lines): UNSAFE recall 1.00 in rules-only mode; NO_RESPONSE and YELL exact in rules-only mode; the two prompt-injection lines (L078, L079) get no tags in both modes. Targets (report if missed, do not hide): rules-only precision on unhelpful tags ≥ 0.85 on test; rules + model micro-F1 ≥ 0.80 on test.

## 14. Quality bar

- TypeScript strict, no `any`, no `@ts-ignore`. ESLint and Prettier clean. No dead code, no commented-out blocks, no leftover stubs or console logs.
- Unit tests for the engine (golden vectors, each rule family, merge exclusions, scoring, par, day functions), for the API handlers with a fake provider, and for the store. Playwright end-to-end for the main loop.
- Turn round trip: median under 2.5 s with a model, under 300 ms rules-only.
- Accessibility: full keyboard use; visible focus; the child's line and the result of a turn are announced through an `aria-live` region; the meter has a text equivalent; chips carry icons and text; timer can be slowed or turned off; `prefers-reduced-motion` respected; contrast AA.
- Layout holds at 375, 768 and 1280 px. No horizontal scroll. Tap targets at least 44 px.
- Visual direction: warm and calm, not clinical and not childish. One accent colour. The meter and the child's line dominate the play screen. System font stack or one webfont. No stock photos of children.
- Empty, loading and error states for every screen. A lost session offers a restart. A 429 explains itself.

## 15. Stack and repository

Next.js (App Router, current stable), React, TypeScript, Tailwind CSS, zod, ioredis, the official `openai` and `@anthropic-ai/sdk` packages, Vitest, Playwright, ESLint, Prettier. Node: current LTS. Check versions at install time; do not pin from memory. No database besides Redis. No auth library. No UI kit beyond small headless primitives if needed.

```
src/engine/      pure engine (track A)
src/llm/         providers, prompts, turn call, custom scene, coach (track A)
src/server/      redis, session store, rate limit, daily, env (track A)
src/app/api/     route handlers (track A)
src/shared/      api.ts — the contract (frozen after stage 0; change only by agreement)
src/app/         pages and layouts except api/ (track B)
src/components/  UI components (track B)
src/lib/         browser store, api client, share, formatting (track B)
src/voice/       recorder, loudness, playback (track B)
content/         scenes.json, tips.json, templates.json, par.json (track A)
eval/            labeled.jsonl, run.ts, results.json (track A)
e2e/             Playwright tests (track B)
scripts/         deploy.sh (track B), par.ts (track A)
docs/            SPEC.md, MODEL.md (A), DEPLOY.md (B), build/, reference/
Dockerfile, docker-compose.yml, Caddyfile, .env.example, .github/workflows/ci.yml (track B)
```

Scripts in `package.json`: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `par`, `eval`, `eval:model`, `e2e`, and `verify` = lint + typecheck + test + eval + build.

## 16. Deployment

Target: one Linux VPS with a public IP and a domain. Docker Compose with three services:

- `web`: the Next.js app built with `output: "standalone"`, multi-stage Dockerfile, runs as a non-root user, listens on 3000 inside the network only, has a health check on `/api/health`.
- `redis`: `redis:7-alpine` with append-only persistence and a named volume. Not published to the host.
- `caddy`: publishes 80 and 443, obtains certificates automatically, proxies to `web:3000`, sets `X-Forwarded-For`. Caddyfile: `{$DOMAIN} { encode zstd gzip; reverse_proxy web:3000 }`.

Environment (`.env` on the server, never committed; `.env.example` lists every name with a comment): `DOMAIN`, `SITE_URL`, `REDIS_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `LLM_PRIMARY`, `MODEL_DAILY_CALL_CAP`, `OPENAI_TRANSCRIBE_MODEL`, `OPENAI_TTS_MODEL`, `NEXT_PUBLIC_PRO_PREVIEW`, `ADMIN_KEY`, `GIT_SHA`.

`scripts/deploy.sh` (run on the server from the repository folder): fetch and fast-forward `main`, export `GIT_SHA`, `docker compose up -d --build`, wait until `https://$DOMAIN/api/health` returns `ok: true` with the new commit, print the result, exit non-zero on failure. `docs/DEPLOY.md` covers first-time setup: DNS A record, firewall (22, 80, 443), Docker install, clone, `.env`, first start, rollback (`git checkout <sha> && ./scripts/deploy.sh --no-pull`).

CI (`.github/workflows/ci.yml`): on every push and pull request run `npm ci` and `npm run verify`.

## 17. Facts allowed in product copy

Use only these, worded no more strongly than here, each with its link.

1. "48% of parents say that most days their stress is completely overwhelming, compared to 26% among other adults." U.S. Surgeon General's Advisory on the Mental Health and Well-Being of Parents, 2024 (2023 data). https://www.hhs.gov/surgeongeneral/reports-and-publications/parents/index.html
2. A meta-analysis of 77 evaluations of parent training programs found larger effects for programs that, among other things, required parents to practise new skills with their own child during sessions. Kaminski, Valle, Filene and Boyle, Journal of Abnormal Child Psychology, 2008. https://pubmed.ncbi.nlm.nih.gov/18205039/ — always followed by: Do-Over is rehearsal against a simulated child; we have not measured its effect.
3. National Parent & Youth Helpline, operated by Parents Anonymous: 1-855-427-2736, call, text or chat, 24 hours a day. https://parentsanonymous.org/helpline/sample-helpline/

For the pitch deck and the README only, not for the landing page: Good Inside, a parenting membership, charges $279 a year or $84 a quarter (https://support.goodinside.com/hc/en-us/articles/4416301207060-How-much-does-Good-Inside-cost) and reported $34 million in revenue last year, up nearly 50%, profitable, with more than 100,000 subscribers (Fortune, republished at https://www.aol.com/articles/exclusive-dr-becky-kennedy-built-143000907.html).

## 18. Out of scope

Accounts and login, payments, native apps, push notifications, a general parenting chatbot, languages other than English, children as users, storing audio, admin dashboards beyond the stats endpoint, analytics SDKs, social feeds, leaderboards with names.
