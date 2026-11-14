import { z } from "zod";
import * as c from "@/shared/api";

export class ApiError extends Error {
  constructor(public code: string, public status: number, message: string) { super(message); this.name = "ApiError"; }
}
async function request<T>(path: string, schema: z.ZodType<T>, body?: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try { response = await fetch(path, { method: body === undefined ? "GET" : "POST", headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store", signal }); }
  catch (error) { if (error instanceof DOMException && error.name === "AbortError") throw error; throw new ApiError("network_error", 0, "We couldn't reach the server. Check your connection and try again."); }
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new ApiError("invalid_response", response.status, "The server returned an unreadable response. Please try again."); }
  if (!response.ok) { const error = c.ErrorResponseSchema.safeParse(payload); throw new ApiError(error.success ? error.data.error : "server_error", response.status, error.success ? error.data.message : "Something went wrong. Please try again."); }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) throw new ApiError("invalid_response", response.status, "The response didn't match what this page expected. Please refresh and try again.");
  return parsed.data;
}
export const api = {
  daily: (signal?: AbortSignal) => request("/api/daily", c.DailyResponseSchema, undefined, signal),
  session: (value: c.SessionRequest) => request("/api/session", c.SessionResponseSchema, c.SessionRequestSchema.parse(value)),
  turn: (value: c.TurnRequest) => request("/api/turn", c.TurnResponseSchema, c.TurnRequestSchema.parse(value)),
  customScene: (value: c.CustomSceneRequest) => request("/api/custom-scene", c.CustomSceneResponseSchema, c.CustomSceneRequestSchema.parse(value)),
  coach: (value: c.CoachRequest) => request("/api/coach", c.CoachResponseSchema, c.CoachRequestSchema.parse(value)),
  waitlist: (value: c.WaitlistRequest) => request("/api/waitlist", c.WaitlistResponseSchema, c.WaitlistRequestSchema.parse(value)),
  health: () => request("/api/health", c.HealthResponseSchema),
  stats: (key: string) => request(`/api/admin/stats?key=${encodeURIComponent(key)}`, c.AdminStatsSchema),
};
