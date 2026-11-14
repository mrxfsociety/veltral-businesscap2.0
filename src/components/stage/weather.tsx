"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
import { seeded, type StageMood } from "./mood";
import { PAPER as P, SKY_BY_TIME, type PaperColor } from "./palette";
import type { SceneSet } from "./types";
import styles from "./stage.module.css";

/* Weather on strings. Everything here is drawn in the shared viewBox 0 0 400 300. */

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa
    .map((v, i) =>
      Math.round(v + (pb[i] - v) * t)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

const STRING = { type: "spring", stiffness: 120, damping: 8 } as const;
const RISE = { type: "spring", stiffness: 90, damping: 16 } as const;

/** Sky or wall, the sun or moon on its stick, the floor and its fold line. */
export function SkyPlane({
  set,
  mood,
  still,
}: {
  set: SceneSet;
  mood: StageMood;
  still: boolean;
}) {
  const reduce = useReducedMotion();
  const horizon = set.horizon ?? 232;
  const wallColor = P[set.wall ?? (SKY_BY_TIME[set.timeOfDay] as PaperColor)];
  const night = set.timeOfDay === "night";
  const golden = set.timeOfDay === "golden";
  const sunX = golden ? 318 : night ? 300 : 306;
  const sunUpY = golden ? 132 : night ? 92 : 98;
  const sunDown = golden ? 96 : 190;
  const lift = mood.sunUp ? 0 : sunDown;
  return (
    <>
      <rect
        x={-40}
        y={-80}
        width={480}
        height={horizon + 80}
        fill={wallColor}
      />
      {night && (
        <g className={styles.stars} data-bright={mood.sunUp || undefined}>
          {[
            [60, 70],
            [128, 52],
            [182, 92],
            [236, 60],
            [96, 120],
            [350, 128],
            [30, 150],
          ].map(([x, y], i) => (
            <path
              key={i}
              d={`M${x} ${y - 3.4} L${x + 1} ${y - 1} L${x + 3.4} ${y} L${x + 1} ${y + 1} L${x} ${y + 3.4} L${x - 1} ${y + 1} L${x - 3.4} ${y} L${x - 1} ${y - 1} Z`}
              fill={P.mustardLight}
            />
          ))}
        </g>
      )}
      <motion.g
        initial={false}
        animate={{ y: lift }}
        transition={still || reduce ? { duration: 0 } : RISE}
      >
        <path
          d={`M${sunX - 2} ${sunUpY + 20} L${sunX + 2} ${sunUpY + 20} L${sunX + 2.6} ${horizon + 120} L${sunX - 1.6} ${horizon + 120} Z`}
          fill={P.kraftDark}
        />
        {night ? (
          <path
            d={`M${sunX + 4} ${sunUpY - 22} A22 22 0 1 0 ${sunX + 22} ${sunUpY + 10} A17 17 0 0 1 ${sunX + 4} ${sunUpY - 22} Z`}
            fill={P.mustardLight}
          />
        ) : (
          <>
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * 30 * Math.PI) / 180;
              const r1 = 27;
              const r2 = 35 + (i % 2) * 4;
              const s = 0.12;
              return (
                <path
                  key={i}
                  d={`M${sunX + r1 * Math.cos(a - s)} ${sunUpY + r1 * Math.sin(a - s)} L${sunX + r2 * Math.cos(a)} ${sunUpY + r2 * Math.sin(a)} L${sunX + r1 * Math.cos(a + s)} ${sunUpY + r1 * Math.sin(a + s)} Z`}
                  fill={P.mustard}
                />
              );
            })}
            <circle cx={sunX} cy={sunUpY} r={23} fill={P.mustard} />
            <path
              d={`M${sunX + 6} ${sunUpY - 22} A23 23 0 0 1 ${sunX + 6} ${sunUpY + 22} A26 26 0 0 0 ${sunX + 6} ${sunUpY - 22} Z`}
              fill={P.mustardDark}
            />
          </>
        )}
      </motion.g>
      <path
        d={`M-40 ${horizon} L440 ${horizon} L440 340 L-40 340 Z`}
        fill={P[set.floor]}
      />
      <FloorPattern
        kind={set.floorPattern ?? "none"}
        horizon={horizon}
        floor={set.floor}
      />
      {/* the hinge where the floor folds up into the wall */}
      <path
        d={`M-40 ${horizon} L440 ${horizon}`}
        stroke={P.ruleDark}
        strokeWidth={0.8}
      />
      <path
        d={`M-40 ${horizon} L440 ${horizon} L440 ${horizon + 6} L-40 ${horizon + 6} Z`}
        fill={P.ink}
        opacity={0.07}
      />
    </>
  );
}

