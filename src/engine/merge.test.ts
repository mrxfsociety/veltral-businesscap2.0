import { describe, expect, it } from "vitest";
import { mergeTags } from "./merge";
import type { Tag, TagHit } from "./types";

const hit = (tag: Tag, quote = "reply"): TagHit => ({
  tag,
  quote,
  source: "rule",
});
const model = (tag: Tag, quote = "reply"): TagHit => ({
  tag,
  quote,
  source: "model",
});
const names = (hits: TagHit[]) => hits.map((item) => item.tag);
describe("mergeTags", () => {
  it("drops model loudness and response claims", () =>
    expect(
      mergeTags([], [model("YELL"), model("NO_RESPONSE")], "reply"),
    ).toEqual([]));
  it("rejects absent and empty quotes", () =>
    expect(
      mergeTags(
        [],
        [model("CONNECT", "invented"), model("NAME_FEELING", "")],
        "reply",
      ),
    ).toEqual([]));
  it("normalises quotations and returns the exact original substring", () =>
    expect(
      mergeTags(
        [],
        [model("NAME_FEELING", "you're upset")],
        "You’re   upset today.",
      ),
    ).toEqual([
      { tag: "NAME_FEELING", source: "model", quote: "You’re   upset" },
    ]));
  it("keeps the rule quote when both sources agree", () =>
    expect(
      mergeTags(
        [hit("CONNECT", "reply")],
        [model("CONNECT", "REPLY")],
        "reply",
      ),
    ).toEqual([{ tag: "CONNECT", source: "both", quote: "reply" }]));
  it("deduplicates and sorts canonically", () =>
    expect(
      names(
        mergeTags(
          [hit("CONNECT"), hit("HOLD_LIMIT"), hit("CONNECT")],
          [model("NAME_FEELING")],
          "reply",
        ),
      ),
    ).toEqual(["NAME_FEELING", "HOLD_LIMIT", "CONNECT"]));
  it("no response wins over every other tag", () =>
    expect(
      names(
        mergeTags(
          [hit("UNSAFE"), hit("NO_RESPONSE", "")],
          [model("CONNECT")],
          "reply",
        ),
      ),
    ).toEqual(["NO_RESPONSE"]));
  it("unsafe wins over all remaining tags", () =>
    expect(
      names(
        mergeTags([hit("UNSAFE"), hit("GIVE_IN")], [model("CONNECT")], "reply"),
      ),
    ).toEqual(["UNSAFE"]));
  it("giving in removes limit and next step", () =>
    expect(
      names(
        mergeTags(
          [hit("GIVE_IN"), hit("HOLD_LIMIT"), hit("WHEN_THEN")],
          [],
          "reply",
        ),
      ),
    ).toEqual(["GIVE_IN"]));
  it("a choice removes a question command", () =>
    expect(
      names(
        mergeTags([hit("QUESTION_COMMAND")], [model("OFFER_CHOICE")], "reply"),
      ),
    ).toEqual(["OFFER_CHOICE"]));
  it.each(["BRIBE", "THREAT"] as const)("%s removes when–then", (tag) =>
    expect(names(mergeTags([hit("WHEN_THEN")], [model(tag)], "reply"))).toEqual(
      [tag],
    ),
  );
  it("allows no clear move", () =>
    expect(mergeTags([], [], "ordinary words")).toEqual([]));
  it("does not mutate its inputs", () => {
    const rules = [hit("CONNECT")];
    const semantic = [model("CONNECT")];
    mergeTags(rules, semantic, "reply");
    expect(rules[0].source).toBe("rule");
    expect(semantic[0].source).toBe("model");
  });
});
