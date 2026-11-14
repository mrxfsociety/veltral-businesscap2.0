# Fraunces for the Do-Over brand

These are static, full-font instances of Fraunces, from the official [Google Fonts repository](https://github.com/google/fonts/tree/main/ofl/fraunces). The original typeface is by [Undercase Type](https://github.com/undercasetype/Fraunces), licensed under the SIL Open Font License 1.1. The complete license and copyright notice are in `OFL.txt`.

| File | Weight | Style | Optical size | Softness | Wonk |
| --- | ---: | --- | ---: | ---: | ---: |
| `Fraunces-Brand700.ttf` | 700 | upright | 72 | 100 | 1 |
| `Fraunces-Display640.ttf` | 640 | upright | 72 | 100 | 1 |
| `Fraunces-Display640Italic.ttf` | 640 | italic | 72 | 100 | 1 |

The full glyph sets and original font copyright/license records are retained. Only variable axes are pinned and derived family/style names are set to `Fraunces DoOver` to distinguish these instances from the upstream variable font. No glyph design is redrawn or substituted. `provenance.json` records upstream URLs, checksums, axis ranges and output checksums.

The wordmark uses shaped, kerned outlines from the 700 instance; its SVG does not need a loaded font. Open Graph artwork can use the 640 instances directly, without a runtime request to a font CDN.

Reproduction uses fontTools 4.68.0 `instantiateVariableFont` with all four axes pinned as above (`updateFontNames=False`), then updates the derived family/style records. Outlining uses HarfBuzz 0.57.0 for positioning and `SVGPathPen` for contours, preserving kerning. There are no application package dependencies for these one-time preparation steps.
