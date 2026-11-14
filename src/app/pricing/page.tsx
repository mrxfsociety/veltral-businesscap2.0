import type { Metadata } from "next";
import { Pricing } from "./pricing";

export const metadata: Metadata = {
  title: "Free and Pro | Do-Over",
  description:
    "Free daily practice and planned Pro features. No payments are connected.",
};

export default function PricingPage() {
  return <Pricing />;
}
