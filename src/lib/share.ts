import { z } from "zod";
import type { Score } from "@/engine/types";
import { PlaybookEntrySchema, type PlaybookEntry } from "./store";

export const MAX_SHARED_LINES = 100;
export const MAX_FRAGMENT_LENGTH = 32_768;
const SharedPlaybookSchema = z
  .object({
    version: z.literal(1),
    lines: z.array(PlaybookEntrySchema).max(MAX_SHARED_LINES),
  })
  .strict();

export interface ShareResult {
  dayNumber?: number;
  sceneTitle: string;
  score: Score;
  url: string;
}

/** A paused or unfinished scene is never made into a shareable score. */
export function buildShareText({
  dayNumber,
  sceneTitle,
  score,
  url,
}: ShareResult): string | null {
  if (score.outcome === "stopped_unsafe" || score.outcome === "ongoing")
    return null;
  const squares = score.grid
    .map((cell) => ({ good: "🟩", mixed: "🟨", bad: "🟥" })[cell])
    .join("");
  const turns = score.grid.length;
  const ending =
    score.outcome === "calm_limit_held"
      ? `Calm in ${score.turnsToCalm ?? turns} (par ${score.par})`
      : score.outcome === "calm_gave_in"
        ? `Gave in on turn ${turns}`
        : `Not calm after ${turns}`;
  const number = dayNumber === undefined ? "" : ` #${dayNumber}`;
  return `Veltral${number} · ${sceneTitle}\n${squares} ${ending} ${"★".repeat(score.stars)}\n${url}`;
}

/** Encodes UTF-8 text into a URL-safe payload; it does not send or save anything. */
export function encodePlaybook(lines: readonly PlaybookEntry[]): string {
  const parsed = SharedPlaybookSchema.safeParse({ version: 1, lines });
  if (!parsed.success)
    throw new Error("Choose up to 100 valid saved lines to share.");
  const bytes = new TextEncoder().encode(JSON.stringify(parsed.data));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const payload = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  if (payload.length > MAX_FRAGMENT_LENGTH) {
    throw new Error(
      "This playbook is too large for a link. Share fewer lines.",
    );
  }
  return payload;
}

/** Accepts the encoded value or a #d= fragment, rejecting invalid and oversized data. */
export function decodePlaybook(fragment: string): PlaybookEntry[] | null {
  if (fragment.length > MAX_FRAGMENT_LENGTH + 3) return null;
  const payload = fragment.startsWith("#d=") ? fragment.slice(3) : fragment;
  if (
    !payload ||
    payload.length > MAX_FRAGMENT_LENGTH ||
    !/^[A-Za-z0-9_-]+$/.test(payload)
  ) {
    return null;
  }
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    const json: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
    const parsed = SharedPlaybookSchema.safeParse(json);
    return parsed.success ? parsed.data.lines : null;
  } catch {
    return null;
  }
}

export function buildPlaybookUrl(
  lines: readonly PlaybookEntry[],
  origin: string,
): string {
  const url = new URL("/playbook/shared", origin);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("A playbook link needs an HTTP or HTTPS site address.");
  }
  url.hash = `d=${encodePlaybook(lines)}`;
  return url.toString();
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText)
      return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
