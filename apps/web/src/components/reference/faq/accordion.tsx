"use client";

/* Inspo · component: faq · genre: editorial · theme: Inspo-paper
 * archetype: Accordion · diversification: native <details>, single-open
 *   behaviour, no JS-only library
 * states: default · hover · open · focus-visible
 * contrast: pass (46-50)
 */

import { useRef } from "react";

/**
 * Accordion - built on native <details>/<summary> so keyboard, screen
 * reader, and no-JS behaviour all work for free. The "single open at a
 * time" pattern is enforced by closing siblings on each toggle. The
 * affordance is a typographic "+ / -" pair, not an SVG chevron.
 */
const QA = [
  {
    q: "Is Inspo free?",
    a: "Yes - open source, MIT, owned by Together AI. Free in every tier. The tiers differ in how much of the stack you run yourself.",
  },
  {
    q: "How do I install the MCP server?",
    a: "`npx inspo init` detects Claude Code, Cursor, Codex, and Zed configs and appends the server entry. It opens your browser once to authenticate the hosted instance.",
  },
  {
    q: "Can I self-host?",
    a: "Every dependency (Postgres, blob storage, the worker) has a free tier or local equivalent. The worker runs anywhere Chromium runs. See /about for the runbook.",
  },
  {
    q: "Where does the catalogue come from?",
    a: "Curated by hand from a seed list of sites. The worker captures three viewports, extracts palette + type ramp + tech, runs a vision-LLM pass for tags, then waits for curator review.",
  },
];

export function FaqAccordion() {
  const ref = useRef<HTMLUListElement>(null);

  function onToggle(e: React.SyntheticEvent<HTMLDetailsElement>) {
    if (!ref.current) return;
    const opened = e.currentTarget;
    if (!opened.open) return;
    ref.current.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((d) => {
      if (d !== opened) d.open = false;
    });
  }

  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="mb-12 grid grid-cols-1 gap-y-3 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-3">
          <p className="text-meta">Questions</p>
        </div>
        <p className="lg:col-span-9 font-display max-w-[24ch] text-balance text-4xl leading-[1.05] tracking-tight">
          The ones we&rsquo;re asked most often.
        </p>
      </div>

      <ul ref={ref} className="border-t rule">
        {QA.map(({ q, a }) => (
          <li key={q}>
            <details onToggle={onToggle} className="group border-b rule">
              <summary
                className="
                  flex cursor-pointer items-baseline justify-between gap-6
                  py-5 transition-colors
                  hover:text-[var(--color-link)]
                  focus-visible:outline-none focus-visible:text-[var(--color-link)]
                "
              >
                <p className="font-display text-xl leading-tight sm:text-2xl">
                  {q}
                </p>
                <span
                  aria-hidden
                  className="font-mono text-base text-[var(--color-fg-muted)] transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-[60ch] pb-6 pr-8 text-sm leading-relaxed text-[var(--color-fg-muted)]">
                {a}
              </p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
