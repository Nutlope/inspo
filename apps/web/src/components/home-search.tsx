"use client";

import { useState } from "react";

/**
 * The marquee search input on the home hero.
 *
 * Single horizontal row - icon + input + submit hint share one focus
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
        placeholder="search styles, brands, fonts - or paste a URL"
        autoComplete="off"
        className="
          flex-1 min-w-0 bg-transparent outline-none
          font-mono text-base sm:text-lg
          placeholder:text-[var(--color-fg-muted)]
        "
      />

      {/* Submit - pill with a clean SVG arrow.
          On hover: ink fills from the bottom (200ms wipe), the icon
          colour flips to paper, and the arrow nudges 2px right on
          the same easing - the colour shift and the motion read as
          one gesture rather than two effects piled together. */}
      <button
        type="submit"
        aria-label="Search"
        className="
          group/submit shrink-0 relative inline-flex h-11 w-11 items-center justify-center
          overflow-hidden rounded-full border rule
          text-[var(--color-fg-muted)]
          transition-[color,border-color] duration-300 ease-out
          hover:border-[var(--color-fg)] hover:text-[var(--color-bg)]
          group-focus-within:border-[var(--color-link)]
          group-focus-within:text-[var(--color-link)]
          focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-[var(--color-link)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]
        "
      >
        {/* Ink wipe - scales from bottom on hover. */}
        <span
          aria-hidden
          className="
            absolute inset-0 origin-bottom scale-y-0
            bg-[var(--color-fg)]
            transition-transform duration-300 ease-out
            group-hover/submit:scale-y-100
          "
        />
        <svg
          aria-hidden
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="
            relative z-10
            transition-transform duration-300 ease-out
            group-hover/submit:translate-x-0.5
          "
        >
          <path d="M5 12h14" />
          <path d="m13 5 7 7-7 7" />
        </svg>
      </button>

      {/* Animated underline - grows from centre on focus, retracts on blur. */}
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
