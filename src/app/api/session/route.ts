// STUB(T0): replaced in stage A2.
import { SessionRequestSchema } from "@/shared/api";
import { apiError, parseBody } from "@/server/http";
import { t0Session } from "@/server/t0-stubs";

export async function POST(request: Request): Promise<Response> {
  const parsed = await parseBody(request, SessionRequestSchema);
  if (!parsed.ok) return parsed.response;
  const session = t0Session(parsed.data);
  return session
    ? Response.json(session)
    : apiError(
        "scene_not_found",
        "This scene is unavailable. Choose another from the library.",
        404,
      );
}
