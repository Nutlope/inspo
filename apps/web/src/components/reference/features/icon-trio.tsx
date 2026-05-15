/* Hallmark · component: features · genre: editorial · theme: Inspo-paper
 * archetype: Icon trio · diversification: three features each carrying
 *   a typographic mark — no SVG iconography
 * states: default + hover (mark colour shift)
 * contrast: pass (46-50)
 *
 * Hallmark note: rotational SVG iconography (rounded squares + line
 * icons) is one of the strongest AI fingerprints. The typographic
 * marks here (a single mono letter inside a hairline square) carry
 * the same hierarchy without the slop tell.
 */

const ITEMS = [
  {
    mark: "S",
    label: "Search",
    body: "Type a mood, paste a URL, hit ⌘K. Hybrid lex + vector retrieval over the catalogue.",
  },
  {
    mark: "C",
    label: "Crop",
    body: "Every captured page has its component regions cropped — heroes, pricing, footers — addressable from the MCP.",
  },
  {
    mark: "D",
    label: "DESIGN.md",
    body: "Per-site design system extracted from the DOM. Palette roles, type ramp, spacing. Your agent reads it directly.",
  },
];

export function FeaturesIconTrio() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <p className="text-meta">Three primitives</p>
      <p
        className="font-display mt-4 max-w-[22ch] text-balance leading-[1.05] tracking-tight"
        style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
      >
        Search, Crop, DESIGN.md.
      </p>

      <ul className="mt-16 grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-3">
        {ITEMS.map((i) => (
          <li key={i.mark} className="group">
            <div
              className="
                inline-flex h-14 w-14 items-center justify-center border-2 rule
                font-display text-3xl
                transition-colors
                group-hover:border-[var(--color-link)] group-hover:text-[var(--color-link)]
              "
            >
              {i.mark}
            </div>
            <p className="font-display mt-6 text-2xl leading-tight">{i.label}</p>
            <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
              {i.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
