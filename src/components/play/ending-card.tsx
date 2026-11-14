import type { CSSProperties } from "react";
import type { Outcome } from "@/engine/types";
import type { TurnResponse } from "@/shared/api";
import { Icon } from "@/components/paper/icons";
import { Kicker } from "@/components/paper/primitives";
import styles from "./play.module.css";

export const OUTCOME_TITLES: Record<Outcome, string> = {
  calm_limit_held: "Calm, and the limit held.",
  calm_gave_in: "Quiet, but the limit is gone.",
  out_of_turns: "Still melting down.",
  stopped_unsafe: "Let's pause here.",
  ongoing: "Keep practising.",
};

/** The ending, on the stage: title, stars stamped one by one, turns against par, points. */
export function EndingCard({
  final,
  turns,
  par,
  titleRef,
}: {
  final: TurnResponse;
  turns: number;
  par: number;
  titleRef?: React.Ref<HTMLHeadingElement>;
}) {
  const outcome = final.result.outcome;
  const score = final.score;
  const sub =
    outcome === "calm_gave_in"
      ? "The crying stopped because the limit did."
      : outcome === "out_of_turns"
        ? "Real ones end too. Try a do-over."
        : score?.turnsToCalm
          ? `Calm in ${score.turnsToCalm} · par ${par}`
          : `${turns} turns · par ${par}`;
  return (
    <div className={styles.ending} data-outcome={outcome}>
      <Kicker>Curtain</Kicker>
      <h1 id="outcome-title" tabIndex={-1} ref={titleRef}>
        {OUTCOME_TITLES[outcome]}
      </h1>
      <p className={styles.endingSub}>{sub}</p>
      {score && (
        <div className={styles.endingScore}>
          <p
            className={styles.stars}
            role="img"
            aria-label={`${score.stars} out of 3 stars`}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                data-on={i < score.stars || undefined}
                style={{ "--i": i } as CSSProperties}
              >
                <Icon name="star" size={30} />
              </span>
            ))}
          </p>
          <p className={styles.points}>
            <span className="tabular">{score.points}</span> points
          </p>
        </div>
      )}
    </div>
  );
}
