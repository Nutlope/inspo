/* Inspo · component: testimonial · genre: editorial · theme: Inspo-paper
 * archetype: Mosaic · diversification: differs from Pull-Quote on
 *   density (4 voices vs 1) + composition (grid vs hero)
 * states: default · hover (subtle lift)
 * contrast: pass (46-50)
 *
 * Note - quotes are placeholder slots. Replace with real attributed
 * customer voices before shipping; No invented
 * customer testimonials.
 */

const QUOTES = [
  {
    text: "[Quote slot 01 - replace before shipping.]",
    who: "[Name]",
    role: "[Role]",
  },
  {
    text: "[Quote slot 02 - keep it short. One sentence beats four.]",
    who: "[Name]",
    role: "[Role]",
  },
  {
    text: "[Quote slot 03 - focus on what changed, not adjectives.]",
    who: "[Name]",
    role: "[Role]",
  },
  {
    text: "[Quote slot 04 - the strongest voice goes here.]",
    who: "[Name]",
    role: "[Role]",
  },
];

export function TestimonialMosaic() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <p className="text-meta">In the field</p>
      <p className="font-display mt-4 max-w-[24ch] text-balance text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        What designers tell us, unedited.
      </p>

      <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        {QUOTES.map((q, i) => (
          <li
            key={i}
            className="flex flex-col border rule p-8 transition-transform duration-300 ease-out hover:-translate-y-1"
          >
            <p className="font-display flex-1 text-lg leading-relaxed">
              &ldquo;{q.text}&rdquo;
            </p>
            <div className="mt-8 flex items-baseline gap-3 border-t rule pt-4">
              <span className="text-meta">-</span>
              <p className="text-sm">
                <span className="text-[var(--color-fg)]">{q.who}</span>
                <span className="text-meta normal-case tracking-normal text-[var(--color-fg-muted)]"> · {q.role}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
