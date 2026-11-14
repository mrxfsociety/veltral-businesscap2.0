import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { JsonProvider, ProviderRequest } from "./provider";

export function createAnthropicProvider(
  apiKey: string,
  model: string,
  client = new Anthropic({ apiKey, maxRetries: 0 }),
): JsonProvider {
  return {
    name: "anthropic",
    model,
    async completeJson<T>(request: ProviderRequest<T>): Promise<T> {
      const response = await client.messages.create(
        {
          model,
          max_tokens: request.maxOutputTokens,
          system: request.system,
          messages: [{ role: "user", content: request.user }],
          output_config: { format: zodOutputFormat(request.schema) },
        },
        { signal: request.signal, timeout: request.timeoutMs, maxRetries: 0 },
      );
      if (response.stop_reason !== "end_turn")
        throw new Error("Model output unavailable");
      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");
      return request.schema.parse(JSON.parse(text) as unknown);
    },
  };
}
