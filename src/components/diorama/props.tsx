/*
 * Playground pieces for the miniature. Each is a rounded solid: gradient body,
 * a rim highlight that only shows in warm light (class "rim"), and its own
 * base. Cast shadows are not drawn here; the ground plane casts them.
 */
import { useId } from "react";
import { PAPER } from "@/components/stage/palette";
import { Ball, Tube, tone } from "./shade";

const useIds = (...names: string[]) => {
  const base = useId().replace(/[:«»]/g, "");
  return Object.fromEntries(names.map((n) => [n, `${base}${n}`])) as Record<
    string,
    string
  >;
};

export function Tree({ hue = PAPER.sage }: { hue?: string }) {
  const id = useIds("leaf", "leaf2", "trunk");
  return (
    <svg viewBox="0 0 240 320" width="100%" height="100%" aria-hidden>
      <defs>
        <Ball id={id.leaf} color={hue} />
        <Ball id={id.leaf2} color={tone(hue, -0.12)} cx="30%" cy="25%" />
        <Tube id={id.trunk} color={PAPER.kraftDark} />
      </defs>
      <path
        d="M108 318 C110 270 112 230 106 190 L134 190 C128 232 130 272 134 318 Z"
        fill={`url(#${id.trunk})`}
      />
      <circle cx="72" cy="168" r="62" fill={`url(#${id.leaf2})`} />
      <circle cx="170" cy="160" r="66" fill={`url(#${id.leaf2})`} />
      <circle cx="122" cy="98" r="84" fill={`url(#${id.leaf})`} />
      <circle cx="126" cy="186" r="58" fill={`url(#${id.leaf})`} />
      <path
        className="rim"
        d="M52 120 C60 70 100 30 140 22"
        stroke={PAPER.mustardLight}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}

export function Hills() {
  const id = useIds("far", "near");
  return (
    <svg
      viewBox="0 0 1000 220"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={id.far} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone(PAPER.sageLight, 0.1)} />
          <stop offset="1" stopColor={PAPER.sage} />
        </linearGradient>
        <linearGradient id={id.near} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAPER.sage} />
          <stop offset="1" stopColor={PAPER.sageDark} />
        </linearGradient>
      </defs>
      <path
        d="M0 120 C120 40 230 60 330 100 C430 30 560 20 660 90 C760 40 880 50 1000 100 L1000 220 L0 220 Z"
        fill={`url(#${id.far})`}
      />
      <path
        d="M0 170 C150 110 300 120 430 160 C560 110 760 100 1000 150 L1000 220 L0 220 Z"
        fill={`url(#${id.near})`}
      />
    </svg>
  );
}

