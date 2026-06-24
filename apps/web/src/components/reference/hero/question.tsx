/* Inspo · component: hero · genre: editorial · theme: Inspo-paper
 * archetype: Question · diversification: hero as inquiry, not assertion
 * states: default (static)
 * contrast: pass (46-50)
 */

/**
 * Question - the hero asks rather than tells. Useful when the brief is
 * exploratory or invitational. The "answer" in mono caption underneath
 * is brief and confident, framing the rest of the page as the long
 * answer.
 */
export function HeroQuestion() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-20 sm:px-14 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <p className="text-meta">Asked by an agent, 04:21</p>
        <h1
          className="font-display mt-8 max-w-[20ch] text-balance leading-[1] tracking-tight"
          style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
        >
          What does <em className="italic">good</em> actually look like?
        </h1>

        <div className="mt-16 border-t rule pt-6">
          <p className="text-meta">Answered, in 1,019 plates →</p>
        </div>
      </div>
    </section>
  );
}
