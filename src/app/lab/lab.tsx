"use client";

import { useState } from "react";
import type { PublicScene } from "@/engine/types";
import { Diorama } from "@/components/diorama/diorama";
import { PaperStage } from "@/components/stage/paper-stage";
import { kidMood, trendOf } from "@/components/stage/mood";
import styles from "./lab.module.css";

export type LabStyle = "diorama" | "paper";

const STYLE_NAMES: Record<LabStyle, string> = {
  diorama: "Living Diorama",
  paper: "Paper Theatre (shipping)",
};

/** The child's feet at 70% of the frame on a phone, 64% on a laptop (the dock floats over the bottom). */
const ANCHOR: [number, number] = [0.7, 0.64];

type Initial = {
  style: LabStyle;
  storm: number;
  connection: number;
  delta: number;
};

export function Lab({
  scene,
  initial,
  shot,
}: {
  scene: PublicScene;
  initial: Initial;
  shot: boolean;
}) {
  const [style, setStyle] = useState<LabStyle>(initial.style);
  const [storm, setStorm] = useState(initial.storm);
  const [connection, setConnection] = useState(initial.connection);
  const [delta, setDelta] = useState(initial.delta);
  const state = { arousal: storm, connection, lastDelta: delta, turn: 1 };
  const line =
    storm >= 80 ? scene.openingLine.toUpperCase() : scene.openingLine;
  const trend = trendOf(delta);
  const pose = kidMood(state).pose;

  return (
    <div
      className={styles.root}
      data-shot={shot ? "" : undefined}
      data-style={style}
    >
      {!shot && (
        <form
          className={styles.controls}
          onSubmit={(e) => e.preventDefault()}
          aria-label="Lab controls"
        >
          <fieldset className={styles.styles}>
            <legend>Style</legend>
            {(Object.keys(STYLE_NAMES) as LabStyle[]).map((s) => (
              <label key={s}>
                <input
                  type="radio"
                  name="style"
                  checked={style === s}
                  onChange={() => setStyle(s)}
                />{" "}
                {STYLE_NAMES[s]}
              </label>
            ))}
          </fieldset>
          <label>
            Storm <output>{storm}</output>
            <input
              type="range"
              min={0}
              max={100}
              value={storm}
              onChange={(e) => setStorm(Number(e.target.value))}
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
          <label>
            Last change
            <input
              type="number"
              min={-50}
              max={50}
              value={delta}
              onChange={(e) => setDelta(Number(e.target.value))}
            />
          </label>
          <p className={styles.note}>
            Lab only. Pose: {pose}. Screenshot URL:{" "}
            <code>
              /lab?style={style}&amp;storm={storm}&amp;shot=1
            </code>
          </p>
        </form>
      )}

      {style === "diorama" ? (
        <div className={styles.play}>
          <Diorama
            scene={scene}
            state={state}
            seed="lab"
            className={styles.stage}
            anchor={ANCHOR}
          >
            <div className={styles.hud}>
              <p className={styles.kicker}>
                Take 1<span className={styles.long}> · {scene.title}</span>
              </p>
              <p className={styles.storm}>
                <span className={styles.stormLabel}>Storm</span>
                <span className={styles.stormValue} data-testid="arousal-value">
                  {storm}
                </span>
                <span className={styles.trend} data-trend={trend}>
                  {trend}
                </span>
              </p>
              <div
                className={styles.thread}
                aria-label={`Connection ${connection}`}
              >
                <span>Connection</span>
                <span className={styles.threadBar}>
                  <span style={{ transform: `scaleX(${connection / 100})` }} />
                </span>
                <span>{connection}</span>
              </div>
            </div>
            <figure className={styles.bubble}>
              <blockquote
                className={styles.line}
                data-loud={storm >= 80 ? "" : undefined}
              >
                {line}
              </blockquote>
              <figcaption className={styles.action}>
                {scene.childName} {scene.openingAction}
              </figcaption>
            </figure>
          </Diorama>
          <div className={styles.dock}>
            <label htmlFor="lab-reply">What do you say?</label>
            <div className={styles.dockRow}>
              <textarea
                id="lab-reply"
                rows={2}
                maxLength={300}
                placeholder="Type what you would say to Zoe"
              />
              <button type="button" disabled title="Replies are off in the lab">
                Send reply
              </button>
            </div>
            <p className={styles.dockNote}>
              Lab preview. Replies are off here.
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.paper}>
          <PaperStage
            scene={scene}
            state={state}
            outcome="ongoing"
            curtain="open"
            seed="lab"
            bubble={{ line, action: scene.openingAction }}
          />
        </div>
      )}
    </div>
  );
}
