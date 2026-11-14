"use client";

import { useSpring, useReducedMotion } from "motion/react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { AgeBand } from "@/engine/types";
import { bodyFor, lookFor, type HairStyle, type KidBody } from "./kids";
import type { KidFace, KidMood, KidPose } from "./mood";
import { PAPER as P } from "./palette";
import styles from "./kid.module.css";

/*
 * PaperKid: a jointed paper doll. Head, hair, torso, two arms, two legs, face
 * pieces. Joints rotate on springs; continuous motion (stomp, kick, shake,
 * breath, tears) is CSS on inner groups so the two never fight.
 * Local coordinates: (0, 0) is between the feet, drawn upward.
 */

type Angles = {
  armL: number;
  armR: number;
  legL: number;
  legR: number;
  head: number;
  /** Head drop in units (head down). */
  headDrop: number;
  lean: number;
  /** 0 standing, 1 sitting on the floor. */
  sit: number;
};

/* Arm and leg angles are "outward": 0 hangs straight down, positive swings
   away from the body, negative crosses in front of it. */
const POSES: Record<KidPose, Angles> = {
  floor: {
    armL: 128,
    armR: 142,
    legL: 72,
    legR: 84,
    head: -9,
    headDrop: 0,
    lean: -5,
    sit: 1,
  },
  stomp: {
    armL: 152,
    armR: 146,
    legL: 7,
    legR: 4,
    head: -5,
    headDrop: 0,
    lean: -2,
    sit: 0,
  },
  crossed: {
    armL: -82,
    armR: -78,
    legL: 6,
    legR: 6,
    head: 7,
    headDrop: -1,
    lean: 2,
    sit: 0,
  },
  headDown: {
    armL: 7,
    armR: 7,
    legL: 3,
    legR: 3,
    head: 5,
    headDrop: 4,
    lean: 3,
    sit: 0,
  },
  loose: {
    armL: 10,
    armR: 10,
    legL: 4,
    legR: 4,
    head: 0,
    headDrop: 0,
    lean: 0,
    sit: 0,
  },
  open: {
    armL: 64,
    armR: 64,
    legL: 8,
    legR: 8,
    head: -3,
    headDrop: 0,
    lean: -1,
    sit: 0,
  },
  holding: {
    armL: 12,
    armR: 156,
    legL: 4,
    legR: 5,
    head: -11,
    headDrop: 0,
    lean: -2,
    sit: 0,
  },
};

const SPRING = { stiffness: 260, damping: 22 };

