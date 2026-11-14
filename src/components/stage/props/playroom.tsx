import { PAPER as P, type PaperColor } from "../palette";
import type { PropProps } from "./types";

/* Playroom cuts. Each origin is the bottom centre and each object has one
   shaded paper facet. Toy wheels and board cells are material, not shadows. */

function shadedPaper(tint: PaperColor): string {
  const darker = `${tint.replace(/Light$|Dark$/, "")}Dark`;
  return darker in P ? P[darker as PaperColor] : P.creamDark;
}

/** Foreshortened board and three scattered pieces: x -38..38, y -24..0. */
export function BoardGame({ tint = "cream" }: PropProps) {
  return (
    <g>
      <path d="M-30 -23 L27 -24 L34 -7 L-35 -6 Z" fill={P[tint]} />
      {/* Only the board's front edge exposes its folded underside. */}
      <path d="M-35 -6 L34 -7 L33 -4 L-34 -3 Z" fill={shadedPaper(tint)} />
      <path
        d="M-24 -20 L-12 -20.2 L-13 -15 L-26 -14.8 Z M1 -20.5 L13 -20.7 L15 -15.5 L2 -15.3 Z M-13 -15 L1 -15.3 L2 -9.7 L-14 -9.4 Z M15 -15.5 L26 -15.7 L28 -10 L17 -9.9 Z"
        fill={P.teal}
      />
      <path d="M-38 -4 L-34 -7 L-30 -4 L-32 0 L-36 -0.5 Z" fill={P.tomato} />
      <path d="M31 -11 L37 -10 L38 -5 L32 -5.5 Z" fill={P.teal} />
      <path d="M9 -3.5 L15 -4 L17 -0.5 L11 0 Z" fill={P.tomato} />
    </g>
  );
}

/** Three open shelves with a few toys: x -35..35, y -95..0. */
export function ToyShelf({ tint = "kraft" }: PropProps) {
  return (
    <g>
      <path
        d="M-35 0 L-34 -95 L34 -94 L35 0 Z M-28 -87 L28 -87 L28 -63 L-28 -63 Z M-28 -57 L28 -57 L28 -33 L-28 -33 Z M-28 -27 L28 -27 L28 -6 L-28 -6 Z"
        fill={P[tint]}
        fillRule="evenodd"
      />
      {/* A single dark side panel gives the shelf its depth. */}
      <path d="M29 -94 L34 -94 L35 0 L29 0 Z" fill={shadedPaper(tint)} />
      <path
        d="M-23 -70 a6.5 6.5 0 1 0 13 0 a6.5 6.5 0 1 0 -13 0 Z"
        fill={P.tomato}
      />
      <path d="M9 -76 L20 -77 L21 -63 L8 -63 Z" fill={P.teal} />
      <path d="M-23 -40 L-5 -39 L-10 -33 L-19 -33 Z" fill={P.teal} />
      <path
        d="M-15 -54 L-6 -42 L-15 -42 Z M-15 -54 L-14 -54 L-14 -39 L-15 -39 Z"
        fill={P.tomato}
      />
      <path
        d="M-23 -17 L-12 -17 L-10 -22 L-4 -22 L1 -13 L1 -10 L-23 -10 Z"
        fill={P.tomato}
      />
      <path
        d="M-20 -9 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 Z M-8 -9 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 Z"
        fill={shadedPaper(tint)}
      />
      <path
        d="M11 -18 L21 -19 L22 -6 L10 -6 Z M14 -25 L20 -25 L20 -19 L14 -19 Z"
        fill={P.teal}
      />
    </g>
  );
}

/** A dump truck with a tipped paper bed: x -27..27, y -34..0. */
export function DumpTruck({ tint = "mustard" }: PropProps) {
  return (
    <g>
      <path
        d="M-27 -13 L-26 -31 L3 -34 L5 -17 L15 -17 L15 -9 L-25 -9 Z M8 -27 L20 -27 L26 -18 L27 -8 L7 -8 Z"
        fill={P[tint]}
      />
      {/* One dark cut under the tipped loading bed. */}
      <path
        d="M-27 -13 L5 -17 L15 -17 L15 -13 L-25 -9 Z"
        fill={shadedPaper(tint)}
      />
      <path d="M12 -24 L18 -24 L23 -18 L12 -18 Z" fill={P.sky} />
      <path
        d="M-21 -5 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z M13 -5 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z"
        fill={P.ink}
      />
    </g>
  );
}

/** Three chunky blocks: x -34..34, y -22..0; four papers. */
export function Blocks({ tint = "teal" }: PropProps) {
  return (
    <g>
      <path d="M-34 -3 L-31 -17 L-17 -14 L-19 0 Z" fill={P.tomato} />
      <path d="M-7 -22 L9 -21 L14 -5 L-3 -4 Z" fill={P[tint]} />
      <path d="M19 -12 L33 -15 L34 -1 L21 0 Z" fill={P.mustard} />
      {/* Only the upright centre block exposes its shaded side. */}
      <path d="M9 -21 L14 -5 L9 -5.3 L4 -21.3 Z" fill={shadedPaper(tint)} />
    </g>
  );
}
