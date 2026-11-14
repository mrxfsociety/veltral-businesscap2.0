import type { Metadata } from "next";
import { Welcome } from "./welcome";

export const metadata: Metadata = {
  title: "Season pass active",
  robots: { index: false, follow: false },
};

export default function WelcomePage() {
  return <Welcome />;
}