/** A joint that rotates (and optionally slides) on a spring, about a pivot in local units. */
function Joint({
  angle = 0,
  pivot,
  dx = 0,
  dy = 0,
  className,
  children,
}: {
  angle?: number;
  pivot: [number, number];
  dx?: number;
  dy?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<SVGGElement>(null);
  const reduce = useReducedMotion();
  const a = useSpring(angle, SPRING);
  const x = useSpring(dx, SPRING);
  const y = useSpring(dy, SPRING);
  const [px, py] = pivot;
  useEffect(() => {
    if (reduce) {
      a.jump(angle);
      x.jump(dx);
      y.jump(dy);
    } else {
      a.set(angle);
      x.set(dx);
      y.set(dy);
    }
  }, [angle, dx, dy, reduce, a, x, y]);
  useEffect(() => {
    const write = () =>
      ref.current?.setAttribute(
        "transform",
        `translate(${x.get().toFixed(2)} ${y.get().toFixed(2)}) rotate(${a.get().toFixed(2)} ${px} ${py})`,
      );
    write();
    const stops = [
      a.on("change", write),
      x.on("change", write),
      y.on("change", write),
    ];
    return () => stops.forEach((stop) => stop());
  }, [a, x, y, px, py]);
  return (
    <g
      ref={ref}
      className={className}
      transform={`translate(${dx} ${dy}) rotate(${angle} ${px} ${py})`}
    >
      {children}
    </g>
  );
}

function Leg({
  body,
  pants,
  side,
}: {
  body: KidBody;
  pants: string;
  side: -1 | 1;
}) {
  const w = body.legW;
  const L = body.legL;
  // drawn from the hip (0,0) down to the sole (0,L)
  return (
    <g>
      <path
        d={`M${-w / 2} 0 L${w / 2} 0 L${w / 2 - 0.6} ${L - 5} L${-w / 2 + 0.4} ${L - 5} Z`}
        fill={pants}
      />
      <path
        d={`M${-w / 2 - (side < 0 ? 3 : 0.5)} ${L - 6} L${w / 2 + (side > 0 ? 3 : 0.5)} ${L - 6} L${w / 2 + (side > 0 ? 3.5 : 1)} ${L} L${-w / 2 - (side < 0 ? 3.5 : 1)} ${L} Z`}
        fill={P.ink}
      />
    </g>
  );
}

function Arm({
  body,
  sleeve,
  skin,
  holding,
}: {
  body: KidBody;
  sleeve: string;
  skin: string;
  holding?: boolean;
}) {
  const w = body.armW;
  const L = body.armL;
  return (
    <g>
      <path
        d={`M${-w / 2} -1 C${-w / 2} -4 ${w / 2} -4 ${w / 2} -1 L${w / 2 - 0.4} ${L * 0.48} L${-w / 2 + 0.4} ${L * 0.48} Z`}
        fill={sleeve}
      />
      <path
        d={`M${-w / 2 + 0.9} ${L * 0.46} L${w / 2 - 0.9} ${L * 0.46} L${w / 2 - 1.2} ${L - 2} L${-w / 2 + 1.2} ${L - 2} Z`}
        fill={skin}
      />
      <circle cx={0} cy={L - 1} r={w / 2 + 0.6} fill={skin} />
      {holding && (
        <g transform={`translate(0 ${L + 5}) rotate(-12)`}>
          <path d="M-9 -5 L9 -6 L10 5 L-8 6 Z" fill={P.mustard} />
          <path d="M-4 -5.6 L0 -5.8 L0.6 5.6 L-3.4 5.8 Z" fill={P.tomato} />
          <path
            d="M-9 -5 L9 -6 L9.2 -3 L-8.8 -2 Z"
            fill={P.sheet}
            opacity={0.45}
          />
        </g>
      )}
    </g>
  );
}

function hairBack(style: HairStyle, r: number, color: string, away: boolean) {
  const full = (
    <path
      d={`M${-r - 1.5} ${r * 0.35} C${-r - 3} ${-r * 0.6} ${-r * 0.7} ${-r - 3} 0 ${-r - 3} C${r * 0.7} ${-r - 3} ${r + 3} ${-r * 0.6} ${r + 1.5} ${r * 0.35} C${r * 0.6} ${r + 1} ${-r * 0.6} ${r + 1} ${-r - 1.5} ${r * 0.35} Z`}
      fill={color}
    />
  );
  switch (style) {
    case "bob":
      return (
        <path
          d={`M${-r - 3.5} ${r * 0.8} C${-r - 5} ${-r * 0.4} ${-r * 0.9} ${-r - 5} 0 ${-r - 5} C${r * 0.9} ${-r - 5} ${r + 5} ${-r * 0.4} ${r + 3.5} ${r * 0.8} L${r * 0.4} ${r * 0.9} L${-r * 0.4} ${r * 0.9} Z`}
          fill={color}
        />
      );
    case "curly": {
      const bumps = Array.from({ length: 11 }, (_, i) => {
        const a = (Math.PI * (i * 22 - 200)) / 180;
        return (
          <circle
            key={i}
            cx={(r + 1.5) * Math.cos(a)}
            cy={(r + 1.5) * Math.sin(a) - 1}
            r={r * 0.36}
            fill={color}
          />
        );
      });
      return <g>{bumps}</g>;
    }
    case "pony":
      return (
        <g>
          {away && full}
          <path
            d={`M${r * 0.55} ${-r * 0.75} C${r * 1.7} ${-r * 0.9} ${r * 1.9} ${r * 0.2} ${r * 1.35} ${r * 0.85} C${r * 1.25} ${r * 0.2} ${r * 1.0} ${-r * 0.2} ${r * 0.5} ${-r * 0.4} Z`}
            fill={color}
          />
        </g>
      );
    case "buns":
      return (
        <g>
          {away && full}
          <circle cx={-r * 0.78} cy={-r * 0.82} r={r * 0.46} fill={color} />
          <circle cx={r * 0.78} cy={-r * 0.82} r={r * 0.46} fill={color} />
        </g>
      );
    default:
      return away ? full : null;
  }
}

function hairFront(style: HairStyle, r: number, color: string) {
  switch (style) {
    case "spiky":
      return (
        <path
          d={`M${-r - 0.5} ${-r * 0.05} C${-r - 1} ${-r * 0.8} ${-r * 0.6} ${-r - 2} 0 ${-r - 2.5} C${r * 0.6} ${-r - 2} ${r + 1} ${-r * 0.8} ${r + 0.5} ${-r * 0.05} L${r * 0.62} ${-r * 0.5} L${r * 0.42} ${-r * 0.24} L${r * 0.18} ${-r * 0.58} L${-r * 0.08} ${-r * 0.3} L${-r * 0.32} ${-r * 0.6} L${-r * 0.55} ${-r * 0.3} L${-r * 0.78} ${-r * 0.55} Z`}
          fill={color}
        />
      );
    case "curly": {
      return (
        <path
          d={`M${-r - 1} ${-r * 0.05} C${-r - 2} ${-r * 0.9} ${-r * 0.6} ${-r - 2} 0 ${-r - 2} C${r * 0.6} ${-r - 2} ${r + 2} ${-r * 0.9} ${r + 1} ${-r * 0.05} C${r * 0.85} ${-r * 0.45} ${r * 0.55} ${-r * 0.42} ${r * 0.4} ${-r * 0.55} C${r * 0.2} ${-r * 0.3} ${-r * 0.1} ${-r * 0.32} ${-r * 0.22} ${-r * 0.56} C${-r * 0.45} ${-r * 0.32} ${-r * 0.8} ${-r * 0.4} ${-r - 1} ${-r * 0.05} Z`}
          fill={color}
        />
      );
    }
    default:
      return (
        <path
          d={`M${-r - 0.6} ${-r * 0.02} C${-r - 1.2} ${-r * 0.95} ${-r * 0.5} ${-r - 1.6} 0 ${-r - 1.6} C${r * 0.6} ${-r - 1.6} ${r + 1.2} ${-r * 0.95} ${r + 0.6} ${-r * 0.02} C${r * 0.7} ${-r * 0.42} ${r * 0.1} ${-r * 0.62} ${-r * 0.35} ${-r * 0.5} C${-r * 0.55} ${-r * 0.42} ${-r * 0.85} ${-r * 0.3} ${-r - 0.6} ${-r * 0.02} Z`}
          fill={color}
        />
      );
  }
}

const STROKE = {
  stroke: P.ink,
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  fill: "none",
};

function Face({
  face,
  tears,
  flush,
}: {
  face: KidFace;
  tears: number;
  flush: number;
}) {
  const eyes = (() => {
    switch (face) {
      case "wail":
        return (
          <>
            <path d="M-9 -2 L-4 0.4 L-9 2.6" {...STROKE} />
            <path d="M9 -2 L4 0.4 L9 2.6" {...STROKE} />
          </>
        );
      case "pleased":
        return (
          <>
            <path d="M-9 0.5 Q-6 -2.8 -3 0.5" {...STROKE} />
            <path d="M3 0.5 Q6 -2.8 9 0.5" {...STROKE} />
          </>
        );
      case "pout":
        return (
          <>
            <ellipse cx={-6} cy={0.8} rx={2} ry={1.2} fill={P.ink} />
            <ellipse cx={6} cy={0.8} rx={2} ry={1.2} fill={P.ink} />
            <path
              d="M-8.8 -0.6 L-3.4 -0.6 M3.4 -0.6 L8.8 -0.6"
              {...STROKE}
              strokeWidth={1.3}
            />
          </>
        );
      default: {
        const dy = face === "wobble" ? 1.4 : face === "flat" ? -1.3 : 0;
        return (
          <>
            <circle cx={-6} cy={dy} r={1.95} fill={P.ink} />
            <circle cx={6} cy={dy} r={1.95} fill={P.ink} />
            <circle cx={-5.3} cy={dy - 0.7} r={0.6} fill={P.sheet} />
            <circle cx={6.7} cy={dy - 0.7} r={0.6} fill={P.sheet} />
          </>
        );
      }
    }
  })();
  const brows = (() => {
    switch (face) {
      case "shout":
        return (
          <path
            d="M-10 -7.5 L-3.4 -4.6 M10 -7.5 L3.4 -4.6"
            {...STROKE}
            strokeWidth={2}
          />
        );
      case "wail":
      case "wobble":
        return <path d="M-10 -4.6 L-3.6 -7.6 M10 -4.6 L3.6 -7.6" {...STROKE} />;
      case "pout":
        return <path d="M-10 -5.6 L-3.4 -4.2 M10 -5.6 L3.4 -4.2" {...STROKE} />;
      default:
        return (
          <path
            d="M-9.4 -6.4 Q-6.4 -7.6 -3.6 -6.6 M9.4 -6.4 Q6.4 -7.6 3.6 -6.6"
            {...STROKE}
            strokeWidth={1.4}
          />
        );
    }
  })();
  const mouth = (() => {
    switch (face) {
      case "wail":
        return (
          <>
            <ellipse cx={0} cy={9.5} rx={5.4} ry={6} fill={P.ink} />
            <ellipse cx={0} cy={12.6} rx={3.4} ry={2.1} fill={P.tomato} />
          </>
        );
      case "shout":
        return (
          <>
            <path
              d="M-6.2 6 Q0 4.2 6.2 6 L5 12.2 Q0 14 -5 12.2 Z"
              fill={P.ink}
            />
            <path
              d="M-5.2 6.1 Q0 4.9 5.2 6.1 L5 7.6 Q0 6.6 -5 7.6 Z"
              fill={P.sheet}
            />
          </>
        );
      case "pout":
        return (
          <path
            d="M-3.6 9.4 Q0 6.2 3.6 9.4 Q0 11 -3.6 9.4 Z"
            fill={P.tomatoDark}
          />
        );
      case "wobble":
        return <path d="M-5 9.6 Q-2.5 7.6 0 9.6 Q2.5 11.6 5 9.6" {...STROKE} />;
      case "flat":
        return <path d="M-3.6 9.2 L3.6 9.2" {...STROKE} />;
      case "smile":
        return <path d="M-5 7.4 Q0 12.4 5 7.4" {...STROKE} strokeWidth={1.9} />;
      case "pleased":
        return (
          <path d="M-3.4 8.4 Q1 11.6 5.2 7.2" {...STROKE} strokeWidth={1.9} />
        );
    }
  })();
  const tearDrops =
    tears > 0 ? (
      face === "wail" ? (
        <g
          style={
            {
              "--tear-s": `${Math.max(0.55, 2.6 / tears).toFixed(2)}s`,
            } as CSSProperties
          }
        >
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              className={styles.tearFly}
              data-side={i % 2 ? "right" : "left"}
              style={{
                animationDelay: `${(i * Math.max(0.55, 2.6 / tears)) / 4}s`,
              }}
              d={`M${i % 2 ? 9 : -9} 1 q1.6 2.6 0 3.6 q-1.6 -1 0 -3.6 Z`}
              fill={P.skyDark}
            />
          ))}
        </g>
      ) : (
        <path
          className={styles.tearSlide}
          d="M-7.5 3 q1.7 2.8 0 3.9 q-1.7 -1.1 0 -3.9 Z"
          fill={P.skyDark}
        />
      )
    ) : null;
  return (
    <g>
      <ellipse
        cx={-10.4}
        cy={5.6}
        rx={3.6}
        ry={2.3}
        fill={P.tomatoLight}
        opacity={0.18 + flush * 0.62}
      />
      <ellipse
        cx={10.4}
        cy={5.6}
        rx={3.6}
        ry={2.3}
        fill={P.tomatoLight}
        opacity={0.18 + flush * 0.62}
      />
      {eyes}
      {brows}
      {mouth}
      {tearDrops}
    </g>
  );
}

