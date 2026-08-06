/* inspo-reference-component
 * type= nav | genre= editorial | theme= Inspo-paper
 * archetype= N7 Marginal | diversification= differs from Inline + Pill
 *   on orientation (vertical left margin vs horizontal top)
 * states= default · hover (link slides right) · focus-visible
 * contrast= pass (46-50)
 */

/**
 * Marginal nav - vertical index in the left margin. Numbered, mono,
 * stays put while the page scrolls. The shape is editorial: it reads
 * like a table-of-contents pulled into the chrome. Hover slides the
 * label 4px right so the eye can track without a colour change.
 */
const SECTIONS = [
  { n: "01", label: "Archive" },
  { n: "02", label: "Components" },
  { n: "03", label: "Collections" },
  { n: "04", label: "MCP" },
  { n: "05", label: "About" },
];

export function NavMarginal() {
  return (
    <div className="grid grid-cols-1 gap-x-12 border rule bg-[var(--color-bg)] px-8 py-10 sm:px-14 lg:grid-cols-[14rem_1fr]">
      <aside className="lg:sticky lg:top-8 lg:h-fit">
        <p className="font-display text-2xl tracking-tight">
          Inspo<span className="text-[var(--color-accent)]">.</span>
        </p>
        <nav aria-label="Primary" className="mt-10 space-y-1">
          {SECTIONS.map((s) => (
            <a
              key={s.n}
              href="#"
              className="group flex items-baseline gap-3 py-1.5 transition-colors hover:text-[var(--color-accent)]"
            >
              <span className="font-mono text-xs tracking-normal text-[var(--color-fg-muted)]">
                {s.n}
              </span>
              <span className="text-sm transition-transform duration-200 group-hover:translate-x-1">
                {s.label}
              </span>
            </a>
          ))}
        </nav>
      </aside>

      <div className="hidden lg:block">
        <p className="text-meta">Page body</p>
        <p className="font-display mt-4 max-w-[28ch] text-balance text-3xl leading-tight">
          A marginal nav stays out of the way until you need it.
        </p>
      </div>
    </div>
  );
}
