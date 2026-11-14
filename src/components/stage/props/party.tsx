import { PAPER as P, type PaperColor } from "../palette";
import type { PropProps } from "./types";

/* Party pieces share the same restrained paper palette as the other rooms.
   Origins are bottom centre; no lettering is needed to recognise the occasion. */

function shadedPaper(tint: PaperColor): string {
  const darker = `${tint.replace(/Light$|Dark$/, "")}Dark`;
  return darker in P ? P[darker as PaperColor] : P.creamDark;
}

/** Five flags on one gently sagging cord: x -64..64, y -32..0. */
export function Bunting({ tint = "tomato" }: PropProps) {
  return (
    <g>
      <path
        d="M-64 -32 Q0 -12 64 -31 L64 -29.6 Q0 -10.6 -64 -30.6 Z"
        fill={P.ink}
      />
      <path d="M-60 -30 L-40 -25 L-51 -7 Z" fill={P[tint]} />
      <path d="M-34 -24 L-15 -21.5 L-25 -2 Z" fill={P.mustard} />
      <path d="M-10 -21 L10 -21 L1 0 Z" fill={P[tint]} />
      <path d="M16 -21.5 L35 -24 L28 -2 Z" fill={P.mustard} />
      <path d="M41 -25 L60 -30 L52 -8 Z" fill={P[tint]} />
      {/* Only the middle flag lifts into a shaded fold. */}
      <path d="M2 -21 L10 -21 L1 0 L-1 -8 Z" fill={shadedPaper(tint)} />
    </g>
  );
}

/** Three balloons, two coloured papers and ink strings: x about -28..28, y -92..0. */
export function Balloons({ tint = "tomato" }: PropProps) {
  return (
    <g>
      <path
        d="M-15 -50 C-17 -32 -8 -17 0 -1 L1 0 C-7 -18 -15 -33 -13.8 -50 Z M0 -65 C4 -45 -5 -21 0 -1 L1 0 C-3 -22 5 -45 1.2 -65 Z M17 -49 C22 -30 9 -18 1 0 L0 -1 C8 -20 20 -32 15.8 -49 Z"
        fill={P.ink}
      />
      <path
        d="M-15 -84 C-30 -84 -31 -64 -20 -54 L-12 -48 L-14 -53 C-1 -61 -1 -82 -15 -84 Z"
        fill={P.mustard}
      />
      <path
        d="M17 -79 C3 -80 3 -61 13 -52 L16 -47 L19 -52 C30 -60 30 -77 17 -79 Z"
        fill={P.mustard}
      />
      <path
        d="M0 -92 C-16 -92 -16 -72 -5 -66 L-2 -61 L2 -61 L5 -66 C17 -73 15 -91 0 -92 Z"
        fill={P[tint]}
      />
      {/* The nearest balloon alone has a folded right-hand facet. */}
      <path
        d="M5 -91 C16 -87 16 -73 5 -66 L2 -61 L-2 -61 L1 -68 C11 -76 11 -86 5 -91 Z"
        fill={shadedPaper(tint)}
      />
    </g>
  );
}

/** A simple frosted cake on a paper plate: x -23..23, y -31..0. */
export function Cake({ tint = "tomato" }: PropProps) {
  return (
    <g>
      <path d="M-23 -3 L-19 -7 L20 -6 L23 -2 L20 0 L-20 0 Z" fill={P.sheet} />
      <path d="M-18 -22 L17 -23 L18 -4 L-17 -3 Z" fill={P[tint]} />
      <path
        d="M-18 -22 Q-16 -26 0 -26 Q17 -26 18 -22 L18 -16 Q14 -12 11 -17 Q6 -13 2 -17 Q-3 -13 -6 -17 Q-12 -12 -18 -16 Z"
        fill={P.sheet}
      />
      <path
        d="M-10 -22 L-10 -28 L-7.5 -28 L-7.5 -22 Z M6 -22 L6 -28 L8.5 -28 L8.5 -22 Z M-9 -31 L-7 -29 L-10 -29 Z M7 -31 L9 -29 L6 -29 Z"
        fill={P.mustard}
      />
      {/* One shaded slice of the right side, below the frosting. */}
      <path
        d="M12 -16 Q15 -14 18 -16 L18 -4 L12 -3.8 Z"
        fill={shadedPaper(tint)}
      />
    </g>
  );
}

/** One wrapped present with paper ribbon: x -23..23, y -38..0. */
export function Gift({ tint = "teal" }: PropProps) {
  return (
    <g>
      <path d="M-21 -27 L20 -28 L22 -1 L-20 0 Z" fill={P[tint]} />
      <path d="M-23 -29 L22 -30 L23 -24 L-22 -23 Z" fill={P[tint]} />
      {/* One shaded side continues from the lid to the box's bottom. */}
      <path
        d="M15 -29.8 L22 -30 L23 -24 L21 -23.9 L22 -1 L16 -0.8 Z"
        fill={shadedPaper(tint)}
      />
      <path
        d="M-3 -29.5 L3 -29.6 L4 -0.5 L-2 -0.4 Z M-21 -15 L21 -16 L21.4 -11 L-20.7 -10 Z"
        fill={P.mustard}
      />
      <path
        d="M0 -29 C-18 -26 -20 -38 -10 -38 C-4 -38 -2 -33 0 -31 C3 -38 12 -40 15 -35 C18 -28 8 -26 0 -29 Z M-3 -31 C-6 -35 -11 -37 -12 -34 C-13 -31 -7 -30 -3 -31 Z M4 -31 C8 -30 12 -30 12 -33 C12 -36 8 -35 4 -31 Z"
        fill={P.mustard}
        fillRule="evenodd"
      />
    </g>
  );
}
