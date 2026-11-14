import type { Metadata } from "next";
import { ClearData } from "./clear-data";
export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Do-Over stores, where it goes, and how to clear your browser data.",
};
export const dynamic = "force-dynamic";
export default function Privacy() {
  const providers = [
    process.env.OPENAI_API_KEY ? "OpenAI" : null,
    process.env.ANTHROPIC_API_KEY ? "Anthropic" : null,
  ].filter(Boolean);
  return (
    <article className="prose">
      <header className="page-heading">
        <p className="kicker">The small print, in plain English</p>
        <h1>
          Practice is personal.
          <br />
          <em>So is your data.</em>
        </h1>
        <p>
          No account. No advertising. No third-party analytics or tracking
          cookies in this app.
        </p>
      </header>
      <section>
        <h2>What leaves your browser</h2>
        <p>
          Your replies and custom scene descriptions are sent to our server to
          run the simulation. Don’t include real names or identifying details.
        </p>
        <p>
          {providers.length
            ? `Configured AI providers: ${providers.join(" and ")}. When model features are available, text is sent to these providers for tagging, child dialogue and optional scene generation or coaching. Their own data policies also apply.`
            : "No AI provider is configured in this deployment. Model-generated scenes and coaching are unavailable; the server can use its rules-only path when the engine is connected."}
        </p>
        <p>
          Session data is designed to expire after six hours; custom scenes
          after 24 hours. Daily standings use a random session ID and a score,
          rather than your name or reply text, and expire after 14 days. The
          deployment’s actual storage status is available at{" "}
          <a href="/api/health">the health endpoint</a>.
        </p>
        <p>
          The current development preview keeps sessions and waitlist
          submissions in process memory. It does not yet implement daily
          standings or generated custom scenes. These details must be updated at
          integration when the production server replaces the foundation.
        </p>
      </section>
      <section>
        <h2>What stays here</h2>
        <p>
          History, your playbook, streak information and preferences live in
          your browser’s local storage under <code>doover:v1</code>. They remain
          until you clear them. Private browsing or blocked storage may keep
          them only for this visit.
        </p>
        <p>
          A shared playbook link carries the saved lines in its URL fragment.
          This application does not send that fragment to the server. Anyone who
          receives the link can read the lines, and copies cannot be recalled.
        </p>
        <p>
          The waitlist stores the email address and chosen plan that you submit.
          No payment details are requested. There is no automatic expiry for
          waitlist entries.
        </p>
        <p>
          Voice recording is not enabled in this build. The app does not request
          microphone access or record audio.
        </p>
      </section>
      <ClearData />
    </article>
  );
}
