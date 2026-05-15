"use client";

/* Hallmark · component: nav · genre: editorial · theme: Inspo-paper
 * archetype: N3 Mega menu · diversification: hover reveals a panel
 *   instead of a flyout — index-page-style sub-nav
 * states: default · hover · focus-within (keyboard)
 * contrast: pass (46-50)
 */

import { useState } from "react";

/**
 * Mega menu — top-level links that reveal a multi-column panel on
 * hover or focus. Each panel reads like a sub-index. Reach for it on
 * deep sites (docs, large product catalogues) where flyouts get
 * unwieldy.
 */
const PANEL = {
  Archive: [
    { label: "Latest captures", note: "Fresh from the worker" },
    { label: "Editorial", note: "Long-form websites" },
    { label: "SaaS", note: "Tool, dev experience, infra" },
    { label: "Studios", note: "Agency portfolios" },
  ],
  Components: [
    { label: "Heroes", note: "7 references" },
    { label: "Pricing", note: "7 references" },
    { label: "Footers", note: "7 references" },
    { label: "CTAs", note: "7 references" },
  ],
};

export function NavMega() {
  const [open, setOpen] = useState<keyof typeof PANEL | null>(null);

  return (
    <header
      className="relative border-y rule bg-[var(--color-bg)]"
      onMouseLeave={() => setOpen(null)}
    >
      <div className="flex items-center justify-between gap-8 px-8 py-5 sm:px-14">
        <a href="#" className="font-display text-2xl tracking-tight">
          Inspo<span className="text-[var(--color-link)]">.</span>
        </a>
        <nav aria-label="Primary" className="flex items-center gap-7">
          {(Object.keys(PANEL) as Array<keyof typeof PANEL>).map((k) => (
            <button
              key={k}
              type="button"
              onMouseEnter={() => setOpen(k)}
              onFocus={() => setOpen(k)}
              aria-expanded={open === k}
              className={`
                text-meta transition-colors
                ${open === k ? "text-[var(--color-link)]" : "text-[var(--color-fg-muted)] hover:text-[var(--color-link)]"}
              `}
            >
              {k}
            </button>
          ))}
          <a href="#" className="text-meta hover:text-[var(--color-link)]">
            MCP
          </a>
          <a href="#" className="text-meta hover:text-[var(--color-link)]">
            About
          </a>
        </nav>
      </div>

      {/* Panel — fades in on hover/focus. One panel per top-level link. */}
      {open && (
        <div className="absolute inset-x-0 top-full z-10 border-b rule bg-[var(--color-bg)] px-8 py-10 sm:px-14">
          <p className="text-meta">{open}</p>
          <ul className="mt-6 grid grid-cols-2 gap-x-10 gap-y-6 lg:grid-cols-4">
            {PANEL[open].map((item) => (
              <li key={item.label}>
                <a
                  href="#"
                  className="block transition-colors hover:text-[var(--color-link)]"
                >
                  <p className="font-display text-lg leading-tight">
                    {item.label}
                  </p>
                  <p className="text-meta normal-case tracking-normal text-[var(--color-fg-muted)]">
                    {item.note}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
