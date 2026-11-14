import { afterEach, describe, expect, it, vi } from "vitest";
import { speakAudio, transcribe } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("voice API client", () => {
  it("posts one audio part and returns a bounded transcript", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ text: `  ${"word ".repeat(100)}  ` }), {
          headers: { "content-type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const text = await transcribe(
      new Blob(["audio"], { type: "audio/webm;codecs=opus" }),
    );
    expect(text.length).toBe(300);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(call[0]).toBe("/api/transcribe");
    expect(call[1].body).toBeInstanceOf(FormData);
    expect(Array.from((call[1].body as FormData).keys())).toEqual(["audio"]);
    expect(call[1].headers).toBeUndefined();
  });
  it("rejects unsupported Ogg and oversized recordings without sending them", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      transcribe(new Blob(["audio"], { type: "audio/ogg" })),
    ).rejects.toMatchObject({ code: "unsupported_audio" });
    await expect(
      transcribe(new Blob([new Uint8Array(980_001)], { type: "audio/wav" })),
    ).rejects.toMatchObject({ code: "invalid_audio" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("speaks only a stored turn reference and validates audio responses", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(new Blob(["audio"], { type: "audio/mpeg" }), {
          headers: { "content-type": "audio/mpeg" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(
      (await speakAudio({ sessionId: "session", turnIndex: -1 })).size,
    ).toBeGreaterThan(0);
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(call[1].body as string)).toEqual({
      sessionId: "session",
      turnIndex: -1,
    });
    expect(call[1].body).not.toContain("text");
  });
  it("retains friendly API errors and rejects invalid transcript shapes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              error: "rate_limited",
              message: "Please wait before recording again.",
            }),
            { status: 429 },
          ),
      ),
    );
    await expect(
      transcribe(new Blob(["a"], { type: "audio/webm" })),
    ).rejects.toMatchObject({ code: "rate_limited", status: 429 });
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(JSON.stringify({ other: "no transcript" })),
      ),
    );
    await expect(
      transcribe(new Blob(["a"], { type: "audio/webm" })),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });
  it("propagates explicit cancellation", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("Aborted", "AbortError");
      }),
    );
    await expect(
      transcribe(new Blob(["a"], { type: "audio/webm" }), controller.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
