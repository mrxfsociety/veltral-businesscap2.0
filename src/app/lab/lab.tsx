"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicScene } from "@/engine/types";
import type { ChildLine } from "@/engine/lines";
import {
  PaperStage,
  type PaperStageProps,
} from "@/components/stage/paper-stage";
import { HeadsUp } from "@/components/play/heads-up";
import { Stamp } from "@/components/paper/primitives";
import { trendOf } from "@/components/stage/mood";
import { PixelStage } from "@/components/lab/pixel/pixel-stage";
import { PixelHud } from "@/components/lab/pixel/hud";
import { PixelStamps, type LabStamp } from "@/components/lab/pixel/stamps";
import { DioramaStage } from "@/components/lab/diorama/diorama";
import { DioramaHud, DioramaStamps } from "@/components/lab/diorama/hud";
import styles from "./lab.module.css";

export type LabStyle = "paper" | "pixel" | "diorama";
export type DemoLines = Record<"opening" | "rise" | "good" | "calm", ChildLine>;
type LineKey = keyof DemoLines;

const TABS: { id: LabStyle; label: string }[] = [
  { id: "paper", label: "Paper" },
  { id: "pixel", label: "Pixel" },
  { id: "diorama", label: "Diorama" },
];

type Initial = {
  style: LabStyle;
  storm: number;
  connection: number;
  delta: number;
  line: LineKey;
  stamps: boolean;
  outcome: "ongoing" | "calm_limit_held";
};

export function Lab({
  scene,
  lines,
  goodStamps,
  initial,
  shot,
}: {
  scene: PublicScene;
  lines: DemoLines;
  goodStamps: LabStamp[];
  initial: Initial;
  shot: boolean;
}) {
  const [style, setStyle] = useState<LabStyle>(initial.style);
  const [storm, setStorm] = useState(initial.storm);
  const [connection, setConnection] = useState(initial.connection);
  const [delta, setDelta] = useState(initial.delta);
  const [outcome, setOutcome] = useState(initial.outcome);
  const [line, setLine] = useState<LineKey>(initial.line);
  const [stampCount, setStampCount] = useState(
    initial.stamps ? goodStamps.length : 0,
  );
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => clear, []);
  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const reset = (to: number) => {
    clear();
    setOutcome("ongoing");
    setStampCount(0);
    setStorm(to);
    setDelta(0);
    setLine("opening");
  };

  /** The fixed demonstration: the same numbers every time, through the same mood functions. */
  const stormRises = () => {
    reset(75);
    later(700, () => {
      setStorm(89);
      setDelta(14);
      setLine("rise");
    });
  };
  const goodReply = () => {
    reset(75);
    goodStamps.forEach((_, i) =>
      later(500 + i * 380, () => setStampCount(i + 1)),
    );
    later(500 + goodStamps.length * 380 + 300, () => {
      setStorm(57);
      setDelta(-18);
      setLine("good");
    });
  };
  const calmEnding = () => {
    clear();
    setStampCount(0);
    setDelta(Math.min(-1, 20 - storm));
    setStorm(20);
    setOutcome("calm_limit_held");
    setLine("calm");
  };

  const state = { arousal: storm, connection, lastDelta: delta, turn: 1 };
  const trend = trendOf(delta);
  const shown = stampCount > 0 ? goodStamps.slice(0, stampCount) : [];
  const common: Omit<PaperStageProps, "hud" | "children"> = {
    scene,
    state,
    outcome,
    curtain: "open",
    seed: "lab",
    bubble: lines[line],
  };

  return (
    <div className={styles.root} data-shot={shot ? "" : undefined}>
      <div className={styles.tabs} role="tablist" aria-label="Art style">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={style === t.id}
            aria-controls="lab-stage"
            className={styles.tab}
            onClick={() => setStyle(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        id="lab-stage"
        role="tabpanel"
        aria-labelledby={`tab-${style}`}
        className={styles.stage}
        data-style={style}
      >
        {style === "paper" && (
          <PaperStage
            {...common}
            hud={
              <HeadsUp
                take={1}
                turn={1}
                maxTurns={8}
                shownStorm={storm}
                storm={storm}
                trend={trend}
                delta={null}
                connection={connection}
                shownConnection={connection}
              />
            }
          >
            {shown.length > 0 && (
              <div className={styles.paperStamps}>
                {shown.map((s) => (
                  <Stamp key={s.label} kind={s.kind}>
                    {s.label}
                  </Stamp>
                ))}
              </div>
            )}
          </PaperStage>
        )}
        {style === "pixel" && (
          <PixelStage
            {...common}
            hud={
              <PixelHud storm={storm} trend={trend} connection={connection} />
            }
          >
            <PixelStamps stamps={shown} />
          </PixelStage>
        )}
        {style === "diorama" && (
          <DioramaStage
            {...common}
            hud={
              <DioramaHud storm={storm} trend={trend} connection={connection} />
            }
          >
            <DioramaStamps stamps={shown} />
          </DioramaStage>
        )}
      </div>

      {!shot && (
        <form
          className={styles.controls}
          onSubmit={(e) => e.preventDefault()}
          aria-label="Lab controls"
        >
          <label>
            Storm <output>{storm}</output>
            <input
              type="range"
              min={0}
              max={100}
              value={storm}
              onChange={(e) => {
                clear();
                const v = Number(e.target.value);
                setDelta(v - storm);
                setStorm(v);
                setOutcome("ongoing");
              }}
            />
          </label>
          <label>
            Connection <output>{connection}</output>
            <input
              type="range"
              min={0}
              max={100}
              value={connection}
              onChange={(e) => setConnection(Number(e.target.value))}
            />
          </label>
          <div className={styles.demo}>
            <button type="button" onClick={stormRises}>
              Storm rises
            </button>
            <button type="button" onClick={goodReply}>
              A good reply
            </button>
            <button type="button" onClick={calmEnding}>
              Calm ending
            </button>
          </div>
          <p className={styles.note}>
            Style test, not the product. Lines come from the engine&apos;s
            templates; numbers are the fixed demonstration or the sliders.
          </p>
        </form>
      )}
    </div>
  );
}
