import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ServerEnv } from "../server/env";
import type { JsonProvider, ProviderRequest } from "./provider";

export function createOpenAIProvider(
  apiKey: string,
  model: string,
  client = new OpenAI({ apiKey, maxRetries: 0 }),
  reasoningEffort?: ServerEnv["OPENAI_REASONING_EFFORT"],
  textVerbosity?: ServerEnv["OPENAI_TEXT_VERBOSITY"],
): JsonProvider {
  return {
    name: "openai",
    model,
    async completeJson<T>(request: ProviderRequest<T>): Promise<T> {
      const response = await client.responses.create(
        {
          model,
          store: false,
          ...(reasoningEffort === undefined
            ? {}
            : { reasoning: { effort: reasoningEffort } }),
          input: [
            { role: "system", content: request.system },
            { role: "user", content: request.user },
          ],
          text: {
            format: zodTextFormat(request.schema, "do_over"),
            ...(textVerbosity === undefined
              ? {}
              : { verbosity: textVerbosity }),
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
