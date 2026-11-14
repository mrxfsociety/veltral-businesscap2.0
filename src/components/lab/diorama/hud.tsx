import type { Trend } from "@/components/stage/mood";
import styles from "./hud.module.css";

/** Solid cards in the product tokens, floating above the model. */
export function DioramaHud({
  storm,
  trend,
  connection,
}: {
  storm: number;
  trend: Trend;
  connection: number;
}) {
  return (
    <div className={styles.card}>
      <p className={styles.storm}>
        <span className={styles.label}>Storm</span>
        <span className={styles.value} data-testid="arousal-value">
          {storm}
        </span>
        <span className={styles.trend} data-trend={trend}>
          {trend}
        </span>
      </p>
      <div className={styles.thread} aria-label={`Connection ${connection}`}>
        <span>Connection</span>
        <span className={styles.bar}>
          <span style={{ transform: `scaleX(${connection / 100})` }} />
        </span>
        <span>{connection}</span>
      </div>
    </div>
  );
}

export function DioramaStamps({
  stamps,
}: {
  stamps: { label: string; kind: "helpful" | "unhelpful" }[];
}) {
  if (stamps.length === 0) return null;
  return (
    <ul className={styles.stamps} aria-label="Stamps">
      {stamps.map((s) => (
        <li key={s.label} className={styles.stamp} data-kind={s.kind}>
          <span aria-hidden>{s.kind === "helpful" ? "✓" : "✕"}</span>
          {s.label}
        </li>
      ))}
    </ul>
  );
}
