"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/use-store";
import { removePlaybook } from "@/lib/store";
import { buildPlaybookUrl, copyText } from "@/lib/share";
import { tagLabel } from "@/lib/presentation";
import { FREE_PLAYBOOK_LIMIT, isPro } from "@/lib/pro";
import { ProBadge, ProGate } from "@/components/pro-gate";

export function Playbook() {
  const { playbook } = useStore();
  const [message, setMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  async function copyLine(text: string) {
    setMessage(
      (await copyText(text))
        ? "Line copied."
        : "Copy isn't available here. Select the line above and copy it manually.",
    );
  }

  async function share() {
    try {
      const url = buildPlaybookUrl(playbook, window.location.origin);
      setShareUrl(url);
      setMessage(
        (await copyText(url))
          ? "Shared playbook link copied."
          : "Your link is ready below. Select and copy it to share.",
      );
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "We couldn't create the shared link.",
      );
    }
  }

  return (
    <div className="stack">
      <header className="page-heading">
        <p className="kicker">Words to come back to</p>
        <h1>Your playbook.</h1>
        <p>
          Lines that helped during practice, saved by you. They stay in this
          browser.
        </p>
      </header>
      <div className="row">
        <p>
          {playbook.length} saved {playbook.length === 1 ? "line" : "lines"}
          {!isPro() && ` · Free limit: ${FREE_PLAYBOOK_LIMIT}`}
        </p>
        <ProBadge />
      </div>
      {playbook.length === 0 ? (
        <div className="empty-state card stack">
          <h2>Your words will go here.</h2>
          <p>Finish a scene and save a helpful reply from the debrief.</p>
          <Link className="button" href="/play">
            Play today&apos;s meltdown
          </Link>
        </div>
      ) : (
        <>
          <button
            className="button-secondary"
            type="button"
            onClick={() => void share()}
          >
            Share with a co-parent
          </button>
          <p className="muted">
            The shared link contains a snapshot of these lines. Anyone with the
            link can read them. Deleting a line here will not remove it from a
            link you already shared.
          </p>
          {shareUrl && (
            <div className="stack">
              <label htmlFor="shared-playbook-url">Shared playbook link</label>
              <input
                id="shared-playbook-url"
                value={shareUrl}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
              />
              <Link className="button-secondary" href={shareUrl}>
                Open shared playbook
              </Link>
            </div>
          )}
          <div className="stack">
            {playbook.map((line) => (
              <article className="card stack" key={line.id}>
                <blockquote>
                  <p>{line.text}</p>
                </blockquote>
                <div className="row" aria-label="Helpful moves">
                  {line.tags.map((tag) => (
                    <span className="chip" key={tag}>
                      ✓ {tagLabel(tag)}
                    </span>
                  ))}
                </div>
                <p className="muted">
                  {line.sceneTitle} ·{" "}
                  <time dateTime={line.at}>
                    {new Date(line.at).toLocaleDateString("en-US")}
                  </time>
                </p>
                <div className="row">
                  <button
                    className="button-secondary"
                    onClick={() => void copyLine(line.text)}
                    aria-label={`Copy line: ${line.text}`}
                  >
                    Copy
                  </button>
                  <button
                    className="button-secondary"
                    onClick={() => {
                      removePlaybook(line.id);
                      setShareUrl("");
                      setMessage("Line deleted from this browser.");
                    }}
                    aria-label={`Delete line: ${line.text}`}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      {!isPro() && playbook.length >= FREE_PLAYBOOK_LIMIT && (
        <ProGate feature="Unlimited playbook lines" />
      )}
      <p role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
