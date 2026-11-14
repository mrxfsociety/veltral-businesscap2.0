import { speakAudio } from "./api";

export type PlaybackResult = "server" | "browser" | "unavailable";
export interface ChildPlayback {
  sessionId: string;
  turnIndex: number;
  line: string;
  arousal: number;
}

/** Keep every voice audible without letting the simulated arousal exceed normal volume. */
export function playbackVolume(arousal: number): number {
  return (
    0.4 +
    (0.5 * Math.min(100, Math.max(0, Number.isFinite(arousal) ? arousal : 0))) /
      100
  );
}

function playBlob(
  blob: Blob,
  volume: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Playback cancelled", "AbortError"));
      return;
    }
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = volume;
    let finished = false;
    const timeout = setTimeout(
      () => finish(new Error("Playback timed out")),
      20_000,
    );
    const abort = () =>
      finish(new DOMException("Playback cancelled", "AbortError"));
    function finish(error?: Error) {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      URL.revokeObjectURL(url);
      if (error) reject(error);
      else resolve();
    }
    signal.addEventListener("abort", abort, { once: true });
    audio.onended = () => finish();
    audio.onerror = () => finish(new Error("Audio playback is unavailable"));
    void audio
      .play()
      .catch((error: unknown) =>
        finish(
          error instanceof Error
            ? error
            : new Error("Audio playback was blocked"),
        ),
      );
  });
}

function browserSpeech(
  line: string,
  volume: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Playback cancelled", "AbortError"));
      return;
    }
    if (
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    ) {
      reject(new Error("Speech is unavailable"));
      return;
    }
    const speech = new SpeechSynthesisUtterance(line);
    speech.lang = "en-US";
    speech.pitch = 1.35;
    speech.rate = 1.02;
    speech.volume = volume;
    let finished = false;
    const timeout = setTimeout(
      () => finish(new Error("Browser speech timed out")),
      20_000,
    );
    const abort = () => {
      window.speechSynthesis.cancel();
      finish(new DOMException("Playback cancelled", "AbortError"));
    };
    function finish(error?: Error) {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      speech.onend = null;
      speech.onerror = null;
      if (error) window.speechSynthesis.cancel();
      if (error) reject(error);
      else resolve();
    }
    signal.addEventListener("abort", abort, { once: true });
    speech.onend = () => finish();
    speech.onerror = () => finish(new Error("Browser speech was blocked"));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
  });
}

/** Prefer server speech; browser speech uses only the same server-returned child line. */
export async function playChildReply(
  reply: ChildPlayback,
  signal: AbortSignal,
): Promise<PlaybackResult> {
  if (signal.aborted) return "unavailable";
  const volume = playbackVolume(reply.arousal);
  try {
    await playBlob(
      await speakAudio(
        { sessionId: reply.sessionId, turnIndex: reply.turnIndex },
        signal,
      ),
      volume,
      signal,
    );
    return "server";
  } catch {
    if (signal.aborted) return "unavailable";
  }
  try {
    await browserSpeech(reply.line, volume, signal);
    return "browser";
  } catch {
    return "unavailable";
  }
}
