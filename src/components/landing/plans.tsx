"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./plans.module.css";

/*
 * Free and season pass, with a monthly / yearly switch. Prices match
 * PRICES in src/components/paywall/paywall.tsx and SPEC section 10.
 */
const MONTHLY_CENTS = 999;
const YEARLY_CENTS = 5999;

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const SAVING = dollars(MONTHLY_CENTS * 12 - YEARLY_CENTS);

type Billing = "monthly" | "yearly";

export function Plans() {
  const [billing, setBilling] = useState<Billing>("yearly");
  const yearly = billing === "yearly";

  return (
    <div className={styles.wrap}>
      <div
        className={styles.switch}
        role="group"
        aria-label="Billing period"
        data-billing={billing}
      >
        <span className={styles.thumb} aria-hidden="true" />
        <button
          type="button"
          aria-pressed={!yearly}
          onClick={() => setBilling("monthly")}
        >
          Monthly
        </button>
        <button
          type="button"
          aria-pressed={yearly}
          onClick={() => setBilling("yearly")}
        >
          Yearly <span className={styles.save}>Save {SAVING}</span>
        </button>
      </div>

      <div className={styles.plans}>
        <article className={styles.plan}>
          <h3>Free</h3>
          <p className={styles.price}>
            <strong>$0</strong>
          </p>
          <p className={styles.sub}>For everyone, every day.</p>
          <ul>
            <li>Today&apos;s meltdown, with do-overs</li>
            <li>The script after every scene</li>
            <li>Progress, streak and a plan for the week</li>
            <li>A playbook of five lines</li>
          </ul>
          <Link href="/play" className={styles.outline}>
            Play today&apos;s meltdown
          </Link>
        </article>

        <article className={`${styles.plan} ${styles.pass}`}>
          <div className={styles.passHead}>
            <h3>Season pass</h3>
            <span className={styles.tag}>7-day free trial</span>
          </div>
          <p className={styles.price} aria-live="polite">
            <strong>
              {yearly ? dollars(YEARLY_CENTS) : dollars(MONTHLY_CENTS)}
            </strong>
            <span>{yearly ? "a year" : "a month"}</span>
          </p>
          <p className={styles.sub}>
            {yearly
              ? `${dollars(Math.round(YEARLY_CENTS / 12))} a month, billed once a year. You save ${SAVING}.`
              : `Or ${dollars(YEARLY_CENTS)} a year, which saves ${SAVING}.`}
          </p>
          <ul>
            <li>All twelve scenes, ages 2 to 7</li>
            <li>Replay your own meltdowns</li>
            <li>&ldquo;What could I have said?&rdquo; coach suggestions</li>
            <li>Voice mode and an unlimited playbook</li>
          </ul>
          <Link href="/pricing" className={styles.solid}>
            See the season pass
          </Link>
        </article>
      </div>
    </div>
  );
}
