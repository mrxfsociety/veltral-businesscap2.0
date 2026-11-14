import { rmsDb, SILENCE_DB } from "./loudness";

export const MAX_RECORDING_MS = 11_800;
const MIN_RECORDING_MS = 300;
const SUPPORTED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/webm",
  "audio/wav",
] as const;

export type RecordingErrorCode =
  | "unsupported"
  | "permission_denied"
  | "microphone_unavailable"
  | "cancelled"
  | "too_short"
  | "too_long"
  | "recording_failed";
export class RecordingError extends Error {
  constructor(
    public code: RecordingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RecordingError";
  }
}
export interface RecordingResult {
  audio: Blob;
  peakDb: number;
  durationMs: number;
  windowDb: number[];
}
export interface RecordingHandle {
  result: Promise<RecordingResult>;
  stop: () => Promise<RecordingResult>;
  cancel: () => void;
}
export interface RecordingOptions {
  onLevel?: (db: number) => void;
  onSpeechStart?: () => void;
  durationMs?: number;
  speechThresholdDb?: number;
  signal?: AbortSignal;
}

export function selectRecordingMime(
  isSupported: (mime: string) => boolean,
): string | null {
  return SUPPORTED_MIME_TYPES.find(isSupported) ?? null;
}

function cancellation(): RecordingError {
  return new RecordingError(
    "cancelled",
    "Recording cancelled. You can type your reply instead.",
  );
}
function microphoneError(cause: unknown): RecordingError {
  if (cause instanceof RecordingError) return cause;
  if (
    cause instanceof DOMException &&
    (cause.name === "NotAllowedError" || cause.name === "SecurityError")
  )
    return new RecordingError(
      "permission_denied",
      "Microphone access wasn't allowed. You can keep practising by typing.",
    );
  return new RecordingError(
    "microphone_unavailable",
    "The microphone isn't available. You can type your reply instead.",
  );
}

/** The processor observes continuous samples; overlapping 300 ms RMS windows are emitted every 50 ms. */
const PROCESSOR_SOURCE = `class DoOverLevelProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.size = Math.max(1, Math.round(sampleRate * 0.3));
    this.hop = Math.max(1, Math.round(sampleRate * 0.05));
    this.samples = new Float32Array(this.size);
    this.cursor = 0;
    this.count = 0;
    this.energy = 0;
    this.hopCount = 0;
  }
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;
    for (let i = 0; i < channel.length; i += 1) {
      const value = Number.isFinite(channel[i]) ? Math.max(-1, Math.min(1, channel[i])) : 0;
      const previous = this.samples[this.cursor];
      this.energy += value * value - previous * previous;
      this.samples[this.cursor] = value;
      this.cursor = (this.cursor + 1) % this.size;
      this.count += 1;
      this.hopCount += 1;
      if (this.count >= this.size && (this.count === this.size || this.hopCount >= this.hop)) {
        this.port.postMessage({ db: Math.max(-120, 10 * Math.log10(Math.max(0, this.energy) / this.size || 1e-12)) });
        this.hopCount = 0;
      }
    }
    return true;
  }
}
registerProcessor("do-over-level", DoOverLevelProcessor);`;

