/* Inspo · component: hero · genre: editorial · theme: Inspo-paper
 * macrostructure: Marquee Hero · nav: N1 minimal · diversification: canonical
 * states: default (static · no interactive states)
 * contrast: pass (46-50)
 */

/**
 * Marquee Hero - the canonical anti-slop hero shape.
 *
 * One thought, set big, given air. Mono dateline at the left margin acts
 * as the editorial anchor. No imagery, no CTA stack, no eyebrow tag. The
 * type itself is the design - that's the point.
 */
export function HeroMarquee() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-20 sm:px-14 sm:py-28">
      <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-12">
        <p className="font-mono text-meta lg:col-span-2">
          Issue Nº07 - Marquee
        </p>
        <div className="lg:col-span-10">
          <h1 className="font-display max-w-[18ch] text-balance text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            A type specimen that <em className="italic">earns</em> its
            viewport.
          </h1>
          <p className="text-meta mt-10 max-w-[42ch] normal-case tracking-normal text-[var(--color-fg-muted)]">
            One sentence. One thought. The line a designer reads before they
            decide whether to stay.
          </p>
        </div>
      </div>
    </section>
  );
}
