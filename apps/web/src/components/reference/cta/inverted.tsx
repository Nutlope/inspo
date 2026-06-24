/* Inspo · component: cta · genre: editorial · theme: Inspo-paper
 * archetype: Inverted · diversification: ink ground, paper button -
 *   visually loud through contrast, not chrome
 * states: default · hover (button: paper-fill wipe) · focus-visible
 * contrast: pass (46-50)
 */

/**
 * Inverted CTA - black ground, paper button. The contrast does the
 * work; no accent colour, no gradient, no chrome. Reach for it when
 * the brand has earned a quiet authoritative end-state.
 */
export function CtaInverted() {
  return (
    <section className="border-y rule bg-[var(--color-ink)] text-[var(--color-paper)] px-8 py-24 sm:px-14 sm:py-28">
      <div className="mx-auto max-w-4xl text-center">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-[var(--color-paper)]/60">
          Free, no account
        </p>
        <p
          className="font-display mt-6 text-balance leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
        >
          A reference layer for the work,{" "}
          <em className="italic">not the workflow</em>.
        </p>

        <a
          href="#"
          className="
            group/btn relative mt-12 inline-flex h-14 items-center gap-3
            overflow-hidden bg-[var(--color-paper)] px-8
            font-mono text-sm uppercase tracking-[0.12em]
            text-[var(--color-ink)]
            transition-colors duration-300 ease-out
            hover:text-[var(--color-paper)]
          "
        >
          <span
            aria-hidden
            className="
              absolute inset-0 origin-bottom scale-y-0 bg-[var(--color-link)]
              transition-transform duration-300 ease-out
              group-hover/btn:scale-y-100
            "
          />
          <span className="relative z-10">Open the archive</span>
          <span
            aria-hidden
            className="relative z-10 transition-transform duration-300 ease-out group-hover/btn:translate-x-0.5"
          >
            →
          </span>
        </a>
      </div>
    </section>
  );
}
