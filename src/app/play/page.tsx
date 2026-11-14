import type { Metadata } from "next";
import { PlayExperience } from "@/components/play/play-experience";
import { getPublicScenes, getScenePars } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Today's meltdown",
  description:
    "Practise the moment before it happens. Play today's parenting scene, then try a do-over.",
};

export default function PlayPage() {
  return (
    <PlayExperience scenes={getPublicScenes()} scenePars={getScenePars()} />
  );
}
