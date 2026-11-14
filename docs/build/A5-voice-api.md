# A5 — Voice endpoints (stretch; only after the go decision at checkpoint 2)

Track A. Branch: `a5-voice-api`. Target: 40 minutes.

Read first: SPEC section 11; the provider's current speech-to-text and text-to-speech documentation.

## Build

1. `POST /api/transcribe`: multipart audio up to 12 seconds and 1 MB → provider transcription → `{ text }`. Nothing written to disk or Redis.
2. `POST /api/speak`: `{ sessionId, turnIndex }` → audio of the child line the server stored for that turn (`-1` = the opening line). The endpoint never speaks free text. Cache by text hash in memory for one hour.
3. Rate limits per SPEC 8.4; clear errors when the provider is unavailable so the client can fall back.

## Acceptance

- Tests with a fake provider for success, oversize audio, provider failure and rate limit.
- With real keys: a recorded phrase is transcribed correctly and a child line is returned as playable audio (state the measured latency of each).
- `npm run verify` passes.
