import { ApiError } from "@/lib/api";
import {
  ErrorResponseSchema,
  SpeakRequestSchema,
  TranscribeResponseSchema,
  type SpeakRequest,
} from "@/shared/api";

const MAX_AUDIO_BYTES = 980_000;

async function voiceRequest<T>(
  path: string,
  init: RequestInit,
  decode: (response: Response) => Promise<T>,
  externalSignal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  externalSignal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(path, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      let message = "Voice is unavailable right now. You can keep typing.";
      let code = "voice_unavailable";
      try {
        const error = ErrorResponseSchema.safeParse(await response.json());
        if (error.success) {
          message = error.data.message;
          code = error.data.error;
        }
      } catch {
        /* The response may be a proxy error, so keep the safe fallback. */
      }
      throw new ApiError(code, response.status, message);
    }
    return await decode(response);
  } catch (error) {
    if (externalSignal?.aborted)
      throw new DOMException("Voice cancelled", "AbortError");
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "voice_unavailable",
      0,
      "Voice couldn't connect. You can keep typing or try again.",
    );
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", abort);
  }
}

/** Audio is uploaded once for transcription and never written to browser storage. */
export async function transcribe(
  audio: Blob,
  signal?: AbortSignal,
): Promise<string> {
  if (!audio.size || audio.size > MAX_AUDIO_BYTES)
    throw new ApiError(
      "invalid_audio",
      400,
      "That recording is too large or empty. Try a shorter reply, or type it instead.",
    );
  const mediaType = audio.type.split(";")[0].toLowerCase();
  const extension =
    mediaType === "audio/mp4"
      ? "mp4"
      : mediaType === "audio/wav" || mediaType === "audio/x-wav"
        ? "wav"
        : mediaType === "audio/webm"
          ? "webm"
          : null;
  if (!extension)
    throw new ApiError(
      "unsupported_audio",
      400,
      "This recording format isn't supported. Please type your reply.",
    );
  const form = new FormData();
  form.append("audio", audio, `reply.${extension}`);
  return voiceRequest(
    "/api/transcribe",
    { method: "POST", body: form },
    async (response) => {
      const result = TranscribeResponseSchema.safeParse(await response.json());
      if (!result.success)
        throw new ApiError(
          "invalid_response",
          response.status,
          "The transcript couldn't be read. Please type your reply.",
        );
      return result.data.text.trim().slice(0, 300);
    },
    signal,
  );
}

/** Only a server-owned turn reference is sent; arbitrary text cannot be voiced. */
export async function speakAudio(
  request: SpeakRequest,
  signal?: AbortSignal,
): Promise<Blob> {
  return voiceRequest(
    "/api/speak",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(SpeakRequestSchema.parse(request)),
    },
    async (response) => {
      if (
        !response.headers
          .get("content-type")
          ?.toLowerCase()
          .startsWith("audio/")
      )
        throw new ApiError(
          "invalid_audio",
          response.status,
          "The spoken reply wasn't available.",
        );
      const audio = await response.blob();
      if (!audio.size || audio.size > 5_000_000)
        throw new ApiError(
          "invalid_audio",
          response.status,
          "The spoken reply wasn't available.",
        );
      return audio;
    },
    signal,
  );
}
