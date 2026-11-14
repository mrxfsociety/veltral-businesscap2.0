"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicScene } from "@/engine/types";
import type { DailyResponse } from "@/shared/api";
import { api } from "@/lib/api";
import { bestStarsForScene } from "@/lib/progress";
import { useStore } from "@/lib/use-store";
import { ProGate } from "@/components/pro-gate";

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
      {!daily && !error && <p role="status">Finding today&apos;s meltdown…</p>}
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
      <Link className="button" href="/play">
        Play today&apos;s meltdown
      </Link>
      {(["2-3", "4-5", "6-7"] as const).map((age) => (
        <section className="stack" key={age} aria-labelledby={`age-${age}`}>
          <h2 id={`age-${age}`}>Ages {age.replace("-", "–")}</h2>
          <div className="grid">
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
                  <article className="card stack" key={scene.id}>
                    <div className="row">
                      <p className="kicker">{scene.place}</p>
                      {today && <span className="chip">Today</span>}
                    </div>
                    <h3>{scene.title}</h3>
                    <p>{scene.setup}</p>
                    <p className="muted">
                      {scene.childName} · {scene.temperament} ·{" "}
                      {par === null ? "Par shown at start" : `par ${par}`}
                    </p>
                    <p
                      aria-label={
                        stars ? `Your best: ${stars} stars` : "Not played yet"
                      }
                    >
                      {stars
                        ? `Your best: ${"★".repeat(stars)}`
                        : "A fresh start"}
                    </p>
                    {today ? (
                      play
                    ) : (
                      <ProGate feature="The full scene library" compact>
                        {play}
                      </ProGate>
                    )}
                  </article>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
