/* inspo-reference-component
 * type= hero | genre= editorial | theme= Inspo-paper
 * macrostructure= Manifesto | diversification= differs from Stat-Led on
 *   paper band (dark vs light) + accent application (bleed vs corner)
 * states= default (static)
 * contrast= pass (46-50)
 */

/**
 * Manifesto - a single declaration on a black ground, set in display
 * weight, with one phrase punched out in accent red. No CTAs, no proof
 * strip, no nav. The voice carries the brand. Reach for it when the
 * brief is opinionated and the user knows it.
 */
export function HeroManifesto() {
  return (
    <section
      className="relative overflow-hidden border rule bg-[var(--color-ink)] text-[var(--color-paper)] px-8 py-24 sm:px-14 sm:py-32"
    >
      {/* Marginalia - small mono datelines top and bottom. They place
          the manifesto in time and give the type something to push off. */}
      <p className="font-mono text-xs tracking-normal text-[var(--color-paper)]/60">
        Manifesto Nº01 - May 2026
      </p>

      <p
        className="font-display mt-10 max-w-[22ch] text-balance leading-[0.95] tracking-tight"
        style={{ fontSize: "clamp(2.5rem, 7vw, 5.25rem)" }}
      >
        Your agent doesn&rsquo;t have taste.{" "}
        <span className="text-[var(--color-accent)]">
          We lend it some.
        </span>
      </p>

      <p className="font-mono mt-16 text-xs tracking-normal text-[var(--color-paper)]/60">
        Signed - the editors
      </p>
    </section>
  );
}
