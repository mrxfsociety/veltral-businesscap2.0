import type { Metadata } from "next";
import { Progress } from "./progress";

export const metadata: Metadata = {
  title: "Your practice",
  description: "Your practice streak and recent sessions on this device.",
};

export default function ProgressPage() {
  return <Progress />;
}
