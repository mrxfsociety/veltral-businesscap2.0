import Link from "next/link";
import { DailyTeaser } from "@/components/daily-teaser";
import { LiveDemo } from "@/components/live-demo";
import { getPublicScenes, getScenePars } from "@/lib/catalog";
import { readEvaluation } from "@/lib/evaluation";
export const dynamic = "force-dynamic";
export default function Home() {
  const results = readEvaluation();
  return (
    <>
      <section className="hero">
        <p className="kicker">
          <span aria-hidden="true">◌</span> A practice space for parents
        </p>
        <h1>
          You know what to say.
          <br />
          <em>Until they scream.</em>
        </h1>
        <p>
          Do-Over is a 3-minute meltdown simulator for parents of 2–7 year olds.
          Practise the moment before it happens. No account needed.
        </p>
        <Link className="button" href="/play">
          Play today&apos;s meltdown <span aria-hidden="true">↗</span>
        </Link>
        <DailyTeaser />
      </section>
      <section className="landing-section">
        <div className="section-heading">
          <p className="kicker">Practice, with a rewind button</p>
          <h2>
            A hard moment.
            <br />
            <em>A chance to try again.</em>
          </h2>
        </div>
        <div className="grid">
          {[
            {
              n: "01",
              title: "They melt down.",
              text: "A familiar scene. A small person with very big feelings. You have a limit to hold.",
            },
            {
              n: "02",
              title: "You answer in 8 seconds.",
              text: "Say what comes to mind. Before you start, slow the timer down or turn it off if you need more space.",
            },
            {
              n: "03",
              title: "See what your words did.",
              text: "Read the reply tags and the change in arousal. Return to any turn and try a different response.",
            },
          ].map((step) => (
            <article className="step-card" key={step.n}>
              <span className="step-number">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
        <LiveDemo scenes={getPublicScenes()} scenePars={getScenePars()} />
      </section>
      <section className="landing-section">
        <div className="truth-panel">
          <div>
            <p className="kicker">You are not the only one</p>
            <p className="stat">48%</p>
            <p>
              of parents say their stress is completely overwhelming most days,
              compared with 26% of other adults.
            </p>
            <a
              className="small"
              href="https://www.hhs.gov/surgeongeneral/reports-and-publications/parents/index.html"
              target="_blank"
              rel="noreferrer"
            >
              U.S. Surgeon General’s Advisory, 2024 · 2023 data ↗
            </a>
          </div>
          <div>
            <h2>
              Knowing is one thing.
              <br />
              <em>Rehearsing is another.</em>
            </h2>
            <p>
              A review of 77 parent-training evaluations found larger effects
              for programs that included parents practising skills with their
              own child during sessions.
            </p>
            <a
              className="small"
              href="https://pubmed.ncbi.nlm.nih.gov/18205039/"
              target="_blank"
              rel="noreferrer"
            >
              Kaminski and colleagues, 2008 ↗
            </a>
            <p className="small" style={{ marginTop: 20 }}>
              Do-Over is rehearsal against a simulated child; we have not
              measured its effect.
            </p>
          </div>
        </div>
        <p className="muted small" style={{ marginTop: 20 }}>
          We have not measured whether practice here changes what happens at
          home. It is a place to rehearse.
        </p>
      </section>
      <section className="landing-section">
        <div className="grid">
          <div>
            <p className="kicker">No mystery score</p>
            <h2>
              You can look
              <br />
              <em>under the hood.</em>
            </h2>
            <p>
              Our design puts the outcome in a deterministic engine. AI proposes
              tags and child dialogue; it does not decide whether your child
              calms down.
            </p>
            <p>
              {results.rules
                ? `Rules-only test micro F1: ${results.rules.test.microF1.toFixed(3)}, measured on ${results.rules.test.n} test replies.`
                : "Measured tagging accuracy is not available yet. The foundation endpoints are still development placeholders pending engine integration."}
            </p>
            <Link href="/how-it-works">See the method and its limits ↗</Link>
          </div>
          <div className="card">
            <p className="kicker">A little more room to practise</p>
            <h2>
              One scene today.
              <br />
              More ways tomorrow.
            </h2>
            <p>
              The daily scene, do-overs and progress are free. Pro is planned
              for the full library, personal scenes, coaching and an unlimited
              playbook.
            </p>
            <p>
              <strong>Planned: $9.99/month or $59.99/year.</strong>
              <br />
              <span className="muted small">
                Payments are not connected. No card required.
              </span>
            </p>
            <Link className="button-secondary" href="/pricing">
              Explore Free &amp; Pro ↗
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
