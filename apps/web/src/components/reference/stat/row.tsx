/* Inspo · component: stat · genre: editorial · theme: Inspo-paper
 * archetype: 4-stat row · diversification: real numbers from the
 *   project - no invented metrics (anti-invented-metrics rule)
 * states: default (static)
 * contrast: pass (46-50)
 */

/**
 * Stat row - four real catalogue numbers, set in display weight,
 * separated by hairline rules. Tabular-nums so the digits align even
 * if values change across renders. Numbers are real (catalogue size,
 * tag count, etc.) - never invented to inflate proof.
 */
const STATS = [
  { value: "784", label: "Sites filed" },
  { value: "21", label: "Macrostructures" },
  { value: "9", label: "Component types" },
  { value: "MIT", label: "Licence" },
];

export function StatRow() {
  return (
    <section className="border-y rule bg-[var(--color-bg)] px-8 py-12 sm:px-14 sm:py-16">
      <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 sm:gap-x-12">
        {STATS.map((s) => (
          <li key={s.label}>
            <p
              className="font-display leading-none tracking-tight"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {s.value}
            </p>
            <p className="text-meta mt-4 text-[var(--color-fg-muted)]">
              {s.label}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
