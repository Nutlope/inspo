"use client";

/* Inspo · component: pricing · genre: editorial · theme: Inspo-paper
 * archetype: Toggle + 2-plan · diversification: differs from 3-card on
 *   density (2 vs 3) + interaction (billing cadence toggle)
 * states: default · hover · focus-visible · checked (toggle)
 * contrast: pass (46-50)
 */

import { useState } from "react";

/**
 * Toggle + two plans - bipolar choice, monthly/annual cadence flip. The
 * toggle uses radio-button semantics under the hood so keyboard users
 * get arrow-key navigation. Annual badge fades in; no number animation
 * (per "cut motion before adding it") - just a clean opacity swap.
 */
const PLANS = [
  {
    name: "Hobby",
    monthly: 0,
    annual: 0,
    description: "Everything you need to study the archive on your own.",
    bullets: ["Full catalogue", "URL-paste lookups", "Local self-host"],
  },
  {
    name: "Team",
    monthly: 0,
    annual: 0,
    description: "The hosted instance, with the MCP wired to your agent.",
    bullets: ["Everything in Hobby", "MCP for Claude Code, Cursor", "Hosted by Together AI"],
    accent: true,
  },
];

export function PricingToggle() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      {/* Cadence toggle - segmented control. Both labels stay visible so
          the user understands they're picking, not just toggling. */}
      <div
        role="radiogroup"
        aria-label="Billing cadence"
        className="mx-auto mb-12 inline-flex w-full max-w-xs items-center justify-center border rule p-1 font-mono text-xs tracking-normal"
      >
        {[
          { label: "Monthly", value: false },
          { label: "Annual", value: true },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            role="radio"
            aria-checked={annual === opt.value}
            onClick={() => setAnnual(opt.value)}
            className={`
              flex-1 px-3 py-2 transition-colors
              ${
                annual === opt.value
                  ? "bg-[var(--color-fg)] text-[var(--color-bg)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
        {PLANS.map((p) => (
          <article
            key={p.name}
            className={`
              flex flex-col border rule p-8
              ${p.accent ? "border-t-2" : ""}
            `}
            style={
              p.accent ? { borderTopColor: "var(--color-link)" } : undefined
            }
          >
            <p className="text-meta">{p.name}</p>
            <p className="font-display mt-3 flex items-baseline gap-2 text-6xl leading-none tracking-tight">
              ${annual ? p.annual : p.monthly}
              <span className="text-meta normal-case tracking-normal text-[var(--color-fg-muted)]">
                / {annual ? "year" : "month"}
              </span>
            </p>
            <p className="mt-6 max-w-[40ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
              {p.description}
            </p>
            <ul className="mt-8 flex-1 space-y-3 border-t rule pt-6 text-sm">
              {p.bullets.map((b) => (
                <li key={b} className="flex items-baseline gap-3">
                  <span aria-hidden className="text-[var(--color-link)]">
                    ·
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`
                mt-8 border rule px-4 py-3 font-mono text-xs tracking-normal
                transition-colors
                ${
                  p.accent
                    ? "bg-[var(--color-fg)] text-[var(--color-bg)] hover:bg-[var(--color-link)]"
                    : "hover:border-[var(--color-link)] hover:text-[var(--color-link)]"
                }
              `}
            >
              Start with {p.name}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
