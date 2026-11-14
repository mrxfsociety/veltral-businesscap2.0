"use client";

import { usePro } from "@/lib/pro";
import { Icon } from "@/components/paper/icons";
import { ButtonLink, Kicker, Sheet } from "@/components/paper/primitives";
import { PASS_INCLUDES } from "@/components/paywall/paywall";

export function Welcome() {
  const { pro, loading, entitlement } = usePro();
  return (
    <Sheet lift={3} tape tilt="left" className="welcome-sheet">
      <Kicker accent>Season pass</Kicker>
      {loading ? (
        <h1>Checking your season pass…</h1>
      ) : pro ? (
        <>
          <h1>
            Season pass active{" "}
            <em>
              {entitlement?.source === "stripe_test" ? "(test mode)" : ""}
            </em>
          </h1>
          <p>Here is what is open now on this device:</p>
          <ul className="welcome-list">
            {PASS_INCLUDES.map((item) => (
              <li key={item}>
                <Icon name="check" size={16} /> {item}
              </li>
            ))}
          </ul>
          <div className="actions">
            <ButtonLink href="/play" icon="play" size="large">
              Play today&apos;s meltdown
            </ButtonLink>
            <ButtonLink href="/scenes" variant="secondary" icon="stage">
              Open the scene library
            </ButtonLink>
          </div>
        </>
      ) : (
        <>
          <h1>The pass isn&apos;t open on this device.</h1>
          <p>
            The checkout may not have finished. Nothing was charged: this site
            runs Stripe in test mode.
          </p>
          <ButtonLink href="/pricing" icon="ticket">
            Back to the season pass
          </ButtonLink>
        </>
      )}
    </Sheet>
  );
}
