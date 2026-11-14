import { PAPER as P } from "../palette";
import type { PropProps } from "./types";

/*
 * Outdoor props. Local coordinates: (0, 0) is the bottom centre where the
 * piece stands; everything is drawn upward (negative y). One fold or shadow
 * detail per piece, two to four papers, at most 25 paths.
 */

export function Tree({ tint }: PropProps) {
  const leaf = tint ? P[tint] : P.sage;
  return (
    <g>
      <path
        d="M-6 0 L-4.5 -46 L-13 -60 L-9.5 -62.5 L-2.5 -53 L-0.5 -67 L3 -67 L4.2 -51 L11 -61.5 L14 -58.5 L5.6 -44 L6.5 0 Z"
        fill={P.kraftDark}
      />
      <path
        d="M-36 -78 C-41 -98 -22 -117 -4 -112 C6 -123 30 -117 33 -98 C46 -92 44 -70 32 -64 C26 -52 6 -54 0 -60 C-10 -52 -30 -54 -34 -64 C-42 -66 -42 -74 -36 -78 Z"
        fill={leaf}
      />
      <path
        d="M6 -59 C14 -55 26 -54 32 -64 C44 -70 46 -92 33 -98 C36 -82 28 -68 6 -59 Z"
        fill={P.sageDark}
      />
      <path
        d="M-25 -97 C-20 -107 -8 -111 1 -107 C-9 -105 -18 -101 -25 -97 Z"
        fill={P.sageLight}
      />
    </g>
  );
}

export function Hedge({ tint }: PropProps) {
  const leaf = tint ? P[tint] : P.sage;
  return (
    <g>
      <path
        d="M-62 0 L-61 -18 C-62 -30 -48 -36 -40 -30 C-36 -40 -20 -42 -14 -33 C-8 -42 8 -42 13 -33 C19 -41 35 -40 38 -30 C47 -36 62 -29 61 -17 L62 0 Z"
        fill={leaf}
      />
      <path
        d="M-62 0 L-61.5 -9 C-40 -5 -10 -8 18 -6 C34 -5 50 -8 61.6 -10 L62 0 Z"
        fill={P.sageDark}
      />
    </g>
  );
}

export function Slide({ tint }: PropProps) {
  const chute = tint ? P[tint] : P.tomato;
  return (
    <g>
      {/* ladder rails and rungs */}
      <path d="M-53 0 L-50 -84 L-46 -84 L-48.5 0 Z" fill={P.ink} />
      <path d="M-33 0 L-31 -84 L-27 -84 L-28.5 0 Z" fill={P.ink} />
      <path
        d="M-50 -16 H-30 V-12.5 H-50 Z M-50 -34 H-30 V-30.5 H-50 Z M-50 -52 H-30 V-48.5 H-50 Z M-50 -70 H-30 V-66.5 H-50 Z"
        fill={P.ink2}
      />
      {/* platform and roof */}
      <path d="M-56 -86 L-20 -86 L-20 -80 L-56 -80 Z" fill={P.kraft} />
      <path d="M-58 -86 L-39 -113 L-19 -86 Z" fill={P.mustard} />
      <path d="M-39 -113 L-19 -86 L-39 -86 Z" fill={P.mustardDark} />
      {/* chute with its folded edge */}
      <path
        d="M-22 -86 L-12 -87 C11 -61 30 -20 66 -13 L67 -3 C25 -5 4 -45 -22 -76 Z"
        fill={chute}
      />
      <path
        d="M-22 -76 C4 -45 25 -5 67 -3 L67 2 C22 2 1 -39 -22 -69 Z"
        fill={P.tomatoDark}
      />
      <path d="M60 2 L62 -10 L66 -10 L64 2 Z" fill={P.ink} />
    </g>
  );
}

export function Swing({ tint }: PropProps) {
  const seat = tint ? P[tint] : P.mustard;
  return (
    <g>
      <path d="M-58 0 L-50 -102 L-45 -102 L-52 0 Z" fill={P.ink} />
      <path d="M58 0 L50 -102 L45 -102 L52 0 Z" fill={P.ink} />
      <path d="M-56 -100 L56 -103 L56 -97 L-56 -94 Z" fill={P.kraftDark} />
      {/* two seats on ropes */}
      <path
        d="M-30 -96 L-29 -34 L-27.5 -34 L-28.5 -96 Z M-6 -97 L-7 -34 L-5.5 -34 L-4.5 -97 Z"
        fill={P.ink2}
      />
      <path d="M-33 -35 L-3 -35 L-4 -29 L-32 -29 Z" fill={seat} />
      <path
        d="M10 -97 L12 -40 L13.5 -40 L11.5 -97 Z M34 -98 L32 -40 L33.5 -40 L35.5 -98 Z"
        fill={P.ink2}
      />
      <path d="M9 -41 L37 -41 L36 -35 L10 -35 Z" fill={P.teal} />
      <path
        d="M-32 -29 L-4 -29 L-5 -27 L-31 -27 Z M10 -35 L36 -35 L35.4 -33 L10.6 -33 Z"
        fill={P.ink}
        opacity={0.35}
      />
    </g>
  );
}

