import "server-only";
import type { z } from "zod";
import { getEnv } from "../server/env";
import { reserveModelCall } from "../server/stats";
import { createOpenAIProvider } from "./openai";
import { createAnthropicProvider } from "./anthropic";

export type ProviderName = "openai" | "anthropic";
export interface JsonRequest<T> {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  maxOutputTokens: number;
  timeoutMs?: number;
}
export interface ProviderRequest<T> extends JsonRequest<T> {
  timeoutMs: number;
  signal: AbortSignal;
}
export interface JsonProvider {
  name: ProviderName;
  model: string;
  completeJson<T>(request: ProviderRequest<T>): Promise<T>;
}
export type JsonCompleter = <T>(request: JsonRequest<T>) => Promise<T | null>;
export interface ProviderAttempt {
  provider: ProviderName;
  model: string;
  success: boolean;
  latencyMs: number;
}
export interface ProviderChainOptions {
  providers: Partial<Record<ProviderName, JsonProvider>>;
  primary: ProviderName;
  reserveCall: () => Promise<boolean>;
  timeouts?: readonly [number, number];
  onAttempt?: (attempt: ProviderAttempt) => void;
}

export function createProviderChain(
  options: ProviderChainOptions,
): JsonCompleter {
  return async <T>(request: JsonRequest<T>): Promise<T | null> => {
    const names: ProviderName[] = [
      options.primary,
      options.primary === "openai" ? "anthropic" : "openai",
    ];
    let attemptIndex = 0;
    for (const name of names) {
      const provider = options.providers[name];
      if (!provider) continue;
      try {
        if (!(await options.reserveCall())) return null;
      } catch {
        return null;
      }
      const controller = new AbortController();
      const configured =
        (options.timeouts ?? [4_000, 3_500])[attemptIndex] ?? 3_500;
      const timeoutMs = Math.min(configured, request.timeoutMs ?? configured);
      attemptIndex += 1;
      const started = performance.now();
      let timer: ReturnType<typeof setTimeout> | undefined;
      let success = false;
      try {
        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error("Model request timed out"));
          }, timeoutMs);
        });
        const value = await Promise.race([
          provider.completeJson({
            ...request,
            signal: controller.signal,
            timeoutMs,
          }),
          timeout,
        ]);
        const parsed = request.schema.parse(value);
        success = true;
        return parsed;
      } catch {
        // Provider failures deliberately degrade to the next provider or rules.
      } finally {
        if (timer) clearTimeout(timer);
        controller.abort();
        options.onAttempt?.({
          provider: provider.name,
          model: provider.model,
          success,
          latencyMs: performance.now() - started,
        });
      }
    }
    return null;
  };
}

export const completeJson: JsonCompleter = async <T>(
  request: JsonRequest<T>,
): Promise<T | null> => {
  const env = getEnv();
  const providers: Partial<Record<ProviderName, JsonProvider>> = {};
  if (env.OPENAI_API_KEY && env.OPENAI_MODEL) {
    providers.openai = createOpenAIProvider(
      env.OPENAI_API_KEY,
      env.OPENAI_MODEL,
      undefined,
      env.OPENAI_REASONING_EFFORT,
    );
  }
  if (env.ANTHROPIC_API_KEY && env.ANTHROPIC_MODEL) {
    providers.anthropic = createAnthropicProvider(
      env.ANTHROPIC_API_KEY,
      env.ANTHROPIC_MODEL,
    );
  }
  return createProviderChain({
    providers,
    primary: env.LLM_PRIMARY,
    reserveCall: reserveModelCall,
  })(request);
};
