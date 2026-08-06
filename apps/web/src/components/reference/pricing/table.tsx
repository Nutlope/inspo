/* inspo-reference-component
 * type= pricing | genre= editorial | theme= Inspo-paper
 * archetype= Tabular comparison | diversification= differs from 3-card +
 *   toggle on structure (table vs cards) + density (high vs medium)
 * states= default · hover (rows lift)
 * contrast= pass (46-50)
 */

/**
 * Comparison table - feature matrix across tiers. Reads like a magazine
 * spec sheet: thin rules, mono labels, no zebra striping (zebras
 * shout). Hover lifts the row so the eye can track across columns
 * without a colour change.
 */
const TIERS = ["Reader", "Studio", "Together"];
const ROWS: { label: string; values: Array<string | boolean> }[] = [
  { label: "Catalogue access", values: [true, true, true] },
  { label: "URL-paste lookups", values: [true, true, true] },
  { label: "DESIGN.md export", values: [true, true, true] },
  { label: "⌘K palette + Saved", values: [true, true, true] },
  { label: "Self-host the worker", values: [false, true, true] },
  { label: "Fork the schema", values: [false, true, true] },
  { label: "Hosted MCP server", values: [false, false, true] },
  { label: "Auth + rate-limited /extract", values: [false, false, true] },
];

export function PricingTable() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="mb-12 grid grid-cols-1 gap-y-3 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-3">
          <p className="text-meta">Compare</p>
          <p className="font-display mt-3 text-3xl leading-tight">
            What&rsquo;s in each tier.
          </p>
        </div>
        <p className="lg:col-span-9 max-w-[58ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
          Inspo is free in every tier - the tiers differ in how much of
          the stack you run yourself. Read for the gallery, Studio for
          the source, Together for the hosted instance.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b rule">
              <th className="py-4 pr-6 text-left text-meta font-normal" />
              {TIERS.map((t, i) => (
                <th
                  key={t}
                  className="py-4 pr-6 text-left text-meta font-normal"
                >
                  <span
                    className={
                      i === 1
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-fg)]"
                    }
                  >
                    {t}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr
                key={row.label}
                className="border-b rule transition-colors hover:bg-[color-mix(in_oklab,var(--color-fg)_3%,transparent)]"
              >
                <th
                  scope="row"
                  className="py-4 pr-6 text-left font-normal text-[var(--color-fg)]"
                >
                  {row.label}
                </th>
                {row.values.map((v, i) => (
                  <td
                    key={i}
                    className="py-4 pr-6 text-[var(--color-fg-muted)]"
                  >
                    {typeof v === "boolean" ? (
                      v ? (
                        <span aria-label="included" className="text-[var(--color-fg)]">
                          ·
                        </span>
                      ) : (
                        <span aria-label="not included" className="opacity-30">
                          -
                        </span>
                      )
                    ) : (
                      v
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