function FloorPattern({
  kind,
  horizon,
  floor,
}: {
  kind: NonNullable<SceneSet["floorPattern"]>;
  horizon: number;
  floor: PaperColor;
}) {
  const depth = 300 - horizon;
  if (kind === "grass") {
    const rand = seeded("grass");
    const tufts = Array.from({ length: 34 }, () => {
      const x = rand() * 420 - 10;
      const y = horizon + 8 + rand() * (depth - 4);
      const h = 3 + ((y - horizon) / depth) * 6;
      return `M${x.toFixed(1)} ${y.toFixed(1)} L${(x + 1.6).toFixed(1)} ${(y - h).toFixed(1)} L${(x + 2.8).toFixed(1)} ${y.toFixed(1)} L${(x + 4.4).toFixed(1)} ${(y - h * 0.7).toFixed(1)} L${(x + 5.4).toFixed(1)} ${y.toFixed(1)} Z`;
    }).join(" ");
    return <path d={tufts} fill={P.sageDark} opacity={0.7} />;
  }
  if (kind === "tiles" || kind === "boards") {
    const rows =
      kind === "tiles"
        ? [0.1, 0.24, 0.42, 0.66, 0.96]
        : [0.14, 0.34, 0.6, 0.94];
    const lines = rows
      .map((t) => {
        const y = horizon + depth * t;
        return `M-40 ${y.toFixed(1)} L440 ${y.toFixed(1)}`;
      })
      .join(" ");
    const vx = 200;
    const vy = horizon - 120;
    const columns =
      kind === "tiles"
        ? Array.from({ length: 13 }, (_, i) => -160 + i * 60)
            .map((x) => {
              const top = vx + (x - vx) * ((horizon - vy) / (340 - vy));
              return `M${top.toFixed(1)} ${horizon} L${x} 340`;
            })
            .join(" ")
        : "";
    return (
      <path
        d={`${lines} ${columns}`}
        stroke={floor === "rule" ? P.ruleDark : P.kraftDark}
        strokeWidth={0.9}
        opacity={0.75}
      />
    );
  }
  return null;
}

type Slot = { x: number; y: number; s: number; string: number };
const SLOTS: Slot[] = [
  { x: 96, y: 100, s: 1.12, string: 70 },
  { x: 298, y: 94, s: 1.02, string: 62 },
  { x: 196, y: 80, s: 0.92, string: 48 },
  { x: 40, y: 86, s: 0.86, string: 52 },
  { x: 360, y: 116, s: 0.92, string: 86 },
];

function Cloud({
  slot,
  weight,
  index,
  still,
}: {
  slot: Slot;
  weight: number;
  index: number;
  still: boolean;
}) {
  const reduce = useReducedMotion();
  const body = mix(P.sheet, P.storm, weight);
  const belly = mix(P.creamDark, "#262E42", weight);
  const drop = 34 * weight;
  const { x, s } = slot;
  const y = slot.y + drop;
  return (
    <motion.g
      initial={still || reduce ? false : { y: -190 }}
      animate={{ y: 0 }}
      exit={reduce ? { opacity: 0 } : { y: -210 }}
      transition={
        still || reduce
          ? { duration: 0.15 }
          : { ...STRING, delay: index * 0.06 }
      }
    >
      <g
        className={still ? undefined : styles.pendulum}
        style={{ animationDelay: `${-index * 0.7}s` } as CSSProperties}
      >
        <path
          d={`M${x} ${y - 200} L${x} ${y - 16 * s}`}
          stroke={P.ink}
          strokeWidth={0.7}
          opacity={0.55}
        />
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <path
            d="M-38 10 C-48 10 -52 -2 -44 -8 C-46 -20 -32 -26 -24 -20 C-20 -34 2 -38 10 -26 C20 -32 36 -26 34 -12 C46 -12 50 6 38 10 Z"
            fill={body}
            style={{ transition: "fill 700ms cubic-bezier(.2,.8,.2,1)" }}
          />
          <path
            d="M-40 10 C-30 4 -10 6 0 2 C12 6 28 2 38 10 Z"
            fill={belly}
            style={{ transition: "fill 700ms cubic-bezier(.2,.8,.2,1)" }}
          />
        </g>
      </g>
    </motion.g>
  );
}

