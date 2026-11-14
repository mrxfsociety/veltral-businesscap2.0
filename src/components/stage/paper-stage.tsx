"use client";

import { motion, useReducedMotion, useSpring } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { bodyFor } from "./kids";
import {
  describeStage,
  kidMood,
  stageMood,
  type KidMood,
  type StageMood,
} from "./mood";
import { PAPER as P } from "./palette";
import { PaperKid } from "./paper-kid";
import { PROPS } from "./props";
import { setFor } from "./sets";
import { SpeechBubble } from "./speech-bubble";
import type {
  Placement,
  SceneSet,
  StageOutcome,
  StageScene,
  StageState,
} from "./types";
import {
  CloudsPlane,
  Confetti,
  lightningPeriod,
  RainPlane,
  SkyPlane,
} from "./weather";
import styles from "./stage.module.css";

export type CurtainState = "closed" | "open" | "falling";

const HINGE = { type: "spring", stiffness: 260, damping: 22 } as const;
const STRING = { type: "spring", stiffness: 120, damping: 8 } as const;

/** Where the child stands for each stance, in viewBox units. */
const STANCE = {
  front: { x: 204, y: 290, s: 1.12 },
  mid: { x: 196, y: 276, s: 1 },
  wing: { x: 132, y: 266, s: 0.88 },
} as const;

export function kidPlacement(kid: KidMood) {
  const base = STANCE[kid.stance];
  return kid.pose === "open"
    ? { x: base.x, y: base.y + 4, s: base.s + 0.03 }
    : base;
}

/** Top of the child's head in viewBox units, for placing the speech bubble. */
export function headTopFor(scene: Pick<StageScene, "ageBand">, kid: KidMood) {
  const body = bodyFor(scene.ageBand);
  const place = kidPlacement(kid);
  const standing = body.legL + body.torsoH + body.headR * 1.9 + 3;
  const sit = kid.pose === "floor" ? body.legL - 7 : 0;
  return place.y - (standing - sit) * place.s;
}

function SetPieces({ placements }: { placements: Placement[] }) {
  return (
    <>
      {placements.map((piece, i) => {
        const Prop = PROPS[piece.prop];
        const s = piece.scale ?? 1;
        return (
          <g
            key={`${piece.prop}-${i}`}
            transform={`translate(${piece.x} ${piece.y}) scale(${piece.flip ? -s : s} ${s})`}
          >
            <Prop tint={piece.tint} />
          </g>
        );
      })}
    </>
  );
}

function wrapSign(text: string, width = 15) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) current = word;
    else if ((current + " " + word).length <= width) current += " " + word;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

/** The limit on a paper sign on a stick. It falls flat when the parent gives in. */
function LimitSign({
  set,
  limit,
  down,
  still,
}: {
  set: SceneSet;
  limit: string;
  down: boolean;
  still: boolean;
}) {
  const reduce = useReducedMotion();
  const lines = wrapSign(limit);
  const w = 78;
  const h = 14 + lines.length * 10.5;
  const { x, y } = set.sign;
  const top = y - 40 - h;
  return (
    <motion.g
      initial={false}
      animate={{ rotate: down ? 84 : 0 }}
      transition={still || reduce ? { duration: 0 } : STRING}
      style={{ originX: 0.5, originY: 1 }}
    >
      <path
        d={`M${x - 1.8} ${y} L${x - 1.2} ${top + h - 2} L${x + 1.8} ${top + h - 2} L${x + 2.2} ${y} Z`}
        fill={P.kraftDark}
      />
      <path
        d={`M${x - w / 2} ${top + 1} L${x + w / 2 - 1} ${top} L${x + w / 2} ${top + h} L${x - w / 2 + 1} ${top + h + 0.8} Z`}
        fill={P.sheet}
        stroke={P.ink}
        strokeWidth={1.1}
      />
      <path
        d={`M${x - w / 2 + 1} ${top + h + 0.8} L${x + w / 2} ${top + h} L${x + w / 2} ${top + h + 2.6} L${x - w / 2 + 1} ${top + h + 3.4} Z`}
        fill={P.ink}
        opacity={0.18}
      />
      <text
        x={x}
        y={top + 13.5}
        textAnchor="middle"
        className={styles.signText}
        fill={P.ink}
      >
        {lines.map((line, i) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : 10.5}>
            {line}
          </tspan>
        ))}
      </text>
    </motion.g>
  );
}

