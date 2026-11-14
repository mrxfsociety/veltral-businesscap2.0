# B2 — Debrief, do-over, share, history

Track B. Branch: `b2-debrief`. Target: 75 minutes. Depends on: B1 merged.

Goal: the end of a scene teaches something and gives a reason to try again.

Read first: SPEC sections 4.3 (Ended), 5.6, 5.7, 9, 12.2.

## Build

1. Ended screen for the four outcomes with the titles and sub-lines of SPEC 4.3.
2. Debrief: stars, turns vs par, grid squares; every turn with reply, underlined quotes, chips, delta, all notes, child answer; the turning point marked.
3. "Do-over from here" on every turn: sends the next reply with that `turnIndex`; earlier turns stay on screen; the debrief afterwards shows the new line of play.
4. "Save to playbook" on eligible turns (all chips helpful and delta ≤ −8), honouring the free limit through `isPro()` (a simple helper for now; B3 completes gating).
5. Share button: builds the text of SPEC 4.3 for each outcome and copies it; shows what was copied.
6. Unsafe pause screen with the exact text and buttons of SPEC 12.2; no score, no share, not written to history.
7. History: write the finished session to the local store (SPEC 9); mark the daily scene done.
8. `/play/[sceneId]` for library and custom scenes; unknown id → friendly not-found.

## Acceptance

- Playwright against the stubs: finish a scene, see the debrief, do-over from turn 2, finish again; the earlier turn 1 is unchanged; history has one entry per finished run.
- Unit tests for the share text of every outcome and for the eligibility rule of "Save to playbook".
- The unsafe screen shows the helpline text exactly as in SPEC 12.2 (test compares the string).
- Screenshots of the debrief at 375 px and 1280 px.
- `npm run verify` passes.
