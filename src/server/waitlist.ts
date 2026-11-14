import type { WaitlistRequest } from "../shared/api";
import { getStorage, type Storage } from "./redis";
import { incrementStat } from "./stats";

export async function addToWaitlist(
  request: WaitlistRequest,
  storage: Storage = getStorage(),
): Promise<void> {
  await storage.append("waitlist", {
    email: request.email.trim().toLowerCase(),
    plan: request.plan,
    at: new Date(storage.now()).toISOString(),
  });
  await incrementStat("waitlist", storage);
}
