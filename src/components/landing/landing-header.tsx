"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  currentTheme,
  setTheme,
  subscribeTheme,
  THEME_COLORS,
  type Theme,
} from "./theme";
import { VeltralLogo } from "./veltral-logo";
import styles from "./landing-header.module.css";

const LINKS: { href: string; label: string }[] = [
  { href: "/scenes", label: "Scenes" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/progress", label: "Progress" },
  { href: "/pricing", label: "Season pass" },
];

function useTheme(initial: Theme | null): Theme | null {
  return useSyncExternalStore(subscribeTheme, currentTheme, () => initial);
}

export function ThemeToggle({
  initial,
  className,
}: {
  /** The theme the server rendered from the preference cookie, if any. */
  initial: Theme | null;
  className?: string;
}) {
  const theme = useTheme(initial);
  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className={`${styles.toggle} ${className ?? ""}`}
      onClick={() => setTheme(next)}
      aria-label={theme ? `Switch to ${next} theme` : "Switch colour theme"}
      title={theme ? `Switch to ${next} theme` : "Switch colour theme"}
    >
      <svg
        className={styles.moon}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M20.2 14.6A8.4 8.4 0 0 1 9.4 3.8a8.4 8.4 0 1 0 10.8 10.8Z"
          fill="currentColor"
        />
      </svg>
      <svg
        className={styles.sun}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="4.4" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.35 5.35l1.55 1.55M17.1 17.1l1.55 1.55M5.35 18.65l1.55-1.55M17.1 6.9l1.55-1.55" />
        </g>
      </svg>
    </button>
  );
}

export function LandingHeader({ theme }: { theme: Theme | null }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // The browser bar follows the landing theme while this page is open.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const previous = meta?.getAttribute("content") ?? null;
    const sync = () =>
      meta?.setAttribute("content", THEME_COLORS[currentTheme()]);
    sync();
    const unsubscribe = subscribeTheme(sync);
    return () => {
      unsubscribe();
      if (meta && previous) meta.setAttribute("content", previous);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 900) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header
      className={styles.header}
      data-scrolled={scrolled || undefined}
      data-open={open || undefined}
    >
      <div className={styles.shell}>
        <div className={styles.bar}>
          <Link
            href="/"
            className={styles.logo}
            aria-label="Do-Over by Veltral, home"
          >
            <VeltralLogo title="Veltral" />
          </Link>

          <nav className={styles.links} aria-label="Main navigation">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={styles.end}>
            <ThemeToggle initial={theme} />
            <Link href="/play" className={styles.play}>
              Play today
            </Link>
            <button
              ref={buttonRef}
              type="button"
              className={styles.menuButton}
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
        </div>

        <nav
          id={menuId}
          className={styles.menu}
          aria-label="Menu"
          hidden={!open}
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/play"
            className={styles.menuPlay}
            onClick={() => setOpen(false)}
          >
            Play today&apos;s meltdown
          </Link>
        </nav>
      </div>
    </header>
  );
}
