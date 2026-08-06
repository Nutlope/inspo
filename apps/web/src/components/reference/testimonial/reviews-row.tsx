/* inspo-reference-component
 * type= testimonial | genre= editorial | theme= Inspo-paper
 * archetype= Reviews row | diversification= numeric proof + short
 *   placeholder quotes - honest about being placeholders
 * states= default + hover
 * contrast= pass (46-50)
 *
 * Honest copy - star totals and counts are placeholdered ([XX]).
 * Replace with real moderated review numbers before shipping;
 * No invented review counts.
 */

const REVIEWS = [
  { stars: 5, quote: "[Short review - replace before shipping.]", who: "[Name · Studio]" },
  { stars: 5, quote: "[Short review - keep it to one line.]", who: "[Name · Studio]" },
  { stars: 4, quote: "[Short review - even mixed reviews build trust.]", who: "[Name · Studio]" },
];

function Stars({ n }: { n: number }) {
  return (
    <p className="flex gap-0.5 text-[var(--color-accent)]" aria-label={`${n} of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden className={i < n ? "" : "opacity-25"}>
          ★
        </span>
      ))}
    </p>
  );
}

export function TestimonialReviewsRow() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="flex flex-wrap items-baseline justify-between gap-y-3 gap-x-6">
        <p className="text-meta">Reviews</p>
        <p className="text-meta text-[var(--color-fg-muted)]">
          [XX] reviews · placeholder
        </p>
      </div>

      <ul className="mt-10 grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-3">
        {REVIEWS.map((r, i) => (
          <li key={i} className="border-t-2 border-[var(--color-fg)] pt-5">
            <Stars n={r.stars} />
            <p className="font-display mt-4 text-xl leading-snug">
              &ldquo;{r.quote}&rdquo;
            </p>
            <p className="text-meta mt-6 normal-case tracking-normal text-[var(--color-fg-muted)]">
              {r.who}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
