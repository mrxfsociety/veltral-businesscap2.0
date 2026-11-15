import { describe, expect, it } from "vitest";
import type { JsonCompleter, JsonRequest } from "./provider";
import {
  namedSetup,
  proposeCustomScene,
  sentenceCaseTitle,
} from "./customScene";
import { CUSTOM_SCENE_SYSTEM_PROMPT } from "./prompts";

const scene = {
  title: "Leaving For Grandma's House",
  place: "Living room",
  setup:
    "A fictional young child is watching cartoons when the parent says it is time to go.",
  openingLine: "No! One more show!",
  openingAction: "grips the remote",
  limit: "We leave for Grandma's now",
  wants: "one more show",
  startArousal: 70,
  temperament: "spirited" as const,
  limitHints: ["leave now", "we are leaving", "time to go"],
  giveInHints: ["one more show", "okay you can watch", "fine, watch it"],
};

function recording(): { complete: JsonCompleter; users: string[] } {
  const users: string[] = [];
  const complete: JsonCompleter = async <T>(request: JsonRequest<T>) => {
    users.push(request.user);
    return request.schema.parse({ ok: true, refusal: null, scene });
  };
  return { complete, users };
}

describe("custom scene wording", () => {
  it("asks the model for a second-person, named setup and a sentence-case title", () => {
    expect(CUSTOM_SCENE_SYSTEM_PROMPT).toContain("second person");
    expect(CUSTOM_SCENE_SYSTEM_PROMPT).toContain("sentence case");
    expect(CUSTOM_SCENE_SYSTEM_PROMPT).toContain("childName");
  });

  it("sends the name the scene will use, the default when none was given", async () => {
    const { complete, users } = recording();
    await proposeCustomScene(
      { ageBand: "4-5", description: "Leaving for Grandma's mid-cartoon" },
      complete,
    );
    await proposeCustomScene(
      { ageBand: "4-5", description: "Leaving mid-cartoon", childName: "Bea" },
      complete,
    );
    expect(JSON.parse(users[0]).childName).toBe("Sam");
    expect(JSON.parse(users[1]).childName).toBe("Bea");
  });

  it("names the child and sentence-cases a Title Case title", async () => {
    const { complete } = recording();
    const result = await proposeCustomScene(
      { ageBand: "4-5", description: "Leaving for Grandma's mid-cartoon" },
      complete,
    );
    expect(result?.scene?.title).toBe("Leaving for grandma's house");
    expect(result?.scene?.setup).toBe(
      "Sam is watching cartoons when the parent says it is time to go.",
    );
  });

  it("leaves sentence-case titles, names, I and acronyms alone", () => {
    expect(sentenceCaseTitle("Leaving for Grandma's", "Sam")).toBe(
      "Leaving for Grandma's",
    );
    expect(sentenceCaseTitle("When Sam Wants The TV.", "Sam")).toBe(
      "When Sam wants the TV",
    );
    expect(sentenceCaseTitle("Bedtime", "Sam")).toBe("Bedtime");
  });

  it("replaces a generic child at the start of the setup with the name", () => {
    expect(namedSetup("A child is upset at the store.", "Ivy")).toBe(
      "Ivy is upset at the store.",
    );
    expect(namedSetup("The 4-year-old girl won't leave.", "Ivy")).toBe(
      "Ivy won't leave.",
    );
    expect(
      namedSetup("Ivy is building blocks when you say it's dinner.", "Ivy"),
    ).toBe("Ivy is building blocks when you say it's dinner.");
  });
});
