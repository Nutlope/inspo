/* inspo-reference-component
 * type= footer | genre= editorial | theme= Inspo-paper
 * archetype= Ft3 Sitemap | diversification= 4-column link map - the
 *   most-AI-recognised footer shape. Included as the canonical
 *   "this is what the field defaults to" reference.
 * states= default + hover
 * contrast= pass (46-50)
 *
 * Note - Ft3 is the easiest footer to spot as templated. Use
 * only when the site genuinely needs a deep link map (docs root, hub
 * page). Otherwise prefer Ft1 Index, Ft5 Statement, or Ft7 Colophon.
 */

const COLUMNS = [
  {
    label: "Catalogue",
    links: ["The archive", "Components", "Collections", "Issues"],
  },
  {
    label: "Agent",
    links: ["MCP server", "Install", "Tool reference", "Use cases"],
  },
  {
    label: "Project",
    links: ["About", "Self-host", "Contribute", "Roadmap"],
  },
  {
    label: "Legal",
    links: ["DMCA", "Licence", "Privacy", "Status"],
  },
];

export function FooterSitemap() {
  return (
    <footer className="border-t rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="grid grid-cols-2 gap-x-10 gap-y-12 sm:grid-cols-4">
        {COLUMNS.map((c) => (
          <div key={c.label}>
            <p className="text-meta">{c.label}</p>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-sm text-[var(--color-fg)] transition-colors hover:text-[var(--color-accent)]"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-wrap items-baseline justify-between gap-3 border-t rule pt-6 text-meta">
        <span>Together AI · MIT · {new Date().getFullYear()}</span>
        <span>Filed by hand in New York.</span>
      </div>
    </footer>
  );
}
