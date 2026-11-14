import { createFeatureHandlers } from "@/server/features";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = createFeatureHandlers().waitlist;
