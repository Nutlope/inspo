/* Inspo · component: features · genre: editorial · theme: Inspo-paper
 * archetype: Numbered triplet · diversification: differs from Bento on
 *   structure (equal columns vs irregular spans) + voice (process vs catalog)
 * states: default (static)
 * contrast: pass (46-50)
 */

/**
 * Numbered triplet - three steps, each prefaced by a big mono ordinal.
 * Reads like a process diagram without a diagram. Each column is the
 * same width; the variety comes from the type, not the layout.
 */
const STEPS = [
  {
    n: "01",
    label: "Browse",
    body: "Open the archive. Filter by mood, paste a URL, scroll until something stops you.",
  },
  {
    n: "02",
    label: "Study",
    body: "Each tile lifts to a site detail page - palette, type ramp, components, designer credit.",
  },
  {
    n: "03",
    label: "Build",
    body: "Hand the design system to your agent over MCP - or copy DESIGN.md to clipboard yourself.",
  },
];

export function FeaturesNumberedTriplet() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <p className="text-meta">How to use it</p>
      <p className="font-display mt-6 max-w-[24ch] text-balance text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        Three steps, no signup.
      </p>

      <ol className="mt-16 grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="border-t-2 border-[var(--color-fg)] pt-6">
            <p
              className="font-mono text-[var(--color-fg-muted)]"
              style={{
                fontSize: "0.7rem",
                letterSpacing: "0.12em",
                textTransform: "",
              }}
            >
              Step {s.n}
            </p>
            <p className="font-display mt-3 text-3xl leading-tight tracking-tight">
              {s.label}
            </p>
            <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
              {s.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
