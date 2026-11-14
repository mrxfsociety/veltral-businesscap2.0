// STUB(T0): replaced in stage A3.
import { CoachRequestSchema, CoachResponseSchema } from "@/shared/api";
import { parseBody } from "@/server/http";
export async function POST(request: Request): Promise<Response> {
  const parsed = await parseBody(request, CoachRequestSchema);
  if (!parsed.ok) return parsed.response;
  return Response.json(CoachResponseSchema.parse({ source: "tips", suggestions: [], tip: { tag: "THREAT", why: "Threats raise the pressure.", tryInstead: "Name the feeling and calmly restate your limit." } }));
}
