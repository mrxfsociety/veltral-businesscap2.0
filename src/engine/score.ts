import type { Scene, Score, TurnResult } from "./types";
import { HELPFUL, UNHELPFUL, HARSH } from "./tags";

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

export function gridCell(turn: TurnResult): Score["grid"][number] {
  const helpful = turn.tags.filter((t) => HELPFUL.includes(t)).length;
  const unhelpful = turn.tags.length - helpful;
  if (helpful > 0 && unhelpful === 0) return "good";
  if (helpful > 0 && unhelpful > 0) return "mixed";
  return "bad";
}

// Index of the turn that decided the scene: the biggest drop when it ended
// calm with the limit held, otherwise the biggest rise. -1 for no turns.
export function turningPoint(turns: TurnResult[]): number {
  if (turns.length === 0) return -1;
  const calm = turns[turns.length - 1].outcome === "calm_limit_held";
  let best = 0;
  for (let i = 1; i < turns.length; i++) {
    const better = calm
      ? turns[i].delta < turns[best].delta
      : turns[i].delta > turns[best].delta;
    if (better) best = i;
  }
  return best;
}

export function scoreSession(
  scene: Scene,
  turns: TurnResult[],
  par: number,
): Score {
  const last = turns[turns.length - 1];
  const outcome = last ? last.outcome : "ongoing";
  const allTags = turns.flatMap((t) => t.tags);
  const unhelpfulCount = allTags.filter((t) => UNHELPFUL.includes(t)).length;
  const harshOrBribe = allTags.some((t) => HARSH.includes(t) || t === "BRIBE");
  const bribed = allTags.includes("BRIBE");
  const statedLimit = allTags.includes("HOLD_LIMIT");
  const turnsToCalm = outcome === "calm_limit_held" ? turns.length : null;
  const finalArousal = last ? last.after.arousal : scene.startArousal;

  let stars: Score["stars"] = 1;
  if (outcome === "calm_limit_held" && !bribed) {
    stars = 2;
    if (
      turnsToCalm !== null &&
      turnsToCalm <= par + 1 &&
      !harshOrBribe &&
      statedLimit
    )
      stars = 3;
  }

  let points = 0;
  if (outcome === "calm_limit_held") {
    points = Math.max(
      300,
      1000 -
        100 * (turns.length - 1) -
        30 * unhelpfulCount -
        (bribed ? 200 : 0),
    );
  } else if (outcome === "out_of_turns") {
    points = clamp(4 * (scene.startArousal - finalArousal), 0, 250);
  } else if (outcome === "calm_gave_in") {
    points = 100;
  }

  return {
    outcome,
    stars,
    points,
    turnsToCalm,
    par,
    clean: unhelpfulCount === 0,
    statedLimit,
    bribed,
    unhelpfulCount,
    finalArousal,
    grid: turns.map(gridCell),
    turningPoint: turningPoint(turns),
  };
}
