import type { Metadata } from "next";
import { SharedPlaybook } from "./shared-playbook";

export const metadata: Metadata = {
  title: "Shared playbook",
  robots: { index: false, follow: false },
};

export default function SharedPlaybookPage() {
  return <SharedPlaybook />;
}
