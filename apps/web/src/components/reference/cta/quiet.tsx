/* Hallmark · component: cta · genre: editorial · theme: Inspo-paper
 * archetype: Quiet text-link · diversification: anti-banner CTA
 * states: default + hover (single link)
 * contrast: pass (46-50)
 */

/**
 * Quiet CTA — a typographic appeal, not a button. Reads as the end of
 * an article, not a sales push. Use when the audience is informed and
 * the action is a reading or browsing one. Refuses the loud "Sign up
 * free" pattern by design.
 */
export function CtaQuiet() {
  return (
    <section className="border-y rule bg-[var(--color-bg)] px-8 py-24 sm:px-14 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <p
          className="font-display leading-[1.1] text-balance"
          style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
        >
          You&rsquo;ve read enough.{" "}
          <em className="italic text-[var(--color-link)]">
            Open the archive.
          </em>
        </p>
        <p className="text-meta mt-8 normal-case tracking-normal text-[var(--color-fg-muted)]">
          A thousand sites worth studying. Filter by mood, paste a URL,
          or scroll.
        </p>
        <a
          href="#"
          className="
            font-mono mt-12 inline-flex items-baseline gap-2
            text-sm uppercase tracking-[0.12em]
            text-[var(--color-fg)]
            transition-colors hover:text-[var(--color-link)]
          "
        >
          Enter the archive
          <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}
