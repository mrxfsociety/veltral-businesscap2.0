import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Instrument_Sans } from "next/font/google";
import { PaywallHost } from "@/components/paywall/paywall";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { THEME_SCRIPT } from "@/components/site/theme";
import "./globals.css";

/* The site is set in Geist. Fraunces and Instrument Sans stay for the
   paper stage and the play screen. */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

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
    default: "Veltral — rehearse the hardest minute of parenting",
    template: "%s · Veltral",
  },
  description:
    "A paper stage where parents rehearse a toddler meltdown, see what their words did, and take it again. No account needed.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFDF9" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1222" },
  ],
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
    // The theme script sets data-theme before hydration, and browser
    // extensions often add attributes to <body>: neither is a real mismatch.
    <html
      lang="en"
      className={`${geist.variable} ${fraunces.variable} ${instrument.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="site-main">
          {children}
        </main>
        <SiteFooter />
        <PaywallHost />
      </body>
    </html>
  );
}
