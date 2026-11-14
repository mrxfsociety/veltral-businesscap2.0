# J2 — Release

Both tracks, in parallel, after the feature freeze. Branches: `j2-release-a`, `j2-release-b`. Target: 60 minutes. No new features.

## Track A part

1. Final `npm run eval` and `npm run eval:model`; regenerate `docs/MODEL.md`.
2. Clean-up in track A folders: no stubs, no dead code, no unused exports, no console output, consistent names; every public engine function has a one-line doc comment.
3. README sections: "How it works" (the turn diagram of SPEC 3 and where each part lives in the code), "How to check that it is real" (change the input and watch the result change; run the golden vectors; run the evaluation; play with the keys removed), "Measured accuracy" (from `eval/results.json`), "Limits" (what is not measured, what is a hypothesis), "How AI was used to build this" (which models wrote and reviewed code; how the labelled set was drafted and who reviewed the labels — write what is true).

## Track B part

1. Playwright against production: main loop (rules-only assertions), gating with the flag in both states (locally), privacy "Clear my data", waitlist.
2. Clean-up in track B folders, same standard. Remove unused assets. Check the bundle for server-only code.
3. README sections: one-paragraph description, production link, screenshots, "Run locally" (three commands), "Deploy" (link to `docs/DEPLOY.md`), repository map, licence (MIT file added).
4. Final deploy from `main`; `/api/health` shows the final commit.

## Acceptance

- `npm run verify` and `E2E_BASE_URL=https://<domain> npm run e2e` pass on `main`.
- `grep -RInE "STUB\(T0\)|TODO|FIXME|console\.log|@ts-ignore|: any\b" src e2e scripts eval` finds nothing.
- A person who has never seen the product opens the production link in a private window on a phone and finishes the daily scene in under 90 seconds without help (do this for real and note the time).
- Submission checklist in `docs/build/STATUS.md` is fully ticked.
