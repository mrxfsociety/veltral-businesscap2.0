import type { Metadata } from "next";
import { Playbook } from "./playbook";

export const metadata: Metadata = {
  title: "Your playbook",
  description: "Keep the words that worked in your practice sessions.",
};

export default function PlaybookPage() {
  return <Playbook />;
}
