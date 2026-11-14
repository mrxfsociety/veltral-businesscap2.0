"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import type { PublicScene } from "@/engine/types";
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
import { isHelpfulTag, tagLabel } from "@/lib/presentation";
import { ProGate } from "@/components/pro-gate";
import { Icon } from "@/components/paper/icons";
import {
  Button,
  ButtonLink,
  Kicker,
  Stamp,
} from "@/components/paper/primitives";
import { formatDelta, shiftSentence } from "./takes";
import { TurnSlip } from "./turn-slip";
import styles from "./play.module.css";

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
    <ProGate feature="Coach suggestions" compact>
      <div className={styles.coach}>
        <Button
          variant="secondary"
          size="small"
          icon="microphone"
          disabled={pending}
          onClick={() => void ask()}
        >
          {pending ? "Checking alternatives…" : "What could I have said?"}
        </Button>
        {error && <p role="alert">{error}</p>}
        {result && (
          <div className="stack" aria-live="polite">
            {result.suggestions
              .filter((suggestion) => suggestion.delta < 0)
              .map((suggestion, i) => (
                <div key={i} className={styles.suggestion}>
                  <p>“{suggestion.text}”</p>
                  <p className="muted">
                    The engine scores this line at{" "}
                    {formatDelta(suggestion.delta)}.
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
  const [state, setState] = useState<
    "idle" | "saved" | "limit" | "storage" | "error"
  >("idle");
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
      result.ok
        ? "saved"
        : result.reason === "invalid"
          ? "error"
          : result.reason,
    );
  }
  return (
    <div className={styles.saveLine}>
      <Button
        variant="secondary"
        size="small"
        icon={state === "saved" ? "check" : "script"}
        onClick={save}
        disabled={state === "saved"}
      >
        {state === "saved" ? "Saved to your lines" : "Save to playbook"}
      </Button>
      {state === "limit" && (
        <ProGate feature="Unlimited playbook" compact>
          <p>Your playbook is ready for more lines.</p>
        </ProGate>
      )}
      {state === "error" && (
        <p role="alert">This line could not be saved. Please try again.</p>
      )}
      {state === "storage" && (
        <p role="alert">
          This line could not be saved because browser storage is full or
          unavailable. Your existing lines are unchanged. Copy this reply or
          remove a saved line from your playbook before trying again.
        </p>
      )}
      {state === "saved" && (
        <span className="sr-only" role="status">
          Line saved to your playbook.
        </span>
      )}
    </div>
  );
}

/** Take 1 against Take 2 on the same turn: two engine results, side by side. */
export function TakeComparison({
  first,
  second,
  firstTake,
  secondTake,
}: {
  first: TurnResponse;
  second: TurnResponse;
  firstTake: number;
  secondTake: number;
}) {
  const rows = [
    { take: firstTake, turn: first },
    { take: secondTake, turn: second },
  ];
  return (
    <figure className={styles.compare}>
      <Kicker>Turn {second.turnIndex + 1}, two takes</Kicker>
      <div className={styles.compareRows}>
        {rows.map(({ take, turn }) => (
          <div key={take} className={styles.compareTake}>
            <p className={styles.compareLabel}>Take {take}</p>
            <blockquote>
              {turn.text ? `“${turn.text}”` : <em>(nothing said)</em>}
            </blockquote>
            <p className={styles.compareTags}>
              {turn.hits.length === 0 && (
                <Stamp kind="neutral" icon="cloud">
                  No clear move
                </Stamp>
              )}
              {turn.hits.map((hit) => (
                <Stamp
                  key={hit.tag}
                  kind={isHelpfulTag(hit.tag) ? "helpful" : "unhelpful"}
                >
                  {tagLabel(hit.tag)}
                </Stamp>
              ))}
            </p>
            <p
              className={styles.compareDelta}
              data-direction={
                turn.result.delta < 0
                  ? "down"
                  : turn.result.delta > 0
                    ? "up"
                    : "same"
              }
            >
              {formatDelta(turn.result.delta)}
            </p>
          </div>
        ))}
      </div>
      <figcaption>
        {shiftSentence(first.result.delta, second.result.delta)}
      </figcaption>
    </figure>
  );
}

export type ReplacedTake = { turn: TurnResponse; take: number };

export function Debrief({
  session,
  turns,
  turnTakes,
  replaced,
  onRedo,
  onRestart,
  tomorrow,
  realTimeInvite,
  onRealTime,
}: {
  session: SessionResponse;
  turns: TurnResponse[];
  /** The take number each current turn was played in. */
  turnTakes: number[];
  /** Turns a do-over replaced, by turn index (memory only). */
  replaced: Record<number, ReplacedTake>;
  onRedo: (index: number) => void;
  onRestart: () => void;
  tomorrow?: string | null;
  realTimeInvite?: boolean;
  onRealTime?: () => void;
}) {
  const reduce = useReducedMotion();
  const [shared, setShared] = useState("");
  const [copyFailed, setCopyFailed] = useState(false);
  const [leaving, setLeaving] = useState<number | null>(null);
  const final = turns[turns.length - 1];
  if (!final || final.result.outcome === "stopped_unsafe") return null;
  const score = final.score;
  const scene: PublicScene = session.scene;
  const largestRise = turns.reduce(
    (best, turn, index) =>
      turn.result.delta > (turns[best]?.result.delta ?? 0) ? index : best,
    0,
  );
  const standing =
    session.kind === "daily" && !final.usedDoOver ? final.daily : null;
  const comparisons = Object.entries(replaced)
    .map(([index, old]) => ({ index: Number(index), old }))
    .filter(({ index }) => turns[index])
    .sort((a, b) => b.old.take - a.old.take);

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

  function redoFrom(index: number) {
    if (leaving !== null) return;
    if (reduce) {
      onRedo(index);
      return;
    }
    setLeaving(index);
    window.setTimeout(() => {
      onRedo(index);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 380);
  }

  return (
    <section
      className={styles.script}
      aria-labelledby="outcome-title"
      data-testid="debrief"
      data-leaving={leaving ?? undefined}
    >
      <div className={styles.scriptHead}>
        <div>
          <Kicker>The script</Kicker>
          <h2>Every line, and what it did.</h2>
        </div>
        <div className={styles.scriptActions}>
          <Button icon="rewind" onClick={onRestart}>
            Play again
          </Button>
          {score && (
            <Button
              variant="secondary"
              icon="share"
              onClick={() => void share()}
            >
              Share result
            </Button>
          )}
        </div>
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

      {score && (
        <div
          className={styles.grid}
          aria-label={score.grid
            .map((cell, index) => `Turn ${index + 1}: ${cell}`)
            .join("; ")}
          role="img"
        >
          {score.grid.map((cell, index) => (
            <span key={index} data-cell={cell} aria-hidden="true">
              <Icon
                name={
                  cell === "good"
                    ? "check"
                    : cell === "mixed"
                      ? "cloud"
                      : "cross"
                }
                size={14}
              />
            </span>
          ))}
        </div>
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

      {realTimeInvite && onRealTime && (
        <div className={styles.invite}>
          <p>
            <strong>Ready for real time?</strong> Eight seconds.
          </p>
          <Button variant="ink" size="small" icon="flame" onClick={onRealTime}>
            Play it in real time
          </Button>
        </div>
      )}

      {comparisons.map(({ index, old }) => (
        <TakeComparison
          key={index}
          first={old.turn}
          second={turns[index]}
          firstTake={old.take}
          secondTake={turnTakes[index] ?? old.take + 1}
        />
      ))}

      <ol className={styles.line} aria-label="Turns on the line">
        {turns.map((turn, index) => (
          <li
            key={`${turn.turnIndex}-${turn.text}`}
            className={styles.peg}
            data-leaving={leaving !== null && index >= leaving ? "" : undefined}
            style={{ "--i": index } as CSSProperties}
          >
            <a href={`#review-turn-${index}`}>
              <span className={styles.pegNumber}>{index + 1}</span>
              <Icon
                name={
                  turn.result.delta > 0
                    ? "cloud"
                    : turn.result.delta < 0
                      ? "sun"
                      : "script"
                }
                size={16}
              />
              <span className="tabular">{formatDelta(turn.result.delta)}</span>
              {score?.turningPoint === index && (
                <span className={styles.flag}>Turning point</span>
              )}
            </a>
          </li>
        ))}
      </ol>

      <ol className={styles.cards}>
        {turns.map((turn, index) => (
          <li
            id={`review-turn-${index}`}
            className={styles.card}
            key={`${turn.turnIndex}-${turn.text}`}
            data-testid={`review-turn-${index}`}
            data-leaving={leaving !== null && index >= leaving ? "" : undefined}
            data-turning={score?.turningPoint === index || undefined}
          >
            {score?.turningPoint === index && (
              <p className={styles.turningPoint}>
                <Icon name="flame" size={14} /> Turning point
              </p>
            )}
            <TurnSlip
              turn={turn}
              scene={scene}
              allNotes
              take={turnTakes[index]}
            />
            {turn.child && (
              <blockquote className={styles.childReply}>
                <p>
                  <span className={styles.childName}>{scene.childName}:</span>{" "}
                  {turn.child.line}
                </p>
                {turn.child.action && <em>({turn.child.action})</em>}
              </blockquote>
            )}
            <div className={styles.cardActions}>
              <Button
                variant="ink"
                size="small"
                icon="rewind"
                onClick={() => redoFrom(index)}
              >
                Do-over from here
                <span className="sr-only"> · turn {index + 1}</span>
              </Button>
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

      {session.kind === "daily" && (
        <div className={styles.replayCard}>
          <p>
            <strong>Had a real one today?</strong> Replay it here.
          </p>
          <ButtonLink
            href="/replay"
            variant="secondary"
            size="small"
            icon="ticket"
          >
            Replay your own
          </ButtonLink>
        </div>
      )}

      {tomorrow && (
        <p className={styles.tomorrow}>
          <Icon name="moon" size={16} /> Tomorrow: <strong>{tomorrow}</strong>
        </p>
      )}

      <div className={styles.scriptFoot}>
        <ButtonLink href="/scenes" variant="secondary" icon="stage">
          Scenes
        </ButtonLink>
        <ButtonLink href="/replay" variant="secondary" icon="ticket">
          Replay your own
        </ButtonLink>
        <Link href="/progress" className={styles.quietLink}>
          See your progress
        </Link>
      </div>
    </section>
  );
}
