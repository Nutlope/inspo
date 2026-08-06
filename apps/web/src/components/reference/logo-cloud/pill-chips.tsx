/* inspo-reference-component
 * type= logo-cloud | genre= editorial | theme= Inspo-paper
 * archetype= Pill chips | diversification= each logo sits inside a
 *   rounded chip - denser, more playful
 * states= default + hover (chip border accent)
 * contrast= pass (46-50)
 */

/**
 * Pill-chip logos - each wordmark in its own rounded chip with a
 * hairline border. Reads denser than a strip; useful when the
 * partner count is high and a row would force a marquee.
 */
const CHIPS = [
  "Together AI",
  "Studio 01",
  "S-02",
  "Atelier 03",
  "MARK 04",
  "Studio · 05",
  "S 06 Co",
  "Studio 07",
  "M 08",
  "Studio 09",
];

export function LogoCloudPillChips() {
  return (
    <section className="border-y rule bg-[var(--color-bg)] px-8 py-12 sm:px-14 sm:py-16">
      <p className="text-meta text-center">Partners</p>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {CHIPS.map((c) => (
          <li
            key={c}
            className="rounded-full border rule px-4 py-1.5 font-mono text-xs tracking-normal text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            {c}
          </li>
        ))}
      </ul>
    </section>
  );
}
