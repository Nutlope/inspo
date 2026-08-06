/* inspo-reference-component
 * type= faq | genre= editorial | theme= Inspo-paper
 * archetype= Two-column open | diversification= differs from Accordion
 *   on interaction (none - all open) + structure (Q-left, A-right)
 * states= default (static)
 * contrast= pass (46-50)
 */

/**
 * Two-column open - every Q&A on display, no toggle. Question sits in
 * the left column, answer in the right. Reads as a magazine Q&A
 * interview, not a help-desk FAQ. Good when the questions are short
 * and the answers are the meat.
 */
const QA = [
  {
    q: "Why open source?",
    a: "Because the reference layer should belong to the field, not a vendor. MIT, owned by Together AI, free to fork.",
  },
  {
    q: "Why MCP and not a REST API?",
    a: "Both, actually. The MCP wraps the same query surface a REST API exposes - the value is in the catalogue, not the protocol.",
  },
  {
    q: "Who is this for?",
    a: "Designers and the coding agents they work alongside. The website is for humans - browse, study, copy a DESIGN.md. The MCP is for agents - same catalogue, addressed by tool calls.",
  },
  {
    q: "What about copyright?",
    a: "Screenshots of public web pages for editorial commentary is well-established. We credit designers and respect takedown requests.",
  },
];

export function FaqTwoColumn() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="mb-12 grid grid-cols-1 gap-y-3 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-3">
          <p className="text-meta">FAQ</p>
        </div>
        <p className="lg:col-span-9 font-display max-w-[26ch] text-balance text-4xl leading-[1.05] tracking-tight">
          The ones worth answering out loud.
        </p>
      </div>

      <dl className="border-t rule">
        {QA.map((row) => (
          <div
            key={row.q}
            className="grid grid-cols-1 gap-x-10 gap-y-3 border-b rule py-8 lg:grid-cols-12"
          >
            <dt className="lg:col-span-4">
              <p className="font-display text-2xl leading-tight">{row.q}</p>
            </dt>
            <dd className="lg:col-span-8">
              <p className="max-w-[60ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
                {row.a}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
