"use client";
import { useState } from "react";
import { clearStore } from "@/lib/store";
export function ClearData() {
  const [message, setMessage] = useState("");
  return (
    <div className="card stack">
      <h2>Your browser, your choice.</h2>
      <p>
        Remove your history, saved lines, settings and completed-day markers
        from this browser. This does not remove information already sent to the
        server or an AI provider, waitlist entries, or links you have shared.
      </p>
      <button
        className="button-secondary"
        onClick={() =>
          setMessage(
            clearStore()
              ? "Your local data has been cleared."
              : "This visit’s data is cleared, but your browser blocked removal of saved data. Clear this site’s storage in your browser settings to finish.",
          )
        }
      >
        Clear my data
      </button>
      <p className="copy-status" role="status">
        {message}
      </p>
    </div>
  );
}
