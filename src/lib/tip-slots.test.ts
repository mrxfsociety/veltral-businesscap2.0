import { describe, expect, it } from "vitest";
import tips from "../../content/tips.json";
import { getPublicScenes } from "./catalog";
import { fillTipSlots, NEUTRAL_SLOTS, slotsFromHistory } from "./tip-slots";

const scenes = getPublicScenes();
const raw = /[{}[\]]/;

describe("slotsFromHistory", () => {
  it("uses the most recent catalogue scene in local history", () => {
    const slots = slotsFromHistory(
      [
        { sceneId: "store-candy", at: "2026-11-13T10:00:00.000Z" },
        { sceneId: "playground-leave", at: "2026-11-14T10:00:00.000Z" },
        { sceneId: "custom-abc123", at: "2026-11-15T10:00:00.000Z" },
      ],
      scenes,
    );
    expect(slots).toMatchObject({
      childName: "Zoe",
      limit: "It's time to leave the playground",
      wants: "to stay at the playground",
    });
  });

  it("falls back to plain words with no history", () => {
    expect(slotsFromHistory([], scenes)).toBe(NEUTRAL_SLOTS);
  });
});

describe("fillTipSlots", () => {
  it("fills every tip from a scene with no slot or bracket left", () => {
    const slots = slotsFromHistory(
      [{ sceneId: "store-candy", at: "2026-11-14T10:00:00.000Z" }],
      scenes,
    );
    for (const tip of Object.values(tips)) {
      expect(fillTipSlots(tip.tryInstead, slots)).not.toMatch(raw);
      expect(fillTipSlots(tip.why, slots)).not.toMatch(raw);
    }
    expect(fillTipSlots(tips.THREAT.tryInstead, slots)).toBe(
      "You are upset, Mia. I am right here. No candy today.",
    );
  });

  it("writes plain words without brackets when there is no scene", () => {
    for (const tip of Object.values(tips))
      expect(fillTipSlots(tip.tryInstead, NEUTRAL_SLOTS)).not.toMatch(raw);
    expect(fillTipSlots(tips.THREAT.tryInstead, NEUTRAL_SLOTS)).toBe(
      "You are upset. I am right here. The limit.",
    );
    expect(fillTipSlots(tips.BRIBE.tryInstead, NEUTRAL_SLOTS)).toBe(
      "You really wanted that. The limit. I will stay close.",
    );
  });
});
