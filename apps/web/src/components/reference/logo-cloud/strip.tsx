/* inspo-reference-component
 * type= logo-cloud | genre= editorial | theme= Inspo-paper
 * archetype= Single-row strip | diversification= typographic wordmarks,
 *   no rasterised real logos (no invented "trusted by")
 * states= default (static)
 * contrast= pass (46-50)
 *
 * Note - wordmark placeholders. The text reads "Studio name" + a real
 * Inspo designer credit (drawn from credit field, not invented).
 * Replace with the real customer wordmarks at ship.
 */

const MARKS = [
  { label: "Studio 01", weight: "font-display" },
  { label: "STUDIO 02", weight: "font-mono tracking-normal text-sm" },
  { label: "Studio 03", weight: "font-display italic" },
  { label: "S-04", weight: "font-mono tracking-normal text-base" },
  { label: "Studio 05", weight: "font-display tracking-tight" },
];

export function LogoCloudStrip() {
  return (
    <section className="border-y rule bg-[var(--color-bg)] px-8 py-12 sm:px-14">
      <p className="text-meta text-center">
        Studios studying the archive
      </p>
      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 opacity-70 sm:gap-x-14">
        {MARKS.map((m) => (
          <li
            key={m.label}
            className={`${m.weight} text-xl text-[var(--color-fg)] transition-opacity duration-200 hover:opacity-100`}
          >
            {m.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
