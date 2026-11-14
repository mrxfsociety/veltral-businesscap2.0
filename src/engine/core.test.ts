import { describe, expect, it } from "vitest";
import vectors from "../../docs/reference/vectors.json";
import precomputedPar from "../../content/par.json";
import { initialState, applyTurn, CALM_AT, MAX_TURNS } from "./transition";
import { scoreSession, turningPoint, gridCell } from "./score";
import {
  getScene,
  SCENES,
  dayKey,
  dayNumber,
  sceneOfTheDay,
  SceneSchema,
} from "./scenes";
import { parFor } from "./par";
import { canonicalTags, HELPFUL, TAGS, TAG_DEFINITIONS } from "./tags";
import { noteText, NOTE_TEXT } from "./notes";
import type { Scene, Tag, TurnResult, Note } from "./types";

function requiredScene(id = "store-candy"): Scene {
  const scene = getScene(id);
  if (!scene) throw new Error(`Missing test scene: ${id}`);
  return scene;
}
function play(scene: Scene, tagSets: Tag[][]): TurnResult[] {
  let state = initialState(scene);
  const turns: TurnResult[] = [];
  for (const tags of tagSets) {
    const result = applyTurn(scene, state, tags);
    turns.push(result);
    state = result.after;
    if (result.outcome !== "ongoing") break;
  }
  return turns;
}

describe("reference golden vectors", () => {
  it("contains exactly 37 fixtures", () =>
    expect(vectors.vectors).toHaveLength(37));
  for (const vector of vectors.vectors) {
    it(vector.id, () => {
      const scene = requiredScene(vector.sceneId);
      const turns = play(scene, vector.tagSets as Tag[][]);
      expect(
        turns.map((turn) => ({
          arousal: turn.after.arousal,
          connection: turn.after.connection,
          delta: turn.delta,
          outcome: turn.outcome,
          notes: turn.notes,
        })),
      ).toEqual(vector.turns);
      expect(
        scoreSession(
          scene,
          turns,
          vectors.par[vector.sceneId as keyof typeof vectors.par],
        ),
      ).toEqual(vector.score);
    });
  }
});

describe("par search", () => {
  it("recomputes all twelve pars from the transition, matching both artifacts", () => {
    const actual = Object.fromEntries(
      SCENES.map((scene) => [scene.id, parFor(scene)]),
    );
    expect(actual).toEqual(vectors.par);
    expect(actual).toEqual(precomputedPar);
  }, 120_000);
});

describe("custom scene par boundary", () => {
  it("finds an achievable par at maximum arousal for every age and temperament", () => {
    const base = requiredScene();
    for (const ageBand of ["2-3", "4-5", "6-7"] as const) {
      for (const temperament of [
        "easygoing",
        "sensitive",
        "spirited",
      ] as const) {
        expect(
          parFor({
            ...base,
            id: "custom-maximum",
            ageBand,
            temperament,
            startArousal: 90,
          }),
        ).toBe(4);
      }
    }
  }, 30_000);
});

describe("calendar and scene loading", () => {
  it("validates all twelve scenes and each unique identifier", () => {
    expect(SCENES).toHaveLength(12);
    expect(new Set(SCENES.map((scene) => scene.id)).size).toBe(12);
    for (const scene of SCENES)
      expect(SceneSchema.safeParse(scene).success).toBe(true);
    expect(getScene("unknown-scene")).toBeUndefined();
    expect(
      SceneSchema.safeParse({ ...requiredScene(), startArousal: 91 }).success,
    ).toBe(false);
  });
  it("starts at one and follows the specified rotation", () => {
    expect(dayNumber("2026-11-14")).toBe(1);
    expect(sceneOfTheDay("2026-11-15").id).toBe("playground-leave");
    expect(sceneOfTheDay("2026-11-26").id).toBe("store-candy");
    expect(sceneOfTheDay("2026-11-13").id).toBe("leaving-party");
  });
  it("uses the New York date across winter and summer midnight boundaries", () => {
    expect(dayKey(new Date("2026-11-15T04:59:59Z"))).toBe("2026-11-14");
    expect(dayKey(new Date("2026-11-15T05:00:00Z"))).toBe("2026-11-15");
    expect(dayKey(new Date("2026-07-15T03:59:59Z"))).toBe("2026-07-14");
    expect(dayKey(new Date("2026-07-15T04:00:00Z"))).toBe("2026-07-15");
  });
  it("rejects malformed and nonexistent dates", () => {
    expect(() => dayNumber("2026-02-30")).toThrow(RangeError);
    expect(() => dayNumber("November 15")).toThrow(RangeError);
  });
});

