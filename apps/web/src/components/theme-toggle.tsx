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

import { useEffect, useSyncExternalStore } from "react";
import { useHydrated } from "@/lib/use-hydrated";

type Theme = "light" | "dark";
const KEY = "inspo:theme";
const EVT = "inspo:theme:change";

// Fallback for browsers where localStorage throws (private mode), so a
// flip still takes effect for the life of the page.
let inMemory: Theme | null = null;

function readTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  if (inMemory) return inMemory;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) onChange();
  };
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVT, onChange);
  media?.addEventListener("change", onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVT, onChange);
    media?.removeEventListener("change", onChange);
  };
}

function apply(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function ThemeToggle() {
  const mounted = useHydrated();
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "light");

  // The class on <html> follows the store; this runs on hydration too,
  // which is where a saved dark preference first gets applied.
  useEffect(() => {
    apply(theme);
  }, [theme]);

  function flip() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    inMemory = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVT));
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
      className="util-seg relative flex shrink-0 items-center justify-center px-2.5 text-[var(--color-fg-muted)]"
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
