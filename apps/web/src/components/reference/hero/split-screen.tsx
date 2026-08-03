/* Inspo · component: hero · genre: editorial · theme: Inspo-paper
 * archetype: Split-screen · diversification: half typography, half
 *   atmospheric panel (accent-tinted)
 * states: default (static)
 * contrast: pass (46-50)
 */

/**
 * Split-screen - typography lives on one half, an atmospheric panel
 * fills the other. The panel is a pure CSS composition (gradient + a
 * single rule of marginalia) - not an image placeholder. Honours
 * the "never ship invented stock photos" rule.
 */
export function HeroSplitScreen() {
  return (
    <section className="border rule overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="bg-[var(--color-bg)] px-8 py-20 sm:px-14 sm:py-24">
          <p className="text-meta">Volume Two</p>
          <h1
            className="font-display mt-10 max-w-[15ch] text-balance leading-[1] tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)" }}
          >
            One half is what,{" "}
            <em className="italic">the other is feel</em>.
          </h1>
          <p className="text-meta mt-8 max-w-[44ch] normal-case tracking-normal text-[var(--color-fg-muted)]">
            The split runs the full bleed on desktop. On mobile the
            panel slides under the type, not over it.
          </p>
        </div>

        {/* Atmospheric panel - pure CSS, no image. Two-step gradient
            with a faint paper texture overlay. */}
        <div
          className="relative min-h-[24rem] lg:min-h-0"
          style={{
            background: `
              radial-gradient(120% 80% at 0% 0%, color-mix(in oklab, var(--color-link) 30%, var(--color-bg)), transparent 60%),
              linear-gradient(180deg, color-mix(in oklab, var(--color-link) 8%, var(--color-bg)), var(--color-bg))
            `,
          }}
        >
          <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-14">
            <p className="font-mono text-xs tracking-normal text-[var(--color-fg-muted)]">
              Panel - accent tint, no imagery
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
