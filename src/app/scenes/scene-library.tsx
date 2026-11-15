"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import type { PublicScene } from "@/engine/types";
import type { DailyResponse } from "@/shared/api";
import { api } from "@/lib/api";
import { bestStarsForScene } from "@/lib/progress";
import { useStore } from "@/lib/use-store";
import { ProGate } from "@/components/pro-gate";
import { Icon } from "@/components/paper/icons";
import { PaperStage } from "@/components/stage/paper-stage";
import styles from "./scenes.module.css";

function Stars({ stars }: { stars: number }) {
  if (!stars) return <p className={styles.stars}>A fresh start</p>;
  return (
    <p className={styles.stars} aria-label={`Your best: ${stars} stars`}>
      <span aria-hidden="true">Your best</span>
      {[1, 2, 3].map((n) => (
        <span key={n} data-on={n <= stars || undefined} aria-hidden="true">
          <Icon name="star" size={16} />
        </span>
      ))}
    </p>
  );
}

/** A click anywhere on a card does what its one control does (play, or open the paywall). */
function forwardClick(event: MouseEvent<HTMLElement>) {
  const target = event.target as HTMLElement;
  if (target.closest("a, button, input, select, textarea")) return;
  event.currentTarget
    .querySelector<HTMLElement>(`.${styles.action} :is(a, button)`)
    ?.click();
}

export function SceneLibrary({
  catalog,
}: {
  catalog: { scene: PublicScene; par: number | null }[];
}) {
  const { history } = useStore();
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .daily()
      .then((result) => {
        if (active) {
          setDaily(result);
          setError("");
        }
      })
      .catch(() => {
        if (active)
          setError("We couldn't load today's scene. You can try again.");
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  return (
    <div className="stack">
      <header className="page-heading">
        <p className="kicker">A little rehearsal for real life</p>
        <h1>Familiar moments. Another chance.</h1>
        <p>Choose a moment to practise. Your best stars stay on this device.</p>
      </header>
      <div className={styles.status}>
        {!daily && !error && (
          <p role="status">Finding today&apos;s meltdown…</p>
        )}
      </div>
      {error && (
        <div className="notice">
          <p role="alert">{error}</p>
          <button
            className="button-secondary"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      )}
      {(["2-3", "4-5", "6-7"] as const).map((age) => (
        <section
          className={styles.shelf}
          key={age}
          aria-labelledby={`age-${age}`}
        >
          <h2 id={`age-${age}`}>Ages {age.replace("-", "–")}</h2>
          <div className={styles.row}>
            {catalog
              .filter(({ scene }) => scene.ageBand === age)
              .map(({ scene, par }) => {
                const today = daily?.sceneId === scene.id;
                const stars = bestStarsForScene(history, scene.id);
                const play = (
                  <Link
                    className="button-secondary"
                    href={
                      today ? "/play" : `/play/${encodeURIComponent(scene.id)}`
                    }
                  >
                    Practise {scene.title.toLowerCase()}
                  </Link>
                );
                return (
                  <article
                    className={styles.card}
                    key={scene.id}
                    data-today={today || undefined}
                    onClick={forwardClick}
                  >
                    <div className={styles.thumb}>
                      <div aria-hidden="true">
                        <PaperStage
                          size="thumb"
                          scene={scene}
                          state={{
                            arousal: scene.startArousal,
                            connection: 50,
                            lastDelta: 0,
                            turn: 0,
                          }}
                        />
                      </div>
                      {today && <span className={styles.flag}>Today</span>}
                    </div>
                    <div className={styles.body}>
                      <p className={styles.place}>{scene.place}</p>
                      <h3>{scene.title}</h3>
                      <p className={styles.setup}>{scene.setup}</p>
                      <p className={styles.meta}>
                        {scene.childName} · {scene.temperament} ·{" "}
                        {par === null ? "par shown at start" : `par ${par}`}
                      </p>
                      <Stars stars={stars} />
                      <div className={styles.action}>
                        {today ? (
                          play
                        ) : (
                          <ProGate feature="The full scene library" compact>
                            {play}
                          </ProGate>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
