/*
 * Light and dark theme for the site (every page except the play screen,
 * which keeps its paper stage).
 *
 * With no stored choice the site follows the system setting through CSS
 * (`prefers-color-scheme`). A choice made with the toggle is kept in a
 * small preference cookie and written as `data-theme` on <html>.
 * THEME_SCRIPT runs in <head> and applies a stored choice before the first
 * paint, so static pages open in the chosen theme without a flash, and the
 * attribute survives client-side navigation because <html> never remounts.
 */

export type Theme = "light" | "dark";

export const THEME_COOKIE = "doover_theme";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Browser bar colours, matching --lp-bg of each theme in globals.css. */
export const THEME_COLORS: Record<Theme, string> = {
  light: "#FFFDF9",
  dark: "#0D1222",
};

export const THEME_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark)(?:;|$)/);if(m){document.documentElement.setAttribute("data-theme",m[1])}}catch(e){}})()`;

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
  const root = document.documentElement;
  if (theme) root.setAttribute("data-theme", theme);
  else root.removeAttribute("data-theme");
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
