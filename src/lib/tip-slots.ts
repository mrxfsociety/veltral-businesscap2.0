/*
 * Tips in content/tips.json carry three slots: {childName}, {wants}, {limit}.
 * In a scene they take that scene's words. Outside one (the progress page),
 * they take the most recent scene the parent played from the public catalogue,
 * or plain words when there is none. A reader never sees a raw slot.
 */
export type TipSlots = { childName: string; wants: string; limit: string };
export type SlotScene = TipSlots & { id: string };

/** Marks the neutral words so the vocative ", {childName}" can be dropped. */
const NEUTRAL = Symbol("neutral");
export type FillSlots = TipSlots & { [NEUTRAL]?: true };

// "You really wanted what they wanted" says nothing; "that" keeps the line whole.
export const NEUTRAL_SLOTS: FillSlots = {
  childName: "your child",
  wants: "that",
  limit: "the limit",
  [NEUTRAL]: true,
};

/** The most recent history entry whose scene is in the catalogue, or the neutral words. */
export function slotsFromHistory(
  history: readonly { sceneId: string; at: string }[],
  scenes: readonly SlotScene[],
): FillSlots {
  const byId = new Map(scenes.map((scene) => [scene.id, scene]));
  const latest = [...history]
    .filter((entry) => byId.has(entry.sceneId))
    .sort((a, b) => b.at.localeCompare(a.at))[0];
  const scene = latest ? byId.get(latest.sceneId) : undefined;
  return scene
    ? { childName: scene.childName, wants: scene.wants, limit: scene.limit }
    : NEUTRAL_SLOTS;
}

export function fillTipSlots(text: string, slots: FillSlots): string {
  // "I am here, your child." reads wrong; without a name the line just ends.
  const source = slots[NEUTRAL] ? text.replace(/, \{childName\}/g, "") : text;
  return source
    .replace(
      /\{(wants|childName|limit)\}/g,
      (_match, key: keyof TipSlots) => slots[key],
    )
    .replace(/(^|[.!?]\s+)([a-z])/g, (_m, lead: string, first: string) =>
      `${lead}${first.toUpperCase()}`,
    );
}
