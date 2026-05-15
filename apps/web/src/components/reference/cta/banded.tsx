/* Hallmark · component: cta · genre: editorial · theme: Inspo-paper
 * archetype: Banded · diversification: differs from Quiet on paper band
 *   (accent-bleed vs paper) + voice (declarative vs invitational)
 * states: default + hover (button: ink wipe), focus-visible (ring)
 * contrast: pass (46-50)
 */

/**
 * Banded CTA — full-bleed accent ribbon with a single action. The
 * pattern earns its loudness by being the only one of its kind on the
 * page. Reserve for the singular conversion ask; never stack two of
 * these on one page.
 */
export function CtaBanded() {
  return (
    <section
      className="
        relative overflow-hidden border-y rule
        bg-[var(--color-link)] text-[var(--color-paper)]
        px-8 py-20 sm:px-14 sm:py-24
      "
    >
      <div className="grid grid-cols-1 items-center gap-x-10 gap-y-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-[var(--color-paper)]/70">
            Install once. Free forever.
          </p>
          <p
            className="font-display mt-4 max-w-[22ch] text-balance leading-[1] tracking-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Lend your agent some taste.
          </p>
        </div>

        <div className="lg:col-span-4 lg:justify-self-end">
          {/* Inverse button — paper background on accent ground. Hover
              wipes to ink so the button stays the heaviest thing in
              the band even after the eye adjusts to the red. */}
          <a
            href="#"
            className="
              group/btn relative inline-flex h-12 items-center gap-3
              overflow-hidden border-2
              px-7 font-mono text-sm uppercase tracking-[0.12em]
              transition-colors duration-300 ease-out
            "
            style={{
              borderColor: "var(--color-paper)",
              color: "var(--color-link)",
              backgroundColor: "var(--color-paper)",
            }}
          >
            <span
              aria-hidden
              className="
                absolute inset-0 origin-left scale-x-0
                transition-transform duration-300 ease-out
                group-hover/btn:scale-x-100
              "
              style={{ backgroundColor: "var(--color-ink)" }}
            />
            <span className="relative z-10 transition-colors duration-300 group-hover/btn:text-[var(--color-paper)]">
              npx inspo init
            </span>
            <span
              aria-hidden
              className="relative z-10 transition-[transform,color] duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:text-[var(--color-paper)]"
            >
              →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
