"use client";

import { useState } from "react";

/**
 * The marquee search input on the home hero.
 *
 * Single horizontal row — icon + input + submit hint share one focus
 * container so hover/focus state lights up everything together. No
 * internal vertical dividers; the focus indicator is an animated
 * underline that grows from the centre.
 *
 * Submits a GET form to /screens, where URL-paste detection redirects
 * to the matching screen and lex search ranks the rest.
 */
export function HomeSearch({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      method="GET"
      action="/screens"
      role="search"
      aria-label="Search the archive"
      className="
        group relative w-full
        flex items-center gap-3 px-5 py-4
        border-b border-[var(--color-border)]/60
        transition-colors duration-200
        hover:border-[var(--color-fg)]/40
        focus-within:border-[var(--color-link)]
      "
    >
      <span
        aria-hidden
        className="
          shrink-0 inline-flex
          text-[var(--color-fg-muted)]
          transition-colors duration-200
          group-focus-within:text-[var(--color-link)]
        "
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>

      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="search styles, brands, fonts — or paste a URL"
        autoComplete="off"
        className="
          flex-1 min-w-0 bg-transparent outline-none
          font-mono text-base sm:text-lg
          placeholder:text-[var(--color-fg-muted)]
        "
      />

      <button
        type="submit"
        aria-label="Search"
        className="
          shrink-0 inline-flex h-10 w-10 items-center justify-center
          rounded-full border rule
          text-lg leading-none
          text-[var(--color-fg-muted)]
          transition-colors duration-200
          group-focus-within:border-[var(--color-link)]
          group-focus-within:text-[var(--color-link)]
          hover:border-[var(--color-fg)]/50
          hover:text-[var(--color-fg)]
        "
      >
        <span aria-hidden>→</span>
      </button>

      {/* Animated underline — grows from centre on focus, retracts on blur. */}
      <span
        aria-hidden
        className="
          pointer-events-none absolute inset-x-0 -bottom-px h-px
          origin-center scale-x-0
          bg-[var(--color-link)]
          transition-transform duration-300 ease-out
          group-focus-within:scale-x-100
        "
      />
    </form>
  );
}
