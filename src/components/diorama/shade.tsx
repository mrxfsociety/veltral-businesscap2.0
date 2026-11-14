/*
 * Volume for the miniature: every solid is filled with a gradient that reads as
 * a rounded form lit from the upper left (lit side, body, shadow side).
 */
import type { ReactNode } from "react";

function hex(c: string) {
  const v = c.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
}
function toHex(rgb: number[]) {
  return `#${rgb
    .map((n) =>
      Math.round(Math.min(255, Math.max(0, n)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** Mix a colour toward white (amount > 0) or a cool ink (amount < 0). */
export function tone(color: string, amount: number) {
  const [r, g, b] = hex(color);
  const target = amount >= 0 ? [255, 250, 238] : [24, 28, 46];
  const t = Math.abs(amount);
  return toHex([
    r + (target[0] - r) * t,
    g + (target[1] - g) * t,
    b + (target[2] - b) * t,
  ]);
}

/** A sphere-like radial fill: highlight at upper left, falling into a cool shadow. */
export function Ball({
  id,
  color,
  cx = "34%",
  cy = "28%",
}: {
  id: string;
  color: string;
  cx?: string;
  cy?: string;
}) {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r="78%" fx={cx} fy={cy}>
      <stop offset="0" stopColor={tone(color, 0.42)} />
      <stop offset="0.38" stopColor={color} />
      <stop offset="0.82" stopColor={tone(color, -0.32)} />
      <stop offset="1" stopColor={tone(color, -0.48)} />
    </radialGradient>
  );
}

/** A cylinder-like linear fill across x: lit edge, body, shadow side. */
export function Tube({
  id,
  color,
  vertical = false,
}: {
  id: string;
  color: string;
  vertical?: boolean;
}) {
  return (
    <linearGradient
      id={id}
      x1="0"
      y1="0"
      x2={vertical ? "0" : "1"}
      y2={vertical ? "1" : "0"}
    >
      <stop offset="0" stopColor={tone(color, 0.3)} />
      <stop offset="0.22" stopColor={tone(color, 0.12)} />
      <stop offset="0.55" stopColor={color} />
      <stop offset="1" stopColor={tone(color, -0.42)} />
    </linearGradient>
  );
}

export function Defs({ children }: { children: ReactNode }) {
  return <defs>{children}</defs>;
}
