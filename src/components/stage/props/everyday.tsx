import { PAPER as P, type PaperColor } from "../palette";
import type { PropProps } from "./types";

/* Everyday objects, authored in paper cuts. Bottom centre is (0, 0).
   Each prop has one shaded facet; everything else is an object or its contents. */

function shadedPaper(tint: PaperColor): string {
  const darker = `${tint.replace(/Light$|Dark$/, "")}Dark`;
  return darker in P ? P[darker as PaperColor] : P.creamDark;
}

/** The back of a tablet, not a lit screen. Bounds: x -24..24, y -15..0. */
export function TabletFaceDown({ tint = "storm" }: PropProps) {
  return (
    <g>
      <path d="M-24 -4 L-19 -15 L24 -11 L21 -1 L-22 -3 Z" fill={P[tint]} />
      {/* One narrow underside, facing away from the top-left light. */}
      <path d="M-24 -4 L21 -1 L20.5 0 L-23 -2 Z" fill={P.ink} />
      <path
        d="M-17.5 -12.8 L-13.2 -12.5 L-14.1 -9.6 L-18.5 -10 Z"
        fill={P.ink}
      />
      <path
        d="M-16 -11.7 a0.8 0.7 0 1 0 0 1.4 a0.8 0.7 0 1 0 0 -1.4 Z"
        fill={P.cream}
      />
    </g>
  );
}

/** Pendant including its cord: x -20..20, y -92..0; three paper colours. */
export function PendantLamp({ tint = "mustard" }: PropProps) {
  return (
    <g>
      <path d="M-0.8 -92 L0.6 -92 L0.9 -25 L-0.7 -25 Z" fill={P.ink} />
      <path d="M-20 -1 L-10 -25 L9 -26 L20 0 Z" fill={P[tint]} />
      {/* The single fold is the shade's right panel. */}
      <path d="M1 -25.55 L9 -26 L20 0 L5 -0.38 Z" fill={shadedPaper(tint)} />
    </g>
  );
}

/** A plate of pasta and peas, foreshortened on a table: four paper colours. */
export function DinnerPlate({ tint = "cream" }: PropProps) {
  return (
    <g>
      <path
        d="M-24 -9 C-23 -18 22 -18 24 -8 Q22 -1 0 -2 Q-22 -2 -24 -9 Z"
        fill={P[tint]}
      />
      {/* One underside facet under the front rim; no extra rim outline. */}
      <path
        d="M-24 -9 Q-22 -2 0 -2 Q22 -1 24 -8 L23 -5 Q20 0 0 0 Q-20 0 -23 -5 Z"
        fill={shadedPaper(tint)}
      />
      <path
        d="M-13 -11 Q-11 -15 -7 -12 L-3 -9 Q-1 -7 -3 -6 L-5 -7 Q-5 -9 -9 -10 Q-11 -10 -11 -9 Z M-2 -12 Q1 -15 4 -12 L8 -8 L6 -6 L2 -10 Q0 -12 -1 -10 Z M-10 -6 L-7 -8 L-1 -4.5 L-3 -3.5 Z M8 -12 L11 -13 L15 -9 L13 -7 Z"
        fill={P.mustard}
      />
      <path
        d="M-17 -8 a1.7 1.35 0 1 0 3.4 0 a1.7 1.35 0 1 0 -3.4 0 Z M9 -5.5 a1.6 1.25 0 1 0 3.2 0 a1.6 1.25 0 1 0 -3.2 0 Z M2 -6.3 a1.5 1.2 0 1 0 3 0 a1.5 1.2 0 1 0 -3 0 Z"
        fill={P.sageDark}
      />
    </g>
  );
}
