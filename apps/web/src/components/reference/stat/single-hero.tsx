/* Inspo · component: stat · genre: editorial · theme: Inspo-paper
 * archetype: Single hero stat · diversification: differs from Row on
 *   count (1 vs 4) + framing (a single fact carried by typography)
 * states: default (static)
 * contrast: pass (46-50)
 */

/**
 * Single hero stat - one number, set as large as the page allows, with
 * a fragment of supporting copy. The whole composition is the figure;
 * the copy is its caption. Reach for it when the catalogue's strongest
 * claim is countable and singular.
 */
export function StatSingleHero() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-20 sm:px-14 sm:py-28">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-meta">Catalogue · May 2026</p>
        <p
          className="font-display mt-8 leading-[0.85] tracking-tight"
          style={{
            fontSize: "clamp(7rem, 22vw, 18rem)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          784
        </p>
        <p className="font-display mx-auto mt-10 max-w-[28ch] text-balance text-2xl leading-tight sm:text-3xl">
          Real production sites, indexed for designers and the agents
          that build alongside them.
        </p>
      </div>
    </section>
  );
}
