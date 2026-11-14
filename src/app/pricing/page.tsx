import type { Metadata } from "next";
import { Pricing } from "./pricing";

export const metadata: Metadata = {
  title: "Free and season pass",
  description:
    "Today's meltdown is free. The season pass opens every scene, your own replays, coach suggestions and voice.",
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  return <Pricing checkoutIncomplete={checkout === "incomplete"} />;
}
