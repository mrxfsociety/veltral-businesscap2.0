"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, type CSSProperties } from "react";
import styles from "./stage.module.css";

/**
 * A cut-paper outline, viewBox 0 0 100 60: spiky in a storm, round when calm.
 * The base is a superellipse that fills its box (an ellipse would cut the
 * corners off the text); spikes point outward from it.
 */
export function bubblePath(arousal: number) {
  const cx = 50;
  const cy = 30;
  const a = 50;
  const b = 30;
  const exponent = 0.42; // 2/n for a superellipse with n ≈ 4.8: nearly square corners
  const spiky = arousal >= 55;
  const count = spiky ? (arousal >= 80 ? 36 : 28) : 48;
  const amp = spiky ? (arousal >= 80 ? 0.2 : 0.13) : arousal >= 40 ? 0.025 : 0;
  const points = Array.from({ length: count }, (_, i) => {
    const t = (Math.PI * 2 * i) / count;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const k = spiky ? (i % 2 ? 1 : 1 + amp) : 1 + (i % 2 ? -amp : amp);
    const x = cx + a * k * Math.sign(c) * Math.abs(c) ** exponent;
    const y = cy + b * k * Math.sign(s) * Math.abs(s) ** exponent;
    return `${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return `M${points.join(" L")} Z`;
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
  // 28px calm to 56px in a storm, then fitted to the line's length so long
  // lines stay inside the stage.
  const storm = 28 + 28 * Math.min(1, Math.max(0, (arousal - 25) / 60));
  const fit = Math.min(1, Math.max(0.5, 1 - (letters.length - 22) / 90));
  const size = storm * fit;
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
      data-long={letters.length > 44 || undefined}
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
              className={styles.letter}
              style={{ animationDelay: `${Math.round(i * step)}ms` }}
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
