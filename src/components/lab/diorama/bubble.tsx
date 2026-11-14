"use client";

import { useEffect, useState } from "react";
import styles from "./diorama.module.css";

/** The child's line on a solid card floating above the model, revealed in at most 600 ms. */
export function DioramaBubble({
  line,
  action,
  onRevealed,
  instant,
}: {
  line: string;
  action?: string;
  onRevealed?: () => void;
  instant?: boolean;
}) {
  const [shown, setShown] = useState(instant ? line.length : 0);
  useEffect(() => {
    if (instant) {
      onRevealed?.();
      return;
    }
    const step = Math.max(12, Math.floor(600 / Math.max(1, line.length)));
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= line.length) {
        window.clearInterval(id);
        onRevealed?.();
      }
    }, step);
    return () => window.clearInterval(id);
  }, [line, instant, onRevealed]);
  const loud = line === line.toUpperCase() && /[A-Z]/.test(line);
  return (
    <figure className={styles.bubble}>
      <blockquote className={styles.line} data-loud={loud ? "" : undefined}>
        <span aria-hidden>{line.slice(0, instant ? line.length : shown)}</span>
        <span className={styles.srOnly}>{line}</span>
      </blockquote>
      {action && <figcaption className={styles.action}>{action}</figcaption>}
    </figure>
  );
}
