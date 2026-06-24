"use client";

/**
 * Light/dark toggle. Persists to localStorage; respects prefers-color-scheme
 * on first visit. Adds/removes .dark on <html> so the CSS variables in
 * globals.css flip atomically.
 *
 * Icons are inline SVGs at a fixed 14px stroke-weight box so sun and moon
 * occupy the *same* optical area - Unicode `☼` / `◐` glyphs differ in
 * baseline and width and never looked right in a square cell.
 */

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const KEY = "inspo:theme";

function readInitial(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function apply(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = readInitial();
    setTheme(t);
    apply(t);
    setMounted(true);
  }, []);

  function flip() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    apply(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={
        mounted
          ? `Switch to ${theme === "dark" ? "light" : "dark"} mode`
          : "Theme"
      }
      title={
        mounted
          ? `Switch to ${theme === "dark" ? "light" : "dark"} mode`
          : "Theme"
      }
      className="
        util-seg relative flex shrink-0 items-center justify-center px-2.5
        text-[var(--color-fg-muted)]
      "
    >
      <span
        aria-hidden
        className="inline-flex h-3.5 w-3.5 items-center justify-center transition-transform duration-300"
        style={{ visibility: mounted ? "visible" : "hidden" }}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
