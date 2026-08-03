/* Inspo · component: nav · genre: editorial · theme: Inspo-paper
 * archetype: N5 Floating pill · diversification: differs from N1 Inline
 *   on shape (centred pill vs full-width row) + edge (floating vs banded)
 * states: default · hover (link colour) · focus-visible (ring)
 * contrast: pass (46-50)
 */

/**
 * Floating pill - centred nav that doesn't sit on a full-width band.
 * Sits over content with a hairline border + paper bg + subtle shadow.
 * Useful when the hero is full-bleed imagery and a banded nav would
 * cut the composition.
 */
export function NavFloatingPill() {
  return (
    <div className="relative bg-[color-mix(in_oklab,var(--color-fg)_6%,var(--color-bg))] px-8 py-10">
      <header className="mx-auto flex w-fit items-center gap-1 rounded-full border rule bg-[var(--color-bg)] px-2 py-1.5 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.15)]">
        <a
          href="#"
          className="font-display rounded-full px-4 py-1.5 text-lg leading-none tracking-tight transition-opacity hover:opacity-70"
        >
          Inspo<span className="text-[var(--color-link)]">.</span>
        </a>
        <span aria-hidden className="h-4 w-px bg-[var(--color-border)]" />
        <nav aria-label="Primary" className="flex items-center gap-1">
          {["Archive", "Components", "MCP", "About"].map((l) => (
            <a
              key={l}
              href="#"
              className="rounded-full px-3 py-1.5 font-mono text-xs tracking-normal text-[var(--color-fg-muted)] transition-colors hover:bg-[color-mix(in_oklab,var(--color-fg)_5%,transparent)] hover:text-[var(--color-fg)]"
            >
              {l}
            </a>
          ))}
        </nav>
      </header>
    </div>
  );
}
