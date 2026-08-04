/* Inspo · component: hero · genre: editorial · theme: Inspo-paper
 * macrostructure: Stat-Led · diversification: differs from Marquee on
 *   anchor (numeric vs typographic) + alignment (right-bias vs left-bias)
 * states: default (static)
 * contrast: pass (46-50)
 */

/**
 * Stat-Led - open with the number. The largest type on the page is a
 * quantity, not a sentence. The supporting copy sits to the right and
 * pulls weight from the figure. Works when the brief has a real number
 * to lead with; refuse otherwise (don't invent one).
 */
export function HeroStatLed() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-20 sm:px-14 sm:py-24">
      <div className="grid grid-cols-1 items-end gap-x-10 gap-y-8 lg:grid-cols-12">
        {/* The figure - set in display serif, optical-sized, single-line.
            Tabular-nums so the digits don't dance if you swap them. */}
        <div className="lg:col-span-7">
          <p className="text-meta mb-4">Catalogue · 2026</p>
          <p
            className="font-display leading-[0.85] tracking-tight"
            style={{
              fontSize: "clamp(5rem, 14vw, 12rem)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            784
          </p>
        </div>

        <div className="lg:col-span-5 lg:pb-3">
          <p className="font-display text-3xl leading-tight text-balance sm:text-4xl">
            Real production sites,{" "}
            <em className="italic">filed by hand</em>.
          </p>
          <p className="text-meta mt-6 normal-case tracking-normal text-[var(--color-fg-muted)]">
            Each one tagged, palette-extracted, queryable from your
            coding agent over MCP.
          </p>
        </div>
      </div>
    </section>
  );
}