export function Bench({ tint }: PropProps) {
  const wood = tint ? P[tint] : P.kraft;
  return (
    <g>
      <path
        d="M-38 0 L-36 -24 L-32 -24 L-33 0 Z M33 0 L32 -24 L36 -24 L38 0 Z"
        fill={P.ink}
      />
      <path d="M-44 -26 L44 -27 L45 -21 L-44 -20 Z" fill={wood} />
      <path d="M-44 -20 L45 -21 L44 -18 L-43 -17 Z" fill={P.kraftDark} />
      <path
        d="M-42 -46 L42 -48 L42 -41 L-42 -39 Z M-42 -36 L42 -37.5 L42 -31 L-42 -30 Z"
        fill={wood}
      />
      <path
        d="M-36 -30 L-35 -50 L-32 -50 L-33 -26 Z M32 -26 L32 -50 L35 -50 L36 -30 Z"
        fill={P.ink}
      />
    </g>
  );
}

export function Backpack({ tint }: PropProps) {
  const bag = tint ? P[tint] : P.teal;
  return (
    <g>
      <path
        d="M-13 0 C-15 -12 -14 -24 -9 -30 C-4 -34 4 -34 9 -30 C14 -24 15 -12 13 0 Z"
        fill={bag}
      />
      <path
        d="M-12 -18 C-6 -22 6 -22 12 -18 C13 -24 10 -30 0 -31 C-10 -30 -13 -24 -12 -18 Z"
        fill={P.tealDark}
      />
      <path d="M-7 -2 L-7 -10 C-3 -12 3 -12 7 -10 L7 -2 Z" fill={P.tealLight} />
      <path
        d="M-4 -33 C-4 -39 4 -39 4 -33 L2.5 -33 C2.5 -37 -2.5 -37 -2.5 -33 Z"
        fill={P.ink}
      />
    </g>
  );
}

export function House({ tint }: PropProps) {
  const wall = tint ? P[tint] : P.cream;
  return (
    <g>
      <path d="M-46 0 L-46 -62 L46 -62 L46 0 Z" fill={wall} />
      <path d="M-54 -60 L0 -104 L54 -60 Z" fill={P.plum} />
      <path d="M0 -104 L54 -60 L0 -60 Z" fill={P.plumDark} />
      <path
        d="M-34 -46 H-12 V-24 H-34 Z M12 -46 H34 V-24 H12 Z"
        fill={P.mustardLight}
      />
      <path
        d="M-24 -46 H-22 V-24 H-24 Z M22 -46 H24 V-24 H22 Z M-34 -36 H-12 V-34 H-34 Z M12 -36 H34 V-34 H12 Z"
        fill={P.plumDark}
      />
      <path d="M-8 0 L-8 -30 L8 -30 L8 0 Z" fill={P.plum} />
    </g>
  );
}

export function Car({ tint }: PropProps) {
  const body = tint ? P[tint] : P.teal;
  return (
    <g>
      <path
        d="M-76 -14 L-74 -34 C-70 -38 -58 -40 -48 -40 L-34 -60 C-30 -64 22 -64 30 -60 L48 -40 C62 -40 74 -36 76 -28 L77 -14 Z"
        fill={body}
      />
      <path d="M-76 -14 L77 -14 L76 -20 L-75 -22 Z" fill={body} />
      <path
        d="M-30 -42 L-21 -57 L-3 -57 L-3 -42 Z M3 -42 L3 -57 L24 -57 L37 -42 Z"
        fill={P.skyLight}
      />
      {/* Rear opening receives the separate car-seat cutout. The door opens
          toward the left wing; only its outward edge has a folded facet. */}
      <path d="M-28 -48 L-4 -48 L-4 -18 L-28 -18 Z" fill={P.ink} />
      <path d="M-44 -44 L-31 -51 L-29 -18 L-44 -12 Z" fill={body} />
      <path d="M-44 -44 L-41 -45.6 L-41 -13.2 L-44 -12 Z" fill={P.tealDark} />
      <path
        d="M-52 -10 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 Z M30 -10 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 Z"
        fill={P.ink}
      />
      <path
        d="M-45 -10 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z M37 -10 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z"
        fill={P.skyLight}
      />
    </g>
  );
}

export function Fence({ tint }: PropProps) {
  const wood = tint ? P[tint] : P.sheet;
  const pickets = Array.from({ length: 9 }, (_, i) => {
    const x = -64 + i * 16;
    return `M${x} 0 L${x} -30 L${x + 4.5} -36 L${x + 9} -30 L${x + 9} 0 Z`;
  }).join(" ");
  return (
    <g>
      <path
        d="M-66 -24 L66 -25 L66 -19 L-66 -18 Z M-66 -10 L66 -11 L66 -5 L-66 -4 Z"
        fill={P.ruleDark}
      />
      <path d={pickets} fill={wood} />
    </g>
  );
}
