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

/** Tips are written for a scene; outside one, the slots get neutral placeholders. */
function readTips(): Record<string, Tip> {
  try {
    const raw = JSON.parse(
      readFileSync(join(process.cwd(), "content/tips.json"), "utf8"),
    ) as Record<string, { why: string; tryInstead: string }>;
    const neutral = (text: string) =>
      text
        .replaceAll("{childName}", "[name]")
        .replaceAll("{limit}", "[the limit]")
        .replaceAll("{wants}", "[what they wanted]");
    return Object.fromEntries(
      Object.entries(raw).map(([tag, tip]) => [
        tag,
        { why: tip.why, tryInstead: neutral(tip.tryInstead) },
      ]),
    );
  } catch {
    return {};
  }
}

export default function ProgressPage() {
  const scenes = getPublicScenes().map(({ id, title, temperament }) => ({
    id,
    title,
    temperament,
  }));
  return <Progress tips={readTips()} scenes={scenes} />;
}
