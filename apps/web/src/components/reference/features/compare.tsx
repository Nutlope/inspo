/* inspo-reference-component
 * type= features | genre= editorial | theme= Inspo-paper
 * archetype= Compare grid | diversification= feature comparison without
 *   naming competitors - categorical "before / with" framing
 * states= default · hover (cells)
 * contrast= pass (46-50)
 *
 * Note= comparison tables that name competitors slip into
 * marketing slop fast. Frame the comparison categorically (before /
 * with) so the page is honest about *what changes*, not which
 * neighbour you're trying to beat.
 */

const ROWS = [
  {
    capability: "Visual reference",
    before: "Browse a screenshot site by hand",
    after: "search_screens via MCP - agent gets URLs",
  },
  {
    capability: "Design tokens",
    before: "Read the source and translate by eye",
    after: "get_design_system - palette, type ramp, spacing",
  },
  {
    capability: "Component patterns",
    before: "Hunt Storybook or copy from competitors",
    after: "find_components - real crops + canonical code",
  },
  {
    capability: "Cost",
    before: "Pay per seat, per export, per token",
    after: "Free, open source, MIT",
  },
];

export function FeaturesCompare() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="mb-12 grid grid-cols-1 gap-y-3 lg:grid-cols-12 lg:gap-x-10">
        <p className="text-meta lg:col-span-3">Before / with</p>
        <p
          className="lg:col-span-9 font-display max-w-[24ch] text-balance leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
        >
          What changes when your agent has Inspo.
        </p>
      </div>

      <div className="border-t rule">
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-x-6 border-b rule py-3 text-meta">
          <span>Capability</span>
          <span>Before</span>
          <span className="text-[var(--color-accent)]">With Inspo</span>
        </div>
        {ROWS.map((r) => (
          <div
            key={r.capability}
            className="grid grid-cols-[1fr_1fr_1fr] items-baseline gap-x-6 border-b rule py-5 transition-colors hover:bg-[color-mix(in_oklab,var(--color-fg)_3%,transparent)]"
          >
            <p className="text-sm font-medium text-[var(--color-fg)]">{r.capability}</p>
            <p className="text-sm text-[var(--color-fg-muted)]">{r.before}</p>
            <p className="text-sm text-[var(--color-fg)]">{r.after}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
