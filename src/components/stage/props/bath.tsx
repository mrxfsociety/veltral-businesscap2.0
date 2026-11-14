import { PAPER as P } from "../palette";
import type { PropProps } from "./types";

/* Bathroom pieces, cut from the stage's construction papers. Local origin is
   the bottom centre. Each prop has just one right-side or underside facet. */

/** Three columns of wall tiles. Bounds: x -46..46, y -102..0. */
export function TiledPanel({ tint = "skyLight" }: PropProps) {
  return (
    <g>
      <path d="M-46 0 L-45 -102 L45 -101 L46 0 Z" fill={P.cream} />
      {[-98, -66, -34].map((top, row) =>
        [-42, -13, 16].map((left, column) => (
          <path
            key={`${row}-${column}`}
            d={`M${left} ${top} L${left + 26} ${top + 0.5} L${left + 26.5} ${top + 28} L${left - 0.3} ${top + 28.5} Z`}
            fill={P[tint]}
          />
        )),
      )}
      {/* A single narrow fold where the tiled card turns at stage right. */}
      <path d="M43 -101 L45 -101 L46 0 L43 0 Z" fill={P.skyDark} />
    </g>
  );
}

/** A hanging towel, with its hook and one folded right edge. */
export function TowelHook({ tint = "teal" }: PropProps) {
  return (
    <g>
      <path
        d="M-3 -42 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 Z M-1.1 -42 L1.3 -42 L1.7 -34 L-1 -34 Z"
        fill={P.ink}
      />
      <path d="M-10 -36 L11 -37 L14 -1 L-12 0 L-14 -26 Z" fill={P[tint]} />
      <path d="M7 -36.8 L11 -37 L14 -1 L8 -0.8 Z" fill={P.tealDark} />
    </g>
  );
}

/** Bath and bubbles share one cut-paper silhouette, with a blue inset basin.
 * Feet end at y=0; the tallest bubble is y=-51. Bounds: x -60..60. */
export function Bathtub({ tint = "sheet" }: PropProps) {
  return (
    <g>
      <path
        d="M-43 0 L-40 -12 L-34 -12 L-36 0 Z M36 0 L34 -12 L40 -12 L44 0 Z"
        fill={P.creamDark}
      />
      <path
        d="M-60 -33 Q-56 -40 0 -39 Q56 -39 60 -32 L50 -12 Q46 -4 34 -4 L-33 -4 Q-47 -5 -51 -14 Z"
        fill={P[tint]}
      />
      <path
        d="M-52 -32 Q-48 -36 0 -35 Q48 -35 52 -31 Q45 -25 0 -25 Q-46 -26 -52 -32 Z"
        fill={P.skyLight}
      />
      {/* Broad white bubble cutouts, not stroked circles or tiny foam dots. */}
      <path
        d="M-44 -31 C-49 -36 -44 -43 -38 -41 C-37 -50 -26 -51 -22 -43 C-17 -47 -9 -42 -10 -35 L-10 -30 Z M-12 -31 C-15 -39 -9 -45 -3 -42 C-3 -51 8 -55 13 -46 C19 -50 27 -45 26 -38 C33 -41 39 -35 35 -30 Z M34 -30 C30 -36 36 -42 42 -39 C45 -43 52 -40 51 -34 L49 -30 Z"
        fill={P[tint]}
      />
      {/* The only shaded facet follows the bath's right and bottom cut. */}
      <path
        d="M60 -32 L50 -12 Q46 -4 34 -4 L-33 -4 Q-45 -5 -49 -11 Q-28 -7 23 -8 Q42 -8 47 -17 L53 -31 Z"
        fill={P.creamDark}
      />
    </g>
  );
}

/** A small paper duck, four papers including its underside and ink eye. */
export function RubberDuck({ tint = "mustard" }: PropProps) {
  return (
    <g>
      <path
        d="M-17 -13 L-9 -9 Q-7 -13 -2 -13 C-6 -19 -2 -24 4 -24 C11 -24 13 -18 10 -14 Q17 -12 14 -6 Q10 0 -2 0 Q-14 0 -17 -13 Z"
        fill={P[tint]}
      />
      <path d="M10 -19 L17 -17 L11 -14 Z" fill={P.tomato} />
      {/* One underside facet; no second wing shadow. */}
      <path
        d="M-14 -7 Q-7 -1 6 -4 Q12 -5 15 -9 Q15 -3 6 -1 Q-7 2 -14 -7 Z"
        fill={P.mustardDark}
      />
      <path d="M6 -19.5 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 Z" fill={P.ink} />
    </g>
  );
}
