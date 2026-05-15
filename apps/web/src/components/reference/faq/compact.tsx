"use client";

/* Hallmark · component: faq · genre: editorial · theme: Inspo-paper
 * archetype: Compact list · diversification: Q-only by default, click
 *   to expand A inline — dense list scanning
 * states: default · hover · open · focus-visible
 * contrast: pass (46-50)
 */

import { useState } from "react";

const QA = [
  { q: "Is it free?", a: "Open source, MIT. Free in every tier." },
  { q: "Does it train on my prompts?", a: "No. Search logs are anonymised; we do not retain prompt content." },
  { q: "Can I bring my own catalogue?", a: "Self-host the worker, point it at your seed list. Same schema." },
  { q: "What about images we don't own?", a: "Editorial commentary precedent. Credit + takedown honoured at /dmca." },
  { q: "Is there a desktop app?", a: "No. The MCP runs in your editor — your editor IS the app." },
  { q: "How often does the catalogue grow?", a: "Slowly. Curation is the moat, not coverage." },
];

export function FaqCompact() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="grid grid-cols-1 gap-x-10 gap-y-3 lg:grid-cols-12">
        <p className="text-meta lg:col-span-3">Brief answers</p>
        <p
          className="lg:col-span-9 font-display max-w-[24ch] text-balance leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          The short version of everything.
        </p>
      </div>

      <ul className="mt-12 border-t rule">
        {QA.map((row, i) => {
          const open = openIdx === i;
          return (
            <li key={row.q} className="border-b rule">
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                aria-expanded={open}
                className={`
                  flex w-full items-baseline justify-between gap-6 py-4 text-left
                  transition-colors
                  ${open ? "text-[var(--color-link)]" : "hover:text-[var(--color-link)]"}
                `}
              >
                <p className="font-display text-lg leading-tight sm:text-xl">{row.q}</p>
                <span
                  aria-hidden
                  className={`font-mono text-sm transition-transform duration-200 ${open ? "rotate-45" : ""}`}
                >
                  +
                </span>
              </button>
              {open && (
                <p className="max-w-[60ch] pb-5 text-sm leading-relaxed text-[var(--color-fg-muted)]">
                  {row.a}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
