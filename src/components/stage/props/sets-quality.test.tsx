import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PAPER } from "../palette";
import { SETS } from "../sets";
import { PROPS } from ".";

// Later scene pairs are added here when they are delivered, never as placeholders.
const delivered = [
  "bedtime",
  "wrong-cup",
  "tablet-off",
  "dinner-refusal",
  "car-seat",
  "getting-dressed",
  "hit-brother",
  "bath-time",
  "sharing-toy",
  "leaving-party",
];
const paperColours = new Set<string>(Object.values(PAPER));

describe("delivered paper sets", () => {
  for (const id of delivered) {
    it(`${id} has three populated planes and bounded authored props`, () => {
      const set = SETS[id];
      expect(set).toBeDefined();
      for (const plane of [set.far, set.mid, set.front]) {
        expect(plane.length).toBeGreaterThan(0);
        for (const placement of plane) {
          expect(placement.x).toBeGreaterThanOrEqual(20);
          expect(placement.x).toBeLessThanOrEqual(380);
          expect(placement.y).toBeGreaterThanOrEqual(60);
          expect(placement.y).toBeLessThanOrEqual(310);
          const Prop = PROPS[placement.prop];
          const svg = renderToStaticMarkup(
            <svg>
              <Prop tint={placement.tint} />
            </svg>,
          );
          expect((svg.match(/<path\b/g) ?? []).length).toBeLessThanOrEqual(25);
          expect(svg).not.toMatch(
            /<(?:filter|linearGradient|radialGradient|image|text)\b/,
          );
          const colours = new Set(
            [...svg.matchAll(/(?:fill|stroke)="([^"]+)"/g)]
              .map((match) => match[1])
              .filter((colour) => colour !== "none"),
          );
          expect(
            colours.size,
            `${id}/${placement.prop}: paper budget`,
          ).toBeGreaterThanOrEqual(2);
          expect(
            colours.size,
            `${id}/${placement.prop}: paper budget`,
          ).toBeLessThanOrEqual(4);
          for (const colour of colours)
            expect(paperColours.has(colour)).toBe(true);
        }
      }
      expect(set.front.some((piece) => piece.y >= 298)).toBe(true);
      expect(set.sign.x).toBeGreaterThanOrEqual(310);
    });
  }
});