describe("transition boundaries and purity", () => {
  it("deduplicates and orders tags without mutating the input state or tags", () => {
    const scene = requiredScene();
    const state = initialState(scene);
    const snapshot = structuredClone(state);
    const tags: Tag[] = ["CONNECT", "NAME_FEELING", "CONNECT"];
    const result = applyTurn(scene, state, tags);
    expect(result.tags).toEqual(["NAME_FEELING", "CONNECT"]);
    expect(state).toEqual(snapshot);
    expect(tags).toEqual(["CONNECT", "NAME_FEELING", "CONNECT"]);
    expect(canonicalTags(tags)).toEqual(result.tags);
  });
  it("gives UNSAFE priority over giving in and leaves arousal unchanged", () => {
    const scene = requiredScene();
    const result = applyTurn(scene, initialState(scene), ["GIVE_IN", "UNSAFE"]);
    expect(result.outcome).toBe("stopped_unsafe");
    expect(result.delta).toBe(0);
    expect(result.after.limitIntact).toBe(true);
    expect(result.notes).toEqual(["UNSAFE_STOP"]);
  });
  it("uses the actual delta at the meter ceiling", () => {
    const scene = requiredScene();
    const result = applyTurn(scene, { ...initialState(scene), arousal: 99 }, [
      "YELL",
    ]);
    expect(result.after.arousal).toBe(100);
    expect(result.delta).toBe(1);
  });
  it("calm has priority over the maximum turn count", () => {
    const scene = requiredScene();
    const result = applyTurn(
      scene,
      { ...initialState(scene), arousal: CALM_AT + 1, turn: MAX_TURNS - 1 },
      ["NAME_FEELING"],
    );
    expect(result.outcome).toBe("calm_limit_held");
  });
  it("clamps connection at either edge", () => {
    const scene = requiredScene();
    expect(
      applyTurn(scene, { ...initialState(scene), connection: 99 }, ["CONNECT"])
        .after.connection,
    ).toBe(100);
    expect(
      applyTurn(scene, { ...initialState(scene), connection: 1 }, ["SHAME"])
        .after.connection,
    ).toBe(0);
  });
});

describe("scoring and explanatory metadata", () => {
  it("has deterministic results for an empty session", () => {
    const scene = requiredScene();
    expect(scoreSession(scene, [], 3)).toMatchObject({
      outcome: "ongoing",
      points: 0,
      stars: 1,
      finalArousal: scene.startArousal,
      turnsToCalm: null,
      turningPoint: -1,
      grid: [],
    });
    expect(turningPoint([])).toBe(-1);
  });
  it("classifies grid cells by helpful and unhelpful tags", () => {
    const scene = requiredScene();
    const state = initialState(scene);
    expect(gridCell(applyTurn(scene, state, ["CONNECT"]))).toBe("good");
    expect(gridCell(applyTurn(scene, state, ["CONNECT", "THREAT"]))).toBe(
      "mixed",
    );
    expect(gridCell(applyTurn(scene, state, []))).toBe("bad");
  });
  it("defines all tags once and fills every note slot", () => {
    expect(TAG_DEFINITIONS.map((tag) => tag.tag)).toEqual(TAGS);
    expect(
      TAG_DEFINITIONS.filter((tag) => tag.kind === "helpful").map(
        (tag) => tag.tag,
      ),
    ).toEqual(HELPFUL);
    const scene = requiredScene();
    for (const note of Object.keys(NOTE_TEXT) as Note[])
      expect(noteText(note, scene)).not.toContain("{childName}");
    expect(noteText("HIGH_CONNECTION", scene)).toContain(scene.childName);
  });
});
