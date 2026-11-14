import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createOpenAIProvider } from "./openai";
import { createAnthropicProvider } from "./anthropic";
import { getEnv } from "../server/env";

const schema = z.object({ accepted: z.boolean() }).strict();
const request = {
  system: "Classify data.",
  user: "{}",
  schema,
  maxOutputTokens: 64,
  timeoutMs: 1000,
  signal: new AbortController().signal,
};
function openaiResponse(text: string) {
  return {
    id: "test-response",
    object: "response",
    created_at: 0,
    status: "completed",
    model: "configured-id",
    output: [
      {
        type: "message",
        id: "test-message",
        status: "completed",
        role: "assistant",
        content: [{ type: "output_text", text, annotations: [] }],
      },
    ],
  };
}
function anthropicResponse(text: string) {
  return {
    id: "test-message",
    type: "message",
    role: "assistant",
    model: "configured-id",
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  };
}

describe("official SDK JSON adapters", () => {
  it("uses configured OpenAI model, strict output and disabled provider storage", async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify(openaiResponse('{"accepted":true}')), {
          headers: { "content-type": "application/json" },
        }),
    );
    const client = new OpenAI({
      apiKey: "test-only-key",
      fetch: fetcher,
      maxRetries: 0,
    });
    const provider = createOpenAIProvider(
      "test-only-key",
      "configured-id",
      client,
    );
    expect(await provider.completeJson(request)).toEqual({ accepted: true });
    const body = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      model: "configured-id",
      store: false,
      max_output_tokens: 64,
      text: { format: { type: "json_schema", strict: true } },
    });
    expect(body).not.toHaveProperty("reasoning");
    expect(body.input).toEqual([
      { role: "system", content: request.system },
      { role: "user", content: request.user },
    ]);
  });

  it("sends optional reasoning effort from validated environment without changing the client argument", async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify(openaiResponse('{"accepted":true}')), {
          headers: { "content-type": "application/json" },
        }),
    );
    const client = new OpenAI({
      apiKey: "test-only-key",
      fetch: fetcher,
      maxRetries: 0,
    });
    const env = getEnv({ OPENAI_REASONING_EFFORT: "none" });
    const provider = createOpenAIProvider(
      "test-only-key",
      "configured-id",
      client,
      env.OPENAI_REASONING_EFFORT,
    );
    expect(await provider.completeJson(request)).toEqual({ accepted: true });
    const body = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      reasoning: { effort: "none" },
      max_output_tokens: 64,
    });
  });

  it("treats an empty reasoning setting as optional and rejects unsupported values", () => {
    expect(
      getEnv({ OPENAI_REASONING_EFFORT: "" }).OPENAI_REASONING_EFFORT,
    ).toBeUndefined();
    expect(
      getEnv({ OPENAI_REASONING_EFFORT: "low" }).OPENAI_REASONING_EFFORT,
    ).toBe("low");
    expect(() => getEnv({ OPENAI_REASONING_EFFORT: "automatic" })).toThrow(
      "OPENAI_REASONING_EFFORT",
    );
  });

  it("rejects invalid JSON instead of returning it to the engine", async () => {
    const client = new OpenAI({
      apiKey: "test-only-key",
      maxRetries: 0,
      fetch: async () =>
        new Response(JSON.stringify(openaiResponse("{broken")), {
          headers: { "content-type": "application/json" },
        }),
    });
    await expect(
      createOpenAIProvider(
        "test-only-key",
        "configured-id",
        client,
      ).completeJson(request),
    ).rejects.toThrow();
  });

  it("wrong key makes one request without automatic SDK retry", async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () =>
        new Response(
          JSON.stringify({
            error: { message: "bad key", type: "authentication_error" },
          }),
          { status: 401, headers: { "content-type": "application/json" } },
        ),
    );
    const client = new OpenAI({
      apiKey: "test-only-key",
      fetch: fetcher,
      maxRetries: 0,
    });
    await expect(
      createOpenAIProvider(
        "test-only-key",
        "configured-id",
        client,
      ).completeJson(request),
    ).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("uses configured Anthropic model and structured output schema", async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify(anthropicResponse('{"accepted":false}')), {
          headers: { "content-type": "application/json" },
        }),
    );
    const client = new Anthropic({
      apiKey: "test-only-key",
      fetch: fetcher,
      maxRetries: 0,
    });
    expect(
      await createAnthropicProvider(
        "test-only-key",
        "configured-id",
        client,
      ).completeJson(request),
    ).toEqual({ accepted: false });
    const body = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      model: "configured-id",
      system: request.system,
      max_tokens: 64,
      output_config: { format: { type: "json_schema" } },
    });
    expect(body.messages).toEqual([{ role: "user", content: request.user }]);
  });

  it("rejects an incomplete Anthropic response and schema mismatch", async () => {
    const client = new Anthropic({
      apiKey: "test-only-key",
      maxRetries: 0,
      fetch: async () =>
        new Response(
          JSON.stringify({
            ...anthropicResponse('{"accepted":true}'),
            stop_reason: "max_tokens",
          }),
          { headers: { "content-type": "application/json" } },
        ),
    });
    await expect(
      createAnthropicProvider(
        "test-only-key",
        "configured-id",
        client,
      ).completeJson(request),
    ).rejects.toThrow("Model output unavailable");
    const mismatch = new Anthropic({
      apiKey: "test-only-key",
      maxRetries: 0,
      fetch: async () =>
        new Response(
          JSON.stringify(anthropicResponse('{"accepted":"wrong type"}')),
          { headers: { "content-type": "application/json" } },
        ),
    });
    await expect(
      createAnthropicProvider(
        "test-only-key",
        "configured-id",
        mismatch,
      ).completeJson(request),
    ).rejects.toThrow();
  });
});
