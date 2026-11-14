"use client";

/*
 * Living Diorama (lab): the scene as a small lit model on a tabletop. Real CSS
 * 3D (a ground plane in perspective, layers at depth), one key light whose
 * colour and angle follow the storm, weather with depth. Presentational only:
 * it renders engine state and never computes an outcome.
 */
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { describeStage, kidMood, seeded } from "@/components/stage/mood";
import { lookFor } from "@/components/stage/kids";
import type { PaperStageProps } from "@/components/stage/paper-stage";
import { DioramaBubble } from "./bubble";
import { dioramaLight, springEasing } from "./light";
import {
  Backpack,
  Bench,
  Bush,
  Cloud,
  Hills,
  Slide,
  Swing,
  Tree,
} from "./props";
import { ToyKid } from "./toy-kid";
import styles from "./diorama.module.css";

/** The model is built in world pixels and scaled to cover its frame. */
const W = 1400;
const H = 800;
const FLOOR = 600;
/** Floor plane: 8000 wide, spanning z from -3600 to +900 (it runs under the camera). */
const FLOOR_W = 8000;
const FLOOR_D = 4500;
const FLOOR_Z0 = -3600;
/** Where the child's feet land on screen (world y at the child's depth). */
const FEET_Y = 612;

/** The child's feet at 70% of the frame on a phone, 66% from 1024px. */
const ANCHOR: [number, number] = [0.7, 0.66];

const SPRING = springEasing(170, 16);
const SPRING_SOFT = springEasing(60, 14);

type Solid = {
  key: string;
  x: number;
  z: number;
  w: number;
  h: number;
  /** Footprint depth for the shadow, world px. */
  d: number;
  blur?: number;
  node: ReactNode;
};

const STANCE = {
  front: { x: 690, z: 170 },
  mid: { x: 700, z: 40 },
  wing: { x: 860, z: -170 },
} as const;

/** Cloud slots, centre first so a phone sees the first ones. */
const CLOUD_SLOTS = [
  { x: 700, y: -330 },
  { x: 140, y: -250 },
  { x: 1250, y: -270 },
  { x: -520, y: -360 },
  { x: 1950, y: -320 },
];

const RAIN_LAYERS = [
  {
    z: -900,
    box: { left: -700, top: -260, width: 2800, height: 1520 },
    blur: 0.6,
    cls: "rainFar",
  },
  {
    z: -150,
    box: { left: -150, top: -60, width: 1700, height: 980 },
    blur: 0,
    cls: "rainMid",
  },
  {
    z: 300,
    box: { left: 80, top: -20, width: 1240, height: 760 },
    blur: 1.4,
    cls: "rainNear",
  },
] as const;

/**
 * Scale the model to its frame: cover the frame, but never show less than
 * 700 world px across (a tall phone frame would otherwise crop the set to the
 * child alone). The child's feet sit at `anchor` of the frame height; the sky
 * and the ground plane run past the model's box to fill the rest.
 */
function useFit(anchor: number | [narrow: number, wide: number]) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 0.5, top: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const scale = Math.min(
        Math.max(r.width / W, r.height / H),
        r.width / 700,
      );
      const a =
        typeof anchor === "number"
          ? anchor
          : r.width >= 1024
            ? anchor[1]
            : anchor[0];
      setFit({ scale, top: r.height * a - FEET_Y * scale });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [anchor]);
  return { ref, fit };
}

/**
 * Living Diorama: takes exactly the props PaperStage takes. Only the
 * playground model exists, so `set` is accepted and not used yet.
 */
