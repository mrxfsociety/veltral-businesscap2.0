import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pickChildLine } from "@/engine/lines";
import { getScene } from "@/engine/scenes";
import { TAG_INFO } from "@/engine/tags";
import { initialState } from "@/engine/transition";
import type { Outcome, Scene, Tag, TurnResult } from "@/engine/types";
import { Lab, type DemoLines, type LabStyle } from "./lab";

// A style test, not a feature: not linked, not indexed, and a 404 in
// production unless the server runs with LAB=1.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Style lab",
  robots: { index: false, follow: false },
};

const STYLES: LabStyle[] = ["paper", "pixel", "diorama"];
const GOOD_REPLY: Tag[] = ["NAME_FEELING", "HOLD_LIMIT", "OFFER_CHOICE"];

/** The engine's own child line for a fixed demonstration step. */
function lineFor(
  scene: Scene,
  arousal: number,
  delta: number,
  outcome: Outcome,
) {
  const before = initialState(scene);
  const result: TurnResult = {
    tags: [],
    before,
    after: { ...before, arousal, lastDelta: delta },
    delta,
    outcome,
    effects: [],
    notes: [],
  };
  return pickChildLine(null, scene, result, "lab");
}

function num(
  v: string | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  const n = Number(v);
  return v !== undefined && Number.isFinite(n)
    ? Math.min(max, Math.max(min, Math.round(n)))
    : fallback;
}

/**
 * /lab?style=paper|pixel|diorama&storm=0..100&connection=0..100&delta=-50..50
 *   &line=opening|rise|good|calm&stamps=good&outcome=calm_limit_held&shot=1
 */
export default async function LabPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  if (process.env.NODE_ENV === "production" && process.env.LAB !== "1")
    notFound();
  const scene = getScene("playground-leave");
  if (!scene) notFound();
  const { limitHints: _h, giveInHints: _g, ...publicScene } = scene;
  void _h;
  void _g;
  const opening = {
    line:
      scene.startArousal >= 80
        ? scene.openingLine.toUpperCase()
        : scene.openingLine,
    action: scene.openingAction,
  };
  const lines: DemoLines = {
    opening,
    rise: lineFor(scene, 89, 14, "ongoing") ?? opening,
    good: lineFor(scene, 57, -18, "ongoing") ?? opening,
    calm: lineFor(scene, 20, -37, "calm_limit_held") ?? opening,
  };
  const stamps = GOOD_REPLY.map((tag) => ({
    label: TAG_INFO[tag].label,
    kind: "helpful" as const,
  }));
  const style = STYLES.includes(q.style as LabStyle)
    ? (q.style as LabStyle)
    : "paper";
  const lineKey =
    (["opening", "rise", "good", "calm"] as const).find((k) => k === q.line) ??
    "opening";
  return (
    <Lab
      scene={publicScene}
      lines={lines}
      goodStamps={stamps}
      shot={q.shot === "1"}
      initial={{
        style,
        storm: num(q.storm, scene.startArousal, 0, 100),
        connection: num(q.connection, 50, 0, 100),
        delta: num(q.delta, 0, -50, 50),
        line: lineKey,
        stamps: q.stamps === "good",
        outcome:
          q.outcome === "calm_limit_held" ? "calm_limit_held" : "ongoing",
      }}
    />
  );
}
