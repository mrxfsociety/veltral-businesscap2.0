import type { ReactNode } from "react";
import type { PublicScene } from "@/engine/types";
import { Button, Kicker } from "@/components/paper/primitives";
import styles from "./play.module.css";

export type Pace = 20 | 8 | 0;

export const PACES: { value: Pace; label: string; hint: string }[] = [
  {
    value: 20,
    label: "Rehearsal · 20 s",
    hint: "Time to think. Good for a first run.",
  },
  {
    value: 8,
    label: "Real time · 8 s",
    hint: "About as long as you get in real life.",
  },
  { value: 0, label: "No timer", hint: "Go at your own pace." },
];

export const DISCLAIMER =
  "Veltral is a practice tool. It is not therapy, medical advice or a diagnosis. The child is simulated and the scoring is a simplified model.";

/** A paper playbill pinned to the closed curtains. */
export function Playbill({
  scene,
  par,
  kicker,
  pace,
  onPace,
  voiceSlot,
  notice,
  errorSlot,
  waiting,
  onStart,
}: {
  scene: PublicScene;
  par?: number;
  kicker: string;
  pace: Pace;
  onPace: (pace: Pace) => void;
  voiceSlot?: ReactNode;
  notice?: ReactNode;
  errorSlot?: ReactNode;
  waiting: boolean;
  onStart: () => void;
}) {
  return (
    <section className={styles.playbill} aria-labelledby="scene-title">
      <div className={styles.playbillHead}>
        <Kicker accent>{kicker}</Kicker>
        <p className={styles.playbillPlace}>{scene.place}</p>
        <h1 id="scene-title">{scene.title}</h1>
        <p className={styles.playbillCast}>
          <strong>{scene.childName}</strong> · ages{" "}
          {scene.ageBand.replace("-", "–")} · {scene.temperament}
          {par !== undefined && (
            <>
              {" "}
              ·{" "}
              <abbr
                className={styles.par}
                title="Par: the fewest turns in which this scene can end calm with the limit held"
              >
                par {par}
              </abbr>
            </>
          )}
        </p>
      </div>
      <p className={styles.playbillSetup}>{scene.setup}</p>
      <div className={styles.playbillLimit}>
        <span>Your limit</span>
        <strong>{scene.limit}</strong>
      </div>
      {notice}
      {errorSlot}
      <div className={styles.startRow}>
        <Button
          size="large"
          icon="play"
          className={styles.startButton}
          disabled={waiting}
          onClick={onStart}
        >
          {waiting ? "Starting…" : "Start"}
        </Button>
        <fieldset className={styles.pace}>
          <legend>Pace</legend>
          <div className={styles.paceOptions}>
            {PACES.map((option) => (
              <label key={option.value} data-selected={pace === option.value}>
                <input
                  type="radio"
                  name="pace"
                  value={option.value}
                  checked={pace === option.value}
                  onChange={() => onPace(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <p className={styles.small}>
        {PACES.find((option) => option.value === pace)?.hint}{" "}
        {pace !== 0 &&
          "The clock starts when the child has finished speaking; once you start typing you have 25 seconds."}
      </p>
      {voiceSlot}
      <p className={styles.small}>
        Your replies are sent to an AI model to tag them. Don&apos;t include
        real names.
      </p>
      <p className={styles.disclaimer}>{DISCLAIMER}</p>
    </section>
  );
}
