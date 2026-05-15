/* Hallmark · component: logo-cloud · genre: editorial · theme: Inspo-paper
 * archetype: Credits list · diversification: vertical credit roll —
 *   reads like a film end-credit, not a trust strip
 * states: default + hover
 * contrast: pass (46-50)
 */

/**
 * Credits list — partner roster as a vertical list with roles. The
 * shape inverts the usual horizontal trust-strip: readers scan
 * vertically and the credit format invites verbatim reading. Reach
 * for it when partners did real work and deserve named attribution.
 */
const CREDITS = [
  { partner: "Together AI", role: "Hosting + inference" },
  { partner: "Vercel", role: "Edge + deploy" },
  { partner: "Cloudflare", role: "Blob storage + MCP edge" },
  { partner: "Neon", role: "Postgres + pgvector" },
  { partner: "Playwright", role: "Capture pipeline" },
];

export function LogoCloudCredits() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-12 sm:px-14 sm:py-16">
      <div className="grid grid-cols-1 gap-x-12 gap-y-3 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-meta">Built with</p>
          <p className="font-display mt-4 max-w-[14ch] text-balance text-2xl leading-tight">
            Credit where credit is due.
          </p>
        </div>
        <ul className="lg:col-span-8 lg:border-l rule lg:pl-10">
          {CREDITS.map((c) => (
            <li
              key={c.partner}
              className="
                grid grid-cols-[1fr_auto] items-baseline gap-x-6
                border-b rule py-3 transition-colors hover:text-[var(--color-link)]
              "
            >
              <p className="font-display text-lg leading-tight">{c.partner}</p>
              <p className="text-meta normal-case tracking-normal text-[var(--color-fg-muted)]">
                {c.role}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
