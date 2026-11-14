import type { z } from "zod";
import { ErrorResponseSchema } from "@/shared/api";

export function apiError(
  error: string,
  message: string,
  status: number,
): Response {
  return Response.json(ErrorResponseSchema.parse({ error, message }), {
    status,
  });
}

export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: apiError("validation", "Send a valid JSON body.", 400),
    };
  }
  const parsed = schema.safeParse(body);
  return parsed.success
    ? { ok: true, data: parsed.data }
    : {
        ok: false,
        response: apiError(
          "validation",
          "Check the request fields and try again.",
          400,
        ),
      };
}
