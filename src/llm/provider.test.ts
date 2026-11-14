import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  createProviderChain,
  type JsonProvider,
  type ProviderRequest,
} from "./provider";

const schema = z.object({ accepted: z.boolean() }).strict();
const request = {
  system: "Return a boolean.",
  user: "{}",
  schema,
  maxOutputTokens: 64,
};
function provider(name: "openai" | "anthropic", output: unknown) {
  const calls = vi.fn<(input: ProviderRequest<unknown>) => void>();
  return {
    name,
    model: `${name}-configured`,
    calls,
    async completeJson<T>(input: ProviderRequest<T>): Promise<T> {
      calls(input);
      return input.schema.parse(output);
    },
  };
}

describe("provider chain", () => {
  it("returns primary validated data and reserves exactly one call", async () => {
    const openai = provider("openai", { accepted: true });
    const anthropic = provider("anthropic", { accepted: false });
    const reserveCall = vi.fn(async () => true);
    const onAttempt = vi.fn();
    const complete = createProviderChain({
      providers: { openai, anthropic },
      primary: "openai",
      reserveCall,
      onAttempt,
    });
    expect(await complete(request)).toEqual({ accepted: true });
    expect(reserveCall).toHaveBeenCalledTimes(1);
    expect(anthropic.calls).not.toHaveBeenCalled();
    expect(onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "openai",
        model: "openai-configured",
        success: true,
      }),
    );
  });

  it("honours primary order and skips absent providers", async () => {
    const anthropic = provider("anthropic", { accepted: true });
    const reserveCall = vi.fn(async () => true);
    const complete = createProviderChain({
      providers: { anthropic },
      primary: "openai",
      reserveCall,
    });
    expect(await complete(request)).toEqual({ accepted: true });
    expect(anthropic.calls).toHaveBeenCalledWith(
      expect.objectContaining({ timeoutMs: 4_000 }),
    );
    expect(reserveCall).toHaveBeenCalledTimes(1);
  });

  it("aborts a stalled first provider and uses the second", async () => {
    let signal: AbortSignal | undefined;
    const openai: JsonProvider = {
      name: "openai",
      model: "stalled",
      completeJson: <T>(input: ProviderRequest<T>) => {
        signal = input.signal;
        return new Promise<T>(() => undefined);
      },
    };
    const anthropic = provider("anthropic", { accepted: true });
    const reserveCall = vi.fn(async () => true);
    const complete = createProviderChain({
      providers: { openai, anthropic },
      primary: "openai",
      reserveCall,
      timeouts: [10, 20],
    });
    expect(await complete(request)).toEqual({ accepted: true });
    expect(signal?.aborted).toBe(true);
    expect(reserveCall).toHaveBeenCalledTimes(2);
    expect(anthropic.calls).toHaveBeenCalledWith(
      expect.objectContaining({ timeoutMs: 20 }),
    );
  });

  it("invalid output is a failure even if an adapter fails to validate", async () => {
    const openai: JsonProvider = {
      name: "openai",
      model: "unchecked",
      completeJson: async <T>() => ({ secret: "unexpected" }) as T,
    };
    const anthropic = provider("anthropic", { accepted: false });
    const complete = createProviderChain({
      providers: { openai, anthropic },
      primary: "openai",
      reserveCall: async () => true,
    });
    expect(await complete(request)).toEqual({ accepted: false });
  });

  it("returns null without retries when both fail", async () => {
    const openai = provider("openai", "not JSON");
    const anthropic = provider("anthropic", { unexpected: true });
    const complete = createProviderChain({
      providers: { openai, anthropic },
      primary: "openai",
      reserveCall: async () => true,
    });
    expect(await complete(request)).toBeNull();
    expect(openai.calls).toHaveBeenCalledTimes(1);
    expect(anthropic.calls).toHaveBeenCalledTimes(1);
  });

  it("budget exhaustion skips all network work", async () => {
    const openai = provider("openai", { accepted: true });
    const complete = createProviderChain({
      providers: { openai },
      primary: "openai",
      reserveCall: async () => false,
    });
    expect(await complete(request)).toBeNull();
    expect(openai.calls).not.toHaveBeenCalled();
  });

  it("budget exhaustion after a failed first call prevents the second", async () => {
    const openai = provider("openai", null);
    const anthropic = provider("anthropic", { accepted: true });
    const reserveCall = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValue(false);
    const complete = createProviderChain({
      providers: { openai, anthropic },
      primary: "openai",
      reserveCall,
    });
    expect(await complete(request)).toBeNull();
    expect(anthropic.calls).not.toHaveBeenCalled();
  });

  it("budget storage failure degrades safely without exposing errors", async () => {
    const openai = provider("openai", { accepted: true });
    const complete = createProviderChain({
      providers: { openai },
      primary: "openai",
      reserveCall: async () => {
        throw new Error("private infrastructure detail");
      },
    });
    expect(await complete(request)).toBeNull();
    expect(openai.calls).not.toHaveBeenCalled();
  });

  it("no configured provider does not reserve budget", async () => {
    const reserveCall = vi.fn(async () => true);
    expect(
      await createProviderChain({
        providers: {},
        primary: "openai",
        reserveCall,
      })(request),
    ).toBeNull();
    expect(reserveCall).not.toHaveBeenCalled();
  });
});
