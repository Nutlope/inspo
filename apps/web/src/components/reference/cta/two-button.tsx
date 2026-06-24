/* Inspo · component: cta · genre: editorial · theme: Inspo-paper
 * archetype: Two-button · diversification: primary + ghost secondary,
 *   single typography block above
 * states: default · hover · focus-visible (both buttons)
 * contrast: pass (46-50)
 */

/**
 * Two-button CTA - primary action and a quiet secondary "learn more"
 * path. The pair sits below a single tight headline. Don't add a
 * third button (the page will read as a feature comparison, not a
 * conversion ask).
 */
export function CtaTwoButton() {
  return (
    <section className="border-y rule bg-[var(--color-bg)] px-8 py-24 sm:px-14 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <p
          className="font-display text-balance leading-[1.1] tracking-tight"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
        >
          Hand your agent a real reference.
        </p>
        <p className="mt-6 max-w-[52ch] mx-auto text-[var(--color-fg-muted)]">
          One install. Free for everyone. Authenticates in the browser.
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <a
            href="#"
            className="
              group/btn relative inline-flex h-12 items-center gap-3
              overflow-hidden bg-[var(--color-fg)] px-7
              font-mono text-sm uppercase tracking-[0.12em] text-[var(--color-bg)]
              transition-opacity hover:opacity-90
            "
          >
            <span>npx inspo init</span>
            <span aria-hidden className="transition-transform duration-300 group-hover/btn:translate-x-0.5">
              →
            </span>
          </a>
          <a
            href="#"
            className="
              inline-flex h-12 items-center px-7 border rule
              font-mono text-sm uppercase tracking-[0.12em] text-[var(--color-fg)]
              transition-colors hover:border-[var(--color-link)] hover:text-[var(--color-link)]
            "
          >
            Read the docs
          </a>
        </div>
      </div>
    </section>
  );
}
