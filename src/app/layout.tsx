import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Do-Over — a little practice for a hard moment",
    template: "%s · Do-Over",
  },
  description:
    "Practise the hardest moment of parenting in a meltdown simulator. No account needed.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <Link className="brand" href="/" aria-label="Do-Over home">
            <span aria-hidden="true">↺</span> Do-Over
            <span className="brand-dot">.</span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/scenes">Scenes</Link>
            <Link href="/playbook">Playbook</Link>
            <Link href="/progress">Progress</Link>
            <Link href="/pricing">Pricing</Link>
          </nav>
          <Link className="button header-play" href="/play">
            Let’s practise <span aria-hidden="true">↗</span>
          </Link>
        </header>
        <main id="main" className="site-main">
          {children}
        </main>
        <footer className="site-footer">
          <Link className="brand" href="/">
            ↺ Do-Over.
          </Link>
          <p>A little practice for a hard moment.</p>
          <nav aria-label="Footer">
            <Link href="/how-it-works">How it works</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/privacy">Privacy</Link>
          </nav>
          <p className="disclaimer">
            Do-Over is a practice tool. It is not therapy, medical advice or a
            diagnosis. The child is simulated and the scoring is a simplified
            model.
          </p>
        </footer>
      </body>
    </html>
  );
}
