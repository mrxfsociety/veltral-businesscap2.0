"use client";

import { useState } from "react";
import type { Outcome, PublicScene } from "@/engine/types";
import { PaperStage, type CurtainState } from "@/components/stage/paper-stage";

export function StageLab({ scenes }: { scenes: PublicScene[] }) {
  const [sceneId, setSceneId] = useState("playground-leave");
  const [arousal, setArousal] = useState(75);
  const [connection, setConnection] = useState(50);
  const [lastDelta, setLastDelta] = useState(4);
  const [outcome, setOutcome] = useState<Outcome>("ongoing");
  const [curtain, setCurtain] = useState<CurtainState>("open");
  const scene = scenes.find((s) => s.id === sceneId) ?? scenes[0];
  const state = { arousal, connection, lastDelta, turn: 1 };
  return (
    <div className="stack" style={{ padding: 16 }}>
      <div className="row">
        <label>
          Scene{" "}
          <select value={sceneId} onChange={(e) => setSceneId(e.target.value)}>
            {scenes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id}
              </option>
            ))}
          </select>
        </label>
        <label>
          Storm {arousal}{" "}
          <input
            type="range"
            min={0}
            max={100}
            value={arousal}
            onChange={(e) => setArousal(Number(e.target.value))}
          />
        </label>
        <label>
          Connection {connection}{" "}
          <input
            type="range"
            min={0}
            max={100}
            value={connection}
            onChange={(e) => setConnection(Number(e.target.value))}
          />
        </label>
        <label>
          Delta{" "}
          <input
            type="number"
            value={lastDelta}
            onChange={(e) => setLastDelta(Number(e.target.value))}
            style={{ width: 80 }}
          />
        </label>
        <label>
          Outcome{" "}
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as Outcome)}
          >
            {[
              "ongoing",
              "calm_limit_held",
              "calm_gave_in",
              "out_of_turns",
              "stopped_unsafe",
            ].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label>
          Curtain{" "}
          <select
            value={curtain}
            onChange={(e) => setCurtain(e.target.value as CurtainState)}
          >
            {["open", "closed", "falling"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
      </div>
      <PaperStage
        scene={scene}
        state={state}
        outcome={outcome}
        curtain={curtain}
        seed="lab"
        bubble={{
          line:
            arousal >= 80 ? scene.openingLine.toUpperCase() : scene.openingLine,
          action: scene.openingAction,
        }}
      />
      <div className="grid">
        {[20, 50, 85].map((a) => (
          <PaperStage
            key={a}
            size="thumb"
            scene={scene}
            state={{ ...state, arousal: a }}
          />
        ))}
      </div>
    </div>
  );
}
