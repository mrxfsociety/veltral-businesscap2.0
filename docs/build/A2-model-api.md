# A2 — Model layer and the real play API

Track A. Branch: `a2-model-api`. Target: 90 minutes. Depends on: A1 merged.

Goal: `/api/session` and `/api/turn` run on the real engine with model tags and child lines, and keep working with no model and no Redis.

Read first: SPEC sections 3, 7.1, 7.2, 8 (8.1–8.4), 12.1, 13.

## Build

1. `src/server/env.ts` (zod-validated environment), `redis.ts` (ioredis with in-memory fallback), `sessionStore.ts`, `rateLimit.ts`, `stats.ts`.
2. `src/llm/provider.ts` with `completeJson`, `openai.ts`, `anthropic.ts`. Check each SDK's current documentation for structured output and for the fastest small model; ids come from the environment.
3. `src/llm/turn.ts`: the turn call of SPEC 7.2. The tag definitions in the prompt are generated from `src/engine/tags.ts`. Six to eight examples written for the prompt.
4. Route handlers `session` and `turn` per SPEC 8.1, replacing the T0 stubs. The provider is injected so tests can use a fake.
5. Budget guard and the provider chain with the timeouts of SPEC 7.1. `tagging` reports what really happened.
6. `npm run eval:model` writing the `merged` block of `eval/results.json`; a bake-off of both providers on the dev split (accuracy and median latency); set `LLM_PRIMARY` in `.env.example` accordingly; write `docs/MODEL.md` from the results.
7. `GET /api/health` reports real Redis state.

## Acceptance

- Handler tests with a fake provider cover: model success; first provider times out and the second answers; both fail → rules-only with `tagging: "rules"`; invalid JSON from the model; a model tag with a quote that is not in the reply is dropped; YELL or NO_RESPONSE from the model is ignored; UNSAFE stops the scene and skips the model; GIVE_IN ends the scene; do-over truncates and sets `usedDoOver`; `turn_out_of_order` and `session_ended` return 409; expired session returns 404; rate limit returns 429.
- With real keys, three different replies to the same scene produce three different, sensible results (paste them). With keys removed, the same three replies still return valid results in rules-only mode.
- With Redis stopped, a full scene can be played and health shows `redis: "memory"`.
- `grep -R "STUB(T0)" src/app/api/session src/app/api/turn` finds nothing.
- `docs/MODEL.md` exists with provider, model id, date, test-split metrics for both modes, and median latency.
- `npm run verify` passes.
