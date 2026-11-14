import type { ChildState, Scene, Tag } from "./types";
import { HELPFUL } from "./tags";
import {
  MAX_CALMING_TAGS,
  MAX_TURNS,
  initialState,
  applyTurn,
} from "./transition";

// Minimum number of turns in which the scene can end as calm_limit_held,
// searching every combination of up to MAX_CALMING_TAGS helpful tags per turn.
export function parFor(scene: Scene): number {
  const moves: Tag[][] = [];
  const n = HELPFUL.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    const tags = HELPFUL.filter((_, i) => mask & (1 << i));
    if (tags.length <= MAX_CALMING_TAGS) moves.push(tags);
  }
  const key = (s: ChildState) =>
    `${s.arousal}|${s.connection}|${s.lastHelpfulTags.join(",")}|${s.lastDelta < 0 ? 1 : 0}`;
  let frontier = [initialState(scene)];
  const seen = new Set([key(frontier[0])]);
  for (let depth = 1; depth <= MAX_TURNS; depth++) {
    const next: ChildState[] = [];
    for (const state of frontier) {
      for (const tags of moves) {
        const r = applyTurn(scene, state, tags);
        if (r.outcome === "calm_limit_held") return depth;
        const k = key(r.after);
        if (r.outcome === "ongoing" && !seen.has(k)) {
          seen.add(k);
          next.push(r.after);
        }
      }
    }
    frontier = next;
  }
  return MAX_TURNS;
}
