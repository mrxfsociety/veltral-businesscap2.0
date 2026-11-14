import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyTurn, initialState } from "../engine/transition";
import { getScene } from "../engine/scenes";
import { ErrorResponseSchema } from "../shared/api";
import { ApiError } from "./http";
import { Storage } from "./redis";
import { createSessionStore } from "./sessionStore";
import { createVoiceHandlers } from "./voice";

let storage: Storage;
let now: number;
beforeEach(() => {
  now = Date.parse("2026-11-14T15:00:00Z");
  storage = new Storage({ now: () => now });
});
afterEach(() => storage.close());
const AUDIO = new Uint8Array([73, 68, 51, 4, 0, 0]);
function recording(size = 20, type = "audio/webm") {
  return new File([new Uint8Array(size)], "recording.webm", { type });
}
function multipart(
  audio: File | null = recording(),
  extras: { key: string; value: string | File }[] = [],
) {
  const body = new FormData();
  if (audio) body.append("audio", audio);
  for (const extra of extras) body.append(extra.key, extra.value);
  return new Request("https://doover.example/api/transcribe", {
    method: "POST",
    body,
    headers: { "x-forwarded-for": "198.51.100.33" },
  });
}
function speakRequest(
  sessionId: string,
  turnIndex = -1,
  extra: Record<string, unknown> = {},
) {
  return new Request("https://doover.example/api/speak", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.34",
    },
    body: JSON.stringify({ sessionId, turnIndex, ...extra }),
  });
}
async function storedSession(
  childLine: string | null = "I need another moment.",
) {
  const scene = getScene("store-candy")!;
  const sessions = createSessionStore(storage);
  const session = await sessions.createSession({
    scene,
    kind: "library",
    dayKey: "2026-11-14",
    par: 3,
  });
  session.turns.push({
    turnIndex: 0,
    text: "A calm reply.",
    hits: [],
    result: applyTurn(
      scene,
      initialState(scene),
      childLine === null ? ["UNSAFE"] : ["CONNECT"],
    ),
    child: childLine === null ? null : { line: childLine, action: "pauses" },
    tagging: "rules",
    score: null,
    daily: null,
    usedDoOver: false,
  });
  await sessions.saveSession(session);
  return session;
}

