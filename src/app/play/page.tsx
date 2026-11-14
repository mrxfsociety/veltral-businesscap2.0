import type { Metadata } from "next";
import { PlayExperience } from "@/components/play/play-experience";
import { getPublicScenes, getScenePars } from "@/lib/catalog";
import { DAILY_ROTATION } from "@/engine/scenes";

export const metadata: Metadata = {
  title: "Today's meltdown",
  description:
    "Rehearse the moment before it happens. Play today's parenting scene, then take it again.",
};

export default function PlayPage() {
  const scenes = getPublicScenes();
  const rotation = DAILY_ROTATION.map(
    (id) => scenes.find((scene) => scene.id === id)?.title ?? id,
  );
  return (
    <PlayExperience
      scenes={scenes}
      scenePars={getScenePars()}
      rotation={rotation}
    />
  );
}
