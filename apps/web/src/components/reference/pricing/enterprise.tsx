/* Hallmark · component: pricing · genre: editorial · theme: Inspo-paper
 * archetype: Enterprise contact · diversification: no prices visible,
 *   contact is the action
 * states: default · hover (button) · focus-visible
 * contrast: pass (46-50)
 */

/**
 * Enterprise contact — the page that doesn't quote prices. Sets out
 * what's covered, what's negotiable, and where to reach. The
 * implicit promise: a real conversation, not a calculator.
 */
const COVERED = [
  "SLA + audit-trail logging",
  "Dedicated worker pool",
  "SSO + per-org rate limits",
  "On-prem self-host with our help",
];
const NEGOTIABLE = [
  "Custom MCP tools",
  "Private catalogues",
  "Capture-on-demand for your set",
  "Joint roadmap calls",
];

export function PricingEnterprise() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="text-meta">For teams</p>
          <p
            className="font-display mt-4 max-w-[18ch] text-balance leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
          >
            Built for your set, on your terms.
          </p>
          <a
            href="mailto:enterprise@inspo.design"
            className="
              mt-10 inline-flex h-12 items-center gap-3 border-2 px-7
              font-mono text-sm uppercase tracking-[0.12em]
              transition-colors
              hover:border-[var(--color-link)] hover:text-[var(--color-link)]
            "
            style={{ borderColor: "var(--color-fg)" }}
          >
            Book a 30-min call
            <span aria-hidden>→</span>
          </a>
        </div>

        <div className="lg:col-span-7 lg:border-l rule lg:pl-10 space-y-10">
          <div>
            <p className="text-meta">What&rsquo;s covered</p>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {COVERED.map((l) => (
                <li key={l} className="flex items-baseline gap-3 text-sm">
                  <span aria-hidden className="text-[var(--color-link)]">·</span>
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-meta">What&rsquo;s negotiable</p>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {NEGOTIABLE.map((l) => (
                <li key={l} className="flex items-baseline gap-3 text-sm">
                  <span aria-hidden className="text-[var(--color-fg-muted)]">·</span>
                  {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
