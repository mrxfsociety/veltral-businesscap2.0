import { afterEach, describe, expect, it, vi } from "vitest";
import type { Score } from "@/engine/types";
import {
  MAX_FRAGMENT_LENGTH,
  buildPlaybookUrl,
  buildShareText,
  copyText,
  decodePlaybook,
  encodePlaybook,
} from "./share";
import type { PlaybookEntry } from "./store";

const score: Score = {
  outcome: "calm_limit_held",
  stars: 3,
  points: 700,
  turnsToCalm: 4,
  par: 3,
  clean: false,
  statedLimit: true,
  bribed: false,
  unhelpfulCount: 1,
  finalArousal: 20,
  grid: ["good", "mixed", "good", "good"],
  turningPoint: 2,
};

const line: PlaybookEntry = {
  id: "line-1",
  at: "2026-11-14T14:00:00.000Z",
  text: "I’m here, Zoë. We can breathe together. 💛",
  tags: ["CONNECT"],
  sceneTitle: "A hard goodbye",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("share result", () => {
  const text = (change: Partial<Score>) =>
    buildShareText({
      dayNumber: 2,
      sceneTitle: "Leaving the playground",
      score: { ...score, ...change },
      url: "https://doover.example/play",
    });

  it("matches the real engine grid and calm score", () => {
    expect(text({})).toBe(
      "Veltral #2 · Leaving the playground\n🟩🟨🟩🟩 Calm in 4 (par 3) ★★★\nhttps://doover.example/play",
    );
  });

  it("formats giving in and running out of turns without describing them as calm wins", () => {
    expect(
      text({
        outcome: "calm_gave_in",
        turnsToCalm: null,
        grid: ["bad", "mixed", "bad"],
        stars: 1,
      }),
    ).toContain("Gave in on turn 3 ★");
    expect(
      text({
        outcome: "out_of_turns",
        turnsToCalm: null,
        grid: Array.from({ length: 8 }, () => "bad"),
        stars: 1,
      }),
    ).toContain("Not calm after 8 ★");
  });

  it("never shares unsafe or ongoing sessions", () => {
    expect(text({ outcome: "stopped_unsafe" })).toBeNull();
    expect(text({ outcome: "ongoing" })).toBeNull();
  });
});

describe("playbook link", () => {
  it("round trips Unicode and puts all content in the fragment, never the query", () => {
    const url = new URL(buildPlaybookUrl([line], "https://doover.example"));
    expect(url.pathname).toBe("/playbook/shared");
    expect(url.search).toBe("");
    expect(decodePlaybook(url.hash)).toEqual([line]);
    expect(decodePlaybook(encodePlaybook([line]))).toEqual([line]);
  });

  it("rejects malformed encoding, unknown schema, invalid entries and oversized fragments", () => {
    for (const invalid of [
      "",
      "#d=???",
      "#d=abc&extra=1",
      "A",
      "a".repeat(MAX_FRAGMENT_LENGTH + 1),
    ]) {
      expect(decodePlaybook(invalid)).toBeNull();
    }
    expect(
      decodePlaybook(btoa(JSON.stringify({ version: 2, lines: [] }))),
    ).toBeNull();
    expect(
      decodePlaybook(
        btoa(JSON.stringify({ version: 1, lines: [{ id: "missing" }] })),
      ),
    ).toBeNull();
    expect(() =>
      encodePlaybook(Array.from({ length: 101 }, () => line)),
    ).toThrow();
    expect(() =>
      encodePlaybook(
        Array.from({ length: 100 }, (_, index) => ({
          ...line,
          id: String(index),
          text: "💛".repeat(150),
        })),
      ),
    ).toThrow("too large");
  });

  it("keeps untrusted text as text and refuses clipboard failures safely", async () => {
    const html = { ...line, text: "<script>alert('hello')</script>" };
    expect(decodePlaybook(encodePlaybook([html]))?.[0]?.text).toBe(html.text);
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    await expect(copyText("a saved line")).resolves.toBe(false);
    vi.stubGlobal("navigator", {});
    await expect(copyText("a saved line")).resolves.toBe(false);
  });
});
