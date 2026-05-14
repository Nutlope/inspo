"use client";

/**
 * Light/dark toggle. Persists to localStorage; respects prefers-color-scheme
 * on first visit. Adds/removes .dark on <html> so the CSS variables in
 * globals.css flip atomically.
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

  // Hide until mounted to avoid hydration flash. The button takes
  // 22px of nav width — slot is reserved.
  return (
    <button
      type="button"
      onClick={flip}
      aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Theme"}
      title={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Theme"}
      className="text-meta inline-flex h-7 w-7 items-center justify-center border rule transition-colors hover:border-[var(--color-link)] hover:text-[var(--color-link)]"
    >
      <span aria-hidden style={{ visibility: mounted ? "visible" : "hidden" }}>
        {theme === "dark" ? "☼" : "◐"}
      </span>
    </button>
  );
}
