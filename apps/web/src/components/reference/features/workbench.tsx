/* inspo-reference-component
 * type= features | genre= editorial | theme= Inspo-paper
 * archetype= Workbench | diversification= copy left, demo right -
 *   feature explained alongside its working example
 * states= default · hover (terminal cursor blink kept on)
 * contrast= pass (46-50)
 */

/**
 * Workbench - split section: explanatory copy on the left, a live
 * demo block on the right. The demo here is a typeset terminal
 * transcript (real strings, not chrome - see the "re-drawn
 * chrome forbidden" rule). Reach for it when the feature is best
 * shown, not just told.
 */
export function FeaturesWorkbench() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="text-meta">From the bench</p>
          <p
            className="font-display mt-4 max-w-[22ch] text-balance leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
          >
            One MCP call gets your agent a real reference.
          </p>
          <p className="mt-6 max-w-[40ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
            search_screens returns hosted image URLs your agent&rsquo;s
            vision model can fetch directly. No base64 in the tool
            result. No context bloat.
          </p>
        </div>

        <div className="lg:col-span-7">
          {/* Terminal transcript - real strings, not faux chrome. */}
          <pre className="overflow-x-auto border rule bg-[color-mix(in_oklab,var(--color-fg)_4%,var(--color-bg))] px-5 py-5 font-mono text-sm leading-relaxed">
{`> search_screens("editorial dark agency hero", { mode: "dark" })

  ┌── 8 results
  │
  │  · linear-app             dark · agency · marquee
  │  · vercel-com             dark · saas   · stat-led
  │  · atelier-mira           dark · agency · specimen
  │  · raycast-com            dark · saas   · workbench
  │  · arc-net                dark · agency · manifesto
  │  · …
  │
  └── each carries: hero URL, palette, type ramp, designer credit`}
          </pre>
          <p className="text-meta mt-3 text-[var(--color-fg-muted)]">
            Run from any MCP-capable editor.
          </p>
        </div>
      </div>
    </section>
  );
}
