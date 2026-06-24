/* Inspo · component: logo-cloud · genre: editorial · theme: Inspo-paper
 * archetype: 4×3 grid · diversification: fixed grid instead of marquee
 *   or strip - reads as a contact sheet
 * states: default + hover (cell border accent)
 * contrast: pass (46-50)
 */

/**
 * 4×3 logo grid - twelve marks in a hairline-ruled grid. Each cell
 * is a typographic wordmark; hover deepens the cell border in
 * accent. Reach for it when the brand wants to display a substantial
 * partner roster without scrolling.
 */
const MARKS = [
  { mark: "Together AI", style: "font-display" },
  { mark: "STUDIO / 01", style: "font-mono uppercase tracking-[0.18em] text-sm" },
  { mark: "S-02", style: "font-display italic" },
  { mark: "Atelier 03", style: "font-display" },
  { mark: "MARK 04", style: "font-mono uppercase tracking-[0.12em] text-sm" },
  { mark: "Studio · 05", style: "font-display" },
  { mark: "S 06 / Co", style: "font-mono text-base" },
  { mark: "Studio 07", style: "font-display italic" },
  { mark: "M 08", style: "font-display tracking-tight" },
  { mark: "STUDIO 09", style: "font-mono uppercase tracking-[0.12em] text-sm" },
  { mark: "Atelier 10", style: "font-display" },
  { mark: "S-11", style: "font-display" },
];

export function LogoCloudGrid() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-12 sm:px-14 sm:py-16">
      <p className="text-meta">Studios on file</p>
      <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 -m-px">
        {MARKS.map((m, i) => (
          <li
            key={i}
            className={`
              flex aspect-[3/2] items-center justify-center border rule -ml-px -mt-px p-4
              ${m.style} text-base text-[var(--color-fg)] opacity-70
              transition-all duration-200
              hover:opacity-100 hover:border-[var(--color-link)] hover:text-[var(--color-link)]
            `}
          >
            {m.mark}
          </li>
        ))}
      </ul>
    </section>
  );
}
