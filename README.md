# Do-Over

Do-Over is a parenting practice game. A deterministic, tested engine decides state, outcomes and scores. OpenAI supplies language understanding and child dialogue; unavailable model calls fall back to rules and age-specific templates.

This isolated review branch integrates A1–A5 with B1–B4: timed practice, feedback, do-over, library, custom scenes, retention and trust pages. Five reviewed B defects are repaired here; the parallel B branch is preserved. Voice APIs are implemented, while the B5 microphone/playback interface is still pending. Implementation and verification evidence is in [the track A report](docs/build/TRACK-A-REPORT.md); measured accuracy and latency are in [MODEL.md](docs/MODEL.md). No human label review or real-life parenting benefit is claimed.

## Local development

Use Node 26 LTS (Node 24+ supported):

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set private credentials only in the ignored environment file or deployment secret store. The owner selected OpenAI only: use `OPENAI_MODEL=gpt-6-luna`, `OPENAI_REASONING_EFFORT=none`, `LLM_PRIMARY=openai`, and leave Anthropic fields empty. Voice uses separate transcription/speech model variables. Never expose provider keys through `NEXT_PUBLIC_` variables.

## Verification

```sh
npm run verify
RUN_REDIS_INTEGRATION=1 npm test
npm run check:eval-isolation
npm run par
```

Live scripts need environment variables explicitly loaded, for example:

```sh
node --env-file=.env.local --conditions=react-server --import=tsx eval/run.ts --model --dev-only --provider=openai --timeout-ms=30000
node --env-file=.env.local --conditions=react-server --import=tsx eval/run.ts --model --timeout-ms=30000
node --env-file=.env.local --conditions=react-server --import=tsx scripts/latency.ts
node --env-file=.env.local --conditions=react-server --import=tsx scripts/live-smoke.ts
```

Accuracy runs may allow 30 seconds to include every model prediction; normal play keeps the 4-second deadline and records fallbacks separately. The live smoke script uses isolated practice sessions and synthetic local audio, not a microphone recording.

Deployment domain: [veltral.aituconnect.kz](https://veltral.aituconnect.kz). Deployment health and review status are recorded in the implementation report.

Read [SPEC](docs/SPEC.md), [API contracts](src/shared/api.ts), [engine types](src/engine/types.ts) and [deployment instructions](docs/DEPLOY.md). Reference scenes, vectors and evaluation labels are unchanged. The supplied labels still require human review.
