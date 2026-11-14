import { createVoiceHandlers } from "@/server/voice";
export const runtime = "nodejs";
export const POST = createVoiceHandlers().speak;
