import { createVoiceHandlers } from "@/server/voice";
import { withPro } from "@/server/entitlement";
export const runtime = "nodejs";
export const POST = withPro(createVoiceHandlers().transcribe);