export function CloudsPlane({
  mood,
  seed,
  still,
}: {
  mood: StageMood;
  seed: string;
  still: boolean;
}) {
  const rand = seeded(`${seed}:lightning`);
  const period = 3.2 + rand() * 2.2;
  return (
    <>
      <AnimatePresence>
        {SLOTS.slice(0, mood.clouds).map((slot, i) => (
          <Cloud
            key={i}
            slot={slot}
            weight={mood.cloudWeight}
            index={i}
            still={still}
          />
        ))}
      </AnimatePresence>
      {mood.lightning && !still && (
        <path
          className={styles.bolt}
          style={{ animationDuration: `${period.toFixed(2)}s` }}
          d="M218 112 L236 112 L224 140 L242 140 L210 196 L220 152 L204 152 Z"
          fill={P.mustardLight}
          stroke={P.ink}
          strokeWidth={0.8}
        />
      )}
    </>
  );
}

export function lightningPeriod(seed: string) {
  const rand = seeded(`${seed}:lightning`);
  return 3.2 + rand() * 2.2;
}

export function RainPlane({
  mood,
  seed,
  still,
}: {
  mood: StageMood;
  seed: string;
  still: boolean;
}) {
  const rand = seeded(`${seed}:rain`);
  const strands = Array.from({ length: 36 }, () => ({
    x: rand() * 420 - 10,
    y: rand() * 300,
    delay: rand(),
    long: rand() > 0.5,
  })).slice(0, mood.rain);
  return (
    <g
      className={still ? undefined : styles.rain}
      style={{ "--rain-s": `${mood.rainSeconds}s` } as CSSProperties}
    >
      {strands.map((strand, i) => (
        <rect
          key={i}
          x={strand.x}
          y={still ? strand.y : -24}
          width={1.7}
          height={strand.long ? 15 : 10}
          rx={0.8}
          fill={i % 4 === 0 ? P.sheet : P.skyDark}
          transform={`rotate(9 ${strand.x} ${still ? strand.y : -24})`}
          style={
            still
              ? undefined
              : {
                  animationDelay: `${(-strand.delay * mood.rainSeconds).toFixed(2)}s`,
                }
          }
        />
      ))}
    </g>
  );
}

export function Confetti({ seed }: { seed: string }) {
  const rand = seeded(`${seed}:confetti`);
  const colors = [P.mustard, P.tomato, P.teal, P.sky, P.blush, P.sheet];
  return (
    <g className={styles.confetti}>
      {Array.from({ length: 28 }, (_, i) => {
        const x = 20 + rand() * 360;
        const end = 236 + rand() * 60;
        const rot = Math.round(rand() * 540 - 270);
        return (
          <rect
            key={i}
            x={x}
            y={-12}
            width={4 + rand() * 3}
            height={2.4 + rand() * 2}
            fill={colors[i % colors.length]}
            style={
              {
                "--fall": `${end.toFixed(0)}px`,
                "--spin": `${rot}deg`,
                animationDelay: `${(rand() * 0.7).toFixed(2)}s`,
                animationDuration: `${(1.6 + rand() * 0.9).toFixed(2)}s`,
              } as CSSProperties
            }
          />
        );
      })}
    </g>
  );
}
