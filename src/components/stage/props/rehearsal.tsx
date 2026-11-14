import { PAPER as P, type PaperColor } from "../palette";
import type { PropProps } from "./types";

/* Small rehearsal objects. Every origin is the bottom centre of the object;
   negative y is up. Each piece has one shaded paper fold, never a filter. */

function shadedPaper(tint: PaperColor): string {
  const base = tint.replace(/Light$|Dark$/, "");
  const darker = `${base}Dark`;
  return darker in P ? P[darker as PaperColor] : P.creamDark;
}

/** Open book: bounds x -25..26, y -15.34..0; five paths, four papers. */
export function Book({ tint = "teal" }: PropProps) {
  return (
    <g>
      <path
        d="M-25 -3 L-23 -14 Q-11 -18 0 -10 Q13 -18 24 -14 L26 -3 L1 0 Z"
        fill={P[tint]}
      />
      <path
        d="M-22 -13 Q-11 -17 -1 -10 L0 -3 Q-11 -9 -23 -5 Z M1 -10 Q13 -17 22 -13 L24 -5 Q12 -9 0 -3 Z"
        fill={P.cream}
      />
      {/* The single fold is the dark paper at the book's central hinge. */}
      <path d="M0 -10 L3 -11 L4 -4.5 L0 -3 Z" fill={P.creamDark} />
      <path
        d="M-18 -12 L-7 -10.6 L-7 -9.7 L-18 -11 Z M-18.5 -9.4 L-8 -8 L-8 -7.1 L-18.5 -8.4 Z"
        fill={P.ink2}
      />
      <path
        d="M7 -10.6 L18 -12 L18.2 -11 L7.2 -9.7 Z M8 -8 L18.5 -9.4 L18.8 -8.4 L8.2 -7.1 Z"
        fill={P.ink2}
      />
    </g>
  );
}

/** Cup: bounds x -10..16.14, y -24..0; four paths, three papers. */
export function Cup({ tint = "sky" }: PropProps) {
  return (
    <g>
      {/* The handle is a cut-out, so the room remains visible through it. */}
      <path
        d="M6 -21 L11 -21 C18 -21 18 -8 10 -6 L6 -7 Z M9 -17 L9 -10 C13 -10 15 -17 9 -17 Z"
        fill={P[tint]}
        fillRule="evenodd"
      />
      <path d="M-10 -23 L8 -24 L7 -4 Q6.5 0 -5 0 L-7 -2 Z" fill={P[tint]} />
      <path
        d="M-8.5 -22.5 Q-1 -24 6.5 -22.5 L6.2 -20.5 Q-1 -19.2 -8 -20.8 Z"
        fill={P.cream}
      />
      {/* One right-side facet; red and blue cups share this same cut. */}
      <path
        d="M4 -20 L7.8 -21 L7 -4 Q6.5 -0.4 2 -0.1 L3.5 -4 Z"
        fill={shadedPaper(tint)}
      />
    </g>
  );
}

/** Wall shelf: bounds x -34..34, y -8..0; two paths, two papers. */
export function WallShelf({ tint = "kraft" }: PropProps) {
  return (
    <g>
      <path d="M-34 -8 L32.5 -7.5 L34 -4 L-33 -4.5 Z" fill={P[tint]} />
      {/* One underside fold, facing away from the top-left light. */}
      <path d="M-33 -4.5 L34 -4 L33 0 L-32 -0.5 Z" fill={shadedPaper(tint)} />
    </g>
  );
}
