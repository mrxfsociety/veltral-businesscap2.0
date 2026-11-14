import "server-only";
import OpenAI from "openai";
import { z } from "zod";
import type { JsonProvider, ProviderRequest } from "./provider";

export function createOpenAIProvider(
  apiKey: string,
  model: string,
  client = new OpenAI({ apiKey, maxRetries: 0 }),
): JsonProvider {
  return {
    name: "openai",
    model,
    async completeJson<T>(request: ProviderRequest<T>): Promise<T> {
      const response = await client.responses.create(
        {
          model,
          store: false,
          input: [
            { role: "system", content: request.system },
            { role: "user", content: request.user },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "do_over",
              strict: true,
              schema: z.toJSONSchema(request.schema),
            },
          },
          max_output_tokens: request.maxOutputTokens,
        },
        { signal: request.signal, timeout: request.timeoutMs, maxRetries: 0 },
      );
      if (response.status !== "completed" || !response.output_text)
        throw new Error("Model output unavailable");
      return request.schema.parse(JSON.parse(response.output_text) as unknown);
    },
  };
}
