import { PAPER as P, type PaperColor } from "../palette";
import type { PropProps } from "./types";

/* Morning departures, drawn upward from a bottom-centre anchor. */

function shadedPaper(tint: PaperColor): string {
  const darker = `${tint.replace(/Light$|Dark$/, "")}Dark`;
  return darker in P ? P[darker as PaperColor] : P.creamDark;
}

/** Garage door: x -38..38, y -98..0; four paths, four papers. */
export function GarageDoor({ tint = "cream" }: PropProps) {
  return (
    <g>
      <path d="M-38 0 L-38 -98 L37 -97 L38 0 Z" fill={P.kraft} />
      <path d="M-32 0 L-32 -91 L31 -91 L33 0 Z" fill={P[tint]} />
      {/* One shaded edge on the right of the roll-up paper door. */}
      <path d="M26 -91 L31 -91 L33 0 L27 0 Z" fill={shadedPaper(tint)} />
      <path
        d="M-32 -71 L31.4 -70.5 L31.5 -69 L-32 -69.5 Z M-32 -49 L31.9 -48.5 L31.9 -47 L-32 -47.5 Z M-32 -27 L32.4 -26.5 L32.4 -25 L-32 -25.5 Z M-5 -14 L6 -14 L6 -11.5 L-5 -11.5 Z"
        fill={P.ink2}
      />
    </g>
  );
}

/** Empty child seat with harness: x -17..17, y -39..0; four papers. */
export function CarSeat({ tint = "tomato" }: PropProps) {
  return (
    <g>
      <path
        d="M-13 -34 Q-12 -39 -7 -39 L7 -38 Q13 -37 13 -32 L12 -15 L17 -6 L15 0 L-15 0 L-17 -6 L-12 -15 Z"
        fill={P[tint]}
      />
      {/* One fold down the seat's right wing and base. */}
      <path
        d="M8 -37 L12 -35 L12 -15 L17 -6 L15 0 L9 -0.3 L10 -8 L8 -16 Z"
        fill={shadedPaper(tint)}
      />
      <path
        d="M-9 -29 L-6 -30 L1 -14 L7 -30 L10 -29 L3 -10 L3 -4 L-1 -4 L-1 -10 Z M-12 -14 L12 -14 L12 -11 L-12 -11 Z"
        fill={P.ink}
      />
      <path
        d="M-6 -35 L6 -34.5 L6 -31 L-6 -31.5 Z M-3 -15 L4 -15 L4 -9 L-3 -9 Z"
        fill={P.cream}
      />
    </g>
  );
}

/** Three drawers and two small feet: x -28..28, y -64..0; four papers. */
export function Dresser({ tint = "kraft" }: PropProps) {
  return (
    <g>
      <path
        d="M-28 -61 L25 -64 L28 -2 L23 0 L23 -5 L-22 -4 L-22 0 L-27 0 Z"
        fill={P[tint]}
      />
      {/* One right-side facet on the wooden cabinet. */}
      <path
        d="M21 -63.6 L25 -64 L28 -2 L23 0 L23 -5 Z"
        fill={shadedPaper(tint)}
      />
      <path
        d="M-22 -56 L19 -57 L19.5 -44 L-22 -43 Z M-22 -39 L19.7 -40 L20 -27 L-22 -26 Z M-22 -22 L20.2 -23 L20.6 -10 L-22 -9 Z"
        fill={P.cream}
      />
      <path
        d="M-11 -50 a1.7 1.7 0 1 0 3.4 0 a1.7 1.7 0 1 0 -3.4 0 Z M7 -50.4 a1.7 1.7 0 1 0 3.4 0 a1.7 1.7 0 1 0 -3.4 0 Z M-11 -33 a1.7 1.7 0 1 0 3.4 0 a1.7 1.7 0 1 0 -3.4 0 Z M7 -33.4 a1.7 1.7 0 1 0 3.4 0 a1.7 1.7 0 1 0 -3.4 0 Z M-11 -16 a1.7 1.7 0 1 0 3.4 0 a1.7 1.7 0 1 0 -3.4 0 Z M7 -16.4 a1.7 1.7 0 1 0 3.4 0 a1.7 1.7 0 1 0 -3.4 0 Z"
        fill={P.ink2}
      />
    </g>
  );
}

/** A folded shirt over trousers: x -22..22, y -14..0; four papers. */
export function Clothes({ tint = "tomato" }: PropProps) {
  return (
    <g>
      <path d="M-18 -7 L17 -8 L19 -1 L-17 0 Z" fill={P.ink2} />
      <path
        d="M-22 -9 L-15 -14 L-5 -13 Q0 -9 5 -13 L14 -14 L22 -10 L17 -6 L12 -8 L12 -2 L-12 -2 L-12 -8 L-17 -6 Z"
        fill={P[tint]}
      />
      {/* One darker folded panel on the shirt's right side. */}
      <path d="M2 -11 L12 -12 L12 -2 L2 -2 Z" fill={shadedPaper(tint)} />
      <path d="M-5 -13 Q0 -8 5 -13 L3 -14 Q0 -11 -3 -14 Z" fill={P.cream} />
    </g>
  );
}

/** A pair of small shoes: x -24..24, y -13..0; three papers. */
export function Shoes({ tint = "teal" }: PropProps) {
  return (
    <g>
      <path
        d="M-24 -3 L-22 -9 L-13 -10 L-10 -13 L-7 -12 L-7 -7 L-2 -5 L-2 -1 L-22 0 Z"
        fill={P[tint]}
      />
      <path
        d="M2 -3 L4 -10 L13 -13 L17 -12 L18 -7 L24 -4 L24 -1 L4 0 Z"
        fill={P[tint]}
      />
      {/* Only the nearer shoe has a visible shaded underside. */}
      <path d="M2 -3 L24 -2 L24 0 L4 0 Z" fill={shadedPaper(tint)} />
      <path
        d="M-16 -9.5 L-10 -8.4 L-10.2 -7.2 L-16.2 -8.3 Z M-18 -7.2 L-12 -6 L-12.2 -4.8 L-18.2 -6 Z M8 -10.5 L14 -9 L13.7 -7.8 L7.7 -9.3 Z M6 -7.8 L12 -6.4 L11.7 -5.2 L5.7 -6.6 Z"
        fill={P.cream}
      />
    </g>
  );
}
