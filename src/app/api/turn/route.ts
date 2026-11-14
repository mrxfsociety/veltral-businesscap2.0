// STUB(T0): replaced in stage A2.
import { TurnRequestSchema } from "@/shared/api";
import { apiError, parseBody } from "@/server/http";
import { t0Turn } from "@/server/t0-stubs";

export async function POST(request: Request): Promise<Response> {
  const parsed = await parseBody(request, TurnRequestSchema);
  if (!parsed.ok) return parsed.response;
  const turn = t0Turn(parsed.data);
  if (turn === "session_expired") return apiError(turn, "This session expired. Start a new scene.", 404);
  if (turn === "turn_out_of_order") return apiError(turn, "This turn is out of order. Try again from the last completed turn.", 409);
  if (turn === "session_ended") return apiError(turn, "This scene has ended. Choose a do-over or start again.", 409);
  return Response.json(turn);
}