/** Starts capture after permission, and releases every stream, node and timer on stop or cancellation. */
export async function createRecording(
  options: RecordingOptions = {},
): Promise<RecordingHandle> {
  if (options.signal?.aborted) throw cancellation();
  if (
    typeof window === "undefined" ||
    !window.isSecureContext ||
    !navigator.mediaDevices?.getUserMedia ||
    typeof MediaRecorder === "undefined" ||
    typeof AudioContext === "undefined" ||
    typeof AudioWorkletNode === "undefined"
  ) {
    throw new RecordingError(
      "unsupported",
      "Voice needs HTTPS and a browser with microphone recording. You can type instead.",
    );
  }
  const mimeType = selectRecordingMime((mime) =>
    MediaRecorder.isTypeSupported(mime),
  );
  if (!mimeType)
    throw new RecordingError(
      "unsupported",
      "This browser's recording format isn't supported. You can type instead.",
    );
  const requestedDuration = Number.isFinite(options.durationMs)
    ? (options.durationMs ?? MAX_RECORDING_MS)
    : MAX_RECORDING_MS;
  const durationMs = Math.min(
    MAX_RECORDING_MS,
    Math.max(MIN_RECORDING_MS, requestedDuration),
  );
  const threshold = Number.isFinite(options.speechThresholdDb)
    ? (options.speechThresholdDb ?? -55)
    : -55;
  let cancelled = false;
  let stream: MediaStream | null = null;
  let context: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;
  let worklet: AudioWorkletNode | null = null;
  let muted: GainNode | null = null;
  let recorder: MediaRecorder | null = null;
  let frame: number | null = null;
  let cap: ReturnType<typeof setTimeout> | null = null;
  let startedAt = 0;
  let stopDuration = 0;
  let settled = false;
  let stopRequested = false;
  let spoken = false;
  const windows: number[] = [];
  const chunks: Blob[] = [];
  let resolveResult: (value: RecordingResult) => void = () => undefined;
  let rejectResult: (error: RecordingError) => void = () => undefined;
  const result = new Promise<RecordingResult>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });
  void result.catch(() => undefined);

  const cleanup = () => {
    if (cap !== null) clearTimeout(cap);
    if (frame !== null) cancelAnimationFrame(frame);
    cap = null;
    frame = null;
    options.signal?.removeEventListener("abort", abort);
    if (worklet) {
      worklet.port.onmessage = null;
      worklet.port.close();
      worklet.disconnect();
    }
    source?.disconnect();
    analyser?.disconnect();
    muted?.disconnect();
    stream?.getTracks().forEach((track) => track.stop());
    if (context && context.state !== "closed")
      void context.close().catch(() => undefined);
  };
  const fail = (error: RecordingError) => {
    if (settled) return;
    settled = true;
    chunks.length = 0;
    rejectResult(error);
    if (recorder && recorder.state !== "inactive") recorder.stop();
    cleanup();
  };
  function abort() {
    cancelled = true;
    fail(cancellation());
  }
  const stop = () => {
    if (!stopRequested && !settled) {
      stopRequested = true;
      stopDuration = performance.now() - startedAt;
      if (cap !== null) clearTimeout(cap);
      if (recorder?.state === "recording") recorder.stop();
    }
    return result;
  };
  options.signal?.addEventListener("abort", abort, { once: true });

  try {
    const mediaPromise = navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
        video: false,
      })
      .then((acquiredStream) => {
        if (cancelled || options.signal?.aborted)
          acquiredStream.getTracks().forEach((track) => track.stop());
        return acquiredStream;
      });
    const acquired = await Promise.race([
      mediaPromise,
      result.then(() => {
        throw cancellation();
      }),
    ]);
    stream = acquired;
    if (cancelled || options.signal?.aborted) {
      stream.getTracks().forEach((track) => track.stop());
      throw cancellation();
    }
    context = new AudioContext();
    await Promise.race([context.resume(), result]);
    if (!context.audioWorklet)
      throw new RecordingError(
        "unsupported",
        "Your browser can't measure voice level reliably. You can type instead.",
      );
    const processorUrl = URL.createObjectURL(
      new Blob([PROCESSOR_SOURCE], { type: "text/javascript" }),
    );
    try {
      await Promise.race([
        context.audioWorklet.addModule(processorUrl),
        result,
      ]);
    } finally {
      URL.revokeObjectURL(processorUrl);
    }
    if (cancelled || options.signal?.aborted) throw cancellation();
    source = context.createMediaStreamSource(stream);
    analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    worklet = new AudioWorkletNode(context, "do-over-level", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      channelCount: 1,
    });
    muted = context.createGain();
    muted.gain.value = 0;
    analyser.connect(worklet);
    worklet.connect(muted);
    muted.connect(context.destination);
    worklet.port.onmessage = (event: MessageEvent<unknown>) => {
      const value = event.data;
      if (
        settled ||
        !value ||
        typeof value !== "object" ||
        !("db" in value) ||
        typeof value.db !== "number" ||
        !Number.isFinite(value.db)
      )
        return;
      windows.push(value.db);
    };
    const buffer = new Float32Array(analyser.fftSize);
    const liveAnalyser = analyser;
    const updateLevel = () => {
      if (settled) return;
      liveAnalyser.getFloatTimeDomainData(buffer);
      const db = rmsDb(buffer);
      // Detect speech promptly; the independent worklet windows still decide sustained loudness.
      if (!spoken && db >= threshold) {
        spoken = true;
        options.onSpeechStart?.();
      }
      options.onLevel?.(db);
      frame = requestAnimationFrame(updateLevel);
    };
    recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (event: BlobEvent) => {
      if (!settled && event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () =>
      fail(
        new RecordingError(
          "recording_failed",
          "Recording stopped unexpectedly. Please try again or type your reply.",
        ),
      );
    recorder.onstop = () => {
      if (settled) {
        cleanup();
        return;
      }
      const elapsed = stopDuration || performance.now() - startedAt;
      if (elapsed > 12_000) {
        fail(
          new RecordingError(
            "too_long",
            "The recording ran too long while the browser was busy. Please try a shorter reply.",
          ),
        );
        return;
      }
      if (elapsed < MIN_RECORDING_MS || windows.length === 0) {
        fail(
          new RecordingError(
            "too_short",
            "Speak for a little longer, then tap to finish. You can also type your reply.",
          ),
        );
        return;
      }
      const audio = new Blob(chunks, { type: mimeType });
      if (!audio.size) {
        fail(
          new RecordingError(
            "recording_failed",
            "No audio was captured. Please try again or type your reply.",
          ),
        );
        return;
      }
      settled = true;
      const peakDb = Math.max(SILENCE_DB, ...windows);
      chunks.length = 0;
      cleanup();
      resolveResult({
        audio,
        peakDb,
        durationMs: elapsed,
        windowDb: [...windows],
      });
    };
    startedAt = performance.now();
    recorder.start();
    cap = setTimeout(() => {
      void stop();
    }, durationMs);
    frame = requestAnimationFrame(updateLevel);
    return { result, stop, cancel: abort };
  } catch (cause) {
    const error =
      cancelled || options.signal?.aborted
        ? cancellation()
        : microphoneError(cause);
    fail(error);
    throw error;
  }
}
