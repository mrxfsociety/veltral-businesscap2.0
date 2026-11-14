import { HealthResponseSchema } from "@/shared/api";
export const dynamic = "force-dynamic";
export function GET(): Response {
  return Response.json(
    HealthResponseSchema.parse({
      ok: true,
      commit: process.env.GIT_SHA ?? "development",
      time: new Date().toISOString(),
      redis: "memory",
      providers: {
        openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
        anthropic: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      },
      proPreview: process.env.NEXT_PUBLIC_PRO_PREVIEW === "true",
    }),
  );
}
