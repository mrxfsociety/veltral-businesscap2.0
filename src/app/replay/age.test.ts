import { describe, expect, it } from "vitest";
import { ageBandFromText } from "./age";

describe("ageBandFromText", () => {
  it.each([
    ["My 4 year old screamed when we left the park", "4-5"],
    ["my 4yo refused the car seat", "4-5"],
    ["Our four-year-old wanted the tablet back", "4-5"],
    ["the 2 y/o threw her cup", "2-3"],
    ["She's 3 years old and hates bath time", "2-3"],
    ["My son, aged six, would not turn off the game", "6-7"],
    ["a 7-year-old at the birthday party", "6-7"],
  ])("%s → %s", (text, band) => expect(ageBandFromText(text)).toBe(band));

  it("returns null with no age or an age outside 2–7", () => {
    expect(ageBandFromText("He screamed in the store")).toBeNull();
    expect(ageBandFromText("My 10 year old slammed the door")).toBeNull();
    expect(ageBandFromText("We left after 5 minutes")).toBeNull();
    expect(ageBandFromText("We have done this for 2 years")).toBeNull();
  });
});
