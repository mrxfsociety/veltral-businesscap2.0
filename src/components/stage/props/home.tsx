import { PAPER as P, type PaperColor } from "../palette";
import type { PropProps } from "./types";

/* Indoor props. Bottom centre at (0, 0), drawn upward. Wall pieces (window,
   frame) are placed by the bottom of their sill. */

function shadedPaper(tint: PaperColor): string {
  const base = tint.replace(/Light$|Dark$/, "");
  const darker = `${base}Dark`;
  return darker in P ? P[darker as PaperColor] : P.ink;
}

export function Window({ tint }: PropProps) {
  const pane = tint ? P[tint] : P.skyLight;
  return (
    <g>
      <path d="M-36 -4 L-36 -86 L36 -86 L36 -4 Z" fill={P.sheet} />
      <path d="M-30 -10 L-30 -80 L30 -80 L30 -10 Z" fill={pane} />
      {tint === "storm" && (
        <path
          d="M22 -74 C9 -77 6 -62 17 -58 C13 -63 15 -70 22 -74 Z"
          fill={P.sheet}
        />
      )}
      <path
        d="M-1.5 -80 H1.5 V-10 H-1.5 Z M-30 -46.5 H30 V-43.5 H-30 Z"
        fill={P.sheet}
      />
      <path d="M-42 -4 L42 -4 L44 0 L-44 0 Z" fill={P.kraft} />
      <path d="M-40 -88 L-24 -88 C-26 -60 -30 -30 -40 -8 Z" fill={P.kraft} />
      <path d="M40 -88 L24 -88 C26 -60 30 -30 40 -8 Z" fill={P.kraftDark} />
    </g>
  );
}

export function PictureFrame({ tint }: PropProps) {
  const art = tint ? P[tint] : P.mustard;
  return (
    <g>
      <path d="M-20 0 L-20 -32 L20 -32 L20 0 Z" fill={P.kraft} />
      <path d="M-16 -4 L-16 -28 L16 -28 L16 -4 Z" fill={P.sheet} />
      {/* The landscape and sun reuse one art paper to keep four colours. */}
      <path d="M-16 -4 L-6 -16 L2 -9 L8 -14 L16 -6 L16 -4 Z" fill={art} />
      <path d="M4 -22 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 Z" fill={art} />
      {/* One folded right edge, entirely within the original frame bounds. */}
      <path d="M16 -31 L20 -32 L20 0 L16 -4 Z" fill={P.kraftDark} />
    </g>
  );
}

export function Sofa({ tint }: PropProps) {
  const cloth = tint ? P[tint] : P.plum;
  return (
    <g>
      <path d="M-70 -6 L-70 -30 L70 -30 L70 -6 Z" fill={cloth} />
      <path
        d="M-62 -30 L-62 -60 C-62 -64 -58 -66 -54 -66 L54 -66 C58 -66 62 -64 62 -60 L62 -30 Z"
        fill={cloth}
      />
      <path
        d="M-58 -30 L-58 -36 L-2 -36 L-2 -30 Z M2 -30 L2 -36 L58 -36 L58 -30 Z"
        fill={P.plumLight}
      />
      <path
        d="M-76 -4 L-76 -40 C-76 -46 -64 -46 -64 -40 L-64 -4 Z"
        fill={cloth}
      />
      {/* Only the right arm turns away from the light; feet are dark material. */}
      <path
        d="M64 -4 L64 -40 C64 -46 76 -46 76 -40 L76 -4 Z"
        fill={P.plumDark}
      />
      <path
        d="M-66 0 L-64 -6 L-58 -6 L-60 0 Z M58 0 L60 -6 L66 -6 L68 0 Z"
        fill={P.plumDark}
      />
      <path d="M-40 -60 L-18 -62 L-16 -40 L-38 -38 Z" fill={P.mustard} />
    </g>
  );
}

export function Lamp({ tint }: PropProps) {
  const shade = tint ? P[tint] : P.mustard;
  return (
    <g>
      <path d="M-12 0 L-10 -4 L10 -4 L12 0 Z" fill={P.ink} />
      <path d="M-1.4 -4 L-1 -96 L1.4 -96 L1.6 -4 Z" fill={P.ink} />
      <path d="M-16 -94 L-10 -122 L10 -122 L16 -94 Z" fill={shade} />
      <path d="M0 -122 L10 -122 L16 -94 L0 -94 Z" fill={P.mustardDark} />
    </g>
  );
}

/** A rug lies flat on the floor: drawn as a foreshortened shape. */
export function Rug({ tint = "tomato" }: PropProps) {
  const cloth = P[tint];
  return (
    <g>
      <path d="M-74 0 L-62 -20 L62 -20 L74 0 Z" fill={cloth} />
      <path d="M-58 -4 L-51 -16 L51 -16 L58 -4 Z" fill={P.mustardLight} />
      <path d="M-44 -8 L-40 -12 L40 -12 L44 -8 Z" fill={cloth} />
      {/* Opaque ornament; the only shade is this matching front-edge fold. */}
      <path d="M-72.2 -3 L72.2 -3 L74 0 L-74 0 Z" fill={shadedPaper(tint)} />
    </g>
  );
}

export function Table({ tint }: PropProps) {
  const wood = tint ? P[tint] : P.kraft;
  return (
    <g>
      <path d="M-56 -46 L56 -46 L58 -40 L-58 -40 Z" fill={wood} />
      <path d="M-58 -40 L58 -40 L57 -36 L-57 -36 Z" fill={P.kraftDark} />
      <path
        d="M-50 0 L-48 -36 L-43 -36 L-44 0 Z M44 0 L43 -36 L48 -36 L50 0 Z"
        fill={P.kraftDark}
      />
      <path
        d="M-22 -46 C-22 -51 -10 -53 -2 -52 C2 -52 4 -48 2 -46 Z"
        fill={P.sheet}
      />
    </g>
  );
}

