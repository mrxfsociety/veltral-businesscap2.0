import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicScenes } from "@/lib/catalog";
import { StageLab } from "./stage-lab";

export const metadata: Metadata = {
  title: "Stage lab",
  robots: { index: false, follow: false },
};

/** Development only: look at any set in storm and calm, full size and as a thumbnail. */
export default function StageLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <StageLab scenes={getPublicScenes()} />;
}
