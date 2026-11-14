"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicScene, Tag } from "@/engine/types";
import type {
  DailyResponse,
  SessionResponse,
  TurnRequest,
  TurnResponse,
} from "@/shared/api";
import { api, ApiError } from "@/lib/api";
import { readStore, saveHistory, saveSettings } from "@/lib/store";
import { useStore } from "@/lib/use-store";
import { isHelpfulTag } from "@/lib/presentation";
import { isPro } from "@/lib/pro";
import { ProBadge, ProGate } from "@/components/pro-gate";
import { Debrief } from "./debrief";
import { TurnCard } from "./turn-card";
import { UnsafePause } from "./unsafe-pause";
import styles from "./play.module.css";

type Phase = "intro" | "playing" | "ended";
type Failure = { message: string; code: string; retry?: TurnRequest };
const DISCLAIMER =
  "Do-Over is a practice tool. It is not therapy, medical advice or a diagnosis. The child is simulated and the scoring is a simplified model.";

function failureFrom(cause: unknown, retry?: TurnRequest): Failure {
  if (cause instanceof ApiError)
    return {
      message: cause.message,
      code:
        cause.code === "network_error" ||
        (retry && (cause.code === "invalid_response" || cause.status >= 500))
          ? "network"
          : cause.code,
      retry,
    };
  return {
    message:
      "We couldn't confirm the reply reached the server. Your words are still here. You can retry this turn or start a new scene.",
    code: "network",
    retry,
  };
}

