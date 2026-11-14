"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  CoachResponse,
  SessionResponse,
  TurnResponse,
} from "@/shared/api";
import { api } from "@/lib/api";
import { isPro } from "@/lib/pro";
import { isPlaybookEligible } from "@/lib/playbook";
import { savePlaybook } from "@/lib/store";
import { buildShareText, copyText } from "@/lib/share";
import { ProGate } from "@/components/pro-gate";
import { TurnCard } from "./turn-card";
import styles from "./play.module.css";

const outcomeTitles = {
  calm_limit_held: "Calm, and the limit held.",
  calm_gave_in: "Quiet, but the limit is gone.",
  out_of_turns: "Still melting down.",
  stopped_unsafe: "Let's pause here.",
  ongoing: "Keep practising.",
};

function Coach({
  sessionId,
  turnIndex,
}: {
  sessionId: string;
  turnIndex: number;
}) {
  const [result, setResult] = useState<CoachResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function ask() {
    if (pending || !isPro()) return;
    setPending(true);
    setError("");
    try {
      setResult(await api.coach({ sessionId, turnIndex }));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Suggestions could not load. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <ProGate feature="Coach suggestions">
      <div className={styles.coach}>
        <button
          className="button-secondary"
          disabled={pending}
          onClick={() => void ask()}
        >
          {pending ? "Checking alternatives…" : "What could I have said?"}
        </button>
        {error && <p role="alert">{error}</p>}
        {result && (
          <div className="stack" aria-live="polite">
            {result.suggestions
              .filter((suggestion) => suggestion.delta < 0)
              .map((suggestion, i) => (
                <div key={i} className={styles.suggestion}>
                  <p>“{suggestion.text}”</p>
                  <p className="muted">
                    Would have moved the meter by {suggestion.delta}.
                  </p>
                </div>
              ))}
            {result.tip && (
              <div className={styles.suggestion}>
                <p>{result.tip.why}</p>
                <p>
                  <strong>Try instead:</strong> {result.tip.tryInstead}
                </p>
              </div>
            )}
            {!result.tip &&
              !result.suggestions.some(
                (suggestion) => suggestion.delta < 0,
              ) && (
                <p>
                  No alternative passed the engine checks for this turn. Try a
                  do-over.
                </p>
              )}
          </div>
        )}
      </div>
    </ProGate>
  );
}

function SaveLine({
  turn,
  sceneTitle,
}: {
  turn: TurnResponse;
  sceneTitle: string;
}) {
  const [state, setState] = useState<"idle" | "saved" | "limit" | "error">(
    "idle",
  );
  function save() {
    if (state === "saved") return;
    const result = savePlaybook({
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      text: turn.text,
      tags: turn.hits.map((hit) => hit.tag),
      sceneTitle,
    });
    setState(
      result.ok ? "saved" : result.reason === "limit" ? "limit" : "error",
    );
  }
  return (
    <div className="stack">
      <button
        className="button-secondary"
        onClick={save}
        disabled={state === "saved"}
      >
        {state === "saved" ? "Saved to playbook ✓" : "Save to playbook"}
      </button>
      {state === "limit" && (
        <ProGate feature="Unlimited playbook">
          <p>Your playbook is ready for more lines.</p>
        </ProGate>
      )}
      {state === "error" && (
        <p role="alert">This line could not be saved. Please try again.</p>
      )}
      {state === "saved" && (
        <span className={styles.srOnly} role="status">
          Line saved to your playbook.
        </span>
      )}
    </div>
  );
}

export function Debrief({
  session,
  turns,
  onRedo,
  onRestart,
}: {
  session: SessionResponse;
  turns: TurnResponse[];
  onRedo: (index: number) => void;
  onRestart: () => void;
}) {
  const [shared, setShared] = useState("");
  const [copyFailed, setCopyFailed] = useState(false);
  const final = turns[turns.length - 1];
  if (!final || final.result.outcome === "stopped_unsafe") return null;
  const score = final.score;
  const largestRise = turns.reduce(
    (best, turn, index) =>
      turn.result.delta > (turns[best]?.result.delta ?? 0) ? index : best,
    0,
  );
  const standing =
    session.kind === "daily" && !final.usedDoOver ? final.daily : null;
  async function share() {
    if (!score) return;
    const value = buildShareText({
      dayNumber: session.kind === "daily" ? session.dayNumber : undefined,
      sceneTitle: session.scene.title,
      score,
      url: `${window.location.origin}/play`,
    });
    if (value) {
      setShared(value);
      setCopyFailed(!(await copyText(value)));
    }
  }
  return (
    <section
      className={styles.debrief}
      aria-labelledby="outcome-title"
      data-testid="debrief"
    >
      <header className={styles.ending}>
        <p className="kicker">A little practice. A new way through.</p>
        <h1 id="outcome-title" tabIndex={-1}>
          {outcomeTitles[final.result.outcome]}
        </h1>
        <p>
          {final.result.outcome === "calm_gave_in"
            ? "The crying stopped because the limit did."
            : final.result.outcome === "out_of_turns"
              ? "Real ones end too. Try a do-over."
              : `${turns.length} turns · par ${session.par}`}
        </p>
        {score && (
          <>
            <p
              className={styles.stars}
              aria-label={`${score.stars} out of 3 stars`}
            >
              {"★".repeat(score.stars)}
              <span aria-hidden="true">{"☆".repeat(3 - score.stars)}</span>
            </p>
            <div
              className={styles.grid}
              aria-label={score.grid
                .map((cell, index) => `Turn ${index + 1}: ${cell}`)
                .join("; ")}
            >
              {score.grid.map((cell, index) => (
                <span key={index} data-cell={cell} aria-hidden="true">
                  {cell === "good" ? "✓" : cell === "mixed" ? "~" : "×"}
                </span>
              ))}
            </div>
            <p className="muted">
              {turns.length} turns · par {session.par}
            </p>
          </>
        )}
        {!score && (
          <p role="status">
            Your scene is finished. The server did not return a score; your
            turn-by-turn review is below.
          </p>
        )}
        {standing && standing.players > 0 && (
          <div className={styles.standing}>
            <p>
              Player {standing.rank} of {standing.players} today
            </p>
            {standing.players >= 20 && standing.beatPct !== null && (
              <p>Calmer than {standing.beatPct}% of today&apos;s players</p>
            )}
          </div>
        )}
        {final.usedDoOver && (
          <p className="muted">Do-over practice · this run is not ranked.</p>
        )}
        <div className={styles.actions}>
          <button className="button" onClick={onRestart}>
            Play again
          </button>
          {score && (
            <button className="button-secondary" onClick={() => void share()}>
              Share result
            </button>
          )}
        </div>
        {shared && (
          <div className={styles.sharePreview} role="status">
            <p>
              {copyFailed
                ? "Copy was blocked. Select and copy this text:"
                : "Copied to clipboard:"}
            </p>
            <pre tabIndex={0}>{shared}</pre>
          </div>
        )}
      </header>
      <div className={styles.sectionTitle}>
        <p className="kicker">Your do-over</p>
        <h2>Every moment is a place to start again.</h2>
      </div>
      <ol className={styles.turnList}>
        {turns.map((turn, index) => (
          <li
            className={styles.reviewTurn}
            key={`${turn.turnIndex}-${turn.text}`}
            data-testid={`review-turn-${index}`}
          >
            {score?.turningPoint === index && (
              <p className={styles.turningPoint}>↳ Turning point</p>
            )}
            <TurnCard turn={turn} scene={session.scene} expanded />
            <div className={styles.actions}>
              <button
                className="button-secondary"
                onClick={() => onRedo(index)}
              >
                Do-over from here
                <span className={styles.srOnly}> · turn {index + 1}</span>
              </button>
              {isPlaybookEligible(turn.hits, turn.result.delta) && (
                <SaveLine turn={turn} sceneTitle={session.scene.title} />
              )}
            </div>
            {index === largestRise && turn.result.delta > 0 && (
              <Coach sessionId={session.sessionId} turnIndex={turn.turnIndex} />
            )}
          </li>
        ))}
      </ol>
      <div className={styles.actions}>
        <Link href="/scenes" className="button-secondary">
          Scene library
        </Link>
        <Link href="/replay" className="button-secondary">
          Replay your own
        </Link>
      </div>
    </section>
  );
}
