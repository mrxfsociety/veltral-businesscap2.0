import Link from "next/link";

import { UNSAFE_MESSAGE } from "./safety-copy";
export { UNSAFE_MESSAGE } from "./safety-copy";

export function UnsafePause({ onRetry }: { onRetry?: () => void }) {
  return (
    <section className="card stack" aria-labelledby="pause-title" role="status">
      <p className="kicker">A moment to pause</p>
      <h1 id="pause-title">Let&apos;s pause here.</h1>
      <p>{UNSAFE_MESSAGE}</p>
      <div className="row">
        {onRetry && (
          <button className="button" onClick={onRetry}>
            Try this turn again
          </button>
        )}
        <Link className="button-secondary" href="/scenes">
          Back to scenes
        </Link>
      </div>
    </section>
  );
}
