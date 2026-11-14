import { createPlayHandlers } from "../../../server/play";
import { sessionNeedsPro, withPro } from "@/server/entitlement";

export const runtime = "nodejs";
// Today's scene is free; other library scenes and custom scenes need the season pass.
export const POST = withPro(createPlayHandlers().session, sessionNeedsPro);
