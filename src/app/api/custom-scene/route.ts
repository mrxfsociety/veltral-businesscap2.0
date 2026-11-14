import { createFeatureHandlers } from "@/server/features";
import { withPro } from "@/server/entitlement";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = withPro(createFeatureHandlers().customScene);
