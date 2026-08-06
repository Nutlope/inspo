/* inspo-reference-component
 * type= pricing | genre= editorial | theme= Inspo-paper
 * archetype= Single plan focus | diversification= one plan, no
 *   comparison - the page IS the plan
 * states= default · hover (button) · focus-visible
 * contrast= pass (46-50)
 */

/**
 * Single plan - when the product has one offering, show one card.
 * Reads as a brochure: lead with the headline, list what's in, end
 * with the action. No "Most popular" framing; nothing to be popular
 * against.
 */
const INCLUDED = [
  "Full catalogue access - 1,000+ sites",
  "URL-paste lookups + lex search",
  "MCP server for Claude Code, Cursor, Codex",
  "DESIGN.md export per site",
  "Twenty-eight Inspo reference components",
  "All future updates",
];

export function PricingSinglePlan() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-20 sm:px-14 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-meta">One plan</p>
        <p
          className="font-display mt-4 leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
        >
          Free for everyone.
        </p>
        <p className="mt-4 text-[var(--color-fg-muted)]">
          Open source, MIT, owned and operated by Together AI. No tiers,
          no paywall, no usage caps that matter.
        </p>

        <div className="mt-12 border-t rule pt-8">
          <p className="text-meta">What&rsquo;s included</p>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {INCLUDED.map((line) => (
              <li key={line} className="flex items-baseline gap-3 text-sm">
                <span aria-hidden className="text-[var(--color-accent)]">·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <a
          href="#"
          className="mt-12 inline-flex h-12 items-center gap-3 bg-[var(--color-fg)] px-7 font-mono text-sm tracking-normal text-[var(--color-bg)] transition-opacity hover:opacity-90"
        >
          npx inspo init
          <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}
