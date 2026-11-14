# B3 — Reasons to return and what is sold

Track B. Branch: `b3-retention-pro`. Target: 90 minutes. Depends on: J1 merged (uses A3 endpoints as they land; until then the T0 stubs answer).

Read first: SPEC sections 4.4–4.8, 7.3, 7.4, 8.3, 9, 10.

## Build

1. `/scenes`: twelve cards by age band with par and best stars from history; today's scene marked.
2. `/replay`: the form of SPEC 4.5 → custom scene → play. Refusal and unavailable states.
3. `/playbook`: list, copy, delete, the free limit, and "Share with a co-parent" with the fragment link and the read-only `/playbook/shared` view (validate and size-limit what is read from the fragment).
4. `/progress`: streak, counts, the 14-session chart of helpful share, most-used helpful tag, most frequent slip, session list, empty state.
5. `/pricing`: the table of SPEC 10, "Planned price", the payments notice, the waitlist form with success and error states.
6. Gating: `isPro()` and `<ProGate>` driven by `NEXT_PUBLIC_PRO_PREVIEW`; "Pro preview" badges; paywall card when the flag is false.
7. Debrief additions: coach suggestions ("What could I have said?") with the engine-computed delta; daily standing; "Do-Over #N" header on the daily scene; `practice: true` after the first finished daily run of the day.

## Acceptance

- Playwright with the flag true: library → play a non-daily scene; replay form → generated scene starts (real keys) or the unavailable state shows (no keys); save a line → it appears in the playbook → open the shared link in a fresh context and see it read-only; join the waitlist.
- Playwright with the flag false: library, replay, coach and the sixth playbook line show the paywall card; the daily scene still works end to end.
- Unit tests: streak across day keys, helpful-share series, fragment encode/decode with malformed input.
- No number on these pages is hardcoded (the report lists where each comes from).
- `npm run verify` passes.