export function Slide() {
  const id = useIds("chute", "rail", "deck", "post", "ladder");
  return (
    <svg viewBox="0 0 360 300" width="100%" height="100%" aria-hidden>
      <defs>
        <Tube id={id.post} color={PAPER.teal} />
        <Tube id={id.rail} color={PAPER.mustard} />
        <linearGradient id={id.chute} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={tone(PAPER.tomato, 0.35)} />
          <stop offset="0.4" stopColor={PAPER.tomato} />
          <stop offset="1" stopColor={tone(PAPER.tomato, -0.4)} />
        </linearGradient>
        <linearGradient id={id.deck} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone(PAPER.kraft, 0.25)} />
          <stop offset="1" stopColor={tone(PAPER.kraft, -0.3)} />
        </linearGradient>
      </defs>
      {/* ladder */}
      <rect
        x="44"
        y="96"
        width="14"
        height="204"
        rx="7"
        fill={`url(#${id.post})`}
      />
      <rect
        x="104"
        y="96"
        width="14"
        height="204"
        rx="7"
        fill={`url(#${id.post})`}
      />
      {[130, 168, 206, 244, 282].map((y) => (
        <rect
          key={y}
          x="52"
          y={y}
          width="58"
          height="9"
          rx="4.5"
          fill={`url(#${id.rail})`}
        />
      ))}
      {/* platform */}
      <rect
        x="36"
        y="82"
        width="132"
        height="22"
        rx="8"
        fill={`url(#${id.deck})`}
      />
      <rect
        x="156"
        y="96"
        width="14"
        height="204"
        rx="7"
        fill={`url(#${id.post})`}
      />
      <path
        d="M40 82 C40 40 160 40 164 82"
        stroke={`url(#${id.rail})`}
        strokeWidth="11"
        fill="none"
        strokeLinecap="round"
      />
      {/* chute: a rounded trough curling to the ground */}
      <path
        d="M150 88 C200 96 236 150 270 222 C284 252 304 272 350 276 L352 300 C296 300 262 280 244 244 C214 182 186 124 142 112 Z"
        fill={`url(#${id.chute})`}
      />
      <path
        d="M150 90 C200 98 236 152 270 224 C284 254 304 274 350 278"
        stroke={tone(PAPER.tomato, 0.55)}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        className="rim"
        d="M46 84 C60 52 140 48 160 80"
        stroke={PAPER.mustardLight}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Swing() {
  const id = useIds("pole", "seat", "top");
  return (
    <svg viewBox="0 0 320 300" width="100%" height="100%" aria-hidden>
      <defs>
        <Tube id={id.pole} color={PAPER.plum} />
        <Tube id={id.top} color={PAPER.plum} vertical />
        <Tube id={id.seat} color={PAPER.mustard} vertical />
      </defs>
      <path d="M40 300 L92 22 L106 22 L58 300 Z" fill={`url(#${id.pole})`} />
      <path d="M118 300 L100 22 L112 22 L134 300 Z" fill={`url(#${id.pole})`} />
      <path d="M200 300 L222 22 L234 22 L216 300 Z" fill={`url(#${id.pole})`} />
      <path d="M278 300 L226 22 L240 22 L294 300 Z" fill={`url(#${id.pole})`} />
      <rect
        x="80"
        y="12"
        width="176"
        height="20"
        rx="10"
        fill={`url(#${id.top})`}
      />
      <g className="swing-seat">
        <path
          d="M144 30 L144 214 M196 30 L196 214"
          stroke={PAPER.ink2}
          strokeWidth="3"
        />
        <rect
          x="132"
          y="208"
          width="76"
          height="16"
          rx="8"
          fill={`url(#${id.seat})`}
        />
      </g>
      <path
        className="rim"
        d="M96 26 L50 290"
        stroke={PAPER.mustardLight}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

export function Bench() {
  const id = useIds("wood", "leg");
  return (
    <svg viewBox="0 0 300 150" width="100%" height="100%" aria-hidden>
      <defs>
        <Tube id={id.wood} color={PAPER.kraft} vertical />
        <Tube id={id.leg} color={PAPER.storm} />
      </defs>
      <rect
        x="40"
        y="70"
        width="16"
        height="80"
        rx="6"
        fill={`url(#${id.leg})`}
      />
      <rect
        x="244"
        y="70"
        width="16"
        height="80"
        rx="6"
        fill={`url(#${id.leg})`}
      />
      <rect
        x="14"
        y="14"
        width="272"
        height="26"
        rx="12"
        fill={`url(#${id.wood})`}
      />
      <rect
        x="10"
        y="62"
        width="280"
        height="28"
        rx="12"
        fill={`url(#${id.wood})`}
      />
      <rect
        className="rim"
        x="24"
        y="16"
        width="200"
        height="5"
        rx="2.5"
        fill={PAPER.mustardLight}
      />
    </svg>
  );
}

export function Bush({ hue = PAPER.sageDark }: { hue?: string }) {
  const id = useIds("a", "b");
  return (
    <svg viewBox="0 0 260 160" width="100%" height="100%" aria-hidden>
      <defs>
        <Ball id={id.a} color={hue} />
        <Ball id={id.b} color={tone(hue, 0.08)} />
      </defs>
      <circle cx="70" cy="104" r="58" fill={`url(#${id.a})`} />
      <circle cx="190" cy="100" r="62" fill={`url(#${id.a})`} />
      <circle cx="130" cy="76" r="74" fill={`url(#${id.b})`} />
      <rect
        x="20"
        y="120"
        width="220"
        height="40"
        rx="20"
        fill={tone(hue, -0.3)}
      />
    </svg>
  );
}

export function Backpack() {
  const id = useIds("bag", "pocket");
  return (
    <svg viewBox="0 0 120 130" width="100%" height="100%" aria-hidden>
      <defs>
        <Ball id={id.bag} color={PAPER.teal} cx="30%" cy="22%" />
        <Ball id={id.pocket} color={PAPER.mustard} />
      </defs>
      <path
        d="M40 22 C40 4 80 4 80 22"
        stroke={PAPER.tealDark}
        strokeWidth="7"
        fill="none"
      />
      <rect
        x="14"
        y="18"
        width="92"
        height="110"
        rx="36"
        fill={`url(#${id.bag})`}
      />
      <rect
        x="30"
        y="72"
        width="60"
        height="44"
        rx="18"
        fill={`url(#${id.pocket})`}
      />
    </svg>
  );
}

export function Cloud({ dark }: { dark: number }) {
  const id = useIds("light", "dark");
  return (
    <svg viewBox="0 0 320 150" width="100%" height="100%" aria-hidden>
      <defs>
        <Ball id={id.light} color="#F6F1E6" cx="40%" cy="20%" />
        <Ball id={id.dark} color={PAPER.storm} cx="40%" cy="15%" />
      </defs>
      {(["light", "dark"] as const).map((k) => (
        <g
          key={k}
          style={{
            opacity: k === "dark" ? dark : 1,
            transition: "opacity 900ms cubic-bezier(0.2, 0.7, 0.2, 1)",
          }}
        >
          <ellipse cx="160" cy="112" rx="132" ry="30" fill={`url(#${id[k]})`} />
          <circle cx="66" cy="104" r="40" fill={`url(#${id[k]})`} />
          <circle cx="122" cy="78" r="54" fill={`url(#${id[k]})`} />
          <circle cx="196" cy="66" r="60" fill={`url(#${id[k]})`} />
          <circle cx="258" cy="98" r="44" fill={`url(#${id[k]})`} />
        </g>
      ))}
    </svg>
  );
}
