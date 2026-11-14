import type { Metadata } from "next";
import { ClearData } from "./clear-data";
export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Do-Over stores, where it goes, and how to clear your browser data.",
};
export const dynamic = "force-dynamic";
export default function Privacy() {
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
          When AI features are available, text is sent to OpenAI for tagging,
          child dialogue, custom scene generation or coaching. OpenAI’s own data
          policies also apply. If AI is unavailable, the daily scene and library
          can use rules and template dialogue. A failed AI request may still
          have sent your text before this fallback takes over.
        </p>
        <p>
          Session data, including replies, expires six hours after the session
          starts. Generated custom scenes expire after 24 hours. Daily standings
          store a random session ID and a score, rather than your name or reply
          text, with a 14-day expiry window.
        </p>
        <p>
          Server data uses Redis storage. If it is unavailable, the app falls
          back to server memory, which can be lost when the app restarts.
        </p>
        <p>
          The waitlist stores your submitted email address, chosen plan and
          submission date on our server. No payment details are requested. There
          is no automatic expiry for waitlist entries.
        </p>
        <p>
          To limit abuse, the server keeps a hash of your IP address with
          request counts for up to a day. It also keeps daily totals, such as
          sessions started and model calls, with a 30-day expiry window. These
          counters do not contain your replies.
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
          Clearing browser data below removes local history, saved lines and
          preferences. It does not remove server sessions, a submitted waitlist
          entry or copies of a shared link.
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
