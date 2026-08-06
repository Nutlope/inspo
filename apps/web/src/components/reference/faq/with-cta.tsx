/* inspo-reference-component
 * type= faq | genre= editorial | theme= Inspo-paper
 * archetype= FAQ + closing CTA | diversification= ends the FAQ with a
 *   "still asking?" affordance so reads convert
 * states= default + hover
 * contrast= pass (46-50)
 */

/**
 * FAQ with closing CTA - three open Q&A rows followed by a quiet
 * conversion strip ("Still asking? Reach us at …"). Reaches the
 * reader who got most of the way through the page and still has
 * questions; converts them to a real conversation.
 */
const QA = [
  { q: "Is the catalogue ever wrong?", a: "Sometimes. Audit runs every few weeks; bad captures get re-shot or rejected. Open an issue if you find one." },
  { q: "Can I use this commercially?", a: "Yes. MIT licence. Use the catalogue, the components, the worker - own your fork." },
  { q: "Will the schema change?", a: "Slowly, and only with a migration path. Drizzle migrations live in packages/db/src/migrations." },
];

export function FaqWithCta() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <p className="text-meta">FAQ</p>
      <p
        className="font-display mt-4 max-w-[20ch] text-balance leading-[1.05] tracking-tight"
        style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
      >
        Still asking, after all this.
      </p>

      <dl className="mt-12 border-t rule">
        {QA.map((row) => (
          <div
            key={row.q}
            className="grid grid-cols-1 gap-x-10 gap-y-2 border-b rule py-6 lg:grid-cols-[18rem_1fr]"
          >
            <dt className="font-display text-xl leading-tight">{row.q}</dt>
            <dd className="max-w-[60ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
              {row.a}
            </dd>
          </div>
        ))}
      </dl>

      {/* Closing strip - quiet, one action. */}
      <div className="mt-10 flex flex-wrap items-baseline justify-between gap-4 border-y-2 border-[var(--color-fg)] py-6">
        <p className="font-display text-2xl leading-tight">
          Question we didn&rsquo;t answer?
        </p>
        <a
          href="mailto:speedyoussef@gmail.com"
          className="font-mono text-sm tracking-normal text-[var(--color-fg)] transition-colors hover:text-[var(--color-accent)]"
        >
          speedyoussef@gmail.com ↗
        </a>
      </div>
    </section>
  );
}
