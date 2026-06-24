/* Inspo · component: testimonial · genre: editorial · theme: Inspo-paper
 * archetype: Press + quote · diversification: a single quote with
 *   credibility from a small press wordmark
 * states: default (static)
 * contrast: pass (46-50)
 *
 * Honest copy - quote + outlet are placeholdered. Replace with real
 * verifiable press mentions before shipping; faked press credit is
 * legally risky and visually corrosive.
 */

export function TestimonialPress() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-20 sm:px-14 sm:py-24">
      <figure className="mx-auto max-w-4xl text-center">
        <p
          className="font-display leading-[1.1] text-balance"
          style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
        >
          &ldquo;[Press quote - one line that captures the read. Replace before
          shipping.]&rdquo;
        </p>

        <figcaption className="mt-10 space-y-3">
          <p className="text-meta normal-case tracking-normal text-[var(--color-fg-muted)]">
            [Byline]
          </p>
          <p className="font-display text-2xl">
            [Outlet]
            <span aria-hidden className="text-[var(--color-link)]">.</span>
          </p>
          <a href="#" className="text-meta hover:text-[var(--color-link)]">
            Read the full piece ↗
          </a>
        </figcaption>
      </figure>
    </section>
  );
}
