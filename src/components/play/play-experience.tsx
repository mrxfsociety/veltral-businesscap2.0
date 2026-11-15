"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
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
import { isPro, usePro } from "@/lib/pro";
import { TicketBooth } from "@/components/paywall/paywall";
import { ProBadge, ProGate } from "@/components/pro-gate";
import { Icon } from "@/components/paper/icons";
import {
  Button,
  ButtonLink,
  Kicker,
  Sheet,
} from "@/components/paper/primitives";
import { PaperStage, type CurtainState } from "@/components/stage/paper-stage";
import { trendOf } from "@/components/stage/mood";
import { Debrief, type ReplacedTake } from "./debrief";
import { EndingCard } from "./ending-card";
import { HeadsUp } from "./heads-up";
import { Playbill, type Pace } from "./playbill";
import { tomorrowFrom } from "./takes";
import { BEAT_DONE, TurnSlip } from "./turn-slip";
import { paperSound, readSoundPref, writeSoundPref } from "@/lib/sound";
import { UnsafePause } from "./unsafe-pause";
import { VoiceCalibration, VoiceLevel } from "./voice-controls";
import { createRecording, type RecordingHandle } from "@/voice/recorder";
import { isLoud } from "@/voice/loudness";
import { transcribe } from "@/voice/api";
import { playChildReply } from "@/voice/playback";
import styles from "./play.module.css";

type Phase = "intro" | "playing" | "ended";
type Failure = { message: string; code: string; retry?: TurnRequest };

/** Set once the visitor has picked a pace themselves (REDESIGN 5.2). */
const PACE_FLAG = "doover:pace-chosen";

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

