/* Inspo · component: hero · genre: editorial · theme: Inspo-paper
 * archetype: Documentary · diversification: caption-led hero, credit
 *   block as marginalia
 * states: default (static)
 * contrast: pass (46-50)
 */

/**
 * Documentary - the headline reads as the caption of a missing
 * photograph. A documentary credit block sits to the right (date,
 * photographer, source) the way it would in a Sunday-paper supplement.
 */
export function HeroDocumentary() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-20 sm:px-14 sm:py-24">
      <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-12">
        <div className="lg:col-span-9">
          <p className="text-meta">Plate Nº - May 2026</p>
          <h1
            className="font-display mt-8 max-w-[22ch] text-balance leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
          >
            Notes on the kind of website that <em className="italic">earns</em>{" "}
            its scroll.
          </h1>
        </div>
        <aside className="lg:col-span-3 lg:border-l rule lg:pl-6">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-[var(--color-fg-muted)]">
            Caption
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg)]">
            Curated edition. Filed by hand from a list of sites whose
            craft holds up - and that an agent can usefully study.
          </p>
        </aside>
      </div>
    </section>
  );
}
