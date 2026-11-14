import { createPlayHandlers } from "../../../server/play";

export const runtime = "nodejs";
export const POST = createPlayHandlers().session;
