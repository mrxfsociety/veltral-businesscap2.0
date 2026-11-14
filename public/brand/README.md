# Do-Over · another take

The mark is a counter-clockwise loop cut from tomato paper. Only the arrowhead lifts: a dark underside and one small ink-tinted shadow describe the fold. The lettering is Fraunces at weight 700, soft 100, optical size 72, converted to shaped outlines. Its hyphen is a tomato paper strip tilted six degrees. No part of the logo requires a font download.

## Choice

[The comparison sheet](candidates/comparison.svg) shows all three authored candidates at **16, 32, 180 and 512 literal pixels**, on cream and plum. The 16/32 examples use their simplified masters. The PNG beside it is a raster export of that SVG, not a generated image.

| Criterion                    | A · Open take — selected                  | B · Broad take                      | C · High take                            |
| ---------------------------- | ----------------------------------------- | ----------------------------------- | ---------------------------------------- |
| Readable at 16 px            | Open counter, clear tail gap, joined head | Heavier head crowds the counter     | Head/body junction looks detached        |
| Recognisable in one colour   | Continuous rewind silhouette              | Rewind remains clear                | Join is less convincing without the fold |
| Clearly paper at large sizes | A restrained underside and short shadow   | Larger fold becomes the focal point | Higher lift is too conspicuous           |
| No cliché                    | Rehearsal/another take only               | Same                                | Same                                     |

**A is the master.** It retains a readable gap between the flat tail and the triangular tip, while the lifted detail stays subordinate to the loop. No faces, hearts, speech bubbles, babies, brains or sparkles are used.

## Files and use

- `mark.svg`: full-detail 64-unit master; five filled shapes including the cream sheet, four paths, no strokes or gradients. Construction is documented inside it.
- `mark-simple.svg`: mandatory at **32 px and below**. No fold or shadow. `src/app/icon.svg` is this exact master.
- `wordmark.svg`: lettering only, with the tape hyphen. All letters are paths.
- `lockup-horizontal.svg`, `lockup-stacked.svg`: full-detail arrangements. `lockup-horizontal-simple.svg` is for header-size use.
- `*-ink.svg`: one ink colour on transparency. `*-reversed.svg`: one cream colour on transparency, for plum/ink backgrounds. These omit folds and shadows at every size.
- `lockup.tsx`: `BrandLockup`, a small React wrapper for the horizontal asset. Defaults to 32 px high and selects the simplified master. Accepts `height`, `tone` (`colour`, `ink`, `reversed`), `className`, and `decorative`.
- `fonts/`: licensed static Fraunces instances and source checksums. The social card uses local fonts, never a runtime font CDN.

STAGE can use `import { BrandLockup } from "../../../public/brand/lockup"` in `src/components/paper/primitives.tsx`, then have its existing `Wordmark` return `<BrandLockup decorative />` inside the already-labelled home link. The direct header asset is `/brand/lockup-horizontal-simple.svg` (360 × 64 viewBox). BRAND does not edit the header owner's files.

## Space and size

Let **u = 8 units** on the mark's 64-unit grid. Keep at least **1u** of clear space outside the entire mark or lockup, measured after scaling. Keep the original icon's cream tile and internal margins. The gap between mark and lettering in the horizontal lockup is fixed.

- Standalone mark minimum: **16 px**. Full folded mark minimum: **33 px**.
- Horizontal lockup minimum: **144 px wide**; prefer 180 px or wider in a header. At heights up to 32 px use the simplified lockup.
- Wordmark minimum: **100 px wide**. Full-colour stacked lockup minimum: **130 px wide**, so its mark stays above 32 px.
- Maskable icon: 512 px with a full-bleed cream background, artwork inset to 384 px. All critical coloured artwork fits inside the central 80%-diameter safe circle.

## Paper colours

| Paper       | Value     | Role                             |
| ----------- | --------- | -------------------------------- |
| Cream       | `#F4ECDD` | Tile and table                   |
| Tomato      | `#C8431F` | Loop and tape                    |
| Dark tomato | `#9E3216` | Fold underside only              |
| Ink         | `#1E2740` | Lettering; shadow at 18% opacity |
| Sheet       | `#FBF6EA` | Social-card sheet                |
| Plum        | `#5E3B55` | Approved dark presentation field |

The full-colour mark always keeps its cream tile, including on plum. Use the reversed single-colour lockup for a dark header. Tomato is not used for small body text.

## Do not

Do not rotate the whole mark, reverse its direction, round its flat cuts, change the tape angle, stretch it, move the tip, redraw the letters, or add a second paper detail. Do not add gradients, outlines, glows, bevels, faces or decorative symbols. Do not use the folded mark below 33 px. Do not add a white tile or place the ink-only version on a low-contrast field.

## Re-export

From the repository root, after `npm ci`:

```sh
node --import tsx scripts/brand.ts
```

The script validates the mark structure and exports Apple 180, regular 192/512 and maskable 512 PNGs from the authored SVG. It also rebuilds the candidate comparison SVG/PNG. It uses Sharp already present through Next.js and adds no package. The manifest starts at `/play`, with cream theme/background and standalone display.
