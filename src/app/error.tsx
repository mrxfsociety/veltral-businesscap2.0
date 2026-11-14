"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="error-page" role="alert">
      <h1>A little interruption.</h1>
      <p>
        This page couldn’t load. Your saved lines and history stay in this
        browser.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
