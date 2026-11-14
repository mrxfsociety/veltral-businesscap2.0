import "server-only";
import OpenAI from "openai";
import { getEnv } from "../server/env";
import { reserveModelCall } from "../server/stats";

export const SPEECH_TIMEOUT_MS = 10_000;

export class SpeechUnavailableError extends Error {
  constructor() {
    super("Voice is unavailable right now. Please use text.");
    this.name = "SpeechUnavailableError";
  }
}

interface SpeechRequestOptions {
  signal: AbortSignal;
  timeout: number;
  maxRetries: 0;
}

interface TranscriptionInput {
  file: File;
  model: string;
  response_format: "json";
  language: "en";
}

interface SpeechInput {
  model: string;
  input: string;
  voice: "coral";
  response_format: "mp3";
  instructions?: string;
}

export interface SpeechClient {
  transcribe(
    input: TranscriptionInput,
    options: SpeechRequestOptions,
  ): Promise<unknown>;
  speak(
    input: SpeechInput,
    options: SpeechRequestOptions,
  ): Promise<{ arrayBuffer(): Promise<ArrayBuffer> }>;
}

export interface SpeechConfig {
  apiKey?: string;
  transcribeModel?: string;
  ttsModel?: string;
  timeoutMs?: number;
  reserveCall?: () => Promise<boolean>;
}

function officialClient(apiKey: string): SpeechClient {
  const client = new OpenAI({ apiKey, maxRetries: 0 });
  return {
    transcribe: (input, options) =>
      client.audio.transcriptions.create(input, options),
    speak: (input, options) => client.audio.speech.create(input, options),
  };
}

async function bounded<T>(
  timeoutMs: number,
  operation: (options: SpeechRequestOptions) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation({
        signal: controller.signal,
        timeout: timeoutMs,
        maxRetries: 0,
      }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new SpeechUnavailableError());
        }, timeoutMs);
      }),
    ]);
  } catch {
    throw new SpeechUnavailableError();
  } finally {
    clearTimeout(timeout);
  }
}

export function createSpeechProvider(
  config: SpeechConfig,
  injectedClient?: SpeechClient,
) {
  const timeoutMs = config.timeoutMs ?? SPEECH_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new SpeechUnavailableError();
  }
  let client = injectedClient;
  function getClient(): SpeechClient {
    if (client) return client;
    if (!config.apiKey?.trim()) throw new SpeechUnavailableError();
    client = officialClient(config.apiKey);
    return client;
  }
  async function permittedClient(signal: AbortSignal): Promise<SpeechClient> {
    const transport = getClient();
    if (config.reserveCall && !(await config.reserveCall())) {
      throw new SpeechUnavailableError();
    }
    if (signal.aborted) throw new SpeechUnavailableError();
    return transport;
  }

  return {
    async transcribeAudio(file: File): Promise<string> {
      const model = config.transcribeModel?.trim();
      if (!model) throw new SpeechUnavailableError();
      return bounded(timeoutMs, async (options) => {
        const transport = await permittedClient(options.signal);
        const result = await transport.transcribe(
          { file, model, response_format: "json", language: "en" },
          options,
        );
        if (
          typeof result !== "object" ||
          result === null ||
          !("text" in result) ||
          typeof result.text !== "string"
        ) {
          throw new SpeechUnavailableError();
        }
        return result.text.trim();
      });
    },
    async synthesizeSpeech(text: string): Promise<Uint8Array> {
      const model = config.ttsModel?.trim();
      if (!model || !text.trim() || text.length > 120) {
        throw new SpeechUnavailableError();
      }
      return bounded(timeoutMs, async (options) => {
        const transport = await permittedClient(options.signal);
        const result = await transport.speak(
          {
            model,
            input: text,
            voice: "coral",
            response_format: "mp3",
            ...(model === "tts-1" || model === "tts-1-hd"
              ? {}
              : {
                  instructions:
                    "Read only the supplied line as a young child in a practice scene. Use an expressive, slightly upset delivery that follows the words; a cooperative line should sound calmer. Do not add words or sound effects.",
                }),
          },
          options,
        );
        const audio = new Uint8Array(await result.arrayBuffer());
        if (audio.byteLength === 0) throw new SpeechUnavailableError();
        return audio;
      });
    },
  };
}

function configuredProvider() {
  const env = getEnv();
  return createSpeechProvider({
    apiKey: env.OPENAI_API_KEY,
    transcribeModel: env.OPENAI_TRANSCRIBE_MODEL,
    ttsModel: env.OPENAI_TTS_MODEL,
    reserveCall: reserveModelCall,
  });
}

export function transcribeAudio(file: File): Promise<string> {
  return configuredProvider().transcribeAudio(file);
}

export function synthesizeSpeech(text: string): Promise<Uint8Array> {
  return configuredProvider().synthesizeSpeech(text);
}