describe("voice transcription endpoint", () => {
  it("validates the recording, forwards it once and stores no audio", async () => {
    const validate = vi.fn<(file: File) => Promise<void>>(async () => {});
    const transcribe = vi.fn<(file: File) => Promise<string>>(
      async () => "I can wait beside you.",
    );
    const set = vi.spyOn(storage, "set");
    const response = await createVoiceHandlers({
      storage,
      validate,
      transcribe,
    }).transcribe(multipart());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ text: "I can wait beside you." });
    expect(validate).toHaveBeenCalledOnce();
    expect(transcribe).toHaveBeenCalledOnce();
    expect(transcribe.mock.calls[0][0]).toBeInstanceOf(File);
    expect(transcribe.mock.calls[0][0].size).toBe(20);
    expect(set).not.toHaveBeenCalled();
  });

  it("rejects empty, oversized, missing, repeated and extra multipart inputs before the provider", async () => {
    const transcribe = vi.fn(async () => "unused");
    const validate = vi.fn(async () => {});
    const handler = createVoiceHandlers({
      storage,
      validate,
      transcribe,
    }).transcribe;
    const inputs = [
      multipart(recording(0)),
      multipart(recording(1_000_001)),
      multipart(null),
      multipart(recording(), [{ key: "audio", value: recording() }]),
      multipart(recording(), [{ key: "text", value: "unexpected" }]),
    ];
    for (const input of inputs) {
      const response = await handler(input);
      expect(response.status).toBe(400);
      expect(ErrorResponseSchema.parse(await response.json()).error).toBe(
        "validation",
      );
    }
    expect(validate).not.toHaveBeenCalled();
    expect(transcribe).not.toHaveBeenCalled();
  });

  it("rejects malformed multipart, incorrect content type and a file failing audio validation", async () => {
    const transcribe = vi.fn(async () => "unused");
    const validate = vi.fn(async () => {
      throw new ApiError(
        400,
        "validation",
        "Please use a supported audio format.",
      );
    });
    const handler = createVoiceHandlers({
      storage,
      validate,
      transcribe,
    }).transcribe;
    const wrongType = new Request("https://doover.example/api/transcribe", {
      method: "POST",
      body: "audio",
      headers: { "content-type": "application/json" },
    });
    const malformed = new Request("https://doover.example/api/transcribe", {
      method: "POST",
      body: "invalid",
      headers: { "content-type": "multipart/form-data; boundary=not-present" },
    });
    for (const input of [
      wrongType,
      malformed,
      multipart(recording(20, "text/plain")),
    ]) {
      expect((await handler(input)).status).toBe(400);
    }
    expect(validate).toHaveBeenCalledOnce();
    expect(transcribe).not.toHaveBeenCalled();
  });

  it("bounds the whole multipart stream even when no length header is present", async () => {
    const transcribe = vi.fn(async () => "unused");
    const handler = createVoiceHandlers({
      storage,
      validate: async () => {},
      transcribe,
    }).transcribe;
    const declaredOversize = new Request(
      "https://doover.example/api/transcribe",
      {
        method: "POST",
        body: "tiny",
        headers: {
          "content-type": "multipart/form-data; boundary=x",
          "content-length": "2000000",
        },
      },
    );
    expect((await handler(declaredOversize)).status).toBe(400);
    const streamedOversize = new Request(
      "https://doover.example/api/transcribe",
      {
        method: "POST",
        body: new Blob([new Uint8Array(1_020_001)]),
        headers: { "content-type": "multipart/form-data; boundary=x" },
      },
    );
    expect((await handler(streamedOversize)).status).toBe(400);
    expect(transcribe).not.toHaveBeenCalled();
  });

  it("returns a clear sanitized failure when transcription is unavailable", async () => {
    const handler = createVoiceHandlers({
      storage,
      validate: async () => {},
      transcribe: async () => {
        throw new Error("private-provider-secret");
      },
    }).transcribe;
    const response = await handler(multipart());
    expect(response.status).toBe(500);
    const body = ErrorResponseSchema.parse(await response.json());
    expect(body.error).toBe("voice_unavailable");
    expect(body.message).toContain("use text");
    expect(body.message).not.toContain("private-provider-secret");
  });

  it("allows 120 recordings then returns 429 without another provider call", async () => {
    const transcribe = vi.fn(async () => "A transcribed phrase.");
    const handler = createVoiceHandlers({
      storage,
      validate: async () => {},
      transcribe,
    }).transcribe;
    for (let count = 0; count < 120; count++)
      expect((await handler(multipart())).status).toBe(200);
    const response = await handler(multipart());
    expect(response.status).toBe(429);
    expect(ErrorResponseSchema.parse(await response.json()).error).toBe(
      "rate_limited",
    );
    expect(transcribe).toHaveBeenCalledTimes(120);
  });
});

