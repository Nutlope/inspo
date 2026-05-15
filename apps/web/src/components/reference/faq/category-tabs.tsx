"use client";

/* Hallmark · component: faq · genre: editorial · theme: Inspo-paper
 * archetype: Category tabs · diversification: questions sliced by
 *   audience or topic — useful when the FAQ serves multiple roles
 * states: default · hover · active (tab) · focus-visible
 * contrast: pass (46-50)
 */

import { useState } from "react";

const CATEGORIES = {
  Designers: [
    { q: "Can I just browse without an account?", a: "Yes. Everything in the gallery is public — no signup required." },
    { q: "Where do I find palettes?", a: "Open any site detail page; the brand palette band shows the extracted swatches." },
  ],
  Engineers: [
    { q: "How does the MCP server authenticate?", a: "OAuth via the browser on first install — your editor remembers the token after." },
    { q: "Can I run the worker locally?", a: "Yes. Playwright + Chromium on any Node host. See DEPLOY.md." },
  ],
  Curators: [
    { q: "How do I add a site?", a: "Append it to apps/worker/src/seed-urls.ts and open a PR." },
    { q: "Why was a site rejected?", a: "Audit pass flagged a banner, broken capture, or off-brief content. Check the curator note." },
  ],
};

type Cat = keyof typeof CATEGORIES;

export function FaqCategoryTabs() {
  const [active, setActive] = useState<Cat>("Designers");

  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <p className="text-meta">Questions, sliced</p>
      <p
        className="font-display mt-4 max-w-[22ch] text-balance leading-[1.05] tracking-tight"
        style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
      >
        Who&rsquo;s asking.
      </p>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="FAQ categories"
        className="mt-10 flex flex-wrap items-baseline gap-6 border-b rule pb-2"
      >
        {(Object.keys(CATEGORIES) as Cat[]).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={active === k}
            onClick={() => setActive(k)}
            className={`
              text-meta relative pb-2
              transition-colors
              ${active === k ? "text-[var(--color-link)]" : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"}
            `}
          >
            {k}
            <span
              aria-hidden
              className={`
                pointer-events-none absolute inset-x-0 -bottom-px h-px bg-[var(--color-link)]
                transition-transform duration-200 origin-left
                ${active === k ? "scale-x-100" : "scale-x-0"}
              `}
            />
          </button>
        ))}
      </div>

      <dl className="mt-8">
        {CATEGORIES[active].map((row) => (
          <div
            key={row.q}
            className="grid grid-cols-1 gap-x-10 gap-y-2 border-b rule py-5 lg:grid-cols-[16rem_1fr]"
          >
            <dt className="font-display text-lg leading-tight">{row.q}</dt>
            <dd className="max-w-[60ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
              {row.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
