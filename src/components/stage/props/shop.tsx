import { PAPER as P } from "../palette";
import type { PropProps } from "./types";

/* Shop props. Same rules as outdoor.tsx: bottom centre at (0, 0), drawn upward. */

const GOODS = [P.tomato, P.teal, P.mustard, P.sky, P.plum, P.sage, P.blush];

/** A tall shelving unit with rows of paper boxes. Deterministic, no randomness. */
export function Shelves({ tint }: PropProps) {
  const frame = tint ? P[tint] : P.kraftLight;
  const rows = [-118, -88, -58, -28];
  const widths = [9, 12, 7, 10, 8, 11, 9];
  return (
    <g>
      <path d="M-46 0 L-46 -134 L46 -134 L46 0 Z" fill={frame} />
      <path d="M38 0 L38 -134 L46 -134 L46 0 Z" fill={P.kraft} />
      {rows.map((top, r) => {
        let x = -41;
        const boxes = [];
        for (let i = 0; x < 34; i++) {
          const w = widths[(i + r * 3) % widths.length];
          const h = 14 + ((i * 5 + r * 7) % 9);
          boxes.push(
            <path
              key={i}
              d={`M${x} ${top + 26} L${x} ${top + 26 - h} L${Math.min(x + w, 37)} ${top + 26 - h} L${Math.min(x + w, 37)} ${top + 26} Z`}
              fill={GOODS[(i + r * 2) % GOODS.length]}
            />,
          );
          x += w + 1.5;
        }
        return (
          <g key={top}>
            {boxes}
            <path
              d={`M-46 ${top + 26} L46 ${top + 26} L46 ${top + 30} L-46 ${top + 30} Z`}
              fill={P.kraftDark}
            />
          </g>
        );
      })}
    </g>
  );
}

/** The candy rack at the checkout: three tiers of wrapped bars. */
export function CandyRack({ tint }: PropProps) {
  const frame = tint ? P[tint] : P.ink;
  return (
    <g>
      <path
        d="M-26 0 L-24 -78 L-20 -78 L-21 0 Z M21 0 L20 -78 L24 -78 L26 0 Z"
        fill={frame}
      />
      <path d="M-28 -80 L28 -80 L27 -86 L-27 -86 Z" fill={P.tomato} />
      <path d="M-25 -82 H25 V-84 H-25 Z" fill={P.sheet} opacity={0.6} />
      {[-62, -42, -22].map((y, r) => (
        <g key={y}>
          <path
            d={`M-22 ${y + 4} L22 ${y + 4} L23 ${y + 8} L-23 ${y + 8} Z`}
            fill={P.ink2}
          />
          {[-18, -9, 0, 9].map((x, i) => (
            <path
              key={x}
              d={`M${x} ${y + 4} L${x + 1} ${y - 12} L${x + 8} ${y - 13} L${x + 8} ${y + 4} Z`}
              fill={[P.mustard, P.plum, P.tomato, P.teal][(i + r) % 4]}
            />
          ))}
          <path
            d={`M-18 ${y - 5} L26 ${y - 6} L26 ${y - 3.5} L-18 ${y - 2.5} Z`}
            fill={P.sheet}
            opacity={0.5}
          />
        </g>
      ))}
    </g>
  );
}

/** The checkout counter with its belt and till. */
export function CheckoutBelt({ tint }: PropProps) {
  const body = tint ? P[tint] : P.rule;
  return (
    <g>
      <path d="M-74 0 L-74 -40 L70 -40 L70 0 Z" fill={body} />
      <path d="M-74 -40 L70 -40 L72 -46 L-72 -47 Z" fill={P.ink} />
      <path
        d="M-60 -47 L-60 -52 L-44 -52 L-44 -47 Z M-30 -47 L-31 -56 L-20 -56 L-19 -47 Z"
        fill={P.sky}
      />
      <path d="M-40 -47 L-40 -51 L-34 -51 L-34 -47 Z" fill={P.mustard} />
      <path d="M44 -47 L44 -74 L68 -74 L68 -47 Z" fill={P.ink2} />
      <path d="M47 -70 L65 -70 L65 -60 L47 -60 Z" fill={P.skyLight} />
      <path d="M-74 -12 L70 -12 L70 0 L-74 0 Z" fill={P.ruleDark} />
    </g>
  );
}

/** A wire shopping cart: thin paper strips for the wires. */
export function Cart({ tint }: PropProps) {
  const handle = tint ? P[tint] : P.tomato;
  const wires = Array.from({ length: 7 }, (_, i) => {
    const x = -26 + i * 8;
    return `M${x} -56 L${x + 1.4} -56 L${x + 4 + 1.4} -22 L${x + 4} -22 Z`;
  }).join(" ");
  return (
    <g>
      <path
        d="M-30 -58 L30 -58 L26 -20 L-24 -20 Z"
        fill={P.ink}
        opacity={0.12}
      />
      <path d={wires} fill={P.ink} />
      <path
        d="M-31 -58 L31 -58 L31 -55 L-31 -55 Z M-25 -40 L28 -40 L28 -38 L-25 -38 Z M-24 -23 L27 -23 L27 -20 L-24 -20 Z"
        fill={P.ink}
      />
      <path d="M31 -58 L42 -70 L45 -68 L34 -56 Z" fill={P.ink} />
      <path d="M38 -74 L50 -66 L47 -62 L35 -70 Z" fill={handle} />
      <path
        d="M-20 -20 L-18 -6 M24 -20 L22 -6"
        stroke={P.ink}
        strokeWidth={2.5}
      />
      <path
        d="M-24 -4 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z M17 -4 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z"
        fill={P.ink}
      />
    </g>
  );
}
