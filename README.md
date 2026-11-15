<p align="center">
  <a href="https://veltral.aituconnect.kz">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/hero-dark.jpg">
      <img src="docs/screenshots/hero-light.jpg" alt="Do-Over: You know what to say. Until they scream. A paper stage with a child refusing to leave the playground." width="100%">
    </picture>
  </a>
</p>

<h1 align="center">Veltral</h1>

<p align="center">
  <strong>A meltdown simulator for parents of 2–7 year olds.</strong><br>
  Answer a screaming child in your own words, see exactly what your words did, then rewind and take it again.
</p>

<p align="center">
  <a href="https://veltral.aituconnect.kz"><strong>Live product</strong></a> ·
  <a href="https://veltral.aituconnect.kz/play">Play today's meltdown</a> ·
  <a href="https://veltral.aituconnect.kz/jury">Jury guide</a> ·
  <a href="https://veltral.aituconnect.kz/how-it-works">How it works</a>
</p>

<p align="center">
  No account · about 3 minutes · works on a phone · built by team Veltral for Business Cup 2.0, track <strong>Skills</strong>
</p>

---

## The problem

Parents who have read the books know what to say: name the feeling, hold the limit, offer a choice. In the third minute of screaming at a supermarket checkout they threaten, bribe or yell anyway, and feel bad about it that night.

Knowing the script is not the same as being able to say it under pressure. Books, courses and memberships sell knowledge. Nothing sells repetitions.

