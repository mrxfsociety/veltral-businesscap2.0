import Link from "next/link";
export default function NotFound() {
  return (
    <section className="error-page">
      <p className="kicker">A small wrong turn</p>
      <h1>This page isn’t here.</h1>
      <p>There’s still a fresh chance to practise.</p>
      <Link className="button" href="/play">
        Play today’s meltdown
      </Link>
    </section>
  );
}
