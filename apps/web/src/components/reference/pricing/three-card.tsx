/* inspo-reference-component
 * type= pricing | genre= editorial | theme= Inspo-paper
 * archetype= 3-card horizontal | diversification= canonical plan comparison
 * states= default · hover (cards) · focus-visible (buttons)
 * contrast= pass (46-50)
 */

/**
 * Three-card horizontal - the classic. One recommended tier raised by a
 * thin accent rule along the top; the other two stay quiet. Generous
 * vertical air inside each card so the line items have room to breathe.
 * No "Most popular" badge; the visual emphasis is the rule, not chrome.
 */
const TIERS = [
  {
    name: "Reader",
    price: "Free",
    cadence: "always",
    description: "Browse the archive, paste a URL, use ⌘K. No account required.",
    cta: "Open the archive",
    href: "/screens",
    accent: false,
    features: [
      "Full catalogue access",
      "URL-paste lookups",
      "Saved + recent in ⌘K",
      "DESIGN.md export",
    ],
  },
  {
    name: "Studio",
    price: "$0",
    cadence: "MIT",
    description: "Self-host the worker, run extractions, fork the schema.",
    cta: "Read the docs",
    href: "/about",
    accent: true,
    features: [
      "Everything in Reader",
      "Self-host on any Node host",
      "Capture worker source",
      "Fork the catalogue",
    ],
  },
  {
    name: "Together",
    price: "$0",
    cadence: "hosted",
    description: "The hosted instance Together AI runs. Free for everyone.",
    cta: "Install the MCP",
    href: "/mcp",
    accent: false,
    features: [
      "Everything in Studio",
      "MCP for Claude Code, Cursor, Codex",
      "Authenticated extract endpoint",
      "Anti-abuse rate limiting",
    ],
  },
];

export function PricingThreeCard() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3">
        {TIERS.map((t) => (
          <article
            key={t.name}
            className={`
              group relative flex flex-col border rule
              transition-transform duration-300 ease-out
              hover:-translate-y-1
              ${t.accent ? "border-t-2" : ""}
            `}
            style={t.accent ? { borderTopColor: "var(--color-accent)" } : undefined}
          >
            <div className="space-y-2 px-6 pt-8">
              <p className="text-meta">{t.name}</p>
              <p className="font-display flex items-baseline gap-2 text-5xl leading-none tracking-tight">
                {t.price}
                <span className="text-meta normal-case tracking-normal text-[var(--color-fg-muted)]">
                  / {t.cadence}
                </span>
              </p>
            </div>
            <p className="px-6 pt-6 text-sm leading-relaxed text-[var(--color-fg-muted)]">
              {t.description}
            </p>
            <ul className="mt-8 space-y-3 border-t rule px-6 py-6 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-baseline gap-3">
                  <span aria-hidden className="text-[var(--color-accent)]">
                    ·
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <a
              href={t.href}
              className={`
                m-6 mt-auto inline-flex items-center justify-between
                border rule px-4 py-3 font-mono text-xs tracking-normal
                transition-colors
                hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]
              `}
            >
              {t.cta}
              <span aria-hidden>→</span>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
