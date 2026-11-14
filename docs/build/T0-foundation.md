# T0 — Foundation (run once, before the tracks split)

Branch: `t0-foundation`. Run by the track B executor. Target: 35 minutes. Nothing else starts until this is merged.

Goal: a deployed skeleton with the frozen contract and working stubs, so that track A and track B can build in parallel without touching each other's files.

Read first: `AGENTS.md`; SPEC sections 3, 5.1, 5.2, 8, 9, 10, 15, 16.

## Build

1. Next.js app (App Router, TypeScript strict, Tailwind), ESLint, Prettier, Vitest, Playwright. Install every dependency both tracks will need now: `zod`, `ioredis`, `openai`, `@anthropic-ai/sdk`, an id generator. Check current versions and documentation; do not pin from memory.
2. Keep the files already in the repository unchanged: `AGENTS.md`, `CLAUDE.md`, `docs/**`, `content/scenes.json`, `eval/labeled.jsonl`.
3. The contract: `src/engine/types.ts` exactly as SPEC 5.1; `src/shared/api.ts` with a zod schema and inferred type for every request and response in SPEC 8, including error bodies. Add a unit test that parses one valid example of each shape.
4. Folder layout of SPEC 15 with a short `README.md` line in each top folder saying which track owns it.
5. Stubs, each starting with the comment `// STUB(T0): replaced in stage A2` (or A3), kept as small as possible:
   - `POST /api/session`: real scene from `content/scenes.json` (daily = first scene), initial state per SPEC 5.4, par 3, in-memory session map.
   - `POST /api/turn`: placeholder logic only — one helpful hit when the text contains "you", one THREAT hit when it contains "if", otherwise no hits; arousal −10 or +10; ends at arousal ≤ 25 or after 8 turns; a fixed child line. It must return a body that validates against `TurnResponse`.
   - `GET /api/daily`, `POST /api/waitlist`, `POST /api/custom-scene` (returns `ok: false, reason: "model_unavailable"`), `POST /api/coach` (returns `source: "tips"` with a placeholder tip): minimal valid bodies.
   - `GET /api/health`: real (commit from `GIT_SHA`, redis "memory", providers by presence of keys).
6. Pages: `/` with the product name, one line and a link to `/play`; `/play` as a bare page that starts a session and sends one turn, to prove the wiring. Track B replaces both in B1.
7. `package.json` scripts of SPEC 15. `par`, `eval`, `eval:model` print "pending stage A1/A2" and exit 0 for now.
8. Delivery: `Dockerfile`, `docker-compose.yml`, `Caddyfile`, `.env.example`, `scripts/deploy.sh`, `docs/DEPLOY.md`, `.github/workflows/ci.yml`, all per SPEC 16. `.gitignore` covers `.env*` except `.env.example`.

## Acceptance

- `npm run verify` passes.
- `docker compose up -d --build` on a clean machine serves `http://localhost/api/health` (or the mapped port) with `ok: true`.
- `curl` examples for session and turn in the report return bodies that validate against the schemas.
- `grep -R "STUB(T0)" src | wc -l` equals the number of stub files listed in the report.
- After the human runs `docs/DEPLOY.md` on the server: `https://<domain>/api/health` returns `ok: true` and the commit of `main`.
