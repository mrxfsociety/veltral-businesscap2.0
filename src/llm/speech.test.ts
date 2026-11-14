import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSpeechProvider,
  SpeechUnavailableError,
  type SpeechClient,
} from "./speech";

function fakeClient(): SpeechClient {
  return {
    transcribe: vi.fn(async () => ({ text: "  Let us take a breath.  " })),
    speak: vi.fn(async () => ({
      arrayBuffer: async () => Uint8Array.from([73, 68, 51, 1]).buffer,
    })),
  };
}

afterEach(() => vi.useRealTimers());

describe("speech provider", () => {
  it("forwards the audio in memory with the configured model and no retry", async () => {
    const client = fakeClient();
    const audio = new File(["sound"], "reply.webm", { type: "audio/webm" });
    const provider = createSpeechProvider(
      { transcribeModel: "configured-transcriber" },
      client,
    );
    await expect(provider.transcribeAudio(audio)).resolves.toBe(
      "Let us take a breath.",
    );
    expect(client.transcribe).toHaveBeenCalledWith(
      {
        file: audio,
        model: "configured-transcriber",
        response_format: "json",
        language: "en",
      },
      { signal: expect.any(AbortSignal), timeout: 10_000, maxRetries: 0 },
    );
  });

  it("returns MP3 bytes and requests age appropriate delivery", async () => {
    const client = fakeClient();
    const provider = createSpeechProvider(
      { ttsModel: "configured-tts" },
      client,
    );
    await expect(
      provider.synthesizeSpeech("I want my boots."),
    ).resolves.toEqual(Uint8Array.from([73, 68, 51, 1]));
    expect(client.speak).toHaveBeenCalledWith(
      {
        model: "configured-tts",
        input: "I want my boots.",
        voice: "coral",
        response_format: "mp3",
        instructions: expect.stringContaining("young child"),
      },
      { signal: expect.any(AbortSignal), timeout: 10_000, maxRetries: 0 },
    );
  });

  it.each(["tts-1", "tts-1-hd"])(
    "omits unsupported delivery instructions for %s",
    async (model) => {
      const client = fakeClient();
      await createSpeechProvider({ ttsModel: model }, client).synthesizeSpeech(
        "Fine, I will try.",
      );
      expect(client.speak).toHaveBeenCalledWith(
        {
          model,
          input: "Fine, I will try.",
          voice: "coral",
          response_format: "mp3",
        },
        expect.objectContaining({ maxRetries: 0 }),
      );
    },
  );

  it("returns silence as an empty transcript", async () => {
    const client = fakeClient();
    vi.mocked(client.transcribe).mockResolvedValue({ text: " " });
    await expect(
      createSpeechProvider(
        { transcribeModel: "configured-transcriber" },
        client,
      ).transcribeAudio(new File(["sound"], "reply.webm")),
    ).resolves.toBe("");
  });

  it("checks the call budget once per provider invocation and refuses a spent budget", async () => {
    const client = fakeClient();
    const reserveCall = vi.fn(async () => true);
    const provider = createSpeechProvider(
      {
        ttsModel: "configured-tts",
        transcribeModel: "configured-transcriber",
        reserveCall,
      },
      client,
    );
    await provider.synthesizeSpeech("I can do that.");
    await provider.transcribeAudio(new File(["sound"], "reply.webm"));
    expect(reserveCall).toHaveBeenCalledTimes(2);
    reserveCall.mockResolvedValue(false);
    await expect(provider.synthesizeSpeech("Please wait.")).rejects.toThrow(
      SpeechUnavailableError,
    );
    expect(client.speak).toHaveBeenCalledTimes(1);
  });

  it.each([null, {}, { text: 42 }])(
    "rejects a malformed transcript without leaking provider details",
    async (result) => {
      const client = fakeClient();
      vi.mocked(client.transcribe).mockResolvedValue(result);
      await expect(
        createSpeechProvider(
          { transcribeModel: "configured-transcriber" },
          client,
        ).transcribeAudio(new File(["sound"], "reply.webm")),
      ).rejects.toThrow(SpeechUnavailableError);
    },
  );

  it("replaces provider failures with a safe error", async () => {
    const client = fakeClient();
    vi.mocked(client.speak).mockRejectedValue(
      new Error("private provider data"),
    );
    await expect(
      createSpeechProvider(
        { ttsModel: "configured-tts" },
        client,
      ).synthesizeSpeech("I will hold it."),
    ).rejects.toThrow("Voice is unavailable right now. Please use text.");
  });

  it("aborts and settles even when a provider ignores cancellation", async () => {
    vi.useFakeTimers();
    const client = fakeClient();
    let signal: AbortSignal | undefined;
    vi.mocked(client.transcribe).mockImplementation((_, options) => {
      signal = options.signal;
      return new Promise(() => undefined);
    });
    const result = createSpeechProvider(
      { transcribeModel: "configured-transcriber", timeoutMs: 40 },
      client,
    ).transcribeAudio(new File(["sound"], "reply.webm"));
    const assertion = expect(result).rejects.toThrow(SpeechUnavailableError);
    await vi.advanceTimersByTimeAsync(40);
    await assertion;
    expect(signal?.aborted).toBe(true);
    expect(client.transcribe).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("times out while reading the speech response body too", async () => {
    vi.useFakeTimers();
    const client = fakeClient();
    vi.mocked(client.speak).mockResolvedValue({
      arrayBuffer: () => new Promise(() => undefined),
    });
    const result = createSpeechProvider(
      { ttsModel: "configured-tts", timeoutMs: 40 },
      client,
    ).synthesizeSpeech("Not that one.");
    const assertion = expect(result).rejects.toThrow(SpeechUnavailableError);
    await vi.advanceTimersByTimeAsync(40);
    await assertion;
  });

  it("refuses missing configuration before contacting a provider", async () => {
    const client = fakeClient();
    const provider = createSpeechProvider({}, client);
    await expect(provider.synthesizeSpeech("Wait for me.")).rejects.toThrow(
      SpeechUnavailableError,
    );
    await expect(
      provider.transcribeAudio(new File(["sound"], "reply.webm")),
    ).rejects.toThrow(SpeechUnavailableError);
    await expect(
      createSpeechProvider({ ttsModel: "configured-tts" }).synthesizeSpeech(
        "Wait for me.",
      ),
    ).rejects.toThrow(SpeechUnavailableError);
    expect(client.speak).not.toHaveBeenCalled();
    expect(client.transcribe).not.toHaveBeenCalled();
  });

  it("rejects empty speech output and invalid source lines", async () => {
    const client = fakeClient();
    const provider = createSpeechProvider(
      { ttsModel: "configured-tts" },
      client,
    );
    await expect(provider.synthesizeSpeech("")).rejects.toThrow(
      SpeechUnavailableError,
    );
    await expect(provider.synthesizeSpeech("x".repeat(121))).rejects.toThrow(
      SpeechUnavailableError,
    );
    expect(client.speak).not.toHaveBeenCalled();
    vi.mocked(client.speak).mockResolvedValue({
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    await expect(provider.synthesizeSpeech("All right.")).rejects.toThrow(
      SpeechUnavailableError,
    );
  });
});
