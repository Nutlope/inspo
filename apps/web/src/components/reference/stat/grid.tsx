/* Inspo · component: stat · genre: editorial · theme: Inspo-paper
 * archetype: 6-stat grid · diversification: 3×2 grid of figures with
 *   editorial captions - denser than the 4-stat row
 * states: default + hover (cell highlight)
 * contrast: pass (46-50)
 */

/**
 * 6-stat grid - three columns of two stats each. Each stat carries
 * its figure (display), label (mono), and a short editorial sentence
 * underneath. Real catalogue numbers throughout - No
 * invented stats.
 */
const STATS = [
  { value: "1,019", label: "Sites filed", note: "Curated and published, May 2026" },
  { value: "21", label: "Macrostructures", note: "Named page shapes" },
  { value: "28", label: "References", note: "Reference components, every type populated" },
  { value: "3", label: "Viewports", note: "Desktop, tablet, mobile captured per site" },
  { value: "9.4", label: "Avg pages/site", note: "Median pages captured per site" },
  { value: "MIT", label: "Licence", note: "Free, open, owned by Together AI" },
];

export function StatGrid() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <ul className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3 bg-[var(--color-border)]">
        {STATS.map((s) => (
          <li
            key={s.label}
            className="bg-[var(--color-bg)] p-8 transition-colors hover:bg-[color-mix(in_oklab,var(--color-fg)_3%,var(--color-bg))]"
          >
            <p
              className="font-display leading-none tracking-tight tabular-nums"
              style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)" }}
            >
              {s.value}
            </p>
            <p className="text-meta mt-4">{s.label}</p>
            <p className="text-meta mt-2 normal-case tracking-normal text-[var(--color-fg-muted)]">
              {s.note}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
