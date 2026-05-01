"use client";

import { useState } from "react";

/**
 * The marquee search input on the home hero. Plain GET form pointed at
 * /screens — that route already handles URL-paste detection (redirects
 * to /screens/<slug> when hostname matches the catalogue) and lex
 * search across title / description / fonts / palette / css vars.
 *
 * Rules from the editorial visual system:
 *  - 1.5px solid rule border, transparent bg (NOT a glassy SaaS pill)
 *  - mono 16px placeholder
 *  - focus border swaps to accent red
 *  - submit is a typographic "Enter →" affordance, not a filled pill
 */
export function HomeSearch({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <form
      method="GET"
      action="/screens"
      className="group flex w-full items-stretch border-[1.5px] rule transition-colors focus-within:border-[var(--color-link)]"
      role="search"
      aria-label="Search the archive"
    >
      <span
        aria-hidden
        className="pl-5 self-center font-mono text-base text-[var(--color-fg-muted)] transition-colors group-focus-within:text-[var(--color-link)]"
      >
        ⌕
      </span>
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="search styles, brands, fonts — or paste a URL"
        autoComplete="off"
        className="w-full bg-transparent px-4 py-5 font-mono text-base outline-none placeholder:text-[var(--color-fg-muted)] sm:text-lg"
      />
      <button
        type="submit"
        className="text-meta hidden items-center gap-2 border-l rule px-6 transition-colors hover:text-[var(--color-link)] sm:flex"
        aria-label="Search"
      >
        Enter <span aria-hidden>→</span>
      </button>
    </form>
  );
}
