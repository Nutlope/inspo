/* Hallmark · component: stat · genre: editorial · theme: Inspo-paper
 * archetype: Annotated stat · diversification: numbers with editorial
 *   footnotes — invites the reader to ask "according to what?"
 * states: default (static)
 * contrast: pass (46-50)
 *
 * Real numbers — every figure is a measured catalogue value; the
 * footnotes name the method. Hallmark's anti-invented-metrics rule:
 * if you can't cite it, don't show it.
 */

const STATS = [
  {
    value: "1,019",
    label: "Sites filed",
    foot: "¹ Published rows in screens where status = 'published'",
  },
  {
    value: "28",
    label: "Reference components",
    foot: "² At /components, all Hallmark-stamped, every type populated",
  },
  {
    value: "9.4",
    label: "Avg pages per site",
    foot: "³ Median across catalogue, sub-pages incl. pricing + auth",
  },
];

export function StatAnnotated() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <p className="text-meta">Catalogue · measured</p>

      <ul className="mt-10 grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-3">
        {STATS.map((s, i) => (
          <li key={s.label}>
            <p
              className="font-display leading-none tracking-tight tabular-nums"
              style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
            >
              {s.value}
              <sup className="font-mono text-base text-[var(--color-link)] align-super">
                {String.fromCharCode(0xb9 + i)}
              </sup>
            </p>
            <p className="text-meta mt-4">{s.label}</p>
          </li>
        ))}
      </ul>

      <ol className="mt-12 list-none space-y-2 border-t rule pt-6 text-meta normal-case tracking-normal text-[var(--color-fg-muted)]">
        {STATS.map((s) => (
          <li key={s.foot}>{s.foot}</li>
        ))}
      </ol>
    </section>
  );
}
