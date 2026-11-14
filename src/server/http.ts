import type { z } from "zod";
import { checkRateLimit, clientIp, type RateLimitBucket } from "./rateLimit";
import type { Storage } from "./redis";

export class ApiError extends Error {
  constructor(
    public status: number,
    public error: string,
    message: string,
  ) {
    super(message);
  }
}

/** Read through a bound, including chunked requests without Content-Length. */
export async function readBody(
  request: Request,
  maximum = 32_768,
): Promise<Uint8Array> {
  const size = Number(request.headers.get("content-length") ?? 0);
  if (size > maximum)
    throw new ApiError(400, "validation", "This request is too large.");
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximum) {
        await reader.cancel();
        throw new ApiError(400, "validation", "This request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function readJson<T>(
  request: Request,
  schema: z.ZodType<T>,
  transform?: (value: unknown) => unknown,
): Promise<T> {
  let data: unknown;
  try {
    data = JSON.parse(new TextDecoder().decode(await readBody(request)));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "validation", "Please send valid JSON.");
  }
  const result = schema.safeParse(transform ? transform(data) : data);
  if (!result.success)
    throw new ApiError(
      400,
      "validation",
      "Please check the fields and try again.",
    );
  return result.data;
}

export function json<T>(data: T, schema: z.ZodType<T>): Response {
  return Response.json(schema.parse(data), {
    headers: { "Cache-Control": "no-store" },
  });
}
export function route(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    try {
      return await handler(request);
    } catch (error) {
      const known = error instanceof ApiError;
      return Response.json(
        {
          error: known ? error.error : "internal_error",
          message: known
            ? error.message
            : "Something went wrong. Please try again.",
        },
        {
          status: known ? error.status : 500,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
  };
}
export async function enforceRateLimit(
  request: Request,
  bucket: RateLimitBucket,
  storage?: Storage,
): Promise<void> {
  if (
    !(await checkRateLimit(bucket, clientIp(request.headers), storage)).allowed
  )
    throw new ApiError(
      429,
      "rate_limited",
      "You've practised a lot. Please take a break and try again later.",
    );
}
