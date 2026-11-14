"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { decodePlaybook } from "@/lib/share";
import { tagLabel } from "@/lib/presentation";

function subscribeHash(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

function currentHash() {
  return window.location.hash;
}
function serverHash() {
  return null;
}

export function SharedPlaybook() {
  const hash = useSyncExternalStore<string | null>(
    subscribeHash,
    currentHash,
    serverHash,
  );
  const lines = hash === null ? undefined : decodePlaybook(hash);

  return (
    <div className="stack">
      <header className="page-heading">
        <p className="kicker">A few words, shared</p>
        <h1>A co-parent&apos;s playbook.</h1>
        <p>
          This is a read-only snapshot carried in the link. Nothing is added to
          your own playbook.
        </p>
      </header>
      {lines === undefined ? (
        <p role="status">Reading the shared playbook…</p>
      ) : lines === null ? (
        <div className="notice" role="alert">
          <h2>This link can&apos;t be read.</h2>
          <p>
            It may be incomplete, invalid or too large. Ask the sender for a
            fresh link.
          </p>
        </div>
      ) : lines.length === 0 ? (
        <div className="empty-state card">
          <p>No lines were included in this playbook.</p>
        </div>
      ) : (
        <div className="stack">
          {lines.map((line, index) => (
            <article className="card stack" key={`${line.id}-${index}`}>
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
            </article>
          ))}
        </div>
      )}
      <Link className="button" href="/play">
        Practise a moment yourself
      </Link>
    </div>
  );
}
