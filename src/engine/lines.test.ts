import type { ChildLines } from "./lines";
import { describe, expect, it } from "vitest";
import templates from "../../content/templates.json";
import tips from "../../content/tips.json";
import { pickChildLine, tipFor } from "./lines";
import { getScene } from "./scenes";
import { applyTurn, initialState } from "./transition";
import type { AgeBand, Scene, Tag, TurnResult } from "./types";

const scene = getScene("store-candy") as Scene;
const childLines: ChildLines = {
  calmer: { line: "I am a little sad.", action: "sniffles" },
  same: { line: "I still want it.", action: "frowns" },
  angrier: { line: "No! Listen to me!", action: "stamps one foot" },
  resolved: { line: "Okay. I can do it.", action: "nods" },
  gotIt: { line: "Yay! I got it!", action: "smiles" },
};

function resultWith(
  delta: number,
  outcome: TurnResult["outcome"] = "ongoing",
  arousal = 60,
): TurnResult {
  const result = applyTurn(scene, initialState(scene), []);
  return { ...result, delta, outcome, after: { ...result.after, arousal } };
}

describe("child-line selection", () => {
  it.each([
    [-18, "calmer"],
    [-4, "calmer"],
    [-3, "same"],
    [0, "same"],
    [3, "same"],
    [4, "angrier"],
    [25, "angrier"],
  ] as const)("selects a variant using delta %i", (delta, variant) => {
    expect(
      pickChildLine(childLines, scene, resultWith(delta), "turn-0"),
    ).toEqual(childLines[variant]);
  });

  it("gives terminal outcomes precedence over delta", () => {
    expect(
      pickChildLine(childLines, scene, resultWith(-18, "calm_gave_in"), "a"),
    ).toEqual(childLines.gotIt);
    expect(
      pickChildLine(childLines, scene, resultWith(0, "calm_limit_held"), "a"),
    ).toEqual(childLines.resolved);
    expect(
      pickChildLine(childLines, scene, resultWith(10, "out_of_turns"), "a"),
    ).toEqual(childLines.angrier);
    expect(
      pickChildLine(childLines, scene, resultWith(-18, "stopped_unsafe"), "a"),
    ).toBeNull();
  });

  it("uppercases only the line at arousal 80, without mutating model input", () => {
    expect(
      pickChildLine(childLines, scene, resultWith(0, "ongoing", 80), "a"),
    ).toEqual({
      line: childLines.same.line.toUpperCase(),
      action: childLines.same.action,
    });
    expect(
      pickChildLine(childLines, scene, resultWith(0, "ongoing", 79), "a"),
    ).toEqual(childLines.same);
    expect(childLines.same.line).toBe("I still want it.");
  });

  it("returns a repeatable fallback using seed alone", () => {
    const result = resultWith(-5);
    const first = pickChildLine(null, scene, result, "session:3");
    expect(pickChildLine(null, scene, result, "session:3")).toEqual(first);
    const lines = new Set(
      Array.from(
        { length: 30 },
        (_, index) =>
          pickChildLine(null, scene, result, `session:${index}`)?.line,
      ),
    );
    expect(lines.size).toBe(4);
  });

  it.each([
    "",
    "   ",
    "x".repeat(121),
    "Go to https://example.org",
    "Look at www.example.org",
    "Look at example.org",
    "<b>Fine</b>",
    "[Fine](https://example.org)",
    "**Fine**",
    "_Fine_",
    "`Fine`",
    "# Fine",
    "&lt;div&gt;Fine",
  ])("replaces an invalid proposed line: %s", (line) => {
    const result = resultWith(0);
    const unsafeLines = { ...childLines, same: { line, action: "frowns" } };
    expect(pickChildLine(unsafeLines, scene, result, "same-seed")).toEqual(
      pickChildLine(null, scene, result, "same-seed"),
    );
  });

  it.each([
    "x".repeat(81),
    "<script>alert(1)</script>",
    "visit https://example.org",
  ])("rejects invalid model actions", (action) => {
    const modelLines = { ...childLines, same: { line: "Fine.", action } };
    expect(pickChildLine(modelLines, scene, resultWith(0), "s")).toEqual(
      pickChildLine(null, scene, resultWith(0), "s"),
    );
  });

  it("accepts the exact maximum lengths and empty actions", () => {
    const same = { line: "a".repeat(120), action: "b".repeat(80) };
    expect(
      pickChildLine({ ...childLines, same }, scene, resultWith(0), "s"),
    ).toEqual(same);
    expect(
      pickChildLine(
        { ...childLines, same: { line: "Okay.", action: "" } },
        scene,
        resultWith(0),
        "s",
      ),
    ).toEqual({ line: "Okay.", action: "" });
  });

  it("ignores invalid entries that were not selected", () => {
    expect(
      pickChildLine(
        { ...childLines, calmer: { line: "", action: "" } },
        scene,
        resultWith(0),
        "s",
      ),
    ).toEqual(childLines.same);
  });

  it("uses safe non-slot templates when scene slots are too long or contain markup", () => {
    const hostileScene = {
      ...scene,
      ageBand: "6-7" as const,
      wants: "<img src=x>".repeat(80),
      childName: "<script>",
    };
    const line = pickChildLine(null, hostileScene, resultWith(-4), "s");
    expect(line?.line).not.toMatch(/[<>{}]/);
    expect(line?.line.length).toBeLessThanOrEqual(120);
  });

  it("fills slots as literal data, without interpreting replacement tokens", () => {
    const slotScene = { ...scene, childName: "$&" };
    const lines = Array.from(
      { length: 20 },
      (_, index) =>
        pickChildLine(null, slotScene, resultWith(-5), `s:${index}`)?.line,
    );
    expect(lines).toContain("$& sad now.");
  });
});

