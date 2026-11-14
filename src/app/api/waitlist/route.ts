// STUB(T0): replaced in stage A3.
import { WaitlistRequestSchema, WaitlistResponseSchema } from "@/shared/api";
import { parseBody } from "@/server/http";
import { t0JoinWaitlist } from "@/server/t0-stubs";
export async function POST(request: Request): Promise<Response> {
  const parsed = await parseBody(request, WaitlistRequestSchema);
  if (!parsed.ok) return parsed.response;
  t0JoinWaitlist(parsed.data.email, parsed.data.plan);
  return Response.json(WaitlistResponseSchema.parse({ ok: true }));
}
