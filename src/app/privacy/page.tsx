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
    process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL ? "OpenAI" : null,
    process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL
      ? "Anthropic"
      : null,
  ].filter(Boolean);
  const transcriptionConfigured = Boolean(
    process.env.OPENAI_API_KEY && process.env.OPENAI_TRANSCRIBE_MODEL,
  );
  const speechConfigured = Boolean(
    process.env.OPENAI_API_KEY && process.env.OPENAI_TTS_MODEL,
  );
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
            ? `Configured text AI providers: ${providers.join(" and ")}. Replies and recent scene context may be sent to the primary provider and, if needed, the fallback provider for tagging, child dialogue and optional scene generation or coaching. Their own data policies also apply. Configuration does not guarantee availability.`
            : "No text AI provider and model are configured in this deployment. Rules and written child lines run the simulation. Generated custom scenes and model coaching are unavailable; written coaching tips can still be shown."}
        </p>
        <p>
          A failed model request may already have sent your text to the provider
          before rules and written dialogue take over.
        </p>
        <p>
          Server sessions include replies and expire six hours after creation;
          further replies do not extend that window. Generated custom scenes
          expire after 24 hours. Daily standings store a random session ID and a
          score, with a 14-day expiry window. They do not store your name or
          reply text. The deployment’s current storage mode is available at{" "}
          <a href="/api/health">the health endpoint</a>.
        </p>
        <p>
          The server uses Redis when available and falls back to process memory.
          Memory data can disappear on a restart and is not shared between web
          processes. Expired entries are unavailable immediately; memory cleanup
          runs every minute.
        </p>
        <p>
          Abuse prevention uses a hash of your IP address, with limits lasting
          one hour or 24 hours for custom scenes. Raw IP addresses are not kept
          in that store. Aggregate usage counters have a 30-day expiry window
          and contain counts, not reply text.
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
          Clearing browser data does not delete server sessions, shared copies
          or waitlist submissions. It does remove the season-pass cookie.
        </p>
      </section>
      <section>
        <h2>Optional voice</h2>
        <p>
          Voice is part of the season pass. Recording requires your microphone
          permission and a supported browser. The three-second volume
          calibration stays in your browser. A reply recording is sent through
          our server to OpenAI for transcription when transcription is
          configured. This app does not save the recording on the server; its
          transcript is handled like a typed reply. OpenAI’s data policies also
          apply.
        </p>
        <p>
          {transcriptionConfigured
            ? "OpenAI transcription is configured here; availability depends on the provider."
            : "OpenAI transcription is not configured here. Use text replies."}{" "}
          {speechConfigured
            ? "OpenAI speech playback is configured here."
            : "OpenAI speech playback is not configured here; browser playback may be available."}
        </p>
        <p>
          For spoken child replies, the server sends the child’s line to OpenAI
          when speech playback is configured. Generated audio is cached in
          process memory. Entries expire after up to one hour or when the
          session expires, whichever comes first. Later playback requests clear
          expired entries; a server restart clears the cache. Browser playback
          uses your browser’s speech service, whose data handling depends on the
          browser and voice.
        </p>
      </section>
      <section>
        <h2>Season pass and payments</h2>
        <p>
          If you open the season pass, the server sets one cookie,{" "}
          <code>doover_pro</code>. It holds only how the pass was opened (demo
          code or test checkout), when, and when it ends after 30 days, signed
          so it cannot be edited. It is <code>httpOnly</code>, so page scripts
          cannot read it, and it is not used for tracking. “Return to Free” on
          the pricing page deletes it.
        </p>
        <p>
          Checkout is handled by Stripe on Stripe&apos;s own page, in test mode:
          no real charge is possible, and no card data reaches our server. When
          you come back, our server asks Stripe only whether that checkout was
          completed.
        </p>
        <p>
          Before the season pass existed, the pricing page offered a waitlist.
          Those entries (email, chosen plan, time) have no automatic expiry and
          persist in Redis when available.
        </p>
      </section>
      <ClearData />
    </article>
  );
}
