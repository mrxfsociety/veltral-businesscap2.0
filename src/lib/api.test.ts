import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./api";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("typed client", () => {
  it("rejects malformed successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ ok: true })),
    );
    await expect(api.daily()).rejects.toMatchObject({
      code: "invalid_response",
    });
  });
  it("preserves a typed server error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: "rate_limited", message: "Wait a little." },
            { status: 429 },
          ),
        ),
    );
    await expect(api.daily()).rejects.toMatchObject({
      code: "rate_limited",
      status: 429,
      message: "Wait a little.",
    });
  });
  it("distinguishes connection failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(api.daily()).rejects.toBeInstanceOf(ApiError);
    await expect(api.daily()).rejects.toMatchObject({ code: "network_error" });
  });
  it("does not retry a possibly committed POST", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("lost response"));
    vi.stubGlobal("fetch", fetcher);
    await expect(
      api.turn({
        sessionId: "s",
        turnIndex: 0,
        text: "Hello",
        inputMode: "text",
      }),
    ).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

it("bounds an unanswered request without automatic retries", async () => {
  vi.useFakeTimers();
  const fetcher = vi.fn(
    (_url: unknown, options: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        options.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      }),
  );
  vi.stubGlobal("fetch", fetcher);
  const pending = expect(api.daily()).rejects.toMatchObject({
    code: "network_error",
  });
  await vi.advanceTimersByTimeAsync(20000);
  await pending;
  expect(fetcher).toHaveBeenCalledTimes(1);
});
