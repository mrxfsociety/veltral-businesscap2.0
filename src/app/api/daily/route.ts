// STUB(T0): replaced in stage A3.
import { DailyResponseSchema } from "@/shared/api";
import { t0Daily } from "@/server/t0-stubs";
export const dynamic = "force-dynamic";
export function GET(): Response {
  return Response.json(DailyResponseSchema.parse(t0Daily()));
}
