"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
import { useStore } from "@/lib/use-store";
import { updateStore } from "@/lib/store";
import { FREE_PLAYBOOK_LIMIT, isPro } from "@/lib/pro";
import { ProBadge } from "@/components/pro-gate";

export function Pricing() {
  const { waitlistJoined } = useStore();
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await api.waitlist({ email: email.trim(), plan });
      updateStore({ waitlistJoined: true });
      setEmail("");
      setSubmitted(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "We couldn't add you to the waitlist. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stack">
      <header className="page-heading">
        <p className="kicker">Start small. Practise often.</p>
        <h1>A little room to rehearse.</h1>
        <p>Today&apos;s scene is free, including the chance to do it over.</p>
      </header>
      <div className="notice">
        <p>
          Payments are not connected yet.
          {isPro()
            ? " During the preview every available Pro feature is unlocked."
            : " You can join the waitlist for planned Pro features."}
        </p>
        <ProBadge />
      </div>
      <div className="grid">
        <section className="card stack">
          <p className="kicker">A daily reset</p>
          <h2>Free</h2>
          <p>Today&apos;s meltdown, every day.</p>
          <ul>
            <li>Daily scene, do-overs and debrief</li>
            <li>Share your result</li>
            <li>Progress and daily streak</li>
            <li>{FREE_PLAYBOOK_LIMIT} saved playbook lines</li>
          </ul>
          <Link className="button-secondary" href="/play">
            Play today&apos;s meltdown
          </Link>
        </section>
        <section className="card stack">
          <p className="kicker">More moments to practise</p>
          <h2>Pro</h2>
          <p className="muted">Planned price</p>
          <p>
            <strong>$9.99</strong> / month or <strong>$59.99</strong> / year
          </p>
          <ul>
            <li>Everything in Free</li>
            <li>The full scene library</li>
            <li>Replay your own meltdown</li>
            <li>Coach suggestions checked by the engine</li>
            <li>Unlimited saved playbook lines</li>
            <li>Voice mode, planned</li>
          </ul>
          <a className="button" href="#waitlist">
            Join the Pro waitlist
          </a>
        </section>
      </div>
      <section className="card stack" aria-labelledby="comparison-title">
        <h2 id="comparison-title">What&apos;s included</h2>
        <div style={{ overflowX: "auto" }}>
          <table>
            <caption className="muted">Free and planned Pro features</caption>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col">Free</th>
                <th scope="col">Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Daily scene, do-overs, debrief, sharing</th>
                <td>Yes</td>
                <td>Yes</td>
              </tr>
              <tr>
                <th scope="row">Progress and streak</th>
                <td>Yes</td>
                <td>Yes</td>
              </tr>
              <tr>
                <th scope="row">Scene library</th>
                <td>Today&apos;s scene</td>
                <td>Full library</td>
              </tr>
              <tr>
                <th scope="row">Replay your own meltdown</th>
                <td>No</td>
                <td>Yes</td>
              </tr>
              <tr>
                <th scope="row">Coach suggestions</th>
                <td>No</td>
                <td>Yes</td>
              </tr>
              <tr>
                <th scope="row">Voice mode</th>
                <td>No</td>
                <td>Planned</td>
              </tr>
              <tr>
                <th scope="row">Playbook</th>
                <td>{FREE_PLAYBOOK_LIMIT} lines</td>
                <td>Unlimited</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section
        id="waitlist"
        className="card stack"
        aria-labelledby="waitlist-title"
      >
        <h2 id="waitlist-title">Be here for what comes next.</h2>
        <p>Join the waitlist for Pro. No payment, no commitment.</p>
        {submitted || waitlistJoined ? (
          <p role="status">
            You&apos;re on the waitlist. Thank you for your interest.
          </p>
        ) : (
          <form className="stack" onSubmit={join}>
            <label htmlFor="waitlist-email">Email address</label>
            <input
              id="waitlist-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={pending}
            />
            <label htmlFor="waitlist-plan">Which plan interests you?</label>
            <select
              id="waitlist-plan"
              name="plan"
              value={plan}
              onChange={(event) =>
                setPlan(event.target.value as "monthly" | "yearly")
              }
              disabled={pending}
            >
              <option value="monthly">Monthly — planned $9.99</option>
              <option value="yearly">Yearly — planned $59.99</option>
            </select>
            <p className="muted">
              We store your email and chosen plan for the waitlist.{" "}
              <Link href="/privacy">Read our privacy information</Link>.
            </p>
            <button className="button" type="submit" disabled={pending}>
              {pending ? "Joining…" : "Join waitlist"}
            </button>
            {pending && <p role="status">Submitting your email…</p>}
            {error && <p role="alert">{error}</p>}
          </form>
        )}
      </section>
    </div>
  );
}
