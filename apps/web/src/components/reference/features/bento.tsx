/* Inspo · component: features · genre: editorial · theme: Inspo-paper
 * macrostructure: Bento Grid · diversification: 6 irregular tiles -
 *   varied spans defeat the 3x2 sameness AI defaults to.
 * states: default · hover (subtle scale)
 * contrast: pass (46-50)
 */

/**
 * Bento - six tiles, irregular spans. The largest tile carries the
 * lead idea; the smaller ones extend it. Spans break the 3x2 default
 * AI grids reach for. No icons, no emoji decoration - typography
 * supplies the variety.
 */
export function FeaturesBento() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-[auto_auto_auto]">
        {/* Lead - spans two columns + two rows */}
        <article className="md:col-span-2 md:row-span-2 border rule p-8 flex flex-col">
          <p className="text-meta">Lead</p>
          <p className="font-display mt-6 max-w-[18ch] text-balance text-4xl leading-[1] tracking-tight sm:text-5xl">
            <em className="italic">Study</em>, then build. Never the
            other way around.
          </p>
          <p className="mt-auto max-w-[44ch] pt-12 text-sm leading-relaxed text-[var(--color-fg-muted)]">
            Every reference here was traced from a real production site
            - then rebuilt fresh, distilled, stamped with the
            macrostructure it embodies.
          </p>
        </article>

        {/* Tile 2 */}
        <article className="border rule p-6">
          <p className="text-meta">Patterns</p>
          <p className="font-display mt-3 text-4xl leading-none tracking-tight">
            21
          </p>
          <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
            named macrostructures, each one a complete page-shape.
          </p>
        </article>

        {/* Tile 3 */}
        <article className="border rule p-6">
          <p className="text-meta">Sites filed</p>
          <p className="font-display mt-3 text-4xl leading-none tracking-tight">
            784
          </p>
          <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
            published rows, palettes extracted, queryable from MCP.
          </p>
        </article>

        {/* Tile 4 - spans two columns */}
        <article className="md:col-span-2 border rule p-6 flex items-baseline justify-between gap-6">
          <div>
            <p className="text-meta">For your agent</p>
            <p className="font-display mt-3 text-2xl leading-tight">
              An MCP tool surface that returns URLs, not base64.
            </p>
          </div>
          <a
            href="/mcp"
            className="font-mono text-xs tracking-normal whitespace-nowrap text-[var(--color-fg)] transition-colors hover:text-[var(--color-link)]"
          >
            Read the API →
          </a>
        </article>

        {/* Tile 5 */}
        <article className="border rule p-6">
          <p className="text-meta">License</p>
          <p className="font-display mt-3 text-2xl leading-tight">
            MIT, owned by Together AI.
          </p>
          <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
            Free to fork. Free to self-host.
          </p>
        </article>
      </div>
    </section>
  );
}
