"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { SessionResponse, TurnResponse } from "@/shared/api";
export default function FoundationPlay() {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [turn, setTurn] = useState<TurnResponse | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    setBusy(true);
    setError("");
    try {
      setSession(await api.session({ kind: "daily" }));
      setTurn(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start");
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      setTurn(
        await api.turn({
          sessionId: session.sessionId,
          turnIndex: turn ? turn.turnIndex + 1 : 0,
          text,
          inputMode: "text",
        }),
      );
      setText("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card stack">
      <h1>Foundation wiring preview</h1>
      <p>
        This screen uses explicitly marked development placeholders, not the
        real simulation.
      </p>
      {!session ? (
        <button className="button" onClick={() => void start()} disabled={busy}>
          Start a test session
        </button>
      ) : (
        <>
          <h2>{session.scene.title}</h2>
          <p aria-live="polite">
            {turn?.child?.line ?? session.scene.openingLine}
          </p>
          <p>Arousal: {turn?.result.after.arousal ?? session.state.arousal}</p>
          <label htmlFor="reply">Your reply</label>
          <textarea
            id="reply"
            maxLength={300}
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={busy}
          />
          <button
            className="button"
            disabled={
              busy || Boolean(turn && turn.result.outcome !== "ongoing")
            }
            onClick={() => void send()}
          >
            Send test turn
          </button>
          {turn && <p role="status">Outcome: {turn.result.outcome}</p>}
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
