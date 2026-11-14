import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import Link from "next/link";
import { ButtonLink, Wordmark } from "@/components/paper/primitives";
import { BottomBar, SiteNav } from "@/components/paper/site-nav";
import { PaywallHost } from "@/components/paywall/paywall";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Do-Over — rehearse the hardest minute of parenting",
    template: "%s · Do-Over",
  },
  description:
    "A paper stage where parents rehearse a toddler meltdown, see what their words did, and take it again. No account needed.",
};

export const viewport: Viewport = {
  themeColor: "#F4ECDD",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${instrument.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <Link className="brand" href="/" aria-label="Do-Over home">
            <Wordmark />
          </Link>
          <SiteNav />
          <ButtonLink
            className="header-play"
            href="/play"
            icon="play"
            aria-label="Play today's meltdown"
          >
            <span className="label-long">Play today&apos;s meltdown</span>
            <span className="label-short">Play today</span>
          </ButtonLink>
        </header>
        <main id="main" className="site-main">
          {children}
        </main>
        <footer className="site-footer">
          <Link className="brand" href="/" aria-label="Do-Over home">
            <Wordmark />
          </Link>
          <p>Rehearse the hard minute before it happens.</p>
          <nav aria-label="Footer">
            <Link href="/scenes">Scenes</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/pricing">Season pass</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/jury">Jury guide</Link>
          </nav>
          <p className="disclaimer">
            Do-Over is a practice tool. It is not therapy, medical advice or a
            diagnosis. The child is simulated and the scoring is a simplified
            model.
          </p>
        </footer>
        <BottomBar />
        <PaywallHost />
      </body>
    </html>
  );
}
