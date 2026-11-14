import { describe, expect, it } from "vitest";
import { kidMood, stageMood, type KidPose } from "@/components/stage/mood";
import { CLEAR, FLASH, PALETTE, SHIFTS } from "./palette";
import { FRAMES, KID_H, KID_W, kidSprite } from "./sprites";
import { H, W, renderPixelFrame } from "./scene";

const at = (arousal: number, connection = 50) => {
  const input = { arousal, connection, lastDelta: 0 };
  return { mood: stageMood(input), kid: kidMood(input) };
};

describe("pixel palette", () => {
  it("has exactly sixteen distinct colours, and shifts stay inside it", () => {
    expect(PALETTE).toHaveLength(16);
    expect(new Set(PALETTE).size).toBe(16);
    for (const shift of [...SHIFTS, FLASH]) {
      expect(shift).toHaveLength(16);
      shift.forEach((i) => {
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(16);
      });
    }
  });
});

describe("Zoe's sprite", () => {
  it("has two to four frames per pose, each 24×32 of palette indices", () => {
    const poses = Object.keys(FRAMES) as KidPose[];
    for (const pose of poses) {
      const { count, hold } = FRAMES[pose];
      expect(count).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(4);
      for (let f = 0; f < count; f++) {
        const px = kidSprite(
          { pose, face: "smile", facing: "audience" },
          f * hold,
        );
        expect(px).toHaveLength(KID_W * KID_H);
        px.forEach((v) => expect(v === CLEAR || v < 16).toBe(true));
      }
    }
  });

  it("changes between frames of an animated pose", () => {
    const a = kidSprite(
      { pose: "stomp", face: "shout", facing: "audience" },
      0,
    );
    const b = kidSprite(
      { pose: "stomp", face: "shout", facing: "audience" },
      FRAMES.stomp.hold,
    );
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });
});

describe("renderPixelFrame", () => {
  it("is deterministic and paints every pixel with a palette index", () => {
    for (const storm of [10, 55, 90]) {
      const { mood, kid } = at(storm);
      const one = renderPixelFrame({ mood, kid, tick: 7, seed: "s" });
      const two = renderPixelFrame({ mood, kid, tick: 7, seed: "s" });
      expect(one).toHaveLength(W * H);
      expect(Buffer.from(one).equals(Buffer.from(two))).toBe(true);
      one.forEach((v) => expect(v).toBeLessThan(16));
    }
  });

  it("gets colder as the storm grows: fewer warm pixels at 90 than at 10", () => {
    const warm = (b: Uint8Array) => b.filter((v) => v === 6 || v === 7).length;
    const calm = at(10);
    const storm = at(90);
    expect(
      warm(renderPixelFrame({ ...calm, tick: 0, seed: "s", still: true })),
    ).toBeGreaterThan(
      warm(renderPixelFrame({ ...storm, tick: 0, seed: "s", still: true })),
    );
  });
});
