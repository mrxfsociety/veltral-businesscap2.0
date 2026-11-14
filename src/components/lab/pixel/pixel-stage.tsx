"use client";

/*
 * Pixel (lab): a 16-bit stage. Takes exactly the props PaperStage takes and
 * reads mood from the shared stageMood and kidMood. The scene is drawn into
 * a 192×144 canvas of palette indices and scaled by a whole number of device
 * pixels with image-rendering: pixelated. A 10 fps ticker steps everything.
 */
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { describeStage, kidMood, stageMood } from "@/components/stage/mood";
import type { PaperStageProps } from "@/components/stage/paper-stage";
import { pixelFont } from "./font";
import { PALETTE } from "./palette";
import { H, W, renderPixelFrame } from "./scene";
import styles from "./pixel.module.css";

const FPS = 10;
/** Characters typed per tick: 20 a second, stepped with the scene. */
const TYPE_PER_TICK = 2;

const RGB = PALETTE.map((hex) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)),
);

const REDUCE = "(prefers-reduced-motion: reduce)";
function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const q = window.matchMedia(REDUCE);
      q.addEventListener("change", onChange);
      return () => q.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCE).matches,
    () => false,
  );
}

/** Whole-number scale in device pixels, so every logical pixel is k×k device pixels. */
function useIntegerScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ k: 1, dpr: 1, offset: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = el.getBoundingClientRect().width * dpr;
      const k = Math.max(1, Math.floor(width / W));
      const offset = Math.floor((width - k * W) / 2) / dpr;
      setFit({ k, dpr, offset });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, ...fit };
}

export function PixelStage({
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
  const reduced = useReducedMotion();
  const still = size === "thumb" || reduced;
  const input = {
    ...state,
    outcome: outcome === "intro" ? undefined : outcome,
  };
  const mood = stageMood(input);
  const kid = kidMood(input);
  const { ref, k, dpr, offset } = useIntegerScale();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (still) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000 / FPS);
    return () => window.clearInterval(id);
  }, [still]);

  // Draw: palette indices → RGBA, one logical pixel per canvas pixel.
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const indices = renderPixelFrame({ mood, kid, tick, seed, still });
    const image = ctx.createImageData(W, H);
    for (let i = 0; i < indices.length; i++) {
      const [r, g, b] = RGB[indices[i]] ?? RGB[0];
      image.data[i * 4] = r;
      image.data[i * 4 + 1] = g;
      image.data[i * 4 + 2] = b;
      image.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  });

  const u = k / dpr;
  const vars = {
    "--u": `${u}px`,
    "--stage-w": `${(k * W) / dpr}px`,
    "--stage-h": `${(k * H) / dpr}px`,
    "--offset": `${offset}px`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={`${styles.root} ${pixelFont.variable} ${className ?? ""}`}
      style={vars}
      data-size={size}
    >
      <div className={styles.screen}>
        <canvas
          ref={canvas}
          width={W}
          height={H}
          className={styles.canvas}
          aria-hidden
        />
        {curtain !== "open" && <div className={styles.off} aria-hidden />}
        {hud && <div className={styles.hud}>{hud}</div>}
        <div className={styles.overlay}>{children}</div>
        <p className={styles.srOnly}>{describeStage(input, scene.childName)}</p>
      </div>
      {bubble && curtain === "open" && size !== "thumb" && (
        <Dialogue
          key={bubble.line}
          name={scene.childName}
          line={bubble.line}
          action={bubble.action}
          tick={tick}
          instant={still}
          onRevealed={onBubbleRevealed}
        />
      )}
    </div>
  );
}

/** The child's line in a pixel-bordered box, typed out letter by letter. */
function Dialogue({
  name,
  line,
  action,
  tick,
  instant,
  onRevealed,
}: {
  name: string;
  line: string;
  action?: string;
  tick: number;
  instant: boolean;
  onRevealed?: () => void;
}) {
  const [start] = useState(tick);
  const typed = instant
    ? line.length
    : Math.min(line.length, (tick - start) * TYPE_PER_TICK);
  const done = typed >= line.length;
  const told = useRef(false);
  useEffect(() => {
    if (done && !told.current) {
      told.current = true;
      onRevealed?.();
    }
  }, [done, onRevealed]);
  return (
    <figure className={styles.dialogue}>
      <figcaption className={styles.speaker}>{name}</figcaption>
      <blockquote className={styles.line}>
        <span aria-hidden>{line.slice(0, typed)}</span>
        {done && !instant && <span className={styles.caret} aria-hidden />}
        <span className={styles.srOnly}>{line}</span>
      </blockquote>
      {action && done && <p className={styles.action}>{action}</p>}
    </figure>
  );
}
