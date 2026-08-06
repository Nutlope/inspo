/* inspo-reference-component
 * type= testimonial | genre= editorial | theme= Inspo-paper
 * archetype= Conversation snippet | diversification= chat-style exchange,
 *   not a single quote - invites the reader to overhear
 * states= default (static)
 * contrast= pass (46-50)
 *
 * Honest copy - exchange is placeholdered ([speaker], [message]).
 * Replace with a real attributed conversation before shipping; faked
 * chat-style testimonials are an immediate trust-break.
 */

const LINES = [
  { who: "[Designer]", message: "[Question - what did the agent surprise you with?]" },
  { who: "[Engineer]", message: "[Answer - one sentence about the workflow change.]" },
  { who: "[Designer]", message: "[Follow-up - one short reaction.]" },
];

export function TestimonialConversation() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-meta">Overheard</p>
          <p
            className="font-display mt-4 max-w-[18ch] text-balance leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            From a Friday post-mortem.
          </p>
        </div>
        <ol className="lg:col-span-8 space-y-6">
          {LINES.map((l, i) => (
            <li key={i} className="grid grid-cols-[8rem_1fr] items-baseline gap-x-6">
              <span className="font-mono text-xs tracking-normal text-[var(--color-fg-muted)]">
                {l.who}
              </span>
              <p className="font-display text-lg leading-snug text-[var(--color-fg)]">
                &ldquo;{l.message}&rdquo;
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
