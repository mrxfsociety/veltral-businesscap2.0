import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicScenes } from "@/lib/catalog";
import { Lab, type LabStyle } from "./lab";

// The LAB switch is read at request time, never baked in at build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Style lab",
  robots: { index: false, follow: false },
};

const STYLES: LabStyle[] = ["diorama", "paper"];

function num(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  const n = Number(value);
  return Number.isFinite(n) && value !== undefined
    ? Math.min(max, Math.max(min, Math.round(n)))
    : fallback;
}

/**
 * Style lab: the same engine state rendered by each candidate art direction.
 * Not part of the product. Off in production unless LAB=1.
 * Query: ?style=diorama|paper&storm=0..100&connection=0..100&delta=-50..50&shot=1
 */
export default async function LabPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.LAB !== "1")
    notFound();
  const q = await searchParams;
  const scene = getPublicScenes().find((s) => s.id === "playground-leave");
  if (!scene) notFound();
  const style = STYLES.includes(q.style as LabStyle)
    ? (q.style as LabStyle)
    : "diorama";
  return (
    <Lab
      scene={scene}
      initial={{
        style,
        storm: num(q.storm, scene.startArousal, 0, 100),
        connection: num(q.connection, 50, 0, 100),
        delta: num(q.delta, 4, -50, 50),
      }}
      shot={q.shot === "1"}
    />
  );
}
