# Do-Over foundation

This is the T0 development foundation for Do-Over. The API routes marked `STUB(T0)` are placeholders for parallel interface development. They must be replaced by track A; they are not an actual parenting simulation.

Read `AGENTS.md`, `docs/SPEC.md` and `docs/build/T0-foundation.md` before implementing a stage. The shared contract is in `src/shared/api.ts` and `src/engine/types.ts`; freeze it after T0 is accepted.

Node 26 LTS is the deployment target. Package installation is still pending because this task's terminal cannot reach npm and GitHub Actions stopped before executing any steps. Generate and commit `package-lock.json` before accepting T0.

```sh
npm install
cp .env.example .env.local
npm run dev
```

`/play` exercises session creation and turn submission. `npm run verify` is the full acceptance command. Local targeted validation passed 35 contract/route tests using cached Vitest and Zod4, plus strict TypeScript. This is not a passing Next build or full verify. Docker is unavailable locally and production was not deployed. Setup and deployment are documented in `docs/DEPLOY.md`.

After installation, these calls exercise the live route wiring (the session ID must be copied from the first response):

```sh
curl -sS localhost:3000/api/session -H 'Content-Type: application/json' -d '{"kind":"daily"}'
curl -sS localhost:3000/api/turn -H 'Content-Type: application/json' -d '{"sessionId":"COPY_ID","turnIndex":0,"text":"You wanted it.","inputMode":"text"}'
```

The live curl/Docker/HTTPS checks have not yet run. No stage acceptance is claimed. Voice requires the separate checkpoint decision described in `docs/build/B5-voice-ui.md`.
