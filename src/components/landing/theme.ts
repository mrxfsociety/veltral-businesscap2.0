/*
 * Light and dark theme for the landing page.
 *
 * With no stored choice the page follows the system setting through CSS
 * (`prefers-color-scheme`). A choice made with the toggle is kept in a small
 * preference cookie, so the server renders `data-theme` on the landing root
 * and the first paint is already in the chosen theme (no script, no flash).
 * The toggle also writes the attribute at once, without a reload.
 */

export type Theme = "light" | "dark";

export const THEME_COOKIE = "doover_theme";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Browser bar colours, matching --lp-bg of each theme in landing.module.css. */
export const THEME_COLORS: Record<Theme, string> = {
  light: "#FFFDF9",
  dark: "#0D1222",
};

export function parseTheme(value: unknown): Theme | null {
  return value === "light" || value === "dark" ? value : null;
}

export function storedTheme(): Theme | null {
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${THEME_COOKIE}=`));
  return parseTheme(match?.slice(THEME_COOKIE.length + 1));
}

const DARK_QUERY = "(prefers-color-scheme: dark)";

export function systemTheme(): Theme {
  return window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light";
}

export function currentTheme(): Theme {
  return storedTheme() ?? systemTheme();
}

export function applyTheme(theme: Theme | null) {
  for (const root of document.querySelectorAll("[data-landing]")) {
    if (theme) root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
  }
  const color = THEME_COLORS[theme ?? systemTheme()];
  for (const meta of document.querySelectorAll('meta[name="theme-color"]'))
    meta.setAttribute("content", color);
}

const listeners = new Set<() => void>();

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia?.(DARK_QUERY);
  media?.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    media?.removeEventListener("change", listener);
  };
}

export function setTheme(theme: Theme) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`;
  applyTheme(theme);
  for (const listener of listeners) listener();
}
