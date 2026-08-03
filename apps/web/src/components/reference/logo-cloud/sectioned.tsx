/* Inspo · component: logo-cloud · genre: editorial · theme: Inspo-paper
 * archetype: Sectioned · diversification: logos grouped by relationship
 *   instead of strewn in one row
 * states: default + hover (logo opacity ↑)
 * contrast: pass (46-50)
 *
 * Honest framing - group labels are real-world ("Partners",
 * "Featured in") instead of invented credibility tiers. Logos are
 * typographic wordmark placeholders.
 */

const GROUPS = [
  {
    label: "Partners",
    marks: ["Together AI", "Mod / 01", "Studio 04"],
  },
  {
    label: "Featured in",
    marks: ["[Outlet]", "[Outlet]", "[Outlet]"],
  },
];

export function LogoCloudSectioned() {
  return (
    <section className="border-y rule bg-[var(--color-bg)] px-8 py-12 sm:px-14 sm:py-16">
      <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-2">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <p className="text-meta">{g.label}</p>
            <ul className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-3">
              {g.marks.map((m, i) => (
                <li
                  key={`${m}-${i}`}
                  className={`
                    text-xl text-[var(--color-fg)] opacity-70
                    transition-opacity hover:opacity-100
                    ${i % 2 === 0 ? "font-display" : "font-mono tracking-normal text-base"}
                  `}
                >
                  {m}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