/** Places the child on springs: stance follows connection. */
function KidPlacer({
  kid,
  still,
  children,
}: {
  kid: KidMood;
  still: boolean;
  children: ReactNode;
}) {
  const ref = useRef<SVGGElement>(null);
  const reduce = useReducedMotion();
  const target = kidPlacement(kid);
  const x = useSpring(target.x, { stiffness: 140, damping: 20 });
  const y = useSpring(target.y, { stiffness: 140, damping: 20 });
  const s = useSpring(target.s, { stiffness: 140, damping: 20 });
  useEffect(() => {
    if (still || reduce) {
      x.jump(target.x);
      y.jump(target.y);
      s.jump(target.s);
    } else {
      x.set(target.x);
      y.set(target.y);
      s.set(target.s);
    }
  }, [target.x, target.y, target.s, still, reduce, x, y, s]);
  useEffect(() => {
    const write = () =>
      ref.current?.setAttribute(
        "transform",
        `translate(${x.get().toFixed(2)} ${y.get().toFixed(2)}) scale(${s.get().toFixed(3)})`,
      );
    write();
    const stops = [
      x.on("change", write),
      y.on("change", write),
      s.on("change", write),
    ];
    return () => stops.forEach((stop) => stop());
  }, [x, y, s]);
  return (
    <g
      ref={ref}
      transform={`translate(${target.x} ${target.y}) scale(${target.s})`}
    >
      {children}
    </g>
  );
}

