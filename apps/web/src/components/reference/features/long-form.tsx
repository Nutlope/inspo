/* Hallmark · component: features · genre: editorial · theme: Inspo-paper
 * archetype: Long-form prose · diversification: features described as
 *   essay paragraphs, not bullet points
 * states: default (static)
 * contrast: pass (46-50)
 */

/**
 * Long-form prose — features written as connected paragraphs in a
 * single column with marginal headings. The default AI-page output
 * is a 3-column feature grid; this is the alternative when the brand
 * voice deserves to be read, not scanned.
 */
const NOTES = [
  {
    label: "On reading the page",
    body: "Inspo treats the catalogue as a magazine archive: every site has a credit line, every plate sits at full resolution, every detail page reads like a back-of-the-issue colophon. Scroll the gallery slowly. Open the ones that stop you.",
  },
  {
    label: "On talking to your agent",
    body: "The MCP server hands the same catalogue to Claude Code, Cursor, Codex, and Zed as tool calls. Search by mood, paste a URL, pull a DESIGN.md — the agent sees what you see, and writes from that reference instead of from training-data averages.",
  },
  {
    label: "On the reference layer",
    body: "The components page is the second surface: twenty-eight Hallmark-disciplined sections, each one stamped with its macrostructure. Copy the markup, study the rule, and your output stops looking like every other AI page.",
  },
];

export function FeaturesLongForm() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <p className="text-meta">Three notes</p>
      <p
        className="font-display mt-4 max-w-[20ch] text-balance leading-[1.05] tracking-tight"
        style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
      >
        How this is meant to be used.
      </p>

      <div className="mt-16 space-y-14">
        {NOTES.map((n) => (
          <div
            key={n.label}
            className="grid grid-cols-1 gap-x-10 gap-y-3 lg:grid-cols-12"
          >
            <p className="text-meta lg:col-span-3">{n.label}</p>
            <p className="lg:col-span-9 max-w-[64ch] text-base leading-relaxed text-[var(--color-fg)]">
              {n.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
