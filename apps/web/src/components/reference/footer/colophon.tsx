/* Hallmark · component: footer · genre: editorial · theme: Inspo-paper
 * archetype: Ft7 Colophon · diversification: magazine-style credit block
 * states: default + hover (links)
 * contrast: pass (46-50)
 */

/**
 * Colophon footer — a magazine end-credit. Typefaces, stack, owner, year.
 * Mono caption type throughout so it reads as metadata, not body copy.
 * Three columns at desktop, single stack on mobile. No social row, no
 * link map — those go in a different archetype (Ft1 or Ft3).
 */
export function FooterColophon() {
  return (
    <footer className="border-t rule bg-[var(--color-bg)] px-8 py-14 sm:px-14">
      <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-3">
        <div>
          <p className="text-meta">Typefaces</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg)]">
            Fraunces, set in display.
            <br />
            Inter Tight for body.
            <br />
            JetBrains Mono for the margins.
          </p>
        </div>
        <div>
          <p className="text-meta">Stack</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg)]">
            Next.js 16, Tailwind v4.
            <br />
            Postgres + pgvector on Neon.
            <br />
            Powered by Together AI.
          </p>
        </div>
        <div>
          <p className="text-meta">Colophon</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-fg)]">
            Open source, MIT.
            <br />
            Owned and operated by Together AI.
            <br />
            <span className="text-[var(--color-fg-muted)]">
              © {new Date().getFullYear()} — all sites credited to their
              designers.
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