describe("authored fallback content", () => {
  it("has at least four templates in every age/variant bucket and at least 60 overall", () => {
    let count = 0;
    for (const groups of Object.values(templates)) {
      for (const lines of Object.values(groups)) {
        expect(lines.length).toBeGreaterThanOrEqual(4);
        expect(new Set(lines.map((line) => line.line)).size).toBe(lines.length);
        count += lines.length;
        for (const entry of lines) {
          expect(entry.line.trim().length).toBeGreaterThan(0);
          expect(entry.line.length).toBeLessThanOrEqual(120);
          expect(entry.action.length).toBeLessThanOrEqual(80);
        }
      }
    }
    expect(count).toBeGreaterThanOrEqual(60);
  });

  it("keeps all toddler templates to two through five words", () => {
    for (const entries of Object.values(templates["2-3"])) {
      for (const { line } of entries) {
        const count = line.trim().split(/\s+/).length;
        expect(count).toBeGreaterThanOrEqual(2);
        expect(count).toBeLessThanOrEqual(5);
      }
    }
  });

  it("can generate valid lines for each age, outcome and delta", () => {
    for (const ageBand of Object.keys(templates) as AgeBand[]) {
      for (const result of [
        resultWith(-4),
        resultWith(0),
        resultWith(4),
        resultWith(0, "calm_limit_held"),
        resultWith(0, "calm_gave_in"),
      ]) {
        const child = pickChildLine(
          null,
          { ...scene, ageBand },
          result,
          "session:1",
        );
        expect(child?.line.length).toBeGreaterThan(0);
        expect(child?.line).not.toMatch(/\{(?:wants|childName)\}/);
      }
    }
  });
});

describe("fallback tips", () => {
  const unhelpful: Tag[] = [
    "THREAT",
    "BRIBE",
    "YELL",
    "SHAME",
    "DISMISS",
    "QUESTION_COMMAND",
    "LECTURE",
    "NEGATIVE_COMMAND",
    "VAGUE_COMMAND",
    "GIVE_IN",
    "NO_RESPONSE",
  ];

  it("covers every unhelpful tag except UNSAFE", () => {
    expect(Object.keys(tips).sort()).toEqual([...unhelpful].sort());
    for (const tag of unhelpful) {
      const tip = tipFor(tag, scene);
      expect(tip?.tag).toBe(tag);
      expect(tip?.why.length).toBeGreaterThan(0);
      expect(tip?.tryInstead.length).toBeGreaterThan(0);
      expect(tip?.tryInstead).not.toMatch(/\{\w+\}/);
    }
  });

  it("substitutes scene-specific slots", () => {
    expect(tipFor("BRIBE", scene)?.tryInstead).toContain(scene.wants);
    expect(tipFor("NO_RESPONSE", scene)?.tryInstead).toContain(scene.childName);
    expect(tipFor("THREAT", scene)?.tryInstead).toContain(scene.limit);
  });

  it("returns no tip for helpful or unsafe tags", () => {
    expect(tipFor("UNSAFE", scene)).toBeNull();
    expect(tipFor("CONNECT", scene)).toBeNull();
  });
});
