/* inspo-reference-component
 * type= faq | genre= editorial | theme= Inspo-paper
 * archetype= Numbered list | diversification= differs from Accordion +
 *   Two-column on hierarchy (ordered list vs paired columns)
 * states= default (static)
 * contrast= pass (46-50)
 */

/**
 * Numbered FAQ - the questions read as a list of arguments. Numbered
 * prefix in mono, question in display weight, answer flush-left
 * underneath. No collapsing, no chrome. Reads like a manifesto's
 * "frequently asked, briefly answered."
 */
const QA = [
  {
    q: "Is the catalogue ever-growing?",
    a: "Yes - but slowly. Curation is the moat, not coverage.",
  },
  {
    q: "Can I submit a site?",
    a: "Soon. v1 is curator-only; v2 opens an /extract endpoint with auth + rate-limiting.",
  },
  {
    q: "Does it work offline?",
    a: "The catalogue ships baked into the bundle as static JSON, so /screens and /sites render without a database. Search remains client-side.",
  },
];

export function FaqNumbered() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <p className="text-meta">Asked, briefly answered</p>
      <ol className="mt-12 space-y-12">
        {QA.map((row, i) => (
          <li
            key={row.q}
            className="grid grid-cols-1 gap-x-10 gap-y-2 lg:grid-cols-[5rem_1fr]"
          >
            <span
              className="font-mono text-meta text-[var(--color-fg-muted)]"
              aria-hidden
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="font-display text-2xl leading-tight sm:text-3xl">
                {row.q}
              </p>
              <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
                {row.a}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
