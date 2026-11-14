"use client";

import { useEffect, useRef, useState } from "react";
import { createRecording, RecordingError } from "@/voice/recorder";
import { calibrateBaseline } from "@/voice/loudness";
import styles from "./play.module.css";

function levelPercent(db: number) {
  return Math.min(100, Math.max(0, ((db + 70) / 70) * 100));
}

export function VoiceLevel({
  level,
  baseline,
}: {
  level: number;
  baseline: number | null;
}) {
  const loud = baseline !== null && level - baseline >= 10;
  return (
    <div className={styles.voiceLevel}>
      <div className={styles.voiceLevelLabel}>
        <span>Microphone level</span>
        <span>{loud ? "Raised voice" : "Listening"}</span>
      </div>
      <div
        className={styles.voiceLevelTrack}
        role="meter"
        aria-label="Microphone level"
        aria-valuemin={-70}
        aria-valuemax={0}
        aria-valuenow={Math.round(Math.min(0, Math.max(-70, level)))}
        aria-valuetext={
          loud ? "Above your normal voice" : "Within your normal voice range"
        }
      >
        <span style={{ width: `${levelPercent(level)}%` }} data-loud={loud} />
        {baseline !== null && (
          <i
            style={{ left: `${levelPercent(baseline)}%` }}
            aria-hidden="true"
          />
        )}
      </div>
      {baseline !== null && (
        <p className={styles.small}>
          The mark is your normal voice. A sustained rise of 10 dB adds the
          raised-voice tag.
        </p>
      )}
    </div>
  );
}

export function VoiceCalibration({
  onComplete,
  onCancel,
  onUnavailable,
}: {
  onComplete: (baseline: number) => void;
  onCancel: () => void;
  onUnavailable: (message: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const controller = useRef<AbortController | null>(null);
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(-70);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => {
      controller.current?.abort();
      element?.close();
    };
  }, []);
  function cancel() {
    controller.current?.abort();
    onCancel();
  }
  async function calibrate() {
    if (recording) return;
    const abort = new AbortController();
    controller.current = abort;
    setRecording(true);
    setError("");
    try {
      const handle = await createRecording({
        durationMs: 3000,
        signal: abort.signal,
        onLevel: setLevel,
      });
      const result = await handle.result;
      if (!abort.signal.aborted) onComplete(calibrateBaseline(result.windowDb));
    } catch (cause) {
      if (!abort.signal.aborted) {
        if (
          cause instanceof RecordingError &&
          [
            "permission_denied",
            "unsupported",
            "microphone_unavailable",
          ].includes(cause.code)
        )
          onUnavailable(`${cause.message} Typing is ready.`);
        else
          setError(
            cause instanceof Error
              ? cause.message
              : "We couldn't measure your voice. You can keep typing.",
          );
      }
    } finally {
      if (!abort.signal.aborted) setRecording(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className={styles.calibrationDialog}
      aria-labelledby="voice-calibration-title"
      aria-describedby="voice-calibration-description"
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
    >
      <p className="kicker">A quick sound check</p>
      <h2 id="voice-calibration-title">Find your normal voice.</h2>
      <p id="voice-calibration-description">
        Say hello in your normal voice for three seconds. Keep the microphone at
        the same distance when you practise. This sound check stays in your
        browser.
      </p>
      {recording && (
        <>
          <VoiceLevel level={level} baseline={null} />
          <p role="status">Say “Hello, I&apos;m here” in your normal voice…</p>
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <div className={styles.actions}>
        <button
          className="button"
          type="button"
          disabled={recording}
          onClick={() => void calibrate()}
        >
          {recording
            ? "Measuring for three seconds…"
            : error
              ? "Try sound check again"
              : "Start sound check"}
        </button>
        <button type="button" className="button-secondary" onClick={cancel}>
          Use typing instead
        </button>
      </div>
    </dialog>
  );
}
