import type { Metadata } from "next";
import { PlayExperience } from "@/components/play/play-experience";
import { getPublicScenes, getScenePars } from "@/lib/catalog";

export const metadata: Metadata = { title: "Practice a scene · Do-Over" };

export default async function ScenePage({
  params,
}: {
  params: Promise<{ sceneId: string }>;
}) {
  const { sceneId } = await params;
  return (
    <PlayExperience
      key={sceneId}
      sceneId={sceneId}
      scenes={getPublicScenes()}
      scenePars={getScenePars()}
    />
  );
}
