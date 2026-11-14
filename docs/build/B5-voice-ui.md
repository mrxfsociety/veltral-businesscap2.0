# B5 — Voice mode interface (stretch; only after the go decision at checkpoint 2)

Track B. Branch: `b5-voice-ui`. Target: 60 minutes. Depends on: A5 merged or in review.

Read first: SPEC section 11.

## Build

1. Voice toggle on the intro card (Pro preview badge). Microphone permission flow with a clear fallback to typing when denied or unsupported.
2. `src/voice/recorder.ts` (MediaRecorder, 12-second cap), `loudness.ts` (RMS in dB from an AnalyserNode, 300 ms windows, calibration and the 10 dB rule as pure functions), `playback.ts` (plays `/api/speak` audio with volume scaled by arousal; falls back to `speechSynthesis`).
3. Play screen in voice mode: tap to talk, live level bar with the calm baseline marked, the transcript shown in the reply bubble, the child line spoken, the timer counting until speech starts.
4. Calibration dialog on first use; result stored in settings; "Recalibrate" in the intro card.

## Acceptance

- Unit tests for the loudness functions with synthetic buffers: quiet, normal, 10 dB above baseline, clipping.
- Manual run on a laptop and on a phone over HTTPS: a calm reply is transcribed and tagged; the same words shouted add the "Raised voice" chip; denying the microphone falls back to typing. Results described in the report.
- Text mode is unchanged (the main-loop Playwright suite still passes).
- `npm run verify` passes.