function useMedia(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function paceWasChosen() {
  try {
    return window.localStorage.getItem(PACE_FLAG) === "1";
  } catch {
    return false;
  }
}

/** Beat timings for one turn (ms from the response): 2.4 s in total, skippable. */
function beatTimeline(stamps: number) {
  const b1 = 220;
  const b2 = 520;
  const b3 = b2 + Math.max(1, stamps) * 140 + 220;
  const b4 = b3 + 240;
  const b5 = b4 + 520;
  const b6 = b5 + 360;
  return [0, b1, b2, b3, b4, b5, b6];
}

export function PlayExperience({
  sceneId,
  scenes,
  scenePars = {},
  rotation = [],
}: {
  sceneId?: string;
  scenes: PublicScene[];
  scenePars?: Record<string, number>;
  /** Titles of the daily rotation, in order, for "Tomorrow: …". */
  rotation?: string[];
}) {
  const store = useStore();
  const reduce = useReducedMotion();
  const wide = useMedia("(min-width: 1024px)");
  const [paceChosen, setPaceChosen] = useState(() =>
    typeof window === "undefined" ? true : paceWasChosen(),
  );
  const firstVisit = !paceChosen && store.history.length === 0;
  const timer: Pace = firstVisit ? 20 : store.settings.timer;
  const { pro, loading: proLoading } = usePro();
  const voice = store.settings.voice && pro;
  const [voiceStatus, setVoiceStatus] = useState<
    "idle" | "requesting" | "recording" | "transcribing"
  >("idle");
  const [voiceNotice, setVoiceNotice] = useState("");
  const [liveLevel, setLiveLevel] = useState(-70);
  const [calibrating, setCalibrating] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [playbackUnavailable, setPlaybackUnavailable] = useState(false);
  const captureController = useRef<AbortController | null>(null);
  const playbackController = useRef<AbortController | null>(null);
  const recordingHandle = useRef<RecordingHandle | null>(null);
  const voiceEpoch = useRef(0);
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
  // presentation state (REDESIGN 5–6)
  const [beat, setBeat] = useState(BEAT_DONE);
  const [take, setTake] = useState(1);
  const [turnTakes, setTurnTakes] = useState<number[]>([]);
  const [replaced, setReplaced] = useState<Record<number, ReplacedTake>>({});
  const [clapper, setClapper] = useState<number | null>(null);
  const [cue, setCue] = useState(0);
  const [lineReady, setLineReady] = useState(false);
  const [clockWaiting, setClockWaiting] = useState(false);
  const [soundOn, setSoundOn] = useState(() =>
    typeof window === "undefined" ? true : readSoundPref(),
  );
  const [squeezed, setCompact] = useState(false);
  const compact = squeezed && phase === "playing";
  const beatTimers = useRef<number[]>([]);
  const pendingEnd = useRef(false);
  const armPending = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endingRef = useRef<HTMLHeadingElement>(null);
  const deadlineRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
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
  const sequencing = beat < BEAT_DONE && Boolean(final);
  const child =
    final?.child ??
    (session
      ? { line: session.scene.openingLine, action: session.scene.openingAction }
      : null);
  const previousChild =
    turns[turns.length - 2]?.child ??
    (session
      ? { line: session.scene.openingLine, action: session.scene.openingAction }
      : null);
  const par = session?.par ?? (sceneId ? scenePars[sceneId] : daily?.par);
  const isDaily = session ? session.kind === "daily" : !sceneId;
  const needsGate = Boolean(
    sceneId && (custom || !daily || daily.sceneId !== sceneId),
  );

  const cancelVoice = useCallback((update = true) => {
    voiceEpoch.current += 1;
    captureController.current?.abort();
    captureController.current = null;
    recordingHandle.current?.cancel();
    recordingHandle.current = null;
    playbackController.current?.abort();
    playbackController.current = null;
    if (update && mounted.current) {
      setVoiceStatus("idle");
      setLiveLevel(-70);
    }
  }, []);

  const clearBeats = useCallback(() => {
    beatTimers.current.forEach((id) => window.clearTimeout(id));
    beatTimers.current = [];
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      deadlineRef.current = null;
      cancelVoice(false);
      clearBeats();
      paperSound().stop();
    };
  }, [cancelVoice, clearBeats]);

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

  /** Show the full clock now; it starts when the child's line has finished appearing. */
  function armClock() {
    typedRef.current = false;
    setTypingStarted(false);
    deadlineRef.current = null;
    armPending.current = Boolean(timer);
    setClockWaiting(Boolean(timer));
    setClockTotal(timer || 8);
    setRemaining(timer || null);
  }

  /** Start a clock that was waiting for the line (or start it at once if the line is already up). */
  function releaseClock() {
    if (!armPending.current || typedRef.current) return;
    armPending.current = false;
    setClockWaiting(false);
    deadlineRef.current = timer ? Date.now() + timer * 1000 : null;
  }

  function resetReply() {
    replyRef.current = "";
    setReply("");
    setTranscript("");
  }

  function choosePace(value: Pace) {
    saveSettings({ timer: value });
    try {
      window.localStorage.setItem(PACE_FLAG, "1");
    } catch {
      // storage can be unavailable; the choice still applies to this run
    }
    setPaceChosen(true);
  }

  async function start() {
    if (requestPending.current || (needsGate && !pro)) return;
    if (voice && store.settings.calmBaselineDb === null) {
      setCalibrating(true);
      return;
    }
    // Sound may only start from this gesture.
    if (soundOn) {
      paperSound().enable();
      paperSound().rustle();
    }
    cancelVoice();
    requestPending.current = true;
    setWaiting(true);
    setFailure(null);
    if (firstVisit) saveSettings({ timer });
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
      setTurnTakes([]);
      setReplaced({});
      setTake(1);
      setBeat(BEAT_DONE);
      resetReply();
      setRetryNotice(false);
      setLineReady(false);
      setPhase("playing");
      armClock();
      // the line appears once the curtains have parted
      window.setTimeout(
        () => {
          if (mounted.current) {
            setLineReady(true);
            setCue((value) => value + 1);
          }
        },
        reduce ? 0 : 820,
      );
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
      points: response.score.points,
    });
    if (saved) savedRuns.current.add(id);
  }

  /** Run the turn sequence on the stage. Any tap or key skips to the end state. */
  function playSequence(response: TurnResponse) {
    clearBeats();
    if (reduce) {
      finishSequence();
      return;
    }
    setBeat(0);
    paperSound().rustle();
    const stamps =
      response.hits.length + (response.result.effects.length > 0 ? 0 : 1);
    beatTimeline(stamps).forEach((at, index) => {
      if (index === 0) return;
      beatTimers.current.push(
        window.setTimeout(() => {
          if (!mounted.current) return;
          if (index === BEAT_DONE) finishSequence();
          else setBeat(index);
          if (index === 2)
            for (let i = 0; i < Math.max(1, response.hits.length); i++)
              window.setTimeout(() => paperSound().stamp(), i * 140);
          if (index === 4 && response.result.outcome === "calm_limit_held")
            paperSound().chime();
        }, at),
      );
    });
  }

  function finishSequence() {
    clearBeats();
    setBeat(BEAT_DONE);
    setCue((value) => value + 1);
    if (pendingEnd.current) {
      pendingEnd.current = false;
      setPhase("ended");
    }
  }

  async function submit(
    text: string,
    timedOut = false,
    retry?: TurnRequest,
    spoken?: { loud: boolean },
  ) {
    if (!session || phase !== "playing" || requestPending.current) return;
    cancelVoice();
    requestPending.current = true;
    setWaiting(true);
    setFailure(null);
    deadlineRef.current = null;
    armPending.current = false;
    setRemaining(null);
    const request: TurnRequest = retry ?? {
      sessionId: session.sessionId,
      turnIndex: turnsRef.current.length,
      text: text.slice(0, 300),
      timedOut,
      inputMode: spoken ? "voice" : "text",
      ...(spoken ? { loud: spoken.loud } : {}),
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
      setTurnTakes((takes) => [...takes.slice(0, request.turnIndex), take]);
      resetReply();
      setRetryNotice(Boolean(retry));
      if (response.result.outcome === "ongoing") {
        armClock();
        playSequence(response);
      } else if (response.result.outcome === "stopped_unsafe") {
        // Everything stops: no sequence, no flourish.
        clearBeats();
        setBeat(BEAT_DONE);
        setPhase("ended");
      } else {
        rememberRun(nextTurns, response);
        pendingEnd.current = true;
        playSequence(response);
      }
    } catch (cause) {
      if (mounted.current) setFailure(failureFrom(cause, request));
    } finally {
      requestPending.current = false;
      if (mounted.current) setWaiting(false);
    }
  }

  useEffect(() => {
    if (!sequencing) return;
    const skip = () => finishSequence();
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
    // finishSequence only reads refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequencing]);

  function switchToTyping(message = "Voice is off. You can keep typing.") {
    cancelVoice();
    saveSettings({ voice: false });
    setVoiceNotice(message);
    if (phase === "playing" && !waiting && !failure) {
      armClock();
      releaseClock();
    }
  }

  function toggleVoice(enabled: boolean) {
    setVoiceNotice("");
    if (!enabled) {
      switchToTyping();
      return;
    }
    if (!pro) return;
    if (
      !window.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      switchToTyping(
        "Your browser needs HTTPS and microphone recording support for voice. Typing is ready.",
      );
      return;
    }
    if (store.settings.calmBaselineDb === null) setCalibrating(true);
    else saveSettings({ voice: true });
  }

  async function recordReply() {
    if (!voice || !session || waiting || failure || voiceStatus !== "idle")
      return;
    const baseline = store.settings.calmBaselineDb;
    if (baseline === null) {
      switchToTyping(
        "Set up your voice from the scene's sound check before recording. Typing is ready.",
      );
      return;
    }
    cancelVoice();
    const epoch = voiceEpoch.current;
    const abort = new AbortController();
    captureController.current = abort;
    setVoiceStatus("requesting");
    setVoiceNotice("");
    setTranscript("");
    let speechStarted = false;
    try {
      const handle = await createRecording({
        signal: abort.signal,
        speechThresholdDb: Math.max(-60, baseline - 15),
        onLevel: (db) => {
          if (mounted.current && epoch === voiceEpoch.current) setLiveLevel(db);
        },
        onSpeechStart: () => {
          if (!mounted.current || epoch !== voiceEpoch.current) return;
          speechStarted = true;
          typedRef.current = true;
          setTypingStarted(true);
          deadlineRef.current = null;
          armPending.current = false;
          setRemaining(null);
        },
      });
      if (
        !mounted.current ||
        abort.signal.aborted ||
        epoch !== voiceEpoch.current
      ) {
        handle.cancel();
        return;
      }
      recordingHandle.current = handle;
      setVoiceStatus("recording");
      const recording = await handle.result;
      if (
        !mounted.current ||
        abort.signal.aborted ||
        epoch !== voiceEpoch.current
      )
        return;
      recordingHandle.current = null;
      if (!speechStarted) {
        switchToTyping("We didn't hear a clear reply. You can type it below.");
        return;
      }
      deadlineRef.current = null;
      setRemaining(null);
      setVoiceStatus("transcribing");
      const text = await transcribe(recording.audio, abort.signal);
      if (
        !mounted.current ||
        abort.signal.aborted ||
        epoch !== voiceEpoch.current
      )
        return;
      if (!text) {
        switchToTyping("We didn't hear a clear reply. You can type it below.");
        return;
      }
      replyRef.current = text;
      setReply(text);
      setTranscript(text);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      if (
        !mounted.current ||
        abort.signal.aborted ||
        epoch !== voiceEpoch.current
      )
        return;
      await submit(text, false, undefined, {
        loud: isLoud(recording.peakDb, baseline),
      });
    } catch (cause) {
      if (
        !mounted.current ||
        abort.signal.aborted ||
        epoch !== voiceEpoch.current
      )
        return;
      switchToTyping(
        `${cause instanceof Error ? cause.message : "Microphone recording is unavailable."} You can type your reply below.`,
      );
    }
  }

  function stopRecording() {
    const handle = recordingHandle.current;
    if (handle) void handle.stop().catch(() => undefined);
  }

  useEffect(() => {
    if (
      !voice ||
      !session ||
      phase === "intro" ||
      failure ||
      sequencing ||
      final?.result.outcome === "stopped_unsafe" ||
      !child?.line
    )
      return;
    const abort = new AbortController();
    playbackController.current?.abort();
    playbackController.current = abort;
    void playChildReply(
      {
        sessionId: session.sessionId,
        turnIndex: final?.turnIndex ?? -1,
        line: child.line,
        arousal: childState?.arousal ?? session.state.arousal,
      },
      abort.signal,
    ).then((result) => {
      if (!abort.signal.aborted && mounted.current)
        setPlaybackUnavailable(result === "unavailable");
    });
    return () => abort.abort();
  }, [
    voice,
    session,
    phase,
    failure,
    sequencing,
    final?.turnIndex,
    final?.result.outcome,
    child?.line,
    childState?.arousal,
  ]);

  function hearChild() {
    if (!session || !child?.line) return;
    playbackController.current?.abort();
    const abort = new AbortController();
    playbackController.current = abort;
    void playChildReply(
      {
        sessionId: session.sessionId,
        turnIndex: final?.turnIndex ?? -1,
        line: child.line,
        arousal: childState?.arousal ?? session.state.arousal,
      },
      abort.signal,
    ).then((result) => {
      if (!abort.signal.aborted && mounted.current)
        setPlaybackUnavailable(result === "unavailable");
    });
  }

  useEffect(() => {
    submitRef.current = submit;
  });

  // The clock only runs while the page is visible: a parent who switches tab
  // or puts the phone down never comes back to turns sent as "froze".
  useEffect(() => {
    const onVisibility = () => {
      const now = Date.now();
      if (!document.hidden && deadlineRef.current !== null)
        deadlineRef.current += now - lastTickRef.current;
      lastTickRef.current = now;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (phase !== "playing" || waiting || failure) return;
    lastTickRef.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const deadline = deadlineRef.current;
      if (document.hidden) {
        if (deadline !== null)
          deadlineRef.current = deadline + (now - lastTickRef.current);
        lastTickRef.current = now;
        return;
      }
      lastTickRef.current = now;
      if (deadline === null) return;
      const left = Math.max(0, (deadline - now) / 1000);
      setRemaining(Math.ceil(left));
      if (left === 0) {
        deadlineRef.current = null;
        void submitRef.current(replyRef.current, true);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, waiting, failure]);

  useEffect(() => {
    if (
      phase === "playing" &&
      !waiting &&
      !failure &&
      !sequencing &&
      voiceStatus === "idle"
    )
      inputRef.current?.focus({ preventScroll: true });
    if (phase === "ended") endingRef.current?.focus({ preventScroll: true });
  }, [phase, waiting, failure, turns.length, voiceStatus, sequencing]);

  // Rain follows the storm number the stage is showing.
  const rainStorm =
    phase === "intro" || final?.result.outcome === "stopped_unsafe"
      ? 0
      : final && sequencing && beat < 4
        ? final.result.before.arousal
        : (childState?.arousal ?? 0);
  useEffect(() => {
    paperSound().setRain(soundOn ? rainStorm : 0);
  }, [rainStorm, soundOn]);

  // Phone keyboard: when the visual viewport shrinks, squeeze the stage.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv || phase !== "playing") return;
    const update = () => {
      const squeezed =
        window.innerWidth < 1024 &&
        vv.height < window.innerHeight * 0.78 &&
        document.activeElement === inputRef.current;
      setCompact(squeezed);
      document.documentElement.style.setProperty("--vvh", `${vv.height}px`);
    };
    update();
    vv.addEventListener("resize", update);
    const input = inputRef.current;
    input?.addEventListener("focus", update);
    input?.addEventListener("blur", update);
    return () => {
      vv.removeEventListener("resize", update);
      input?.removeEventListener("focus", update);
      input?.removeEventListener("blur", update);
    };
  }, [phase]);

  function changeReply(value: string) {
    replyRef.current = value.slice(0, 300);
    setReply(replyRef.current);
    if (!typedRef.current) {
      typedRef.current = true;
      armPending.current = false;
      setClockWaiting(false);
      setTypingStarted(true);
      if (timer) {
        deadlineRef.current = Date.now() + 25000;
        setClockTotal(25);
        setRemaining(25);
      }
    }
  }

  const redo = useCallback(
    (index: number, prefill?: string) => {
      cancelVoice();
      clearBeats();
      pendingEnd.current = false;
      setTranscript("");
      const old = turnsRef.current[index];
      const nextTake = take + 1;
      if (old)
        setReplaced((current) => ({
          ...current,
          [index]: { turn: old, take: turnTakes[index] ?? take },
        }));
      const earlier = turnsRef.current.slice(0, index);
      turnsRef.current = earlier;
      setTurns(earlier);
      setTurnTakes((takes) => takes.slice(0, index));
      setTake(nextTake);
      setBeat(BEAT_DONE);
      runId.current = crypto.randomUUID();
      replyRef.current = "";
      setReply("");
      setFailure(null);
      setRetryNotice(false);
      typedRef.current = false;
      setTypingStarted(false);
      deadlineRef.current = null;
      armPending.current = Boolean(timer);
      setClockWaiting(Boolean(timer));
      setClockTotal(timer || 8);
      setRemaining(timer || null);
      if (prefill) {
        // A suggested line counts as typed: the clock gives the typing allowance.
        replyRef.current = prefill.slice(0, 300);
        setReply(replyRef.current);
        typedRef.current = true;
        setTypingStarted(true);
        armPending.current = false;
        setClockWaiting(false);
        if (timer) {
          deadlineRef.current = Date.now() + 25000;
          setClockTotal(25);
          setRemaining(25);
        }
      }
      setPhase("playing");
      setClapper(nextTake);
      paperSound().rustle();
      window.setTimeout(
        () => {
          if (!mounted.current) return;
          setClapper(null);
          setCue((value) => value + 1);
        },
        reduce ? 0 : 900,
      );
    },
    [timer, cancelVoice, clearBeats, take, turnTakes, reduce],
  );

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    writeSoundPref(next);
    if (next) paperSound().enable();
    else paperSound().disable();
  }

  function restart() {
    cancelVoice();
    clearBeats();
    pendingEnd.current = false;
    deadlineRef.current = null;
    armPending.current = false;
    turnsRef.current = [];
    setTurns([]);
    setTurnTakes([]);
    setReplaced({});
    setTake(1);
    setBeat(BEAT_DONE);
    setSession(null);
    setFailure(null);
    setLineReady(false);
    setPhase("intro");
    resetReply();
    if (custom) {
      setLoading(true);
      setReloadKey((key) => key + 1);
    }
  }

  function playInRealTime() {
    choosePace(8);
    restart();
  }

  function retryIntro() {
    setFailure(null);
    setLoading(true);
    setReloadKey((key) => key + 1);
  }

  /* ─── early states ─────────────────────────────────────────── */

  if (loading)
    return (
      <div className={styles.theatre} data-stage-mode="">
        <section className={styles.notice} role="status">
          <Kicker>Take a breath</Kicker>
          <h1>Setting the stage…</h1>
        </section>
      </div>
    );
  if (!daily && failure)
    return (
      <Sheet className={styles.plainSheet}>
        <h1>We couldn&apos;t load this scene.</h1>
        <p role="alert">{failure.message}</p>
        <div className="actions">
          <Button onClick={retryIntro}>Try again</Button>
          <ButtonLink href="/scenes" variant="secondary">
            Back to scenes
          </ButtonLink>
        </div>
      </Sheet>
    );
  if (needsGate && !pro && (proLoading || !activeScene))
    return proLoading ? (
      <div className={styles.theatre} data-stage-mode="">
        <section className={styles.notice} role="status">
          <Kicker>One moment</Kicker>
          <h1>Checking your season pass…</h1>
        </section>
      </div>
    ) : (
      <ProGate feature={custom ? "Replay your own meltdown" : "Scene library"}>
        <p>Choose your scene.</p>
      </ProGate>
    );
  if (needsGate && !pro && activeScene)
    return (
      <div className={styles.theatre} data-stage-mode="" data-phase="intro">
        <header className={styles.topBar}>
          <Link href="/scenes" className={styles.leave}>
            <Icon name="back" size={18} /> Scenes
          </Link>
          <p className={styles.topTitle}>{activeScene.title}</p>
          <Link href="/play" className={styles.leave}>
            Today
          </Link>
        </header>
        <div className={styles.house}>
          <div className={styles.centre}>
            <PaperStage
              scene={activeScene}
              state={{
                arousal: activeScene.startArousal,
                connection: 50,
                lastDelta: 0,
                turn: 0,
              }}
              outcome="intro"
              curtain="closed"
              hud={
                <div className={styles.hudIntro}>
                  <span>{activeScene.place}</span>
                  {par !== undefined && <span>Par {par}</span>}
                </div>
              }
              className={styles.stage}
            />
            <section className={styles.playbill} aria-label="Season pass">
              <TicketBooth feature={activeScene.title} />
            </section>
          </div>
        </div>
      </div>
    );
  if (!activeScene && !failure)
    return (
      <Sheet className={styles.plainSheet}>
        <h1>This scene is no longer here.</h1>
        <p>
          Custom scenes expire after 24 hours. You can start with today&apos;s
          scene or choose another.
        </p>
        <div className="actions">
          <ButtonLink href="/play">Play today&apos;s meltdown</ButtonLink>
          <ButtonLink href="/scenes" variant="secondary">
            Back to scenes
          </ButtonLink>
        </div>
      </Sheet>
    );
  if (!activeScene)
    return (
      <Sheet className={styles.plainSheet}>
        <h1>We couldn&apos;t load this scene.</h1>
        <p role="alert">{failure?.message}</p>
        <div className="actions">
          <Button onClick={retryIntro}>Try again</Button>
          <ButtonLink href="/scenes" variant="secondary">
            Back to scenes
          </ButtonLink>
        </div>
      </Sheet>
    );

  // Stopped as unsafe: house lights up, a plain sheet, no score, no flourish.
  if (phase === "ended" && final?.result.outcome === "stopped_unsafe")
    return (
      <div className={styles.houseLights}>
        <UnsafePause onRetry={() => redo(turns.length - 1)} />
      </div>
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
      <div className="actions">
        {failure.retry &&
          !["session_expired", "session_ended", "turn_out_of_order"].includes(
            failure.code,
          ) && (
            <Button
              variant="secondary"
              size="small"
              onClick={() =>
                void submit(failure.retry?.text ?? "", false, failure.retry)
              }
            >
              Retry this turn
            </Button>
          )}
        {phase === "intro" && (
          <Button variant="secondary" size="small" onClick={() => void start()}>
            Try again
          </Button>
        )}
        <Button variant="secondary" size="small" onClick={restart}>
          Restart scene
        </Button>
      </div>
      {failure.retry && failure.code === "network" && (
        <p className={styles.small}>
          Retrying may replace a turn the server already received and count as a
          do-over.
        </p>
      )}
    </div>
  );

  /* ─── the stage ─────────────────────────────────────────────── */

  const startState = {
    arousal: activeScene.startArousal,
    connection: 50,
    lastDelta: 0,
    turn: 0,
  };
  const engineState = childState ?? {
    ...startState,
    limitIntact: true,
    bribed: false,
    lastHelpfulTags: [],
  };
  // During a turn the stage holds the moment before, until the storm moves (beat 4).
  const shownState =
    final && sequencing && beat < 4 ? final.result.before : engineState;
  const outcome =
    phase === "intro" ? "intro" : (final?.result.outcome ?? "ongoing");
  const shownOutcome = sequencing && beat < 4 ? "ongoing" : outcome;
  const curtain: CurtainState =
    phase === "intro"
      ? "closed"
      : phase === "ended" && outcome === "out_of_turns"
        ? "falling"
        : "open";
  const line = sequencing ? previousChild : child;
  const showBubble =
    phase !== "intro" && lineReady && clapper === null && line?.line;
  const trend = trendOf(shownState.lastDelta);
  const maxTurns = session?.maxTurns ?? 8;
  const turnNumber = Math.min(turns.length + 1, maxTurns);
  const tomorrow =
    isDaily && session && rotation.length
      ? tomorrowFrom(rotation, session.dayNumber)
      : null;

  const hud =
    phase === "intro" ? (
      <div className={styles.hudIntro}>
        <span>{activeScene.place}</span>
        {par !== undefined && <span>Par {par}</span>}
      </div>
    ) : (
      <HeadsUp
        take={take}
        turn={phase === "ended" ? turns.length : turnNumber}
        maxTurns={maxTurns}
        shownStorm={shownState.arousal}
        storm={engineState.arousal}
        trend={trend}
        delta={final && (!sequencing || beat >= 4) ? final.result.delta : null}
        connection={engineState.connection}
        shownConnection={shownState.connection}
      />
    );

  const slip =
    phase === "playing" && final ? (
      <div className={styles.slipArea} aria-live="polite" aria-atomic="false">
        <TurnSlip
          key={`${final.turnIndex}-${take}`}
          turn={final}
          scene={activeScene}
          beat={sequencing ? beat : BEAT_DONE}
          live={sequencing}
          take={turnTakes[turns.length - 1]}
        />
      </div>
    ) : phase === "ended" && final ? (
      <div className={styles.slipArea}>
        <EndingCard
          final={final}
          turns={turns.length}
          par={session?.par ?? par ?? 0}
          titleRef={endingRef}
        />
      </div>
    ) : null;

  const stage = (
    <PaperStage
      scene={activeScene}
      state={shownState}
      outcome={shownOutcome}
      curtain={curtain}
      seed={`${session?.sessionId ?? activeScene.id}:${turns.length}`}
      bubble={
        showBubble && line
          ? {
              line: line.line,
              action: line.action,
              cue,
              lean: wide && phase === "ended" ? "right" : undefined,
            }
          : null
      }
      onBubbleRevealed={() => {
        if (!sequencing && phase === "playing") releaseClock();
      }}
      hud={hud}
      compact={compact}
      className={styles.stage}
    >
      {wide && phase === "ended" && slip}
      {phase === "intro" && waiting && (
        <p className={styles.stageNotice} role="status">
          Setting the stage…
        </p>
      )}
      {clapper !== null && (
        <div className={styles.clapper} role="status">
          <span className={styles.clapperTop} aria-hidden="true" />
          <span className={styles.clapperBoard}>Take {clapper}</span>
        </div>
      )}
    </PaperStage>
  );

  // On a laptop the turn's slip sits beside the stage, so it never covers
  // the child or the line and its total is always in view.
  const scriptSoFar =
    wide && phase === "playing" ? (
      <div className={styles.side}>
        {slip}
        <aside className={styles.soFar} aria-label="The script so far">
          <Kicker>The script so far</Kicker>
          {turns.length <= 1 ? (
            <p className={styles.small}>
              Your lines collect here, with what each one did to the storm.
            </p>
          ) : (
            <ol>
              {turns.slice(0, -1).map((turn) => (
                <li key={turn.turnIndex}>
                  <span className={styles.soFarHead}>
                    <span>Turn {turn.turnIndex + 1}</span>
                    <Icon
                      name={
                        turn.result.delta > 0
                          ? "cloud"
                          : turn.result.delta < 0
                            ? "sun"
                            : "script"
                      }
                      size={14}
                    />
                    <span
                      className="tabular"
                      data-direction={
                        turn.result.delta < 0
                          ? "down"
                          : turn.result.delta > 0
                            ? "up"
                            : "same"
                      }
                    >
                      {turn.result.delta > 0
                        ? "+"
                        : turn.result.delta < 0
                          ? "−"
                          : ""}
                      {Math.abs(turn.result.delta)}
                    </span>
                  </span>
                  <span className={styles.soFarText}>
                    {turn.text ? `“${turn.text}”` : "(froze)"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    ) : null;

  const voiceIntro = (
    <div className={styles.voiceIntro}>
      <ProGate feature="Voice mode" compact>
        <label className={styles.voiceToggle}>
          <input
            type="checkbox"
            checked={voice}
            onChange={(event) => toggleVoice(event.target.checked)}
          />
          Speak your replies
        </label>
        <p className={styles.small}>
          Tap to talk for up to 12 seconds. Audio is sent for transcription and
          is not saved. You can switch back to typing at any time.
        </p>
        {store.settings.calmBaselineDb !== null && (
          <Button
            variant="secondary"
            size="small"
            onClick={() => setCalibrating(true)}
          >
            Recalibrate normal voice
          </Button>
        )}
      </ProGate>
      {voiceNotice && (
        <p className={styles.small} role="status">
          {voiceNotice}
        </p>
      )}
    </div>
  );

  const clockFraction = remaining === null ? 0 : remaining / clockTotal;
  const locked =
    waiting || Boolean(failure) || voiceStatus !== "idle" || sequencing;

  const dock = (
    <div className={styles.dock} data-compact={compact || undefined}>
      {voice && (
        <section className={styles.voiceControls} aria-label="Voice reply">
          {(voiceStatus === "recording" || voiceStatus === "requesting") && (
            <VoiceLevel
              level={liveLevel}
              baseline={store.settings.calmBaselineDb}
            />
          )}
          <div className="actions">
            <Button
              icon="microphone"
              disabled={
                waiting ||
                sequencing ||
                Boolean(failure) ||
                voiceStatus === "requesting" ||
                voiceStatus === "transcribing"
              }
              onClick={() =>
                voiceStatus === "recording"
                  ? stopRecording()
                  : void recordReply()
              }
            >
              {voiceStatus === "recording"
                ? "Stop and send recording"
                : voiceStatus === "requesting"
                  ? "Allow microphone…"
                  : voiceStatus === "transcribing"
                    ? "Transcribing…"
                    : "Tap to talk"}
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => switchToTyping()}
            >
              Use typing
            </Button>
            <Button
              variant="secondary"
              size="small"
              icon="speaker"
              disabled={voiceStatus !== "idle"}
              onClick={hearChild}
            >
              Hear child again
            </Button>
          </div>
          <p className={styles.small} role="status">
            {voiceStatus === "recording"
              ? "Recording ends automatically before 12 seconds. Tap again when you've finished."
              : voiceStatus === "transcribing"
                ? "Your recording has stopped. Turning your words into text…"
                : "The reply timer stops when you begin speaking."}
          </p>
          {playbackUnavailable && (
            <p className={styles.small}>
              Audio playback was blocked. The child&apos;s words are on the
              stage; tap “Hear child again” to retry.
            </p>
          )}
        </section>
      )}
      {voiceNotice && phase === "playing" && (
        <p className={styles.small} role="status">
          {voiceNotice}
        </p>
      )}
      {transcript && (
        <div className={styles.voiceTranscript} aria-live="polite">
          <Kicker>Your transcript</Kicker>
          <p>{transcript}</p>
        </div>
      )}
      <form
        className={styles.replyForm}
        onSubmit={(event) => {
          event.preventDefault();
          void submit(replyRef.current);
        }}
      >
        <div className={styles.replyLabel}>
          <label htmlFor="parent-reply">What do you say?</label>
          <span className={`${styles.small} tabular`}>{reply.length}/300</span>
        </div>
        <div className={styles.replyRow}>
          <textarea
            id="parent-reply"
            ref={inputRef}
            value={reply}
            maxLength={300}
            disabled={locked}
            rows={2}
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
            placeholder={
              sequencing
                ? "Watch what your words did…"
                : "There is room to try again."
            }
            aria-describedby="reply-help"
          />
          <div className={styles.sendGroup}>
            <div
              className={styles.countdown}
              data-low={
                remaining !== null && remaining <= 3 && !waiting
                  ? ""
                  : undefined
              }
              aria-label={
                timer === 0
                  ? "Timer off"
                  : waiting
                    ? "Waiting for the reply"
                    : `${remaining ?? 0} seconds remaining`
              }
              role="timer"
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
              <span className="tabular">
                {timer === 0 ? "∞" : waiting ? "…" : (remaining ?? "–")}
              </span>
            </div>
            <Button
              type="submit"
              icon="arrow"
              iconAfter
              disabled={locked}
              className={styles.sendButton}
            >
              {waiting ? "Listening…" : "Send reply"}
            </Button>
          </div>
        </div>
        <p id="reply-help" className={styles.replyHelp}>
          <span>Enter to send · Shift + Enter for a new line</span>
          {timer !== 0 && (
            <span>
              {typingStarted
                ? "Take a moment to finish your thought."
                : clockWaiting
                  ? "The clock starts when they finish speaking."
                  : "Begin typing before the timer ends."}
            </span>
          )}
        </p>
      </form>
      {errorPanel}
      {retryNotice && (
        <p className={styles.small} role="status">
          Reply received. If the earlier request reached the server, this may be
          recorded as a do-over.
        </p>
      )}
    </div>
  );

  return (
    <div
      className={styles.theatre}
      data-stage-mode=""
      data-phase={phase}
      data-compact={compact || undefined}
    >
      <header className={styles.topBar}>
        <Link href="/" className={styles.leave}>
          <Icon name="back" size={18} /> Leave
        </Link>
        <p className={styles.topTitle}>
          {isDaily
            ? `Do-Over #${session?.dayNumber ?? daily?.dayNumber ?? ""} · ${activeScene.title}`
            : custom
              ? `Your own do-over · ${activeScene.title}`
              : activeScene.title}
        </p>
        {phase === "intro" ? (
          <Link href="/scenes" className={styles.leave}>
            Scenes
          </Link>
        ) : (
          <button
            type="button"
            className={styles.leave}
            aria-pressed={soundOn}
            onClick={toggleSound}
          >
            <Icon name={soundOn ? "speaker" : "speakerOff"} size={18} />
            <span className={styles.soundLabel}>
              {soundOn ? "Sound on" : "Sound off"}
            </span>
          </button>
        )}
      </header>

      <div
        className={styles.house}
        data-wide={wide || undefined}
        data-columns={(wide && phase === "playing") || undefined}
      >
        <div className={styles.centre}>
          {stage}
          {!wide && slip}
          {phase === "intro" && (
            <Playbill
              scene={activeScene}
              par={par}
              kicker={
                isDaily
                  ? `Do-Over #${daily?.dayNumber ?? ""} · Today's meltdown`
                  : custom
                    ? "Your own do-over"
                    : "A little room to rehearse"
              }
              pace={timer}
              onPace={choosePace}
              voiceSlot={voiceIntro}
              notice={
                <>
                  {needsGate && <ProBadge />}
                  {isDaily && daily && store.dailyDone[daily.dayKey] && (
                    <p className={styles.small}>
                      You&apos;ve played today. This run is practice and
                      won&apos;t join today&apos;s ranking.
                    </p>
                  )}
                </>
              }
              errorSlot={errorPanel}
              waiting={waiting}
              onStart={() => void start()}
            />
          )}
          {phase === "playing" && dock}
          {phase === "ended" && session && (
            <Debrief
              session={session}
              turns={turns}
              turnTakes={turnTakes}
              replaced={replaced}
              onRedo={redo}
              onRestart={restart}
              tomorrow={tomorrow}
              realTimeInvite={
                timer === 20 && final?.result.outcome === "calm_limit_held"
              }
              onRealTime={playInRealTime}
            />
          )}
        </div>
        {scriptSoFar}
      </div>

      {phase === "playing" && (
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {sequencing
            ? ""
            : `${activeScene.childName}: ${child?.line ?? ""}${child?.action ? ` (${child.action})` : ""}`}
        </p>
      )}

      {calibrating && (
        <VoiceCalibration
          onComplete={(baseline) => {
            saveSettings({ calmBaselineDb: baseline, voice: true });
            setCalibrating(false);
            setVoiceNotice("");
          }}
          onCancel={() => {
            saveSettings({ voice: false });
            setCalibrating(false);
          }}
          onUnavailable={(message) => {
            setCalibrating(false);
            switchToTyping(message);
          }}
        />
      )}
    </div>
  );
}
