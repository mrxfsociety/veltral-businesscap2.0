import type { Trend } from "@/components/stage/mood";
import styles from "./pixel.module.css";

/** The Storm as a ten-segment bar with its number; Connection as a thin bar. */
export function PixelHud({
  storm,
  trend,
  connection,
}: {
  storm: number;
  trend: Trend;
  connection: number;
}) {
  const lit = Math.round(storm / 10);
  return (
    <div className={styles.hudBox}>
      <p className={styles.hudRow}>
        <span>STORM</span>
        <span className={styles.hudNumber} data-testid="arousal-value">
          {storm}
        </span>
        <span className={styles.hudTrend} data-trend={trend}>
          {trend}
        </span>
      </p>
      <div
        className={styles.segments}
        role="img"
        aria-label={`Storm ${storm} of 100`}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            data-on={i < lit ? "" : undefined}
            data-hot={i >= 7 ? "" : undefined}
          />
        ))}
      </div>
      <p className={styles.hudRow}>
        <span>CONNECTION</span>
        <span className={styles.thread} aria-label={`Connection ${connection}`}>
          <span style={{ width: `${Math.round(connection / 10) * 10}%` }} />
        </span>
        <span>{connection}</span>
      </p>
    </div>
  );
}