export function Chair({ tint }: PropProps) {
  const wood = tint ? P[tint] : P.kraftDark;
  return (
    <g>
      <path
        d="M-18 0 L-17 -30 L-13 -30 L-14 0 Z M14 0 L13 -30 L17 -30 L18 0 Z"
        fill={wood}
      />
      <path d="M-20 -32 L20 -32 L20 -27 L-20 -27 Z" fill={P.kraft} />
      {/* One thin underside folds beneath the seat; legs remain dark wood. */}
      <path d="M-20 -29 L20 -29 L20 -27 L-20 -27 Z" fill={P.kraftDark} />
      <path
        d="M-17 -32 L-17 -66 L-12 -66 L-12 -32 Z M12 -32 L12 -66 L17 -66 L17 -32 Z M-17 -64 L17 -64 L17 -56 L-17 -56 Z"
        fill={wood}
      />
    </g>
  );
}

export function Fridge({ tint }: PropProps) {
  const body = tint ? P[tint] : P.sheet;
  return (
    <g>
      <path d="M-26 0 L-26 -124 L26 -124 L26 0 Z" fill={body} />
      <path d="M18 0 L18 -124 L26 -124 L26 0 Z" fill={P.creamDark} />
      <path d="M-26 -78 L26 -78 L26 -75 L-26 -75 Z" fill={P.ink2} />
      <path
        d="M10 -116 L13 -116 L13 -92 L10 -92 Z M10 -68 L13 -68 L13 -44 L10 -44 Z"
        fill={P.ink2}
      />
      <path d="M-16 -110 L-6 -112 L-5 -100 L-15 -98 Z" fill={P.tomato} />
      <path d="M-8 -60 L2 -61 L1.5 -50 L-8.5 -49 Z" fill={P.tomato} />
    </g>
  );
}

export function Bed({ tint }: PropProps) {
  const blanket = tint ? P[tint] : P.teal;
  return (
    <g>
      <path
        d="M-74 0 L-74 -78 C-74 -86 -58 -86 -58 -78 L-58 0 Z"
        fill={P.kraft}
      />
      <path d="M-58 -24 L72 -24 L72 -40 L-58 -40 Z" fill={P.sheet} />
      <path d="M-26 -24 L74 -24 L76 -44 L-24 -46 Z" fill={blanket} />
      <path d="M-26 -24 L74 -24 L74 -18 L-26 -18 Z" fill={P.tealDark} />
      <path d="M-56 -40 C-58 -52 -30 -54 -30 -42 Z" fill={P.sheet} />
      <path
        d="M-58 0 L-58 -18 L74 -18 L74 0 L68 0 L68 -8 L-52 -8 L-52 0 Z"
        fill={P.kraft}
      />
    </g>
  );
}

export function Door({ tint }: PropProps) {
  const wood = tint ? P[tint] : P.kraft;
  return (
    <g>
      <path d="M-32 0 L-32 -128 L32 -128 L32 0 Z" fill={P.sheet} />
      <path d="M-27 0 L-27 -123 L27 -123 L27 0 Z" fill={wood} />
      <path
        d="M-20 -110 L-3 -110 L-3 -70 L-20 -70 Z M3 -110 L20 -110 L20 -70 L3 -70 Z M-20 -58 L20 -58 L20 -14 L-20 -14 Z"
        fill={P.sheet}
      />
      <path d="M14 -64 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 Z" fill={P.mustard} />
      {/* Panels are opaque paper decoration; only the right edge is folded. */}
      <path d="M23 -122 L27 -123 L27 0 L23 -3 Z" fill={P.kraftDark} />
    </g>
  );
}

export function Plant({ tint }: PropProps) {
  const leaf = tint ? P[tint] : P.sage;
  return (
    <g>
      <path d="M-11 0 L-14 -20 L14 -20 L11 0 Z" fill={P.tomato} />
      <path d="M-14 -20 L14 -20 L14 -16 L-14 -16 Z" fill={P.tomatoDark} />
      <path
        d="M0 -20 C-18 -30 -22 -46 -14 -52 C-6 -42 -2 -32 0 -20 Z M0 -20 C10 -34 22 -40 24 -50 C12 -50 4 -38 0 -20 Z M0 -20 C-2 -38 2 -54 6 -60 C10 -48 6 -34 0 -20 Z"
        fill={leaf}
      />
      <path
        d="M0 -20 C10 -34 22 -40 24 -50 C18 -40 10 -32 0 -20 Z"
        fill={P.sageDark}
      />
    </g>
  );
}

export function Bookshelf({ tint }: PropProps) {
  const wood = tint ? P[tint] : P.kraft;
  return (
    <g>
      <path d="M-36 0 L-36 -110 L36 -110 L36 0 Z" fill={wood} />
      {[-104, -70, -36].map((top, r) => (
        <g key={top}>
          <path
            d={`M-31 ${top} L31 ${top} L31 ${top + 30} L-31 ${top + 30} Z`}
            fill={P.cream}
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M${-29 + i * 9} ${top + 30} L${-29 + i * 9} ${top + 8 + ((i + r) % 3) * 4} L${-22 + i * 9} ${top + 8 + ((i + r) % 3) * 4} L${-22 + i * 9} ${top + 30} Z`}
              fill={P.teal}
            />
          ))}
        </g>
      ))}
      {/* Cream bays reveal kraft shelves; teal books leave room for one fold. */}
      <path d="M31 -109 L36 -110 L36 0 L31 -3 Z" fill={P.kraftDark} />
    </g>
  );
}
