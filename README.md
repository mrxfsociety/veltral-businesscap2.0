# Do-Over — track A

Do-Over is a parenting practice game. A deterministic, tested engine decides state, outcomes and scores. OpenAI supplies language understanding and child dialogue; unavailable model calls fall back to rules and age-specific templates.

This branch implements A1–A5: engine, play/feature APIs, evaluation and voice APIs. The integrated interface is developed in parallel on track B. Implementation and verification evidence is in [the track A report](docs/build/TRACK-A-REPORT.md); measured accuracy and latency are in [MODEL.md](docs/MODEL.md). No human label review or real-life parenting benefit is claimed.

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

Read [SPEC](docs/SPEC.md), [API contracts](src/shared/api.ts), [engine types](src/engine/types.ts) and [deployment instructions](docs/DEPLOY.md). Reference scenes, vectors and evaluation labels are unchanged. The supplied labels still require human review.
