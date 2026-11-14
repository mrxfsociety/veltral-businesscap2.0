import { describe, expect, it } from "vitest";
import {
  ApiError,
  enforceRateLimit,
  json,
  readBody,
  readJson,
  route,
} from "../server/http";
import { Storage } from "../server/redis";
import {
  ErrorResponseSchema,
  WaitlistRequestSchema,
  WaitlistResponseSchema,
} from "./api";

function request(body: string, headers?: HeadersInit): Request {
  return new Request("https://doover.example/api/waitlist", {
    method: "POST",
    body,
    headers,
  });
}

describe("HTTP contract enforcement", () => {
  it("validates bodies and reports malformed input without internal details", async () => {
    const handler = route(async (input) => {
      await readJson(input, WaitlistRequestSchema);
      return json({ ok: true as const }, WaitlistResponseSchema);
    });
    for (const body of [
      "{broken",
      "null",
      "[]",
      '{"email":"parent@example.org","plan":"monthly","admin":true}',
    ]) {
      const response = await handler(request(body));
      expect(response.status).toBe(400);
      expect(ErrorResponseSchema.parse(await response.json()).error).toBe(
        "validation",
      );
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    const success = await handler(
      request('{"email":"parent@example.org","plan":"monthly"}'),
    );
    expect(success.status).toBe(200);
    expect(await success.json()).toEqual({ ok: true });
  });

  it("enforces the body limit with and without a Content-Length header", async () => {
    await expect(readBody(request("12345"), 4)).rejects.toMatchObject({
      status: 400,
      error: "validation",
    });
    await expect(
      readBody(request("x", { "content-length": "999" }), 4),
    ).rejects.toMatchObject({ status: 400 });
    expect(new TextDecoder().decode(await readBody(request("1234"), 4))).toBe(
      "1234",
    );
  });

  it("cancels a chunked body when the byte cap is reached", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(10));
      },
      cancel() {
        cancelled = true;
      },
    });
    const init: RequestInit & { duplex: "half" } = {
      method: "POST",
      body: stream,
      duplex: "half",
    };
    await expect(
      readBody(new Request("https://doover.example/api/turn", init), 12),
    ).rejects.toBeInstanceOf(ApiError);
    expect(cancelled).toBe(true);
  });

  it("sanitizes unknown exceptions and invalid server outputs", async () => {
    const failure = route(async () => {
      throw new Error("secret-key private stack trace");
    });
    const invalidResponse = route(async () => {
      const invalid: unknown = { ok: false };
      return json(invalid, WaitlistResponseSchema);
    });
    for (const handler of [failure, invalidResponse]) {
      const response = await handler(request("{}"));
      expect(response.status).toBe(500);
      const body = await response.text();
      expect(body).not.toMatch(/secret-key|stack|Zod|expected|received/);
      expect(ErrorResponseSchema.parse(JSON.parse(body)).error).toBe(
        "internal_error",
      );
    }
  });

  it("returns the shared friendly 429 response once a real counter is full", async () => {
    const storage = new Storage();
    try {
      const handler = route(async (input) => {
        await enforceRateLimit(input, "waitlist", storage);
        return json({ ok: true as const }, WaitlistResponseSchema);
      });
      for (let count = 0; count < 5; count++) {
        expect(
          (await handler(request("{}", { "x-forwarded-for": "198.51.100.21" })))
            .status,
        ).toBe(200);
      }
      const response = await handler(
        request("{}", { "x-forwarded-for": "198.51.100.21" }),
      );
      expect(response.status).toBe(429);
      expect(ErrorResponseSchema.parse(await response.json()).error).toBe(
        "rate_limited",
      );
      expect(
        (await handler(request("{}", { "x-forwarded-for": "198.51.100.22" })))
          .status,
      ).toBe(200);
    } finally {
      storage.close();
    }
  });
});
