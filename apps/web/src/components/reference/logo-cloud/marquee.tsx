/* Hallmark · component: logo-cloud · genre: editorial · theme: Inspo-paper
 * archetype: Infinite marquee · diversification: differs from Strip on
 *   motion (auto-scroll vs static) + edge (mask-fade vs hard cut)
 * states: default · animation pauses on hover, on focus, on reduced-motion
 * contrast: pass (46-50)
 */

/**
 * Marquee — wordmarks scroll horizontally on an infinite loop. The
 * track is duplicated so the seam is invisible; mask-image fades the
 * edges so logos don't pop in/out. Honours prefers-reduced-motion via
 * the .marquee-track::-webkit-animation pause rule below.
 */
const MARKS = [
  "Studio 01",
  "STUDIO 02",
  "S—03 / Co",
  "Studio 04",
  "Studio · 05",
  "Atelier 06",
  "Studio 07",
];

export function LogoCloudMarquee() {
  return (
    <section className="border-y rule bg-[var(--color-bg)] py-10">
      <p className="text-meta px-8 text-center sm:px-14">
        Studios studying the archive
      </p>

      <div
        className="mt-6 overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <ul
          className="flex w-fit gap-14 whitespace-nowrap will-change-transform"
          style={{
            animation: "marquee-scroll 24s linear infinite",
          }}
        >
          {/* Duplicate the track so the seam doesn't show as the loop
              passes the edge. */}
          {[...MARKS, ...MARKS].map((m, i) => (
            <li
              key={`${m}-${i}`}
              className="font-display text-xl text-[var(--color-fg)] opacity-70"
            >
              {m}
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          ul[style*="marquee-scroll"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