> 48% of parents say that most days their stress is completely overwhelming, compared to 26% among other adults.
> — [U.S. Surgeon General's Advisory, 2024](https://www.hhs.gov/surgeongeneral/reports-and-publications/parents/index.html)

**Do-Over is the place to get the repetitions**, where nothing is at stake.

## One moment, two takes

Both screenshots are from the same session on the live site. The parent threatened, the storm hit 100, then they pressed **Do-over from here** and tried other words.

| Take 1: a threat. Storm **+25**                                                                                        | Take 2: empathy, the limit and a choice. Storm **−18**                                                                         |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| ![Take 1: a threat sends the storm to 100; the child jumps and screams under dark clouds](docs/screenshots/take-1.jpg) | ![Take 2: the same moment answered with empathy, the limit and a choice; the storm settles to 57](docs/screenshots/take-2.jpg) |

Every reply becomes a slip beside the stage: the words that counted are underlined, each move is named, and a ledger shows what every move did and adds up to the total. The weather and the child are drawn from the same numbers.

<p align="center">
  <img src="docs/screenshots/ending.jpg" alt="The ending: the storm is at 17, the sun is out, the limit sign still stands. Calm, and the limit held." width="78%">
</p>

## Try it in 90 seconds

1. **Play today's meltdown** at [/play](https://veltral.aituconnect.kz/play). Read the child's line and answer however you like. Try a threat, try nonsense, try something kind.
2. **Do a turn over.** When the scene ends, open the script and press **Do-over from here** on your worst turn. The stage rewinds to that moment and the clapperboard says Take 2.
3. **Open a locked scene** from [/scenes](https://veltral.aituconnect.kz/scenes). The paywall shows the price and a demo code: enter **`ENCORE`** to open the season pass on your device with no payment. **Return to Free** on [/pricing](https://veltral.aituconnect.kz/pricing) locks it again.
4. **See a week of use** at [/progress](https://veltral.aituconnect.kz/progress). Switch on **Show a sample week** to see a streak, a level and a weekly plan filled in. It is labelled as sample data on every card.

## Why it is different

|                                                            | What you do                                               | What you get back                                                                           |
| ---------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Courses and memberships (Good Inside, Big Little Feelings) | Watch and read                                            | Knowledge                                                                                   |
| Scenario quiz apps (Kapi)                                  | Pick one of four prepared answers                         | An explanation of the right answer                                                          |
| AI chat companions                                         | Chat with a model that also decides how it went           | Whatever the model says                                                                     |
| **Do-Over**                                                | **Say it yourself, under a clock, to a child who reacts** | **Every move in your words named and scored by a tested engine, and a rewind to try again** |

Picking the right answer from four is easy. Producing it while a child screams is the skill.

## How it works

```mermaid
flowchart LR
  Reply["Your reply"] --> Rules["Rule tagger<br/>instant, deterministic"]
  Reply --> Model["Language model<br/>proposes tags with exact quotes<br/>and writes the child's lines"]
  Rules --> Merge["Merge<br/>no quote, no tag"]
  Model --> Merge
  Merge --> Engine["Engine<br/>storm, connection, outcome"]
  Engine --> Stage["Paper stage<br/>weather and child follow the numbers"]
  Engine --> Script["Ledger, script, do-over"]
```

The child has two numbers: **storm** (arousal, 0–100) and **connection**. Nineteen tags move them by fixed, tested amounts: seven helpful moves (named the feeling, held the limit, offered a choice, connected, clear instruction, specific praise, when–then) and twelve unhelpful ones (threat, bribe, raised voice, shaming, dismissing the feeling, lecture and others). Modifiers account for repeating yourself, low or high connection, mixed messages, the child's temperament and age.

The scene ends calm when the storm falls to 25 or lower with the limit intact, ends "quiet, but the limit is gone" if you give in, and runs out after eight turns. A reply that describes hurting or degrading a child stops the scene with no score and shows the National Parent & Youth Helpline.

The teaching model behind the numbers is simple and stated on [/how-it-works](https://veltral.aituconnect.kz/how-it-works), which renders the tag table and constants straight from the code: connect before you direct; empathy and the limit together beat either alone; choices help; harsh words cancel kind ones; bribes work now and cost later.

### Real, not a wrapper

- **The engine decides. The model only proposes.** `src/engine` is pure, synchronous TypeScript checked against 37 golden vectors. A model tag is dropped unless it quotes the reply exactly, and the model never touches the outcome.
- **It works with the model switched off.** Without a provider key, rules tag the reply and written lines speak for the child. Each slip says whether it was "Tagged with the model" or "Tagged by rules only".
- **Every number on screen comes from the engine** or from tested functions over your own history. The sample reply on the landing page is scored by the real engine on every request.
- **Negation is read, not pattern-matched.** "You are not selfish", "You don't have to stop crying" and "Fine, you can hold my hand. No candy today." are not mistaken for shaming, dismissing or giving in.

## What is inside

<p align="center">
  <img src="docs/screenshots/scenes.jpg" alt="The scene shelf: miniature paper stages for the candy aisle, the wrong cup, the car seat and bath time" width="100%">
</p>

- **Twelve scenes** for ages 2–3, 4–5 and 6–7: the candy aisle, the wrong cup, the car seat, bath time, leaving the playground, tablet off, getting dressed, sharing a toy, lights out, hitting a brother, dinner refusal, leaving a party. Each has its own set, child and temperament.
- **A new shared scene every day** with a par, stars, a streak and a spoiler-free share text:

  ```
  Do-Over #2 · Leaving the playground
  🟥🟩🟩🟩 Calm in 4 (par 3) ★★
  ```

- **The script.** Every turn with its stamps, ledger and notes; the turning point is flagged; a free "try instead" line on your worst turn that you can replay with one press.
- **Replay your own.** Describe a real meltdown from today in a sentence or two and rehearse it as a new scene.
- **Your lines.** Save replies that worked and share the playbook with a co-parent through a link that carries its data in the URL fragment and never reaches the server.
- **Voice mode.** Say it out loud; a raised voice is detected from loudness and tagged.
- **Three paces:** 20 seconds for a first run, 8 seconds as in real life, or no timer. The clock waits while the tab is hidden.
- **Light and dark themes**, keyboard play, screen-reader announcements for the child's line and each result, reduced-motion support.

<p align="center">
  <img src="docs/screenshots/progress.jpg" alt="Progress with the sample week switched on: a 7-day streak and level 4, each card labelled as sample data" width="88%">
</p>

## What you pay for, and why you come back

|                                                              | Free          | Season pass |
| ------------------------------------------------------------ | ------------- | ----------- |
| Today's meltdown, unlimited do-overs, the script, sharing    | Yes           | Yes         |
| Progress, weekly plan and streak                             | Yes           | Yes         |
| Scene library                                                | Today's scene | All twelve  |
| Replay your own meltdown                                     | No            | Yes         |
| "What could I have said?" alternatives checked by the engine | No            | Yes         |
| Voice mode                                                   | No            | Yes         |
| Your lines (playbook)                                        | 5 lines       | Unlimited   |

**$9.99 a month or $59.99 a year, with a 7-day free trial.**

<p align="center">
  <img src="docs/screenshots/paywall.jpg" alt="The paywall on a locked scene: what the season pass includes, monthly and yearly prices, and the demo code" width="88%">
</p>

The pass is a signed, httpOnly cookie enforced on the server: gated endpoints answer `402 pro_required` without it. A test-mode Stripe checkout is built in and appears when a `sk_test_` key is configured; the server refuses any other key, so a real charge is impossible. The live site offers the demo code `ENCORE` so reviewers can pass the paywall without a card.

**Why a parent renews:**

- The need lasts for years, not weeks. A two-year-old's meltdowns become a six-year-old's arguments about fairness, and the scenes follow.
- **Replay your own** turns every real meltdown at home into new practice, so the content never runs out.
- The **weekly plan** is built from your own most frequent slip and your least-used move, and ticks itself off as you play.
- Seven **moves** rank up from "Rough cut" to "Second nature"; **then and now** compares your first scenes with your latest.
- The playbook of lines that worked grows and is shared with the other parent.

## Measured, with its limits

Tagging accuracy on the held-out test split (63 of 137 labelled replies), from [`eval/results.json`](eval/results.json). Method and per-tag numbers: [`docs/MODEL.md`](docs/MODEL.md).

|                         | Rules only | Rules + model (`gpt-6-luna`) |
| ----------------------- | ---------: | ---------------------------: |
| Micro-F1                |      98.6% |                        96.6% |
| Exact-set match         |      96.8% |                        92.1% |
| Unhelpful-tag precision |       100% |                        89.7% |

Five gates run on every `npm run verify`: unsafe replies are always caught in rules-only mode, empty and shouted replies are tagged exactly, and two prompt-injection replies get no tags. The labelled set was drafted with an AI assistant and a human review of every label is not recorded (`labelsReviewedByHuman: false`), so read these figures as a regression check, not as proof.

## Engineering

- **587 unit and integration tests in 40 files**, strict TypeScript with no `any`, ESLint and Prettier clean, Playwright end-to-end suites for the main loop, the paywall, retention, trust pages and voice.
- **The server is the only authority on state.** The browser never sends state, tags or scores. Every request and response is validated with zod schemas from one shared contract, [`src/shared/api.ts`](src/shared/api.ts).
- **Resilient by design.** Two model attempts with hard timeouts, then rules for that turn; a daily model-call cap; Redis with a bounded in-memory fallback; per-IP rate limits.
- **Prompt-injection aware.** The parent's reply travels as data inside a JSON field and is never placed in the system prompt.
- **Private by default.** No account, no analytics SDK, no third-party cookies. History, playbook and settings stay in the browser. Server sessions expire after 6 hours.
- **The stage is code.** The proscenium, twelve sets, weather and every child are hand-written SVG and CSS driven by one pure, tested function of the engine state.

<details>
<summary><strong>Repository map</strong></summary>

| Path                                        | What it holds                                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/engine`                                | Tags, rule tagger, merge, state transition, scoring, par, daily rotation. Pure and synchronous                    |
| `src/llm`                                   | Provider adapters, prompts, the turn call, custom scenes, coach, speech                                           |
| `src/server`                                | Sessions, Redis, rate limits, daily standing, season-pass cookie                                                  |
| `src/app/api`                               | Route handlers: session, turn, coach, custom-scene, daily, entitlement, checkout, redeem, voice                   |
| `src/shared/api.ts`                         | The API contract as zod schemas                                                                                   |
| `src/components/stage`                      | The paper stage: sets, props, weather, the child, mood                                                            |
| `src/components/play`                       | Play screen, turn slip and ledger, endings, the script, do-over                                                   |
| `src/components/paywall`, `src/app/pricing` | Paywall and season pass                                                                                           |
| `src/lib`                                   | Browser store, progress, weekly plan, moves, share text                                                           |
| `content`                                   | Scenes, tips, child-line templates, par                                                                           |
| `eval`                                      | Labelled replies, the evaluation runner and results                                                               |
| `e2e`                                       | Playwright suites                                                                                                 |
| `docs`                                      | [SPEC](docs/SPEC.md), [REDESIGN](docs/REDESIGN.md), [MODEL](docs/MODEL.md), [DEPLOY](docs/DEPLOY.md), build notes |

</details>

## Run it locally

Node 24 or newer.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. With no provider key the game runs on rules, and the demo code `ENCORE` opens the season pass.

```sh
npm run verify   # lint, types, unit tests, evaluation gates, production build
npm run e2e      # browser tests, see e2e/README.md
npm run eval     # rules-only tagging accuracy, offline
npm run par      # recompute the par of every scene
```

<details>
<summary><strong>Environment variables</strong></summary>

Every name is documented in [`.env.example`](.env.example). The ones that matter:

| Variable                                      | Purpose                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`, `OPENAI_MODEL`              | Optional. Tag proposals, child lines, custom scenes, coach. Empty means rules-only |
| `OPENAI_TRANSCRIBE_MODEL`, `OPENAI_TTS_MODEL` | Optional. Voice mode                                                               |
| `REDIS_URL`                                   | Sessions, rate limits, daily standing. Falls back to memory                        |
| `ENTITLEMENT_SECRET`                          | Signs the season-pass cookie                                                       |
| `DEMO_CODE`                                   | The code shown on the paywall for reviewers                                        |
| `STRIPE_SECRET_KEY`                           | Optional. Test-mode checkout; only `sk_test_` keys are accepted                    |
| `NEXT_PUBLIC_PRO_PREVIEW`                     | `true` unlocks everything for development; production uses `false`                 |

Deployment (Docker Compose with Redis behind nginx or Caddy) is described in [`docs/DEPLOY.md`](docs/DEPLOY.md). `/api/health` reports the running commit.

</details>

## Built with

Next.js 16 (App Router) · React 19 · TypeScript · zod · Redis (ioredis) · motion · the official OpenAI and Stripe SDKs · Vitest · Playwright · Docker.

## How AI tools were used

The team wrote the product spec and the redesign brief, reviewed every screen and ran the deployment. AI coding agents (Claude and GPT models) wrote and reviewed the code against those documents, and the labelled evaluation set was drafted with an AI assistant. At runtime a language model proposes tags and writes the child's lines; it never decides an outcome. Build notes and verification history are in [`docs/build/`](docs/build/).

## Limits

- The child is simulated and the scoring is a simplified teaching model. The numbers are design choices for a practice game, not measurements of real children.
- A meta-analysis of 77 parent-training evaluations found larger effects for programs that had parents practise new skills with their own child ([Kaminski et al., 2008](https://pubmed.ncbi.nlm.nih.gov/18205039/)). Do-Over is rehearsal against a simulated child; we have not measured whether practice here changes what happens at home.
- English only. No accounts, so progress lives in one browser.
- The labelled set is small and AI-drafted.
- Do-Over is a practice tool. It is not therapy, medical advice or a diagnosis.

---

<p align="center">
  <a href="https://veltral.aituconnect.kz"><strong>veltral.aituconnect.kz</strong></a> · <a href="LICENSE">MIT licence</a> · © 2026 Veltral
</p>