describe("voice playback endpoint", () => {
  it("speaks only the session opening and stored child lines and returns binary audio", async () => {
    const session = await storedSession();
    const speak = vi.fn<(text: string) => Promise<Uint8Array>>(
      async () => AUDIO,
    );
    const handler = createVoiceHandlers({ storage, speak }).speak;
    for (const index of [-1, 0]) {
      const response = await handler(speakRequest(session.id, index));
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("audio/mpeg");
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(AUDIO);
    }
    expect(speak.mock.calls.map(([text]) => text)).toEqual([
      session.scene.openingLine,
      "I need another moment.",
    ]);
    expect(
      (
        await handler(
          speakRequest(session.id, 0, {
            text: "Speak this arbitrary content.",
          }),
        )
      ).status,
    ).toBe(400);
    expect(speak).toHaveBeenCalledTimes(2);
  });

  it("rejects missing sessions, missing turns, invalid indices and unsafe null lines", async () => {
    const session = await storedSession(null);
    const speak = vi.fn(async () => AUDIO);
    const handler = createVoiceHandlers({ storage, speak }).speak;
    expect((await handler(speakRequest("does-not-exist"))).status).toBe(404);
    expect((await handler(speakRequest(session.id, 7))).status).toBe(404);
    expect((await handler(speakRequest(session.id, -2))).status).toBe(400);
    const unsafe = await handler(speakRequest(session.id, 0));
    expect(unsafe.status).toBe(404);
    expect(ErrorResponseSchema.parse(await unsafe.json()).error).toBe(
      "line_unavailable",
    );
    expect(speak).not.toHaveBeenCalled();
  });

  it("caches by text hash within a session and refreshes when a do-over changes the line", async () => {
    const session = await storedSession();
    const second = await storedSession();
    const speak = vi.fn(async () => AUDIO);
    const handler = createVoiceHandlers({ storage, speak }).speak;
    expect((await handler(speakRequest(session.id, 0))).status).toBe(200);
    expect((await handler(speakRequest(session.id, 0))).status).toBe(200);
    expect(speak).toHaveBeenCalledTimes(1);
    expect((await handler(speakRequest(second.id, 0))).status).toBe(200);
    expect(speak).toHaveBeenCalledTimes(2);
    session.turns[0].child = {
      line: "I can try the next step.",
      action: "stands up",
    };
    session.usedDoOver = true;
    await createSessionStore(storage).saveSession(session);
    expect((await handler(speakRequest(session.id, 0))).status).toBe(200);
    expect(speak).toHaveBeenCalledTimes(3);
  });

  it("expires cache after one hour and never serves audio for expired sessions", async () => {
    const session = await storedSession();
    const speak = vi.fn(async () => AUDIO);
    const handler = createVoiceHandlers({ storage, speak }).speak;
    expect((await handler(speakRequest(session.id))).status).toBe(200);
    now += 60 * 60 * 1000 + 1;
    expect((await handler(speakRequest(session.id))).status).toBe(200);
    expect(speak).toHaveBeenCalledTimes(2);
    now += 5 * 60 * 60 * 1000;
    const expired = await handler(speakRequest(session.id));
    expect(expired.status).toBe(404);
    expect(ErrorResponseSchema.parse(await expired.json()).error).toBe(
      "session_expired",
    );
    expect(speak).toHaveBeenCalledTimes(2);
  });

  it("coalesces concurrent requests for the same stored line", async () => {
    const session = await storedSession();
    let resolveAudio: (bytes: Uint8Array) => void = () => {
      throw new Error("Provider not started.");
    };
    const providerResult = new Promise<Uint8Array>((resolve) => {
      resolveAudio = resolve;
    });
    const speak = vi.fn(async () => providerResult);
    const handler = createVoiceHandlers({ storage, speak }).speak;
    const first = handler(speakRequest(session.id));
    const second = handler(speakRequest(session.id));
    await vi.waitFor(() => expect(speak).toHaveBeenCalledOnce());
    resolveAudio(AUDIO);
    expect((await first).status).toBe(200);
    expect((await second).status).toBe(200);
    expect(speak).toHaveBeenCalledOnce();
  });

  it("sanitizes provider failures, clears pending failures and rejects empty audio", async () => {
    const session = await storedSession();
    const speak = vi
      .fn<(text: string) => Promise<Uint8Array>>()
      .mockRejectedValueOnce(new Error("secret stack provider details"))
      .mockResolvedValueOnce(new Uint8Array())
      .mockResolvedValue(AUDIO);
    const handler = createVoiceHandlers({ storage, speak }).speak;
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await handler(speakRequest(session.id));
      expect(response.status).toBe(500);
      const body = ErrorResponseSchema.parse(await response.json());
      expect(body.error).toBe("voice_unavailable");
      expect(body.message).not.toMatch(/secret|stack|provider details/);
    }
    expect((await handler(speakRequest(session.id))).status).toBe(200);
    expect(speak).toHaveBeenCalledTimes(3);
  });

  it("rate limits speech even when the audio is cached", async () => {
    const session = await storedSession();
    const speak = vi.fn(async () => AUDIO);
    const handler = createVoiceHandlers({ storage, speak }).speak;
    for (let count = 0; count < 120; count++)
      expect((await handler(speakRequest(session.id))).status).toBe(200);
    expect((await handler(speakRequest(session.id))).status).toBe(429);
    expect(speak).toHaveBeenCalledOnce();
  });
});
