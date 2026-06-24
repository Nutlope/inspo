/* Inspo · component: features · genre: editorial · theme: Inspo-paper
 * archetype: Alternating rows · diversification: differs from Bento +
 *   triplet on structure (vertical scroll vs grid) + density (low vs high)
 * states: default (static)
 * contrast: pass (46-50)
 */

/**
 * Alternating rows - three feature blocks stacked vertically, label
 * slot flipping side per row to break the column rhythm. No images;
 * a typographic mark (lettered ordinal in mono) sits where the image
 * would. The shape comes from the alternation, not asset variety.
 */
const ROWS = [
  {
    mark: "A",
    label: "Search the way you think",
    body: "Type a mood. Paste a URL. Hit ⌘K. The catalogue answers however you ask it - lex, vector, hostname. Hybrid retrieval is the unsexy choice that works.",
  },
  {
    mark: "B",
    label: "Tag, but only what's true",
    body: "Tags live behind a hard allow-list. Style, industry, vibe, color words. A pricing card that isn't pricing is worse than no pricing card.",
  },
  {
    mark: "C",
    label: "Return URLs, not base64",
    body: "The MCP hands back image URLs your agent's vision model can fetch directly. No context bloat. No 200KB of base64 in the tool result.",
  },
];

export function FeaturesAlternating() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <ul className="space-y-16">
        {ROWS.map((r, i) => {
          const flip = i % 2 === 1;
          return (
            <li
              key={r.mark}
              className={`
                grid grid-cols-1 items-baseline gap-x-12 gap-y-6
                ${flip ? "md:[grid-template-columns:1fr_4fr]" : "md:[grid-template-columns:4fr_1fr]"}
              `}
            >
              <div className={flip ? "md:order-1 md:text-right" : "md:order-2"}>
                <span
                  className="font-display inline-block leading-none text-[var(--color-fg-muted)]"
                  style={{ fontSize: "clamp(4rem, 8vw, 7rem)" }}
                >
                  {r.mark}
                </span>
              </div>
              <div className={flip ? "md:order-2" : "md:order-1"}>
                <p className="text-meta">Section {r.mark}</p>
                <p className="font-display mt-3 max-w-[24ch] text-balance text-3xl leading-[1.05] tracking-tight sm:text-4xl">
                  {r.label}
                </p>
                <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
                  {r.body}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
