/* Hallmark · component: pricing · genre: editorial · theme: Inspo-paper
 * archetype: Tiered bento · diversification: irregular pricing cards,
 *   different shapes carry different weights
 * states: default · hover (each card lifts)
 * contrast: pass (46-50)
 */

/**
 * Tiered bento — pricing tiers laid out as a bento grid: the lead
 * tier spans two columns + two rows; supporting tiers are smaller.
 * Breaks the 3-equal-cards default; the visual hierarchy expresses
 * the recommended tier.
 */
export function PricingTierBento() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-[auto_auto]">
        {/* Featured tier — spans 2x2 */}
        <article
          className="
            md:col-span-2 md:row-span-2 flex flex-col gap-6 border rule p-8
            transition-transform duration-300 ease-out hover:-translate-y-1
          "
          style={{ borderTopWidth: "2px", borderTopColor: "var(--color-link)" }}
        >
          <p className="text-meta">Together</p>
          <p
            className="font-display flex items-baseline gap-3 leading-none tracking-tight"
            style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)" }}
          >
            $0
            <span className="text-meta normal-case tracking-normal text-[var(--color-fg-muted)]">
              / hosted
            </span>
          </p>
          <p className="max-w-[48ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
            The hosted instance Together AI runs. Free for everyone.
            Authenticated, rate-limited, no usage caps that matter.
          </p>
          <ul className="mt-auto space-y-2 text-sm">
            {[
              "Full catalogue + MCP server",
              "Auth, rate limits, anti-abuse",
              "Future-proof — Together pays the bill",
            ].map((l) => (
              <li key={l} className="flex items-baseline gap-3">
                <span aria-hidden className="text-[var(--color-link)]">·</span>
                {l}
              </li>
            ))}
          </ul>
        </article>

        {/* Top right tier */}
        <article className="flex flex-col gap-4 border rule p-6 transition-transform duration-300 ease-out hover:-translate-y-1">
          <p className="text-meta">Reader</p>
          <p className="font-display text-4xl leading-none tracking-tight">
            Free
          </p>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Browse the gallery, paste a URL, use ⌘K.
          </p>
        </article>

        {/* Bottom right tier */}
        <article className="flex flex-col gap-4 border rule p-6 transition-transform duration-300 ease-out hover:-translate-y-1">
          <p className="text-meta">Studio</p>
          <p className="font-display text-4xl leading-none tracking-tight">
            Self-host
          </p>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Fork the schema, run the worker, set your own rate limits.
          </p>
        </article>
      </div>
    </section>
  );
}
