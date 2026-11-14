"use client";

import { animate, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef } from "react";
import type { Trend } from "@/components/stage/mood";
import { formatDelta } from "./takes";
import styles from "./play.module.css";

/** A number that rolls from its previous value to the new one (aria-hidden; the real value is announced separately). */
export function RollingNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef<number | null>(null);
  const reduce = useReducedMotion();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = previous.current;
    previous.current = value;
    if (from === null || from === value || reduce) {
      el.textContent = String(value);
      return;
    }
    const controls = animate(from, value, {
      duration: 0.62,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => {
        el.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [value, reduce]);
  return <span ref={ref} aria-hidden="true" />;
}

/** Inside the top of the proscenium: take and turn, the Storm number, the Connection thread. */
export function HeadsUp({
  take,
  turn,
  maxTurns,
  shownStorm,
  storm,
  trend,
  delta,
  connection,
  shownConnection,
}: {
  take: number;
  turn: number;
  maxTurns: number;
  /** The number the stage currently shows (it rolls during a turn). */
  shownStorm: number;
  /** The engine's current value. */
  storm: number;
  trend: Trend;
  /** The big delta that lands beside the number after a turn; null hides it. */
  delta: number | null;
  connection: number;
  shownConnection: number;
}) {
  return (
    <div className={styles.hud}>
      <p className={styles.hudTake}>
        <span>Take {take}</span>
        <span aria-hidden="true"> · </span>
        <span>
          Turn {turn} of {maxTurns}
        </span>
      </p>
      <div className={styles.hudStorm}>
        <span className={styles.hudLabel}>Storm</span>
        <span className={styles.hudNumber}>
          <RollingNumber value={shownStorm} />
          <span className="sr-only" data-testid="arousal-value">
            {storm} · {trend}
          </span>
        </span>
        <span className={styles.hudTrend} data-trend={trend}>
          {trend}
        </span>
        {delta !== null && (
          <span
            key={`${delta}-${storm}`}
            className={styles.hudDelta}
            data-direction={delta < 0 ? "down" : delta > 0 ? "up" : "same"}
            aria-hidden="true"
          >
            {formatDelta(delta)}
          </span>
        )}
      </div>
      <div className={styles.hudConnection}>
        <span className={styles.hudLabel}>
          Connection{" "}
          <strong className="tabular">
            <RollingNumber value={shownConnection} />
            <span className="sr-only">{connection}</span>
          </strong>
        </span>
        <span
          className={styles.thread}
          role="meter"
          aria-label="Connection"
          aria-valuenow={connection}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ transform: `scaleX(${shownConnection / 100})` }} />
        </span>
      </div>
    </div>
  );
}
