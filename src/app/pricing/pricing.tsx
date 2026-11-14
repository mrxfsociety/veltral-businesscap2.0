"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { FREE_PLAYBOOK_LIMIT, usePro } from "@/lib/pro";
import { Icon } from "@/components/paper/icons";
import {
  Button,
  ButtonLink,
  Kicker,
  Sheet,
  Stamp,
} from "@/components/paper/primitives";
import { TicketBooth } from "@/components/paywall/paywall";

const ROWS: { feature: string; free: string; pass: string }[] = [
  {
    feature: "Today's meltdown, do-overs, the script, sharing",
    free: "Yes",
    pass: "Yes",
  },
  { feature: "Progress, plan and streak", free: "Yes", pass: "Yes" },
  { feature: "Scene library", free: "Today's scene", pass: "All twelve" },
  { feature: "Replay your own meltdown", free: "No", pass: "Yes" },
  { feature: "“What could I have said?”", free: "No", pass: "Yes" },
  {
    feature: "Voice mode",
    free: "No",
    pass: "Yes, where the browser supports it",
  },
  {
    feature: "Your lines (playbook)",
    free: `${FREE_PLAYBOOK_LIMIT} lines`,
    pass: "Unlimited",
  },
];

const SOURCE_LABEL = {
  stripe_test: "opened with the test checkout",
  code: "opened with the demo code",
  preview: "unlocked by the preview setting on this server",
} as const;

export function Pricing({
  checkoutIncomplete,
}: {
  checkoutIncomplete?: boolean;
}) {
  const { pro, entitlement, refresh, loading } = usePro();
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  async function returnToFree() {
    setResetting(true);
    setResetError("");
    try {
      await api.resetEntitlement();
      await refresh();
    } catch {
      setResetError("That didn't work. Please try again.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="stack">
      <header className="page-heading">
        <Kicker accent>Free and season pass</Kicker>
        <h1>
          Today is free. <em>Every scene is the pass.</em>
        </h1>
        <p>
          The daily meltdown, every do-over and your progress cost nothing. The
          season pass opens the whole library, your own replays, coach
          suggestions and voice.
        </p>
      </header>

      {checkoutIncomplete && (
        <p className="notice" role="status">
          The checkout didn&apos;t finish, so nothing changed. You can try again
          or use the demo code.
        </p>
      )}

      <Sheet lift={2} className="pass-state" aria-live="polite">
        {loading ? (
          <p className="muted">Checking your season pass…</p>
        ) : pro ? (
          <div className="stack">
            <p>
              <Stamp kind="helpful" solid>
                Season pass active
              </Stamp>{" "}
              {entitlement?.source
                ? `on this device, ${SOURCE_LABEL[entitlement.source]}${entitlement.source === "stripe_test" ? " (test mode)" : ""}.`
                : "on this device."}
            </p>
            <div className="actions">
              <ButtonLink href="/scenes" icon="stage">
                Open the scene library
              </ButtonLink>
              {entitlement?.source !== "preview" && (
                <Button
                  variant="secondary"
                  icon="rewind"
                  disabled={resetting}
                  onClick={() => void returnToFree()}
                >
                  {resetting ? "Returning…" : "Return to Free"}
                </Button>
              )}
            </div>
            {entitlement?.source !== "preview" && (
              <p className="muted small">
                Return to Free removes the pass from this browser so you can see
                both sides. Nothing is charged either way.
              </p>
            )}
            {resetError && <p role="alert">{resetError}</p>}
          </div>
        ) : (
          <p>
            <Stamp kind="neutral" icon="sun">
              Free
            </Stamp>{" "}
            You&apos;re on Free. Today&apos;s scene is open.
          </p>
        )}
      </Sheet>

      {!pro && !loading && (
        <Sheet lift={3} tape className="pricing-booth">
          <TicketBooth />
        </Sheet>
      )}

      <section className="sheet stack" aria-labelledby="comparison-title">
        <h2 id="comparison-title">What&apos;s included</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col">Free</th>
                <th scope="col">Season pass</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.feature}>
                  <th scope="row">{row.feature}</th>
                  <td>{row.free}</td>
                  <td>
                    {row.pass === "No" ? (
                      row.pass
                    ) : (
                      <>
                        <Icon name="check" size={14} /> {row.pass}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">
          $9.99 a month or $59.99 a year, each with a 7-day free trial. Checkout
          on this site runs in Stripe test mode: no real charge is possible and
          no card data reaches our server.
        </p>
      </section>
    </div>
  );
}
