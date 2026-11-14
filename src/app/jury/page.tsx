import type { Metadata } from "next";
import Link from "next/link";
import { dayKey, sceneOfTheDay } from "@/engine/scenes";
import { ButtonLink, Kicker, Sheet } from "@/components/paper/primitives";

export const metadata: Metadata = {
  title: "Jury guide",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function JuryPage() {
  const today = sceneOfTheDay(dayKey(new Date()));
  const locked = today.id === "car-seat" ? "bedtime" : "car-seat";
  const steps = [
    {
      title: "Play today's meltdown.",
      body: `Today's scene is "${today.title}". Start, read the child's line, then answer in your own words. Watch your reply become a slip on the stage: stamps for each move, a ledger of what each did, the storm moving.`,
      href: "/play",
      cta: "Play today's scene",
    },
    {
      title: "Do a turn over.",
      body: "At the end, open the script and press “Do-over from here” on your worst turn. The stage rewinds to that moment. Answer differently and the script shows Take 1 against Take 2.",
      href: "/play",
      cta: "Back to the stage",
    },
    {
      title: "Open a locked scene.",
      body: "Every other scene is part of the season pass. The paywall shows the price and a demo code: enter ENCORE to open the pass on this device, or use the Stripe test card 4242 4242 4242 4242 if checkout is shown. Then the scene plays. “Return to Free” on the pricing page locks it again.",
      href: `/play/${locked}`,
      cta: "Open a locked scene",
    },
    {
      title: "See a week of use.",
      body: "Progress shows your streak, level, this week's plan and your moves from the scenes you played. Switch on “Show a sample week” to see seven days filled in.",
      href: "/progress",
      cta: "Open progress",
    },
  ];
  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <header className="page-heading">
        <Kicker accent>Jury guide</Kicker>
        <h1>
          Four steps. <em>About five minutes.</em>
        </h1>
        <p>
          No account is needed. Everything you see is computed live by the
          engine; two things are labelled as such on screen: the checkout runs
          in Stripe test mode (no real charge is possible) and the sample week
          on Progress is sample data.
        </p>
      </header>
      <ol
        className="stack"
        style={{ listStyle: "none", padding: 0, margin: 0 }}
      >
        {steps.map((step, index) => (
          <li key={step.title}>
            <Sheet lift={index === 0 ? 2 : 1} className="stack">
              <Kicker>Step {index + 1}</Kicker>
              <h2 style={{ margin: 0 }}>{step.title}</h2>
              <p style={{ margin: 0 }}>{step.body}</p>
              <div>
                <ButtonLink
                  href={step.href}
                  variant={index === 0 ? "primary" : "secondary"}
                  icon="arrow"
                  iconAfter
                >
                  {step.cta}
                </ButtonLink>
              </div>
            </Sheet>
          </li>
        ))}
      </ol>
      <p className="muted small">
        How the scoring works, with measured accuracy and its limits:{" "}
        <Link href="/how-it-works">How it works</Link>.
      </p>
    </div>
  );
}