export function DioramaStage({
  scene,
  state,
  outcome = "ongoing",
  curtain = "open",
  size = "full",
  seed = "lab",
  bubble,
  onBubbleRevealed,
  hud,
  children,
  className,
}: PaperStageProps) {
  const anchor = ANCHOR;
  const thumb = size === "thumb";
  const reduced = (useReducedMotion() ?? false) || thumb;
  const input = {
    ...state,
    outcome: outcome === "intro" ? undefined : outcome,
  };
  const light = dioramaLight(input);
  const kid = kidMood(input);
  const look = lookFor(scene.id);
  const { ref, fit } = useFit(anchor);

  // Camera: pointer moves it a little; it dollies in as the child calms.
  const yaw = useSpring(0, { stiffness: 50, damping: 16 });
  const pitch = useSpring(0, { stiffness: 50, damping: 16 });
  const dolly = useSpring(light.dolly, { stiffness: 30, damping: 14 });
  useEffect(() => {
    if (reduced) dolly.jump(light.dolly);
    else dolly.set(light.dolly);
  }, [light.dolly, dolly, reduced]);
  const world = useMotionTemplate`translateZ(${dolly}px) rotateX(${pitch}deg) rotateY(${yaw}deg)`;
  const skyShift = useTransform(yaw, (v) => `translateX(${-v * 9}px)`);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    yaw.set(((e.clientX - r.left) / r.width - 0.5) * 5);
    pitch.set(-((e.clientY - r.top) / r.height - 0.5) * 3);
  };
  const onPointerLeave = () => {
    yaw.set(0);
    pitch.set(0);
  };

  const stance = STANCE[kid.stance];
  const solids: Solid[] = [
    { key: "slide", x: 470, z: -420, w: 380, h: 316, d: 140, node: <Slide /> },
    { key: "swing", x: 990, z: -560, w: 340, h: 318, d: 150, node: <Swing /> },
    {
      key: "bench",
      x: 160,
      z: 330,
      w: 330,
      h: 165,
      d: 90,
      blur: 3,
      node: <Bench />,
    },
    {
      key: "pack",
      x: 500,
      z: 420,
      w: 110,
      h: 120,
      d: 60,
      blur: 2.5,
      node: <Backpack />,
    },
    {
      key: "bush",
      x: 1280,
      z: 300,
      w: 300,
      h: 185,
      d: 120,
      blur: 3,
      node: <Bush />,
    },
  ];
  const trees: Solid[] = [
    {
      key: "t1",
      x: 40,
      z: -1300,
      w: 300,
      h: 400,
      d: 120,
      blur: 1.4,
      node: <Tree />,
    },
    {
      key: "t2",
      x: 1360,
      z: -1350,
      w: 320,
      h: 420,
      d: 120,
      blur: 1.4,
      node: <Tree />,
    },
    {
      key: "t3",
      x: -620,
      z: -1500,
      w: 300,
      h: 400,
      d: 120,
      blur: 1.6,
      node: <Tree />,
    },
    {
      key: "t4",
      x: 2050,
      z: -1550,
      w: 300,
      h: 400,
      d: 120,
      blur: 1.6,
      node: <Tree />,
    },
    {
      key: "t5",
      x: 700,
      z: -1900,
      w: 280,
      h: 360,
      d: 110,
      blur: 1.8,
      node: <Tree />,
    },
  ];
  const shadowCasters = [
    ...trees,
    ...solids,
    { key: "kid", x: stance.x, z: stance.z, w: 150, h: 300, d: 70 },
  ];

  const rain = useMemo(() => {
    const rnd = seeded(`${seed}:rain`);
    return RAIN_LAYERS.map((_, layer) =>
      Array.from({ length: 24 }, () => ({
        x: rnd() * 100,
        delay: -rnd() * 2,
        len: 0.7 + rnd() * 0.6,
        layer,
      })),
    );
  }, [seed]);

  const vars = {
    "--warm": light.warmth,
    "--chill": light.chill,
    "--spring": SPRING.easing,
    "--spring-ms": `${SPRING.ms}ms`,
    "--spring-soft": SPRING_SOFT.easing,
    "--spring-soft-ms": `${SPRING_SOFT.ms}ms`,
    "--wind": `${light.wind}deg`,
  } as CSSProperties;

  const floorPos = (x: number, z: number) => ({
    left: x + FLOOR_W / 2 - W / 2,
    top: z - FLOOR_Z0,
  });

  return (
    <div
      ref={ref}
      className={`${styles.frame} ${className ?? ""}`}
      style={vars}
      data-reduced={reduced ? "" : undefined}
      data-size={size}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {/* sky: overcast base, warm evening and storm laid over it */}
      <motion.div
        className={styles.sky}
        style={{ transform: skyShift }}
        aria-hidden
      >
        <div className={styles.skyOvercast} />
        <div
          className={`${styles.skyGolden} ${styles.fade}`}
          style={{ opacity: light.warmth }}
        />
        <div
          className={`${styles.skyStorm} ${styles.fade}`}
          style={{ opacity: light.chill }}
        />
        <div
          className={`${styles.sunTrack} ${styles.springSoft}`}
          style={{ transform: `translateY(${(1 - light.sunHeight) * 42}%)` }}
        >
          <div className={styles.sun} />
        </div>
        {light.lightning && (
          <svg className={styles.bolt} viewBox="0 0 60 160" aria-hidden>
            <path
              d="M34 0 L8 78 L28 78 L14 160 L54 62 L32 62 L46 0 Z"
              fill="#EEF2FF"
            />
          </svg>
        )}
      </motion.div>

      <div
        className={styles.fit}
        style={{
          transform: `translateX(-50%) translateY(${fit.top}px) scale(${fit.scale})`,
        }}
        aria-hidden
      >
        {/*
          The ground is its own 3D context, painted first. Upright pieces never
          intersect it in one context, so the browser never has to split planes
          (which shows as rectangles of ground drawn over the child).
        */}
        <div className={styles.viewport}>
          <motion.div
            className={styles.world}
            style={{ transform: reduced ? undefined : world }}
          >
            <div className={styles.drift}>
              {/* the ground */}
              <div
                className={styles.floor}
                style={{
                  width: FLOOR_W,
                  height: FLOOR_D,
                  left: W / 2 - FLOOR_W / 2,
                  top: FLOOR - FLOOR_D / 2,
                  transform: `translateZ(${FLOOR_Z0 + FLOOR_D / 2}px) rotateX(90deg)`,
                }}
              >
                <div
                  className={styles.sand}
                  style={{ ...floorPos(330, -720), width: 1000, height: 1080 }}
                />
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`${styles.cloudShadow} ${styles.fade}`}
                    style={{
                      ...floorPos(-300 + i * 900, -1500 + i * 520),
                      opacity: light.cloudShadow,
                      animationDelay: `${-i * 13}s`,
                    }}
                  />
                ))}
                {shadowCasters.map((s) => (
                  <div key={s.key}>
                    <div
                      className={styles.contact}
                      style={{
                        ...floorPos(s.x - s.w * 0.45, s.z - s.d * 0.35),
                        width: s.w * 0.9,
                        height: s.d * 0.7,
                      }}
                    />
                    <div
                      className={`${styles.cast} ${styles.springSoft}`}
                      style={{
                        ...floorPos(s.x - s.w * 0.08, s.z - s.d / 2),
                        width: s.w * 0.62,
                        height: s.d,
                        opacity: light.shadowOpacity,
                        transform: `rotate(${light.shadowAngle}deg) scaleX(${light.shadowLength})`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
        <div className={styles.viewport}>
          <motion.div
            className={styles.world}
            style={{ transform: reduced ? undefined : world }}
          >
            <div className={styles.drift}>
              <div
                className={styles.hills}
                style={{ transform: "translateZ(-2800px)" }}
              >
                <Hills />
              </div>

              {trees.map((t) => (
                <Placed key={t.key} s={t} />
              ))}

              {/* clouds overhead, lower and darker as the storm rises */}
              {CLOUD_SLOTS.map((c, i) => (
                <div
                  key={i}
                  className={`${styles.cloud} ${styles.springSoft}`}
                  style={{
                    left: c.x - 380,
                    top: c.y,
                    opacity: i < light.clouds ? 1 : 0,
                    transform: `translateZ(-1500px) translateY(${i < light.clouds ? 150 * light.cloudDark : -260}px)`,
                  }}
                >
                  <div
                    className={styles.cloudDrift}
                    style={{ animationDelay: `${-i * 7}s` }}
                  >
                    <Cloud dark={light.cloudDark} />
                  </div>
                </div>
              ))}

              <RainLayer index={0} light={light} strands={rain[0]} />
              <Mist z={-520} opacity={light.mist * 0.8} delay={0} />

              {solids.slice(0, 2).map((s) => (
                <Placed key={s.key} s={s} />
              ))}
              <RainLayer index={1} light={light} strands={rain[1]} />
              <Mist z={-60} opacity={light.mist} delay={-9} />

              {/* the child: sharp, at the focal depth */}
              <div
                className={`${styles.kid} ${styles.springSoft}`}
                style={{
                  left: 700 - 115,
                  top: FLOOR - 300,
                  transform: `translate3d(${stance.x - 700}px, 0, ${stance.z}px)`,
                }}
              >
                <ToyKid look={look} mood={kid} reduced={reduced} />
              </div>

              {solids.slice(2).map((s) => (
                <Placed key={s.key} s={s} />
              ))}
              <Mist z={260} opacity={light.mist * 0.7} delay={-4} />
              <RainLayer index={2} light={light} strands={rain[2]} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* one key light: warm low gold when calm, cold flat grey-blue in a storm */}
      <div
        className={`${styles.gradeCold} ${styles.fade}`}
        style={{ opacity: light.chill * 0.5 }}
        aria-hidden
      />
      <div
        className={`${styles.gradeDesat} ${styles.fade}`}
        style={{ opacity: light.chill * 0.5 }}
        aria-hidden
      />
      <div
        className={`${styles.gradeWarm} ${styles.fade}`}
        style={{ opacity: light.warmth }}
        aria-hidden
      />
      <div
        className={`${styles.bloom} ${styles.springSoft}`}
        style={{
          opacity: light.warmth * 0.9,
          transform: `scale(${0.82 + 0.18 * light.warmth})`,
        }}
        aria-hidden
      />
      <div className={styles.vignette} aria-hidden />
      {light.lightning && !reduced && (
        <div className={styles.flash} data-flash aria-hidden />
      )}

      {curtain !== "open" && (
        <div className={`${styles.lightsDown} ${styles.fade}`} aria-hidden />
      )}
      <p className={styles.srOnly}>{describeStage(input, scene.childName)}</p>
      {hud && <div className={styles.hud}>{hud}</div>}
      {bubble && curtain === "open" && (
        <DioramaBubble
          key={bubble.line}
          line={bubble.line}
          action={bubble.action}
          onRevealed={onBubbleRevealed}
          instant={reduced}
        />
      )}
      {children}
    </div>
  );
}

function Placed({ s }: { s: Solid }) {
  return (
    <div
      className={styles.solid}
      style={{
        left: s.x - s.w / 2,
        top: FLOOR - s.h,
        width: s.w,
        height: s.h,
        transform: `translateZ(${s.z}px)`,
        filter: s.blur ? `blur(${s.blur}px)` : undefined,
      }}
    >
      {s.node}
    </div>
  );
}

function RainLayer({
  index,
  light,
  strands,
}: {
  index: 0 | 1 | 2;
  light: ReturnType<typeof dioramaLight>;
  strands: { x: number; delay: number; len: number }[];
}) {
  const layer = RAIN_LAYERS[index];
  const count = light.rain[index];
  return (
    <div
      className={`${styles.rain} ${styles[layer.cls]} ${styles.fade}`}
      style={{
        ...layer.box,
        transform: `translateZ(${layer.z}px)`,
        filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
        opacity: count > 0 ? 1 : 0,
      }}
    >
      <div className={styles.rainTilt}>
        {strands.map((s, i) => (
          <div
            key={i}
            className={styles.strandTrack}
            style={{
              left: `${s.x}%`,
              opacity: i < count ? 1 : 0,
              animationDuration: `${light.rainSeconds[index]}s`,
              animationDelay: `${s.delay * light.rainSeconds[index]}s`,
            }}
          >
            <div
              className={styles.strand}
              style={{ transform: `scaleY(${s.len})` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Mist({
  z,
  opacity,
  delay,
}: {
  z: number;
  opacity: number;
  delay: number;
}) {
  return (
    <div
      className={`${styles.mist} ${styles.fade}`}
      style={{ transform: `translateZ(${z}px)`, opacity }}
    >
      <div
        className={styles.mistDrift}
        style={{ animationDelay: `${delay}s` }}
      />
    </div>
  );
}
