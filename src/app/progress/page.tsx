import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getPublicScenes } from "@/lib/catalog";
import { Progress, type Tip } from "./progress";

export const metadata: Metadata = {
  title: "Your practice",
  description:
    "Your streak, level, this week's plan, your moves and your slips, from practice on this device.",
};

/** Tips keep their {slots}; the page fills them from the parent's own history. */
function readTips(): Record<string, Tip> {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "content/tips.json"), "utf8"),
    ) as Record<string, Tip>;
  } catch {
    return {};
  }
}

export default function ProgressPage() {
  const scenes = getPublicScenes().map(
    ({ id, title, temperament, childName, limit, wants }) => ({
      id,
      title,
      temperament,
      childName,
      limit,
      wants,
    }),
  );
  return <Progress tips={readTips()} scenes={scenes} />;
}
