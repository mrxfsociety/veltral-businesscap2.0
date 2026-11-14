// STUB(T0): replaced in stage A3.
import {
  CustomSceneRequestSchema,
  CustomSceneResponseSchema,
} from "@/shared/api";
import { parseBody } from "@/server/http";
export async function POST(request: Request): Promise<Response> {
  const parsed = await parseBody(request, CustomSceneRequestSchema);
  if (!parsed.ok) return parsed.response;
  return Response.json(
    CustomSceneResponseSchema.parse({
      ok: false,
      reason: "model_unavailable",
      message:
        "Custom scenes are unavailable right now. Choose a scene from the library instead.",
    }),
  );
}
