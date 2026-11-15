"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { FREE_PLAYBOOK_LIMIT, usePro } from "@/lib/pro";
import { Icon } from "@/components/paper/icons";
import { Button, Kicker } from "@/components/paper/primitives";
import styles from "./paywall.module.css";

export const PRICES = {
  monthly: { label: "$9.99", per: "a month", cents: 999 },
  yearly: { label: "$59.99", per: "a year", cents: 5999 },
} as const;
/** What a year of monthly passes would cost minus the yearly pass, from the two prices above. */
export const YEARLY_SAVING = `$${((PRICES.monthly.cents * 12 - PRICES.yearly.cents) / 100).toFixed(2)}`;

export const PASS_INCLUDES = [
  "Every scene in the library, not only today's",
  "Replay your own meltdown as a new scene",
  "“What could I have said?” — alternatives checked by the engine",
  "Voice mode: say it out loud, with a raised-voice check",
  `Unlimited lines in your playbook (Free keeps ${FREE_PLAYBOOK_LIMIT})`,
];

export const TEST_NOTICE =
  "Test mode. No real charge. Card 4242 4242 4242 4242, any future date, any CVC.";

/** The season pass: prices, trial, test checkout and the demo code. Used in the modal and on /pricing. */
export function TicketBooth({
  feature,
  onOpened,
  headingId,
}: {
  feature?: string;
  onOpened?: () => void;
  headingId?: string;
}) {
  const { entitlement, refresh, pro } = usePro();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState<"" | "code" | "monthly" | "yearly">(
    "",
  );
  const [error, setError] = useState("");
  const [opened, setOpened] = useState(false);
  const checkout = entitlement?.checkout === "stripe_test";
  const demo = entitlement?.demoCode ?? null;

  async function redeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending("code");
    setError("");
    try {
      await api.redeem({ code: code.trim() });
      await refresh();
      setOpened(true);
      onOpened?.();
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "That didn't work. Please try again.",
      );
    } finally {
      setPending("");
    }
  }

  async function buy(plan: "monthly" | "yearly") {
    if (pending) return;
    setPending(plan);
    setError("");
    try {
      const { url } = await api.checkout({ plan });
      window.location.assign(url);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Checkout didn't open. Please try again.",
      );
      setPending("");
    }
  }

  if (pro || opened)
    return (
      <div className={styles.booth} data-open="">
        <Kicker accent>Season pass</Kicker>
        <h2 id={headingId}>The season pass is open on this device.</h2>
        <p>Every scene, your own replays, coach suggestions and voice.</p>
      </div>
    );

  return (
    <div className={styles.booth}>
      <Kicker accent>Season pass</Kicker>
      <h2 id={headingId}>
        {feature ? (
          <>
            {feature} <em>is part of the season pass.</em>
          </>
        ) : (
          <>
            Rehearse <em>every</em> scene.
          </>
        )}
      </h2>
      <p className={styles.free}>
        Today&apos;s meltdown, do-overs, the script and your progress stay free.
      </p>
      <ul className={styles.includes}>
        {PASS_INCLUDES.map((item) => (
          <li key={item}>
            <Icon name="check" size={16} />
            {item}
          </li>
        ))}
      </ul>
      <div className={styles.prices}>
        <div className={styles.price}>
          <p className={styles.priceLabel}>Monthly</p>
          <p className={styles.amount}>
            {PRICES.monthly.label} <span>{PRICES.monthly.per}</span>
          </p>
          {checkout && (
            <Button
              size="small"
              variant="secondary"
              disabled={Boolean(pending)}
              onClick={() => void buy("monthly")}
            >
              {pending === "monthly"
                ? "Opening checkout…"
                : "Start 7-day trial"}
            </Button>
          )}
        </div>
        <div className={styles.price} data-best="">
          <p className={styles.priceLabel}>Yearly · saves {YEARLY_SAVING}</p>
          <p className={styles.amount}>
            {PRICES.yearly.label} <span>{PRICES.yearly.per}</span>
          </p>
          {checkout && (
            <Button
              size="small"
              disabled={Boolean(pending)}
              onClick={() => void buy("yearly")}
            >
              {pending === "yearly" ? "Opening checkout…" : "Start 7-day trial"}
            </Button>
          )}
        </div>
      </div>
      <p className={styles.trial}>
        Both plans start with a 7-day free trial. Cancel any time.
      </p>
      {checkout && <p className={styles.testNotice}>{TEST_NOTICE}</p>}
      {demo && (
        <form className={styles.code} onSubmit={(event) => void redeem(event)}>
          <p>
            <strong>Reviewing Veltral?</strong> Enter <code>{demo}</code> to
            open the season pass on this device. Demo access, no payment.
          </p>
          <div className={styles.codeRow}>
            <label htmlFor="pass-code" className="sr-only">
              Demo code
            </label>
            <input
              id="pass-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="Demo code"
              maxLength={64}
            />
            <Button
              type="submit"
              icon="ticket"
              disabled={!code.trim() || Boolean(pending)}
            >
              {pending === "code" ? "Checking…" : "Open the pass"}
            </Button>
          </div>
        </form>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** One modal for the whole site. Anything can open it with openPaywall(feature). */
export function PaywallHost() {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [feature, setFeature] = useState<string | null>(null);
  useEffect(() => {
    const open = (event: Event) => {
      const detail = (event as CustomEvent<{ feature?: string }>).detail;
      setFeature(detail?.feature ?? "This");
      requestAnimationFrame(() => {
        if (ref.current && !ref.current.open) ref.current.showModal();
      });
    };
    window.addEventListener("doover:paywall", open);
    return () => window.removeEventListener("doover:paywall", open);
  }, []);
  function close() {
    ref.current?.close();
  }
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="paywall-title"
      onClose={() => setFeature(null)}
      onClick={(event) => {
        if (event.target === ref.current) close();
      }}
    >
      {feature !== null && (
        <>
          <div className={styles.awning} aria-hidden="true" />
          <button
            type="button"
            className={styles.close}
            onClick={close}
            aria-label="Close"
          >
            <Icon name="cross" size={18} />
          </button>
          <TicketBooth
            feature={feature}
            headingId="paywall-title"
            onOpened={() => {
              router.refresh();
              window.setTimeout(close, 1200);
            }}
          />
        </>
      )}
    </dialog>
  );
}
