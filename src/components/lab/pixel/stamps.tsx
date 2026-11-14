import styles from "./pixel.module.css";

export type LabStamp = { label: string; kind: "helpful" | "unhelpful" };

/** Small badges that pop in over two frames: a cropped frame, then the whole badge. */
export function PixelStamps({ stamps }: { stamps: LabStamp[] }) {
  if (stamps.length === 0) return null;
  return (
    <ul className={styles.stamps} aria-label="Stamps">
      {stamps.map((s) => (
        <li key={s.label} className={styles.stamp} data-kind={s.kind}>
          <svg
            viewBox="0 0 7 7"
            className={styles.glyph}
            aria-hidden
            shapeRendering="crispEdges"
          >
            {s.kind === "helpful" ? (
              <path
                d="M0 3h1v1h1v1h1V4h1V3h1V2h1V1h1v1H6v1H5v1H4v1H3v1H2V5H1V4H0z"
                fill="currentColor"
              />
            ) : (
              <path
                d="M0 0h2v1h1v1h1V1h1V0h2v2H6v1H5v1h1v1h1v2H5V6H4V5H3v1H2v1H0V5h1V4h1V3H1V2H0z"
                fill="currentColor"
              />
            )}
          </svg>
          {s.label}
        </li>
      ))}
    </ul>
  );
}