function Plane({
  depth,
  order,
  standing,
  still,
  shadow = true,
  children,
}: {
  depth: number;
  order: number;
  standing: boolean;
  still: boolean;
  shadow?: boolean;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const inner = (
    <svg
      className={styles.svg}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMax slice"
      data-shadow={shadow || undefined}
    >
      {children}
    </svg>
  );
  return (
    <div className={styles.plane} style={{ "--depth": depth } as CSSProperties}>
      {still ? (
        inner
      ) : (
        <motion.div
          className={styles.hinge}
          initial={false}
          animate={
            standing
              ? { rotateX: 0, opacity: 1 }
              : { rotateX: reduce ? 0 : 82, opacity: reduce ? 0 : 1 }
          }
          transition={
            reduce
              ? { duration: 0.15 }
              : { ...HINGE, delay: standing ? 0.18 + order * 0.08 : 0 }
          }
        >
          {inner}
        </motion.div>
      )}
    </div>
  );
}

export type PaperStageProps = {
  scene: StageScene;
  /** Engine state. Every visual on the stage is a function of this. */
  state: StageState;
  outcome?: StageOutcome;
  set?: SceneSet;
  curtain?: CurtainState;
  /** "thumb": static, no weather animation, no parallax, no curtains. */
  size?: "full" | "thumb";
  /** Seeds anything that looks random (session id + turn index). */
  seed?: string;
  /** The child's current line, shown in a paper bubble. */
  bubble?: { line: string; action?: string } | null;
  onBubbleRevealed?: () => void;
  /** Content for the proscenium's top band (the heads-up strip). */
  hud?: ReactNode;
  /** HTML overlay on the stage (slip, stamps, ledger). Real, accessible text. */
  children?: ReactNode;
  /** The stage is squeezed (phone keyboard open). */
  compact?: boolean;
  className?: string;
};

export function PaperStage({
  scene,
  state,
  outcome = "ongoing",
  set,
  curtain = "open",
  size = "full",
  seed,
  bubble,
  onBubbleRevealed,
  hud,
  children,
  compact,
  className,
}: PaperStageProps) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const still = size === "thumb";
  const sceneSet = set ?? setFor(scene);
  const input = { ...state, outcome };
  const mood: StageMood = stageMood(input);
  const kid = kidMood(input);
  const standing = still || curtain !== "closed";
  const stageSeed = seed ?? scene.id;
  const flash = lightningPeriod(stageSeed);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (still || reduce || event.pointerType !== "mouse") return;
      const el = rootRef.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const px = ((event.clientX - box.left) / box.width) * 2 - 1;
      const py = ((event.clientY - box.top) / box.height) * 2 - 1;
      el.style.setProperty("--px", px.toFixed(3));
      el.style.setProperty("--py", py.toFixed(3));
    },
    [still, reduce],
  );
  const onPointerLeave = useCallback(() => {
    rootRef.current?.style.setProperty("--px", "0");
    rootRef.current?.style.setProperty("--py", "0");
  }, []);

  return (
    <div
      ref={rootRef}
      className={[styles.stage, className].filter(Boolean).join(" ")}
      data-size={size}
      data-compact={compact || undefined}
      data-muted={mood.muted || undefined}
      data-outcome={outcome}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={
        {
          "--sway": mood.sway,
          "--tint": mood.tint,
          "--flash-s": `${flash.toFixed(2)}s`,
        } as CSSProperties
      }
    >
      {hud && <div className={styles.hud}>{hud}</div>}
      <div className={styles.viewport}>
        <div className={styles.world} aria-hidden="true">
          <Plane
            depth={0}
            order={0}
            standing={standing}
            still={still}
            shadow={false}
          >
            <SkyPlane set={sceneSet} mood={mood} still={still} />
          </Plane>
          <Plane depth={0.25} order={1} standing={standing} still={still}>
            <SetPieces placements={sceneSet.far} />
          </Plane>
          <Plane
            depth={0.4}
            order={2}
            standing={standing}
            still={still}
            shadow={false}
          >
            <CloudsPlane mood={mood} seed={stageSeed} still={still} />
          </Plane>
          <Plane depth={0.5} order={3} standing={standing} still={still}>
            <SetPieces placements={sceneSet.mid} />
            <LimitSign
              set={sceneSet}
              limit={scene.limit}
              down={mood.signDown}
              still={still}
            />
          </Plane>
          <Plane
            depth={0.7}
            order={4}
            standing={standing}
            still={still}
            shadow={false}
          >
            <KidPlacer kid={kid} still={still}>
              <PaperKid sceneId={scene.id} ageBand={scene.ageBand} mood={kid} />
            </KidPlacer>
          </Plane>
          <Plane depth={1} order={5} standing={standing} still={still}>
            <SetPieces placements={sceneSet.front} />
          </Plane>
          <Plane
            depth={1}
            order={6}
            standing={standing}
            still={still}
            shadow={false}
          >
            <RainPlane mood={mood} seed={stageSeed} still={still} />
            {mood.confetti && !still && !reduce && (
              <Confetti seed={stageSeed} />
            )}
          </Plane>
          <div className={styles.tint} />
          {mood.lightning && !still && <div className={styles.flash} />}
        </div>
        {!still && (
          <div
            className={styles.curtains}
            data-state={curtain}
            aria-hidden="true"
          >
            <div className={styles.curtainLeft} />
            <div className={styles.curtainRight} />
            <div className={styles.curtainDrop} />
          </div>
        )}
        <div className={styles.valance} aria-hidden="true" />
        <div className={styles.overlay}>
          {bubble && !still && curtain === "open" && (
            <SpeechBubble
              line={bubble.line}
              action={bubble.action}
              arousal={state.arousal}
              anchorX={kidPlacement(kid).x}
              headTop={headTopFor(scene, kid)}
              compact={compact}
              onRevealed={onBubbleRevealed}
            />
          )}
          {children}
        </div>
      </div>
      {!still && (
        <p className="sr-only">{describeStage(input, scene.childName)}</p>
      )}
    </div>
  );
}
