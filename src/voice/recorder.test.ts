import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createRecording,
  MAX_RECORDING_MS,
  selectRecordingMime,
} from "./recorder";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("recording compatibility and cancellation", () => {
  it("leaves headroom below the server's strict twelve-second limit", () => {
    expect(MAX_RECORDING_MS).toBeLessThan(12000);
    expect(MAX_RECORDING_MS).toBeGreaterThan(11000);
  });
  it("chooses a supported server format and never falls back to Ogg", () => {
    expect(selectRecordingMime((mime) => mime.startsWith("audio/mp4"))).toBe(
      "audio/mp4;codecs=mp4a.40.2",
    );
    expect(selectRecordingMime((mime) => mime.startsWith("audio/webm"))).toBe(
      "audio/webm;codecs=opus",
    );
    expect(
      selectRecordingMime((mime) => mime.startsWith("audio/ogg")),
    ).toBeNull();
  });
  it("fails with an actionable unsupported-browser error", async () => {
    vi.stubGlobal("window", undefined);
    await expect(createRecording()).rejects.toMatchObject({
      code: "unsupported",
    });
  });
  it("honours cancellation before opening the microphone", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      createRecording({ signal: controller.signal }),
    ).rejects.toMatchObject({ code: "cancelled" });
  });
  it("releases a microphone granted after the caller has cancelled", async () => {
    let grant: (stream: MediaStream) => void = () => undefined;
    const microphone = new Promise<MediaStream>((resolve) => {
      grant = resolve;
    });
    const stop = vi.fn();
    vi.stubGlobal("window", { isSecureContext: true });
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: vi.fn(() => microphone) },
    });
    vi.stubGlobal("MediaRecorder", { isTypeSupported: () => true });
    vi.stubGlobal("AudioContext", class {});
    vi.stubGlobal("AudioWorkletNode", class {});
    const controller = new AbortController();
    const recording = createRecording({ signal: controller.signal });
    controller.abort();
    await expect(recording).rejects.toMatchObject({ code: "cancelled" });
    grant({ getTracks: () => [{ stop }] } as unknown as MediaStream);
    await vi.waitFor(() => expect(stop).toHaveBeenCalledTimes(1));
  });
  it("detects speech before a full loudness window is available", async () => {
    let frame: FrameRequestCallback = () => undefined;
    const onSpeechStart = vi.fn();
    const stopTrack = vi.fn();
    const disconnect = vi.fn();
    const close = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("window", { isSecureContext: true });
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: stopTrack }],
        }),
      },
    });
    vi.stubGlobal(
      "MediaRecorder",
      class {
        static isTypeSupported() {
          return true;
        }
        state = "inactive";
        start() {
          this.state = "recording";
        }
        stop() {
          this.state = "inactive";
        }
      },
    );
    vi.stubGlobal(
      "AudioContext",
      class {
        state = "running";
        destination = {};
        audioWorklet = { addModule: vi.fn().mockResolvedValue(undefined) };
        resume = vi.fn().mockResolvedValue(undefined);
        close = close;
        createMediaStreamSource() {
          return { connect: vi.fn(), disconnect };
        }
        createAnalyser() {
          return {
            fftSize: 2048,
            connect: vi.fn(),
            disconnect,
            getFloatTimeDomainData: (buffer: Float32Array) => buffer.fill(0.1),
          };
        }
        createGain() {
          return { gain: { value: 0 }, connect: vi.fn(), disconnect };
        }
      },
    );
    vi.stubGlobal(
      "AudioWorkletNode",
      class {
        port = { onmessage: null, close: vi.fn() };
        connect = vi.fn();
        disconnect = disconnect;
      },
    );
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        frame = callback;
        return 1;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const handle = await createRecording({
      onSpeechStart,
      speechThresholdDb: -40,
    });
    expect(onSpeechStart).not.toHaveBeenCalled();
    // No AudioWorklet 300 ms message has arrived: the first analyser frame must suffice.
    frame(0);
    expect(onSpeechStart).toHaveBeenCalledOnce();
    frame(16);
    expect(onSpeechStart).toHaveBeenCalledOnce();
    handle.cancel();
    await expect(handle.result).rejects.toMatchObject({ code: "cancelled" });
    expect(stopTrack).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });
  it("maps denied permission to a typing fallback", async () => {
    vi.stubGlobal("window", { isSecureContext: true });
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi
          .fn()
          .mockRejectedValue(new DOMException("denied", "NotAllowedError")),
      },
    });
    vi.stubGlobal("MediaRecorder", { isTypeSupported: () => true });
    vi.stubGlobal("AudioContext", class {});
    vi.stubGlobal("AudioWorkletNode", class {});
    await expect(createRecording()).rejects.toMatchObject({
      code: "permission_denied",
    });
  });
});
