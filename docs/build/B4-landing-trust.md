# B4 — Landing, trust pages, polish

Track B. Branch: `b4-landing-trust`. Target: 75 minutes. Depends on: B3 merged; `/how-it-works` needs `eval/results.json` from A2 or A4.

Read first: SPEC sections 4.2, 4.9, 4.10, 12, 14, 17.

## Build

1. Landing per SPEC 4.2. Screenshots are produced by a Playwright script from the real product (`npm run shots`), or the section embeds a live mini-scene; no drawn mock-ups. The line under the button shows the real scene of the day and its par.
2. `/how-it-works` per SPEC 4.9: tag table from `src/engine/tags.ts`, the teaching model and constants from the engine, the accuracy table and date from `eval/results.json`, the limits of the claim.
3. `/privacy` per SPEC 12.4 after checking the code, with a working "Clear my data" button.
4. Metadata: titles, descriptions, Open Graph image, favicon, `robots.txt`, a 404 page that links to `/play`.
5. Accessibility and layout pass over every route at 375, 768 and 1280 px: focus order, labels, contrast, reduced motion, `aria-live` behaviour, tap targets. Fix what you find.
6. Copy pass: every sentence on the site is true today. Facts only from SPEC 17 with links.

## Acceptance

- A table in the report: every factual claim on the landing page → its source in SPEC 17.
- The accuracy numbers on `/how-it-works` equal `eval/results.json` (test or script shown).
- "Clear my data" empties the local store (Playwright).
- An automated accessibility scan (axe through Playwright) on `/`, `/play`, `/pricing`, `/how-it-works` reports no serious or critical issues.
- Screenshots of the landing page at 375 px and 1280 px.
- `npm run verify` passes.
