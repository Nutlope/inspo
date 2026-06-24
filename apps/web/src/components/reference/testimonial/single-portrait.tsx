/* Inspo · component: testimonial · genre: editorial · theme: Inspo-paper
 * archetype: Single portrait + quote · diversification: one face, one
 *   voice - the most editorial, the most demanding to use honestly
 * states: default (static)
 * contrast: pass (46-50)
 *
 * Honest copy - both portrait and quote are placeholder slots. The
 * portrait should be a real photograph or hand-drawn illustration
 * (never AI-generated). The accompanying notes call out the
 * substitution required before shipping.
 */

export function TestimonialSinglePortrait() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="grid grid-cols-1 items-center gap-x-12 gap-y-10 lg:grid-cols-12">
        {/* Portrait slot - a hairline-bordered square with a "Portrait
            of [Name]" caption. Pure typography, no rasterised AI face. */}
        <div className="lg:col-span-4">
          <div
            className="
              relative aspect-square w-full border-2 rule
              flex items-center justify-center
              bg-[color-mix(in_oklab,var(--color-fg)_4%,var(--color-bg))]
            "
          >
            <p className="text-meta text-center text-[var(--color-fg-muted)] px-6">
              Portrait of [Name]
              <br />
              <span className="normal-case tracking-normal">
                replace with real photograph
              </span>
            </p>
          </div>
        </div>

        <figure className="lg:col-span-8">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-[var(--color-fg-muted)]">
            [Year]
          </p>
          <blockquote
            className="font-display mt-4 leading-[1.1] text-balance"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
          >
            &ldquo;[Quote - three lines maximum. Voice carries.]&rdquo;
          </blockquote>
          <figcaption className="mt-8 border-t rule pt-4 text-meta normal-case tracking-normal">
            <span className="text-[var(--color-fg)]">[Name]</span>
            <span className="text-[var(--color-fg-muted)]"> · [Role at Studio]</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
