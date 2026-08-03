/* Inspo · component: footer · genre: editorial · theme: Inspo-paper
 * archetype: Ft5 Statement · diversification: differs from Colophon on
 *   density (high-air vs three-column) + voice (proclamation vs metadata)
 * states: default + hover (single link)
 * contrast: pass (46-50)
 */

/**
 * Statement footer - one big sentence, one quiet sign-off. The brand's
 * last word on the page. No link map, no copyright noise. Use when the
 * site has a strong editorial voice and you want it to land last.
 */
export function FooterStatement() {
  return (
    <footer className="border-t rule bg-[var(--color-bg)] px-8 py-24 sm:px-14 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <p
          className="font-display text-balance leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
        >
          A reference library, not a template marketplace.{" "}
          <em className="italic text-[var(--color-link)]">
            Study, don&rsquo;t copy.
          </em>
        </p>

        <div className="mt-16 flex flex-wrap items-baseline justify-between gap-y-4 border-t rule pt-6 font-mono text-xs tracking-normal text-[var(--color-fg-muted)]">
          <span>Together AI · MIT · {new Date().getFullYear()}</span>
          <a
            href="#"
            className="text-[var(--color-fg)] transition-colors hover:text-[var(--color-link)]"
          >
            Read the manifesto ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
