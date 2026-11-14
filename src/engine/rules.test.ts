import { describe, expect, it } from "vitest";
import { ruleTags } from "./rules";
import { mergeTags } from "./merge";
import type { Scene, Tag } from "./types";

const scene: Scene = {
  id: "rules-fixture",
  title: "Coat time",
  place: "Hall",
  ageBand: "4-5",
  childName: "Sam",
  setup: "It is cold outside.",
  openingLine: "No coat!",
  openingAction: "stamps",
  limit: "The coat goes on.",
  wants: "to go without a coat",
  startArousal: 75,
  temperament: "sensitive",
  limitHints: ["the coat goes on", "we need a coat"],
  giveInHints: ["skip the coat", "go without a coat"],
};
function tags(text: string, options = {}): Tag[] {
  return mergeTags(ruleTags(text, scene, options), [], text).map(
    (hit) => hit.tag,
  );
}
const families: { tag: Tag; positive: string; negative: string }[] = [
  {
    tag: "UNSAFE",
    positive: "I'll slap you if that coat stays off.",
    negative: "I won't let you hit the puppy.",
  },
  {
    tag: "THREAT",
    positive: "If you keep shouting, you lose your markers.",
    negative: "The coat goes on before the door opens.",
  },
  {
    tag: "BRIBE",
    positive: "If you come outside I'll buy a balloon.",
    negative: "When we are outside then we walk to school.",
  },
  {
    tag: "SHAME",
    positive: "You're a spoiled brat over this jacket.",
    negative: "The baby has a jacket too.",
  },
  {
    tag: "DISMISS",
    positive: "It's only a coat, get over it.",
    negative: "The coat feels scratchy on your arms.",
  },
  {
    tag: "QUESTION_COMMAND",
    positive: "Could you put the blue coat on?",
    negative: "Could you wear the blue one or the red one?",
  },
  {
    tag: "LECTURE",
    positive: "How many times must we discuss your jacket?",
    negative: "The coat is by the door.",
  },
  {
    tag: "NEGATIVE_COMMAND",
    positive: "Quit throwing that scarf.",
    negative: "Don't worry about the weather.",
  },
  {
    tag: "VAGUE_COMMAND",
    positive: "Knock it off!",
    negative: "We will knock at the door.",
  },
  {
    tag: "GIVE_IN",
    positive: "Today you may skip the coat.",
    negative: "You may not skip the coat.",
  },
  {
    tag: "HOLD_LIMIT",
    positive: "The coat goes on before our walk.",
    negative: "There is a coat near the chair.",
  },
  {
    tag: "NAME_FEELING",
    positive: "You seem really frustrated with the sleeve.",
    negative: "I feel tired today.",
  },
  {
    tag: "OFFER_CHOICE",
    positive: "You can zip it yourself or ask me for help.",
    negative: "Put it on or I'll leave you.",
  },
  {
    tag: "CLEAR_COMMAND",
    positive: "Please put your arm through this sleeve.",
    negative: "Take your time with the zip.",
  },
  {
    tag: "CONNECT",
    positive: "I'm here beside the shoes.",
    negative: "The coat is here beside the shoes.",
  },
  {
    tag: "LABELED_PRAISE",
    positive: "Nice job finding the sleeve.",
    negative: "Nice coat.",
  },
  {
    tag: "WHEN_THEN",
    positive: "First the coat, then we leave for school.",
    negative: "I saw the coat when we came home.",
  },
  {
    tag: "YELL",
    positive: "PUT THAT COAT ON PLEASE",
    negative: "Put the red coat on please.",
  },
  { tag: "NO_RESPONSE", positive: "\n\t", negative: "I need a moment." },
];
for (const { tag, positive, negative } of families) {
  describe(tag, () => {
    it("recognises its cue", () => expect(tags(positive)).toContain(tag));
    it("does not overtag a different move", () =>
      expect(tags(negative)).not.toContain(tag));
  });
}
describe("rule tagging details", () => {
  it("keeps exact original quotes across curly apostrophes and whitespace", () => {
    const text = "You’re\t really    upset about that.";
    expect(
      ruleTags(text, scene).find((hit) => hit.tag === "NAME_FEELING")?.quote,
    ).toBe("You’re\t really    upset");
  });
  it("does not count a bribe condition as a separate dismissal", () =>
    expect(tags("If you stop crying I'll get a balloon.")).not.toContain(
      "DISMISS",
    ));
  it("still detects a separate dismissal after a bribe", () =>
    expect(
      tags("If you stop crying I'll get a balloon. Calm down about the scarf."),
    ).toContain("DISMISS"));
  it("does not turn a desire question into empathy", () =>
    expect(
      tags("Do you want the striped coat or the plain coat?"),
    ).not.toContain("NAME_FEELING"));
  it("uses the loud flag without manufacturing a quote", () =>
    expect(
      ruleTags("This coat goes on.", scene, { loud: true }),
    ).toContainEqual({ tag: "YELL", source: "rule", quote: "" }));
  it("only tags timeout as no response when there is no text", () =>
    expect(tags("Let me help you.", { timedOut: true })).not.toContain(
      "NO_RESPONSE",
    ));
  it("requires eight letters before using uppercase ratio", () =>
    expect(tags("NO")).not.toContain("YELL"));
  it("recognises punctuation shouting", () =>
    expect(tags("My coat!!!")).toContain("YELL"));
  it("distinguishes an emotion from a forbidden behaviour", () => {
    expect(tags("Stop crying about the scarf.")).not.toContain(
      "NEGATIVE_COMMAND",
    );
    expect(tags("Stop throwing the scarf.")).toContain("NEGATIVE_COMMAND");
  });
  it("does not treat closeness as an instruction", () =>
    expect(tags("Come here, sweetheart.")).not.toContain("CLEAR_COMMAND"));
  it("recognises five sentences as a lecture", () =>
    expect(tags("We leave. We walk. We wait. We arrive. We enter.")).toContain(
      "LECTURE",
    ));
  it("recognises long explanations as a lecture", () =>
    expect(
      tags(Array.from({ length: 31 }, () => "weather").join(" ")),
    ).toContain("LECTURE"));
  it("returns deterministic results without mutating the scene", () => {
    const snapshot = structuredClone(scene);
    expect(ruleTags("You are scared. We need a coat.", scene)).toEqual(
      ruleTags("You are scared. We need a coat.", scene),
    );
    expect(scene).toEqual(snapshot);
  });
  it.each([
    "I hit my child with my hand.",
    "I gave no instruction, but I hate you.",
    "I'll give you a spanking tonight.",
    "You little idiot.",
  ])("recognises unsafe intent: %s", (text) =>
    expect(tags(text)).toEqual(["UNSAFE"]),
  );
  it.each([
    "I will not hit you.",
    "Hitting hurts people.",
    "I love my child.",
    "You do not have to like this.",
  ])("does not misread a safe statement: %s", (text) =>
    expect(tags(text)).not.toContain("UNSAFE"),
  );
});
