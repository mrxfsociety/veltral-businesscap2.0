import { createHash } from "node:crypto";
import { transcribeAudio, synthesizeSpeech } from "../llm/speech";
import {
  SpeakRequestSchema,
  TranscribeRequestSchema,
  TranscribeResponseSchema,
} from "../shared/api";
import { getStorage, type Storage } from "./redis";
import { createSessionStore } from "./sessionStore";
import {
  ApiError,
  enforceRateLimit,
  json,
  readBody,
  readJson,
  route,
} from "./http";
import { validateAudio } from "./audio";

const CACHE_TTL = 60 * 60 * 1000;
const MAX_CACHE_BYTES = 32 * 1024 * 1024;
interface CachedAudio {
  bytes: Uint8Array;
  expires: number;
}
export function createVoiceHandlers(
  options: {
    storage?: Storage;
    transcribe?: (file: File) => Promise<string>;
    speak?: (text: string) => Promise<Uint8Array>;
    validate?: (file: File) => Promise<void>;
  } = {},
) {
  const cache = new Map<string, CachedAudio>();
  const pending = new Map<string, Promise<Uint8Array>>();
  const storage = () => options.storage ?? getStorage();
  function prune() {
    let bytes = 0;
    for (const [key, entry] of cache) {
      if (entry.expires <= storage().now()) cache.delete(key);
      else bytes += entry.bytes.byteLength;
    }
    for (const [key, entry] of cache) {
      if (bytes <= MAX_CACHE_BYTES) break;
      bytes -= entry.bytes.byteLength;
      cache.delete(key);
    }
  }
  return {
    transcribe: route(async (request) => {
      await enforceRateLimit(request, "transcribe", storage());
      const contentType = request.headers.get("content-type");
      if (!contentType?.startsWith("multipart/form-data"))
        throw new ApiError(
          400,
          "validation",
          "Please send a short audio recording.",
        );
      const bytes = await readBody(request, 1_020_000);
      let form: FormData;
      try {
        form = await new Response(new Uint8Array(bytes), {
          headers: { "content-type": contentType },
        }).formData();
      } catch {
        throw new ApiError(
          400,
          "validation",
          "We couldn't read this recording. Please record it again.",
        );
      }
      if (
        [...form.keys()].some((key) => key !== "audio") ||
        form.getAll("audio").length !== 1
      )
        throw new ApiError(
          400,
          "validation",
          "Please send one audio recording.",
        );
      const parsed = TranscribeRequestSchema.safeParse({
        audio: form.get("audio"),
      });
      if (
        !parsed.success ||
        parsed.data.audio.size === 0 ||
        parsed.data.audio.size > 1_000_000
      )
        throw new ApiError(
          400,
          "validation",
          "Keep recordings under 12 seconds and 1 MB.",
        );
      const blob = parsed.data.audio;
      const file =
        blob instanceof File
          ? blob
          : new File([blob], "recording.webm", { type: blob.type });
      await (options.validate ?? validateAudio)(file);
      try {
        return json(
          { text: await (options.transcribe ?? transcribeAudio)(file) },
          TranscribeResponseSchema,
        );
      } catch {
        throw new ApiError(
          500,
          "voice_unavailable",
          "Voice is unavailable right now. Please use text.",
        );
      }
    }),
    speak: route(async (request) => {
      await enforceRateLimit(request, "speak", storage());
      const input = await readJson(request, SpeakRequestSchema);
      const session = await createSessionStore(storage()).getSession(
        input.sessionId,
      );
      if (!session)
        throw new ApiError(
          404,
          "session_expired",
          "This session has expired. Start a new scene.",
        );
      const text =
        input.turnIndex === -1
          ? session.scene.openingLine
          : session.turns[input.turnIndex]?.child?.line;
      if (!text)
        throw new ApiError(
          404,
          "line_unavailable",
          "That child reply is not available.",
        );
      const key = `${session.id}:${createHash("sha256").update(text).digest("hex")}`;
      prune();
      let bytes = cache.get(key)?.bytes;
      if (!bytes) {
        let operation = pending.get(key);
        if (!operation) {
          operation = (options.speak ?? synthesizeSpeech)(text);
          pending.set(key, operation);
        }
        try {
          bytes = await operation;
          if (bytes.byteLength === 0 || bytes.byteLength > MAX_CACHE_BYTES)
            throw new Error("Invalid audio");
          cache.set(key, {
            bytes,
            expires: Math.min(storage().now() + CACHE_TTL, session.expiresAt),
          });
          prune();
        } catch {
          throw new ApiError(
            500,
            "voice_unavailable",
            "Voice is unavailable right now. Please use browser playback.",
          );
        } finally {
          pending.delete(key);
        }
      }
      return new Response(new Uint8Array(bytes), {
        headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
      });
    }),
  };
}