export function PaperKid({
  sceneId,
  ageBand,
  mood,
}: {
  sceneId: string;
  ageBand: AgeBand;
  mood: KidMood;
}) {
  const look = lookFor(sceneId);
  const body = bodyFor(ageBand);
  const pose = POSES[mood.pose];
  const r = body.headR;
  const hipY = -body.legL;
  const shoulderY = hipY - body.torsoH;
  const headY = shoulderY - r * 0.9;
  const hipX = body.torsoBottom / 2 - body.legW / 2 - 0.5;
  const shoulderX = body.torsoTop / 2 - 1.5;
  const sitDrop = pose.sit * (body.legL - 7);
  const away = mood.facing === "away";
  const faceX =
    mood.facing === "side" ? (mood.pose === "crossed" ? -4.5 : 4.5) : 0;
  const skin = P[look.skin];
  const hair = P[look.hair];
  const top = P[look.top];
  const bottom = P[look.bottom];
  const scaleFace = r / 17.5;

  return (
    <g
      className={styles.kid}
      data-pose={mood.pose}
      style={
        {
          "--shake": `${mood.shake.toFixed(2)}px`,
        } as CSSProperties
      }
    >
      {/* contact shadow on the floor */}
      <ellipse
        cx={0}
        cy={-1}
        rx={pose.sit ? 34 : 22}
        ry={4.2}
        fill={P.ink}
        opacity={0.16}
      />
      <g className={styles.shake}>
        {/* legs */}
        <Joint pivot={[-hipX, hipY]} angle={pose.legL} dy={sitDrop}>
          <g className={styles.legLeft}>
            <g transform={`translate(${-hipX} ${hipY})`}>
              <Leg body={body} pants={bottom} side={-1} />
            </g>
          </g>
        </Joint>
        <Joint pivot={[hipX, hipY]} angle={-pose.legR} dy={sitDrop}>
          <g className={styles.legRight}>
            <g transform={`translate(${hipX} ${hipY})`}>
              <Leg body={body} pants={bottom} side={1} />
            </g>
          </g>
        </Joint>
        {/* upper body leans about the hip */}
        <Joint pivot={[0, hipY]} angle={pose.lean} dy={sitDrop}>
          <g className={styles.breath}>
            {/* torso */}
            <path
              d={`M${-body.torsoTop / 2} ${shoulderY} C${-body.torsoTop / 2 + 2} ${shoulderY - 2.5} ${body.torsoTop / 2 - 2} ${shoulderY - 2.5} ${body.torsoTop / 2} ${shoulderY} L${body.torsoBottom / 2} ${hipY + 1} L${-body.torsoBottom / 2} ${hipY + 1.4} Z`}
              fill={top}
            />
            <path
              d={`M${body.torsoTop / 2 - 4} ${shoulderY - 0.6} L${body.torsoTop / 2} ${shoulderY} L${body.torsoBottom / 2} ${hipY + 1} L${body.torsoBottom / 2 - 5} ${hipY + 1.1} Z`}
              fill={P.ink}
              opacity={0.14}
            />
            <path
              d={`M${-body.torsoTop / 2 + 0.8} ${shoulderY + body.torsoH * 0.42} L${body.torsoTop / 2 + 1.2} ${shoulderY + body.torsoH * 0.42} L${body.torsoTop / 2 + 1.6} ${shoulderY + body.torsoH * 0.42 + 3.4} L${-body.torsoTop / 2 + 0.4} ${shoulderY + body.torsoH * 0.42 + 3.4} Z`}
              fill={P[look.trim]}
            />
            <path
              d={`M${-body.torsoBottom / 2} ${hipY + 1.4} L${body.torsoBottom / 2} ${hipY + 1} L${body.torsoBottom / 2 - 0.3} ${hipY + 5} L${-body.torsoBottom / 2 + 0.3} ${hipY + 5.4} Z`}
              fill={bottom}
            />
            {/* head turns about the neck */}
            <Joint pivot={[0, shoulderY]} angle={pose.head} dy={pose.headDrop}>
              <g transform={`translate(0 ${headY})`}>
                <path
                  d={`M-3.4 ${r - 2} L3.4 ${r - 2} L3.8 ${r + 4} L-3.8 ${r + 4} Z`}
                  fill={skin}
                />
                {hairBack(look.hairStyle, r, hair, away)}
                <circle cx={0} cy={0} r={r} fill={skin} />
                {!away && (
                  <>
                    <circle cx={-r + 0.4} cy={2} r={3} fill={skin} />
                    <circle cx={r - 0.4} cy={2} r={3} fill={skin} />
                    <g
                      transform={`translate(${faceX} ${mood.pose === "headDown" ? 2.6 : 0}) scale(${scaleFace.toFixed(3)})`}
                    >
                      <Face
                        face={mood.face}
                        tears={mood.tears}
                        flush={mood.flush}
                      />
                    </g>
                    {hairFront(look.hairStyle, r, hair)}
                  </>
                )}
                {away && (
                  <path
                    d={`M${-r - 1} ${r * 0.3} C${-r - 2} ${-r * 0.8} ${-r * 0.5} ${-r - 2} 0 ${-r - 2} C${r * 0.5} ${-r - 2} ${r + 2} ${-r * 0.8} ${r + 1} ${r * 0.3} C${r * 0.5} ${r * 0.85} ${-r * 0.5} ${r * 0.85} ${-r - 1} ${r * 0.3} Z`}
                    fill={hair}
                  />
                )}
              </g>
            </Joint>
            {/* arms swing about the shoulders */}
            <Joint pivot={[-shoulderX, shoulderY + 2]} angle={pose.armL}>
              <g className={styles.armLeft}>
                <g transform={`translate(${-shoulderX} ${shoulderY + 2})`}>
                  <Arm body={body} sleeve={top} skin={skin} />
                </g>
              </g>
            </Joint>
            <Joint pivot={[shoulderX, shoulderY + 2]} angle={-pose.armR}>
              <g className={styles.armRight}>
                <g transform={`translate(${shoulderX} ${shoulderY + 2})`}>
                  <Arm
                    body={body}
                    sleeve={top}
                    skin={skin}
                    holding={mood.pose === "holding"}
                  />
                </g>
              </g>
            </Joint>
          </g>
        </Joint>
      </g>
    </g>
  );
}
