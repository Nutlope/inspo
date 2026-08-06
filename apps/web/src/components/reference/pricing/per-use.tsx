/* inspo-reference-component
 * type= pricing | genre= editorial | theme= Inspo-paper
 * archetype= Per-use | diversification= line-item pricing instead of
 *   tiered plans - pay for what you use
 * states= default + hover (rows)
 * contrast= pass (46-50)
 */

/**
 * Per-use pricing - line items with quantity slots. Reads as a menu
 * rather than a comparison. Good for usage-based products (API,
 * inference, captures). The "0" rate honestly reflects Inspo's free
 * status; would carry real numbers in a paid product.
 */
const LINES = [
  { label: "Site lookups", note: "via search_screens", rate: "free" },
  { label: "Component crops", note: "via find_components", rate: "free" },
  { label: "DESIGN.md exports", note: "per site", rate: "free" },
  { label: "MCP tool calls", note: "rate-limited only", rate: "free" },
  { label: "Custom URL extracts", note: "auth-gated, ≤5/day", rate: "free" },
];

export function PricingPerUse() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="grid grid-cols-1 gap-x-10 gap-y-3 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-meta">Line items</p>
          <p
            className="font-display mt-4 max-w-[20ch] text-balance leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
          >
            Pay for what you use.
          </p>
          <p className="mt-4 text-sm text-[var(--color-fg-muted)]">
            Each call costs nothing today - Together AI absorbs the
            hosted-instance bill. Self-host to remove the rate-limit.
          </p>
        </div>

        <ul className="lg:col-span-8 lg:border-l rule lg:pl-10">
          {LINES.map((l) => (
            <li
              key={l.label}
              className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-b rule py-5 transition-colors hover:text-[var(--color-accent)]"
            >
              <div>
                <p className="font-display text-xl leading-tight">{l.label}</p>
                <p className="text-meta normal-case tracking-normal text-[var(--color-fg-muted)]">
                  {l.note}
                </p>
              </div>
              <p className="font-mono text-base">
                $0.00 · {l.rate}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
