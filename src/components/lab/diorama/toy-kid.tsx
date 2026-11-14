/*
 * The child as a rounded toy figure: big head, simple limbs, every part a
 * shaded solid. Pose and face come from the shared `kidMood`, so the toy and
 * the paper doll always agree about what the engine state means.
 */
import { useId, type CSSProperties } from "react";
import type { KidFace, KidMood, KidPose } from "@/components/stage/mood";
import { PAPER } from "@/components/stage/palette";
import type { KidLook } from "@/components/stage/kids";
import { Ball, Tube, tone } from "./shade";
import styles from "./diorama.module.css";

type Joint = {
  armL: number;
  armR: number;
  legL: number;
  legR: number;
  head: number;
  headY: number;
  bodyY: number;
  lean: number;
  turn: number;
};

const POSES: Record<KidPose, Joint> = {
  open: {
    armL: 38,
    armR: -38,
    legL: 4,
    legR: -4,
    head: 5,
    headY: 0,
    bodyY: 0,
    lean: 3,
    turn: 1,
  },
  loose: {
    armL: 8,
    armR: -8,
    legL: 2,
    legR: -2,
    head: -3,
    headY: 0,
    bodyY: 0,
    lean: 0,
    turn: 1,
  },
  headDown: {
    armL: 3,
    armR: -3,
    legL: 1,
    legR: -1,
    head: 0,
    headY: 12,
    bodyY: 4,
    lean: 0,
    turn: 1,
  },
  crossed: {
    armL: -72,
    armR: 72,
    legL: 3,
    legR: -3,
    head: -8,
    headY: 0,
    bodyY: 0,
    lean: -3,
    turn: 0.9,
  },
  stomp: {
    armL: 150,
    armR: -150,
    legL: -6,
    legR: 18,
    head: 0,
    headY: -2,
    bodyY: -6,
    lean: 0,
    turn: 1,
  },
  floor: {
    armL: 132,
    armR: -128,
    legL: 74,
    legR: -74,
    head: -10,
    headY: -4,
    bodyY: 52,
    lean: -4,
    turn: 1,
  },
  holding: {
    armL: -38,
    armR: 38,
    legL: 2,
    legR: -2,
    head: 8,
    headY: 0,
    bodyY: 0,
    lean: 2,
    turn: 0.9,
  },
};

const ROT = (deg: number, ox: number, oy: number): CSSProperties => ({
  transform: `rotate(${deg}deg)`,
  transformOrigin: `${ox}px ${oy}px`,
  transformBox: "view-box",
});