export function PlayExperience({
  sceneId,
  scenes,
  scenePars = {},
}: {
  sceneId?: string;
  scenes: PublicScene[];
  scenePars?: Record<string, number>;
}) {
  const store = useStore();
  const timer = store.settings.timer;
  const [phase, setPhase] = useState<Phase>("intro");
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [turns, setTurns] = useState<TurnResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [reply, setReply] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [clockTotal, setClockTotal] = useState(8);
  const [typingStarted, setTypingStarted] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [retryNotice, setRetryNotice] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endingRef = useRef<HTMLDivElement>(null);
  const deadlineRef = useRef<number | null>(null);
  const typedRef = useRef(false);
  const replyRef = useRef("");
  const turnsRef = useRef<TurnResponse[]>([]);
  const requestPending = useRef(false);
  const savedRuns = useRef(new Set<string>());
  const runId = useRef("");
  const mounted = useRef(true);
  const prepared = useRef<{
    key: string;
    promise: Promise<{ daily: DailyResponse; session: SessionResponse | null }>;
  } | null>(null);
  const submitRef = useRef<
    (text: string, timedOut: boolean, retry?: TurnRequest) => Promise<void>
  >(async () => undefined);
  const custom = Boolean(sceneId?.startsWith("custom-"));
  const activeScene =
    session?.scene ??
    scenes.find((scene) => scene.id === (sceneId ?? daily?.sceneId));
  const final = turns[turns.length - 1];
  const childState = final?.result.after ?? session?.state;
  const child =
    final?.child ??
    (session
      ? { line: session.scene.openingLine, action: session.scene.openingAction }
      : null);
  const par = session?.par ?? (sceneId ? scenePars[sceneId] : daily?.par);
  const isDaily = session ? session.kind === "daily" : !sceneId;
  const needsGate = Boolean(
    sceneId && (custom || !daily || daily.sceneId !== sceneId),
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      deadlineRef.current = null;
    };
  }, []);

  useEffect(() => {
    let current = true;
    const key = `${sceneId ?? "daily"}:${reloadKey}`;
    if (prepared.current?.key !== key) {
      prepared.current = {
        key,
        promise: (async () => {
          const nextDaily = await api.daily();
          const nextSession =
            custom && sceneId && isPro()
              ? await api.session({ kind: "custom", sceneId })
              : null;
          return { daily: nextDaily, session: nextSession };
        })(),
      };
    }
    void prepared.current.promise
      .then((value) => {
        if (!current) return;
        setDaily(value.daily);
        if (value.session) setSession(value.session);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!current) return;
        setFailure(failureFrom(cause));
        setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [custom, sceneId, reloadKey]);

  function armClock() {
    typedRef.current = false;
    setTypingStarted(false);
    deadlineRef.current = timer ? Date.now() + timer * 1000 : null;
    setClockTotal(timer || 8);
    setRemaining(timer || null);
  }

  function resetReply() {
    replyRef.current = "";
    setReply("");
  }

  async function start() {
    if (requestPending.current || (needsGate && !isPro())) return;
    requestPending.current = true;
    setWaiting(true);
    setFailure(null);
    try {
      const freshDaily = !sceneId ? await api.daily() : daily;
      if (freshDaily && !sceneId) setDaily(freshDaily);
      const next =
        custom && session && turnsRef.current.length === 0
          ? session
          : await api.session(
              sceneId
                ? {
                    kind: custom ? "custom" : "library",
                    sceneId,
                  }
                : {
                    kind: "daily",
                    practice: Boolean(
                      freshDaily && readStore().dailyDone[freshDaily.dayKey],
                    ),
                  },
            );
      if (!mounted.current) return;
      runId.current = crypto.randomUUID();
      setSession(next);
      turnsRef.current = [];
      setTurns([]);
      resetReply();
      setRetryNotice(false);
      setPhase("playing");
      armClock();
    } catch (cause) {
      if (mounted.current) setFailure(failureFrom(cause));
    } finally {
      requestPending.current = false;
      if (mounted.current) setWaiting(false);
    }
  }

  function rememberRun(nextTurns: TurnResponse[], response: TurnResponse) {
    if (
      !session ||
      !response.score ||
      response.result.outcome === "ongoing" ||
      response.result.outcome === "stopped_unsafe"
    )
      return;
    const id = `${session.sessionId}:${runId.current}`;
    if (savedRuns.current.has(id)) return;
    const tagCounts: Partial<Record<Tag, number>> = {};
    let helpful = 0;
    let unhelpful = 0;
    nextTurns.forEach((turn) =>
      turn.hits.forEach(({ tag }) => {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
        if (isHelpfulTag(tag)) helpful += 1;
        else unhelpful += 1;
      }),
    );
    const saved = saveHistory({
      id,
      at: new Date().toISOString(),
      dayKey: session.dayKey,
      kind: session.kind,
      sceneId: session.scene.id,
      sceneTitle: session.scene.title,
      outcome: response.result.outcome,
      stars: response.score.stars,
      turns: nextTurns.length,
      par: session.par,
      helpful,
      unhelpful,
      tagCounts,
    });
    if (saved) savedRuns.current.add(id);
  }

  async function submit(text: string, timedOut = false, retry?: TurnRequest) {
    if (!session || phase !== "playing" || requestPending.current) return;
    requestPending.current = true;
    setWaiting(true);
    setFailure(null);
    deadlineRef.current = null;
    setRemaining(null);
    const request: TurnRequest = retry ?? {
      sessionId: session.sessionId,
      turnIndex: turnsRef.current.length,
      text: text.slice(0, 300),
      timedOut,
      inputMode: "text",
    };
    try {
      const response = await api.turn(request);
      if (!mounted.current) return;
      if (response.turnIndex !== request.turnIndex)
        throw new Error(
          "The server returned a different turn. Please restart this scene.",
        );
      const nextTurns = [
        ...turnsRef.current.slice(0, request.turnIndex),
        response,
      ];
      turnsRef.current = nextTurns;
      setTurns(nextTurns);
      resetReply();
      setRetryNotice(Boolean(retry));
      if (response.result.outcome === "ongoing") armClock();
      else {
        rememberRun(nextTurns, response);
        setPhase("ended");
      }
    } catch (cause) {
      if (mounted.current) setFailure(failureFrom(cause, request));
    } finally {
      requestPending.current = false;
      if (mounted.current) setWaiting(false);
    }
  }

  useEffect(() => {
    submitRef.current = submit;
  });

  useEffect(() => {
    if (phase !== "playing" || waiting || failure) return;
    const id = window.setInterval(() => {
      const deadline = deadlineRef.current;
      if (deadline === null) return;
      const left = Math.max(0, (deadline - Date.now()) / 1000);
      setRemaining(Math.ceil(left));
      if (left === 0) {
        deadlineRef.current = null;
        void submitRef.current(replyRef.current, true);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, waiting, failure]);

  useEffect(() => {
    if (phase === "playing" && !waiting && !failure) inputRef.current?.focus();
    if (phase === "ended") endingRef.current?.focus();
  }, [phase, waiting, failure, turns.length]);

  function changeReply(value: string) {
    replyRef.current = value.slice(0, 300);
    setReply(replyRef.current);
    if (!typedRef.current) {
      typedRef.current = true;
      setTypingStarted(true);
      if (timer) {
        deadlineRef.current = Date.now() + 25000;
        setClockTotal(25);
        setRemaining(25);
      }
    }
  }

  const redo = useCallback(
    (index: number) => {
      const earlier = turnsRef.current.slice(0, index);
      turnsRef.current = earlier;
      setTurns(earlier);
      runId.current = crypto.randomUUID();
      replyRef.current = "";
      setReply("");
      setFailure(null);
      setRetryNotice(false);
      typedRef.current = false;
      setTypingStarted(false);
      deadlineRef.current = timer ? Date.now() + timer * 1000 : null;
      setClockTotal(timer || 8);
      setRemaining(timer || null);
      setPhase("playing");
    },
    [timer],
  );

  function restart() {
    deadlineRef.current = null;
    turnsRef.current = [];
    setTurns([]);
    setSession(null);
    setFailure(null);
    setPhase("intro");
    resetReply();
    if (custom) {
      setLoading(true);
      setReloadKey((key) => key + 1);
    }
  }

  function retryIntro() {
    setFailure(null);
    setLoading(true);
    setReloadKey((key) => key + 1);
  }

  if (loading)
    return (
      <section className="card stack" role="status">
        <p className="kicker">Take a breath</p>
        <h1>Getting your scene ready…</h1>
      </section>
    );
  if (!daily && failure)
    return (
      <section className="card stack">
        <h1>We couldn&apos;t load this scene.</h1>
        <p role="alert">{failure.message}</p>
        <button className="button" onClick={retryIntro}>
          Try again
        </button>
        <Link href="/scenes">Back to scenes</Link>
      </section>
    );
  if (needsGate && !isPro())
    return (
      <ProGate feature={custom ? "Replay your own meltdown" : "Scene library"}>
        <p>Choose your scene.</p>
      </ProGate>
    );
  if (!activeScene && !failure)
    return (
      <section className="card stack">
        <h1>This scene is no longer here.</h1>
        <p>
          Custom scenes expire after 24 hours. You can start with today&apos;s
          scene or choose another.
        </p>
        <Link className="button" href="/play">
          Play today&apos;s meltdown
        </Link>
        <Link href="/scenes">Back to scenes</Link>
      </section>
    );
  if (!activeScene)
    return (
      <section className="card stack">
        <h1>We couldn&apos;t load this scene.</h1>
        <p role="alert">{failure?.message}</p>
        <button className="button" onClick={retryIntro}>
          Try again
        </button>
        <Link href="/scenes">Back to scenes</Link>
      </section>
    );

  const errorPanel = failure && (
    <div className={styles.error} role="alert">
      <p>
        {failure.code === "session_expired"
          ? "This session has expired. Your saved history is safe. Start a new scene to keep practising."
          : failure.code === "rate_limited"
            ? "You've reached the request limit for now. Give it a little time, then try again."
            : failure.message}
      </p>
      <div className={styles.actions}>
        {failure.retry &&
          !["session_expired", "session_ended", "turn_out_of_order"].includes(
            failure.code,
          ) && (
            <button
              className="button-secondary"
              onClick={() =>
                void submit(failure.retry?.text ?? "", false, failure.retry)
              }
            >
              Retry this turn
            </button>
          )}
        {phase === "intro" && (
          <button className="button-secondary" onClick={() => void start()}>
            Try again
          </button>
        )}
        <button className="button-secondary" onClick={restart}>
          Restart scene
        </button>
      </div>
      {failure.retry && failure.code === "network" && (
        <p className={styles.small}>
          Retrying may replace a turn the server already received and count as a
          do-over.
        </p>
      )}
    </div>
  );

  if (phase === "intro")
    return (
      <div className={styles.playShell}>
        <header className={styles.playHeader}>
          <p className="kicker">
            {isDaily
              ? `Do-Over #${daily?.dayNumber ?? ""} · Today's meltdown`
              : custom
                ? "Your own do-over"
                : "A little room to rehearse"}
          </p>
          <Link href="/scenes">Browse scenes ↗</Link>
        </header>
        <section className={styles.intro} aria-labelledby="scene-title">
          <div className={styles.introTop}>
            <span className={styles.place}>{activeScene.place}</span>
            {par !== undefined && <span className={styles.par}>Par {par}</span>}
          </div>
          <h1 id="scene-title">{activeScene.title}</h1>
          {needsGate && <ProBadge />}
          <p className={styles.childMeta}>
            {activeScene.childName} · ages{" "}
            {activeScene.ageBand.replace("-", "–")} · {activeScene.temperament}
          </p>
          <p className={styles.setup}>{activeScene.setup}</p>
          <div className={styles.limit}>
            <span>Your limit</span>
            <strong>{activeScene.limit}</strong>
          </div>
          <fieldset className={styles.timerSettings}>
            <legend>Time to begin your reply</legend>
            <div className={styles.timerOptions}>
              {([8, 20, 0] as const).map((value) => (
                <label key={value} data-selected={timer === value}>
                  <input
                    type="radio"
                    name="timer"
                    value={value}
                    checked={timer === value}
                    onChange={() => saveSettings({ timer: value })}
                  />
                  {value ? `${value} seconds` : "Timer off"}
                </label>
              ))}
            </div>
            <p className={styles.small}>
              Once you start typing, you have 25 seconds to finish. Turn the
              timer off to go at your own pace.
            </p>
          </fieldset>
          {isDaily && daily && store.dailyDone[daily.dayKey] && (
            <p className={styles.small}>
              You&apos;ve played today. This run is practice and won&apos;t join
              today&apos;s ranking.
            </p>
          )}
          {errorPanel}
          <button
            className={`button ${styles.startButton}`}
            disabled={waiting}
            onClick={() => void start()}
          >
            {waiting ? "Starting…" : "Start"}
            <span aria-hidden="true"> →</span>
          </button>
          <p className={styles.small}>
            Your replies are sent to an AI model to tag them. Don&apos;t include
            real names.
          </p>
        </section>
        <p className={styles.disclaimer}>{DISCLAIMER}</p>
      </div>
    );

  if (phase === "ended" && session)
    return (
      <div className={styles.playShell} ref={endingRef} tabIndex={-1}>
        {final?.result.outcome === "stopped_unsafe" ? (
          <UnsafePause onRetry={() => redo(turns.length - 1)} />
        ) : (
          <Debrief
            session={session}
            turns={turns}
            onRedo={redo}
            onRestart={restart}
          />
        )}
      </div>
    );

  if (!session || !childState) return null;
  const direction =
    childState.lastDelta < 0
      ? "settling"
      : childState.lastDelta > 0
        ? "rising"
        : "steady";
  const clockFraction = remaining === null ? 0 : remaining / clockTotal;
  return (
    <div className={styles.playShell}>
      <header className={styles.playHeader}>
        <p className="kicker">
          {session.kind === "daily"
            ? `Do-Over #${session.dayNumber}`
            : "Practice scene"}{" "}
          · {session.scene.title}
        </p>
        <span>
          Turn {Math.min(turns.length + 1, session.maxTurns)} of{" "}
          {session.maxTurns}
        </span>
      </header>
      <section className={styles.meterCard} aria-label="The child's state">
        <div className={styles.meterHeading}>
          <span>Arousal</span>
          <span className={styles.meterNumber} data-testid="arousal-value">
            {childState.arousal}
            <small> · {direction}</small>
          </span>
        </div>
        <div
          className={styles.meterTrack}
          role="progressbar"
          aria-label="Arousal"
          aria-valuenow={childState.arousal}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div style={{ width: `${childState.arousal}%` }} />
        </div>
        <div className={styles.connection}>
          <span>
            Connection <strong>{childState.connection}</strong>
          </span>
          <div
            role="progressbar"
            aria-label="Connection"
            aria-valuenow={childState.connection}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${childState.connection}%` }} />
          </div>
        </div>
        <p className={styles.limitReminder}>
          Your limit: {session.scene.limit}
        </p>
      </section>
      <section
        className={styles.childMoment}
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="kicker">{session.scene.childName}</p>
        <p className={styles.childLine}>{child?.line}</p>
        {child?.action && <p className={styles.childAction}>{child.action}</p>}
      </section>
      <form
        className={styles.replyForm}
        onSubmit={(event) => {
          event.preventDefault();
          void submit(replyRef.current);
        }}
      >
        <div className={styles.replyLabel}>
          <label htmlFor="parent-reply">What do you say?</label>
          <span className={styles.small}>{reply.length}/300</span>
        </div>
        <textarea
          id="parent-reply"
          ref={inputRef}
          value={reply}
          maxLength={300}
          disabled={waiting || Boolean(failure)}
          rows={3}
          onChange={(event) => changeReply(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              void submit(replyRef.current);
            }
          }}
          placeholder="There is room to try again."
          aria-describedby="reply-help"
        />
        <div className={styles.sendRow}>
          <p id="reply-help" className={styles.small}>
            Enter to send · Shift + Enter for a new line
          </p>
          <div className={styles.sendControls}>
            <div
              className={styles.countdown}
              aria-label={
                timer === 0
                  ? "Timer off"
                  : waiting
                    ? "Waiting for the reply"
                    : `${remaining ?? 0} seconds remaining`
              }
            >
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <circle cx="24" cy="24" r="20" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  strokeDasharray={126}
                  strokeDashoffset={126 * (1 - clockFraction)}
                />
              </svg>
              <span>
                {timer === 0 ? "∞" : waiting ? "…" : (remaining ?? "–")}
              </span>
            </div>
            <button
              className="button"
              type="submit"
              disabled={waiting || Boolean(failure)}
            >
              {waiting ? "Listening…" : "Send reply"}
            </button>
          </div>
        </div>
        {timer !== 0 && (
          <p className={styles.timerCaption}>
            {typingStarted
              ? "Take a moment to finish your thought."
              : "Begin typing before the timer ends."}
          </p>
        )}
      </form>
      {errorPanel}
      {retryNotice && (
        <p className={styles.small} role="status">
          Reply received. If the earlier request reached the server, this may be
          recorded as a do-over.
        </p>
      )}
      {final && (
        <section aria-live="polite" aria-atomic="true">
          <TurnCard turn={final} scene={session.scene} />
        </section>
      )}
      {turns.length > 1 && (
        <details className={styles.previousTurns}>
          <summary>Earlier replies ({turns.length - 1})</summary>
          {turns.slice(0, -1).map((turn) => (
            <TurnCard turn={turn} scene={session.scene} key={turn.turnIndex} />
          ))}
        </details>
      )}
    </div>
  );
}
