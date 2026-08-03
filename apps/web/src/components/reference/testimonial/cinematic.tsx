/* Inspo · component: testimonial · genre: editorial · theme: Inspo-paper
 * archetype: Cinematic · diversification: differs from Pull-Quote + Mosaic
 *   on paper band (dark vs light) + attribution style (credit-roll)
 * states: default (static)
 * contrast: pass (46-50)
 */

/**
 * Cinematic - dark band, single voice, attribution rendered as a
 * film-credit row at the bottom (role · name · date · source). The
 * format invites verbatim quotation rather than marketing rewriting.
 */
export function TestimonialCinematic() {
  return (
    <section
      className="relative overflow-hidden border rule bg-[var(--color-ink)] text-[var(--color-paper)] px-8 py-24 sm:px-14 sm:py-28"
    >
      <figure className="mx-auto max-w-4xl">
        <p className="font-mono text-xs tracking-normal text-[var(--color-paper)]/60">
          On the record
        </p>

        <blockquote
          className="font-display mt-10 leading-[1.1] text-balance"
          style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
        >
          [Replace this with the quote you want to feature. Keep it to
          three lines. The shorter the better - let the surrounding
          black do the heavy work.]
        </blockquote>

        <figcaption className="mt-16 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-[var(--color-paper)]/20 pt-6 font-mono text-xs tracking-normal text-[var(--color-paper)]/70">
          <span className="text-[var(--color-paper)]">[Name]</span>
          <span aria-hidden>·</span>
          <span>[Role at Studio]</span>
          <span aria-hidden>·</span>
          <span>[Date]</span>
          <span aria-hidden>·</span>
          <span className="ml-auto">[Source - interview, email, etc.]</span>
        </figcaption>
      </figure>
    </section>
  );
}
