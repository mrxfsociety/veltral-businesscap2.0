import { describe, expect, it } from "vitest";
import { playbackVolume } from "./playback";

describe("voice playback volume", () => {
  it("scales with the server arousal within audible, bounded volume", () => {
    expect(playbackVolume(0)).toBe(0.4);
    expect(playbackVolume(100)).toBe(0.9);
    expect(playbackVolume(75)).toBeGreaterThan(playbackVolume(25));
    expect(playbackVolume(-500)).toBe(0.4);
    expect(playbackVolume(900)).toBe(0.9);
    expect(playbackVolume(Number.NaN)).toBe(0.4);
  });
});
