"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, type CSSProperties } from "react";
import styles from "./stage.module.css";

/** A cut-paper outline: spiky in a storm, round when calm. viewBox 0 0 100 60. */
export function bubblePath(arousal: number) {
  const cx = 50;
  const cy = 30;
  const rx = 48;
  const ry = 27;
  if (arousal >= 55) {
    const spikes = arousal >= 80 ? 18 : 14;
    const amp = arousal >= 80 ? 0.2 : 0.12;
    const points = Array.from({ length: spikes * 2 }, (_, i) => {
      const a = (Math.PI * 2 * i) / (spikes * 2);
      const k = i % 2 ? 1 - amp : 1;
      return `${(cx + rx * k * Math.cos(a)).toFixed(2)} ${(cy + ry * k * Math.sin(a)).toFixed(2)}`;
    });
    return `M${points.join(" L")} Z`;
  }
  const wobble = arousal >= 40 ? 0.05 : 0.02;
  const n = 10;
  const points = Array.from({ length: n }, (_, i) => {
    const a = (Math.PI * 2 * i) / n;
    const k = 1 - (i % 2 ? wobble : 0);
    return [cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)] as const;
  });
  let d = `M${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const pull = 1.12;
    d += ` Q${(cx + (mx - cx) * pull).toFixed(2)} ${(cy + (my - cy) * pull).toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }
  return `${d} Z`;
}

/**
 * The child's line in a paper bubble above their head. It is decoration for
 * sighted players (aria-hidden); the play screen keeps its own aria-live
 * announcement of the line.
 */
export function SpeechBubble({
  line,
  action,
  arousal,
  anchorX,
  headTop,
  compact,
  onRevealed,
  cue = 0,
  lean,
}: {
  line: string;
  action?: string;
  arousal: number;
  /** Kid x in viewBox units (0..400). */
  anchorX: number;
  /** Top of the kid's head in viewBox units (0..300). */
  headTop: number;
  compact?: boolean;
  /** Called once the last letter has appeared. */
  onRevealed?: () => void;
  /** Changing the cue replays the reveal of the same line. */
  cue?: number;
  /** Lean the bubble to the right of the child (something occupies stage left). */
  lean?: "right";
}) {
  const reduce = useReducedMotion();
  const letters = useMemo(() => Array.from(line), [line]);
  const step = Math.min(32, 600 / Math.max(letters.length, 1));
  const total = reduce ? 0 : Math.round(step * letters.length + 140);
  useEffect(() => {
    if (!onRevealed) return;
    const id = window.setTimeout(onRevealed, total);
    return () => window.clearTimeout(id);
    // the reveal restarts only when the line changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line, total, cue]);
  const size = 28 + 28 * Math.min(1, Math.max(0, (arousal - 25) / 60));
  const left =
    lean === "right"
      ? Math.min(74, Math.max(60, anchorX / 4 + 12))
      : Math.min(74, Math.max(26, anchorX / 4));
  const tail = anchorX / 4 - left;
  return (
    <div
      className={styles.bubble}
      data-compact={compact || undefined}
      data-storm={arousal >= 55 || undefined}
      aria-hidden="true"
      style={
        {
          "--left": `${left}%`,
          "--head": headTop,
          "--tail": `${tail.toFixed(1)}%`,
          "--line-size": size.toFixed(1),
        } as CSSProperties
      }
    >
      <div className={styles.bubbleSheet} key={`${cue}:${line}`}>
        <svg
          className={styles.bubbleShape}
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
        >
          <path d={bubblePath(arousal)} vectorEffect="non-scaling-stroke" />
        </svg>
        <p className={styles.bubbleLine}>
          {letters.map((letter, i) => (
            <span
              key={i}
              className={reduce ? undefined : styles.letter}
              style={
                reduce
                  ? undefined
                  : { animationDelay: `${Math.round(i * step)}ms` }
              }
            >
              {letter}
            </span>
          ))}
        </p>
      </div>
      {action && <p className={styles.direction}>({action})</p>}
    </div>
  );
}
