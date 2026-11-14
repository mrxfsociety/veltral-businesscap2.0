import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { SceneLibrary } from "./scene-library";

export const metadata: Metadata = {
  title: "Scene library",
  description: "Practise everyday parenting moments, grouped by age.",
};

export default function ScenesPage() {
  return <SceneLibrary catalog={getCatalog()} />;
}
