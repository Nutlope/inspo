/* Inspo · component: nav · genre: editorial · theme: Inspo-paper
 * archetype: N1 Inline minimal · diversification: canonical wordmark + links
 * states: default · hover (link colour) · focus-visible (outline)
 * contrast: pass (46-50)
 */

/**
 * Inline minimal - wordmark left, links inline, utilities right. The
 * mono utility cluster (search · theme) sits tighter than the nav links
 * so it reads as a separate group rather than another nav row.
 */
export function NavInline() {
  return (
    <header className="border-y rule bg-[var(--color-bg)] px-8 py-5 sm:px-14">
      <div className="flex items-center justify-between gap-8">
        <a
          href="#"
          className="font-display text-2xl tracking-tight transition-opacity hover:opacity-70"
        >
          Inspo<span className="text-[var(--color-link)]">.</span>
        </a>

        <nav aria-label="Primary" className="flex items-center gap-5 sm:gap-7">
          {["Archive", "Components", "MCP", "About"].map((l) => (
            <a
              key={l}
              href="#"
              className="text-meta transition-colors hover:text-[var(--color-link)]"
            >
              {l}
            </a>
          ))}
          <div className="ml-2 flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Open command palette"
              className="
                inline-flex h-7 items-center justify-center gap-0.5 border rule px-2
                font-mono text-[0.7rem] leading-none tracking-wider text-[var(--color-fg-muted)]
                transition-colors hover:border-[var(--color-link)] hover:text-[var(--color-link)]
              "
            >
              ⌘K
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