function Face({ face, shown }: { face: KidFace; shown: boolean }) {
  const ink = PAPER.ink;
  const eye = (x: number, look = 0) => (
    <g key={x}>
      <ellipse cx={x} cy={92 + look} rx="7.5" ry="9.5" fill={ink} />
      <circle cx={x - 2.5} cy={88 + look} r="2.8" fill="#FFF8EC" />
    </g>
  );
  const shut = (x: number, dir: 1 | -1) => (
    <path
      key={x}
      d={`M${x - 9} ${88} L${x + 6 * dir} ${93} L${x - 9} ${98}`}
      transform={
        dir === -1 ? `translate(${2 * x - 3} 0) scale(-1 1)` : undefined
      }
      stroke={ink}
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
  const parts: Record<KidFace, React.ReactNode> = {
    smile: (
      <>
        {eye(78)}
        {eye(122)}
        <path
          d="M86 116 Q100 130 114 116"
          stroke={ink}
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
    pleased: (
      <>
        <path
          d="M70 94 Q78 84 86 94 M114 94 Q122 84 130 94"
          stroke={ink}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M90 116 Q104 124 114 112"
          stroke={ink}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
    flat: (
      <>
        {eye(78, -4)}
        {eye(122, -4)}
        <path
          d="M89 119 L111 119"
          stroke={ink}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </>
    ),
    wobble: (
      <>
        {eye(78, 2)}
        {eye(122, 2)}
        <path
          d="M66 76 L86 80 M134 76 L114 80"
          stroke={ink}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M86 122 Q91 116 96 122 T106 122 T116 122"
          stroke={ink}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
    pout: (
      <>
        <path
          d="M70 92 Q78 86 86 92 L86 96 Q78 100 70 96 Z M114 92 Q122 86 130 92 L130 96 Q122 100 114 96 Z"
          fill={ink}
        />
        <path
          d="M66 80 L88 86 M134 80 L112 86"
          stroke={ink}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M91 124 Q100 116 109 124"
          stroke={ink}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
    shout: (
      <>
        <path d="M70 90 L86 94 L70 98 Z M130 90 L114 94 L130 98 Z" fill={ink} />
        <path
          d="M64 78 L90 88 M136 78 L110 88"
          stroke={ink}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <ellipse
          cx="100"
          cy="122"
          rx="15"
          ry="12"
          fill={tone(PAPER.tomato, -0.55)}
        />
        <ellipse cx="100" cy="128" rx="8" ry="4" fill={PAPER.blushDark} />
      </>
    ),
    wail: (
      <>
        {shut(78, 1)}
        {shut(122, -1)}
        <path
          d="M64 80 L88 86 M136 80 L112 86"
          stroke={ink}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <ellipse
          cx="100"
          cy="124"
          rx="20"
          ry="16"
          fill={tone(PAPER.tomato, -0.55)}
        />
        <ellipse cx="100" cy="132" rx="10" ry="5" fill={PAPER.blushDark} />
      </>
    ),
  };
  return (
    <g className={styles.fade} style={{ opacity: shown ? 1 : 0 }}>
      {parts[face]}
    </g>
  );
}

const FACES: KidFace[] = [
  "smile",
  "pleased",
  "flat",
  "wobble",
  "pout",
  "shout",
  "wail",
];

export function ToyKid({
  look,
  mood,
  reduced,
}: {
  look: KidLook;
  mood: KidMood;
  reduced: boolean;
}) {
  const base = useId().replace(/[:«»]/g, "");
  const g = (n: string) => `${base}${n}`;
  const skin = PAPER[look.skin];
  const hair = PAPER[look.hair];
  const top = PAPER[look.top];
  const bottom = PAPER[look.bottom];
  const trim = PAPER[look.trim];
  const p = POSES[mood.pose];
  const away = mood.facing === "away";
  const loop = reduced ? undefined : styles[`loop_${mood.pose}`];
  const shakeStyle = {
    "--shake": `${mood.shake * 1.6}px`,
  } as CSSProperties;

  return (
    <svg
      viewBox="0 0 200 270"
      width="100%"
      height="100%"
      overflow="visible"
      aria-hidden
    >
      <defs>
        <Ball id={g("skin")} color={skin} cx="36%" cy="30%" />
        <Ball id={g("hair")} color={hair} cx="34%" cy="18%" />
        <Ball id={g("top")} color={top} cx="32%" cy="24%" />
        <Tube id={g("limb")} color={skin} />
        <Tube id={g("leg")} color={bottom} />
        <Ball id={g("shoe")} color={PAPER.ink} cx="30%" cy="20%" />
        <Ball id={g("toy")} color={PAPER.mustard} />
        <radialGradient id={g("cheek")}>
          <stop offset="0" stopColor={PAPER.tomato} stopOpacity="0.55" />
          <stop offset="1" stopColor={PAPER.tomato} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g
        className={styles.spring}
        style={{
          transform: `scaleX(${p.turn}) rotate(${p.lean}deg)`,
          transformOrigin: "100px 262px",
          transformBox: "view-box",
        }}
      >
        <g className={loop} style={shakeStyle}>
          {/* legs */}
          {(
            [
              ["L", 84, p.legL],
              ["R", 116, p.legR],
            ] as const
          ).map(([k, x, deg]) => (
            <g
              key={k}
              className={styles.spring}
              style={{ ...ROT(deg, x, 196), translate: `0 ${p.bodyY}px` }}
            >
              <g
                className={reduced ? undefined : styles[`kick${k}`]}
                data-on={mood.pose === "floor" ? "" : undefined}
                style={{
                  transformOrigin: `${x}px 196px`,
                  transformBox: "view-box",
                }}
              >
                <rect
                  x={x - 14}
                  y="190"
                  width="28"
                  height="56"
                  rx="13"
                  fill={`url(#${g("leg")})`}
                />
                <ellipse
                  cx={x + (k === "L" ? -3 : 3)}
                  cy="250"
                  rx="19"
                  ry="12"
                  fill={`url(#${g("shoe")})`}
                />
              </g>
            </g>
          ))}
          <g className={styles.spring} style={{ translate: `0 ${p.bodyY}px` }}>
            {/* body */}
            <g
              className={reduced ? undefined : styles.breathe}
              style={{
                transformOrigin: "100px 210px",
                transformBox: "view-box",
              }}
            >
              <path
                d="M58 168 C58 136 76 124 100 124 C124 124 142 136 142 168 L144 196 C144 210 130 214 100 214 C70 214 56 210 56 196 Z"
                fill={`url(#${g("top")})`}
              />
              <path
                d="M60 184 C80 192 120 192 140 184"
                stroke={trim}
                strokeWidth="7"
                fill="none"
                strokeLinecap="round"
                opacity="0.9"
              />
              <path
                className="rim"
                d="M66 150 C70 136 82 128 96 127"
                stroke="#FFE2A8"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
            </g>
            {mood.pose === "holding" && (
              <circle cx="100" cy="176" r="21" fill={`url(#${g("toy")})`} />
            )}
            {/* arms */}
            {(
              [
                ["L", 66, p.armL],
                ["R", 134, p.armR],
              ] as const
            ).map(([k, x, deg]) => (
              <g key={k} className={styles.spring} style={ROT(deg, x, 140)}>
                <g
                  className={reduced ? undefined : styles[`flail${k}`]}
                  data-on={
                    mood.pose === "floor" || mood.pose === "stomp"
                      ? ""
                      : undefined
                  }
                  style={{
                    transformOrigin: `${x}px 140px`,
                    transformBox: "view-box",
                  }}
                >
                  <rect
                    x={x - 10}
                    y="134"
                    width="20"
                    height="50"
                    rx="10"
                    fill={`url(#${g("top")})`}
                  />
                  <circle cx={x} cy="188" r="12" fill={`url(#${g("skin")})`} />
                </g>
              </g>
            ))}
            {/* head */}
            <g
              className={styles.spring}
              style={{ ...ROT(p.head, 100, 128), translate: `0 ${p.headY}px` }}
            >
              <circle cx="100" cy="88" r="60" fill={`url(#${g("skin")})`} />
              <circle
                cx="72"
                cy="112"
                r="15"
                fill={`url(#${g("cheek")})`}
                style={{ opacity: 0.35 + 0.65 * mood.flush }}
                className={styles.fade}
              />
              <circle
                cx="128"
                cy="112"
                r="15"
                fill={`url(#${g("cheek")})`}
                style={{ opacity: 0.35 + 0.65 * mood.flush }}
                className={styles.fade}
              />
              {FACES.map((f) => (
                <Face key={f} face={f} shown={!away && f === mood.face} />
              ))}
              {/* hair: buns and a rounded cap; from behind it covers the face */}
              <circle cx="52" cy="44" r="22" fill={`url(#${g("hair")})`} />
              <circle cx="148" cy="44" r="22" fill={`url(#${g("hair")})`} />
              <path
                d="M40 88 C36 40 66 24 100 24 C134 24 164 40 160 88 C150 66 128 56 100 58 C72 56 50 66 40 88 Z"
                fill={`url(#${g("hair")})`}
              />
              <circle
                cx="100"
                cy="88"
                r="60.5"
                fill={`url(#${g("hair")})`}
                className={styles.fade}
                style={{ opacity: away ? 1 : 0 }}
              />
              <path
                className="rim"
                d="M48 64 C58 40 78 30 98 28"
                stroke="#FFE2A8"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                opacity="0.7"
              />
              {/* tears */}
              {mood.tears > 0 && !away && !reduced && (
                <g
                  className={styles.tears}
                  style={
                    {
                      "--tear-s": `${(1 / mood.tears).toFixed(2)}s`,
                    } as CSSProperties
                  }
                >
                  <ellipse
                    cx="70"
                    cy="104"
                    rx="4"
                    ry="6"
                    fill={PAPER.skyLight}
                  />
                  <ellipse
                    cx="130"
                    cy="104"
                    rx="4"
                    ry="6"
                    fill={PAPER.skyLight}
                  />
                </g>
              )}
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
