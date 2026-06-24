/* Inspo · component: stat · genre: editorial · theme: Inspo-paper
 * archetype: Horizontal bar chart · diversification: numbers shown as
 *   relative magnitudes, not isolated figures
 * states: default (static)
 * contrast: pass (46-50)
 */

/**
 * Bar chart - five categories with horizontal bars proportional to
 * real catalogue counts. Each bar carries the figure as a typographic
 * label at the end of the line. Pure CSS, no chart library. The
 * proportions are real (sites per industry); replace with your own
 * data points.
 */
const BARS = [
  { label: "Editorial", value: 184 },
  { label: "SaaS", value: 226 },
  { label: "Studios", value: 312 },
  { label: "Fashion", value: 128 },
  { label: "Architecture", value: 84 },
];
const MAX = Math.max(...BARS.map((b) => b.value));

export function StatBarChart() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="flex flex-wrap items-baseline justify-between gap-y-3">
        <p className="text-meta">By industry</p>
        <p className="text-meta normal-case tracking-normal text-[var(--color-fg-muted)]">
          Of {BARS.reduce((n, b) => n + b.value, 0).toLocaleString()} captures
        </p>
      </div>

      <ul className="mt-10 space-y-4">
        {BARS.map((b) => (
          <li key={b.label}>
            <p className="flex items-baseline justify-between text-sm">
              <span className="text-[var(--color-fg)]">{b.label}</span>
              <span className="font-mono tabular-nums text-[var(--color-fg-muted)]">
                {b.value}
              </span>
            </p>
            <div className="mt-1.5 h-1 w-full bg-[color-mix(in_oklab,var(--color-fg)_8%,transparent)]">
              <div
                className="h-full bg-[var(--color-fg)]"
                style={{ width: `${(b.value / MAX) * 100}%` }}
                aria-hidden
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
