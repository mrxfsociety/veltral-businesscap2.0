"use client";

import Link from "next/link";
import { useStore } from "@/lib/use-store";
import { summarizeProgress } from "@/lib/progress";
import { tagLabel } from "@/lib/presentation";

export function Progress() {
  const store = useStore();
  const summary = summarizeProgress(store);

  return (
    <div className="stack">
      <header className="page-heading">
        <p className="kicker">One rehearsal at a time</p>
        <h1>Your practice.</h1>
        <p>
          A record of the moments you&apos;ve practised on this device. This is
          practice data, not a measure of your parenting.
        </p>
      </header>
      {store.history.length === 0 ? (
        <div className="empty-state card stack">
          <h2>Start with one moment.</h2>
          <p>Finish today&apos;s scene to begin your practice history.</p>
          <Link className="button" href="/play">
            Play today&apos;s meltdown
          </Link>
        </div>
      ) : (
        <>
          <div className="grid">
            <section className="card">
              <p className="kicker">Current daily streak</p>
              <h2>
                {summary.currentStreak}{" "}
                {summary.currentStreak === 1 ? "day" : "days"}
              </h2>
              <p className="muted">
                The shared daily scene changes at midnight in New York.
              </p>
            </section>
            <section className="card">
              <p className="kicker">Sessions on this device</p>
              <h2>{summary.sessionsPlayed}</h2>
              <p className="muted">
                Including completed do-overs and library practice.
              </p>
            </section>
            <section className="card">
              <p className="kicker">Most-used helpful move</p>
              <h2>
                {summary.mostUsedHelpful
                  ? tagLabel(summary.mostUsedHelpful.tag)
                  : "No helpful moves recorded yet"}
              </h2>
              {summary.mostUsedHelpful && (
                <p>
                  {summary.mostUsedHelpful.count}{" "}
                  {summary.mostUsedHelpful.count === 1 ? "time" : "times"}
                </p>
              )}
            </section>
            <section className="card">
              <p className="kicker">Most frequent slip</p>
              <h2>
                {summary.mostFrequentSlip
                  ? tagLabel(summary.mostFrequentSlip.tag)
                  : "No slips recorded"}
              </h2>
              {summary.mostFrequentSlip && (
                <p>
                  {summary.mostFrequentSlip.count}{" "}
                  {summary.mostFrequentSlip.count === 1 ? "time" : "times"}
                </p>
              )}
            </section>
          </div>
          <section className="card stack" aria-labelledby="helpful-share-title">
            <h2 id="helpful-share-title">Share of helpful moves</h2>
            <p className="muted">
              Helpful chips divided by all detected chips in your most recent{" "}
              {summary.series.length} sessions. No detected chips means no
              percentage is available.
            </p>
            <ol className="stack" style={{ paddingLeft: "1.5rem" }}>
              {summary.series.map((point) => (
                <li key={point.id}>
                  <div className="row">
                    <span>{point.sceneTitle}</span>
                    <strong>
                      {point.share === null
                        ? "No chips detected"
                        : `${Math.round(point.share * 100)}%`}
                    </strong>
                  </div>
                  {point.share !== null && (
                    <meter
                      min={0}
                      max={1}
                      value={point.share}
                      aria-label={`${point.sceneTitle}: ${Math.round(point.share * 100)} percent helpful moves`}
                      style={{
                        width: "100%",
                        height: "1.5rem",
                        accentColor: "var(--accent, #236354)",
                      }}
                    />
                  )}
                </li>
              ))}
            </ol>
          </section>
          <section className="stack" aria-labelledby="history-title">
            <h2 id="history-title">Past sessions</h2>
            {store.history.map((entry) => (
              <article key={entry.id} className="card">
                <div className="row">
                  <h3>{entry.sceneTitle}</h3>
                  <time dateTime={entry.at}>
                    {new Date(entry.at).toLocaleDateString("en-US")}
                  </time>
                </div>
                <p>
                  <span aria-label={`${entry.stars} stars`}>
                    {"★".repeat(entry.stars)}
                  </span>{" "}
                  · {entry.turns} turns · par {entry.par}
                </p>
                <p className="muted">
                  {entry.outcome === "calm_limit_held"
                    ? "Calm, and the limit held."
                    : entry.outcome === "calm_gave_in"
                      ? "Quiet, but the limit is gone."
                      : "Still melting down."}
                </p>
                {entry.kind !== "custom" && (
                  <Link
                    className="button-secondary"
                    href={`/play/${encodeURIComponent(entry.sceneId)}`}
                  >
                    Practise this scene
                  </Link>
                )}
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
