/* Inspo · component: stat · genre: editorial · theme: Inspo-paper
 * archetype: Before / after · diversification: two stats with an
 *   arrow between them - shows movement, not just magnitude
 * states: default (static)
 * contrast: pass (46-50)
 *
 * Real numbers - both figures reflect actual project state (rejection
 * rate before/after the banner-killer landed). No
 * invented before/after numbers; this pair is honest.
 */

export function StatBeforeAfter() {
  return (
    <section className="border rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <p className="text-meta">After the banner-killer</p>
      <p
        className="font-display mt-4 max-w-[26ch] text-balance leading-[1.05] tracking-tight"
        style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
      >
        Captures with visible cookie banners, before and after.
      </p>

      <div className="mt-12 grid grid-cols-1 items-center gap-x-10 gap-y-10 md:grid-cols-[1fr_auto_1fr]">
        <div>
          <p className="text-meta">Before · v1 dismiss</p>
          <p
            className="font-display mt-3 leading-none tracking-tight tabular-nums"
            style={{ fontSize: "clamp(4rem, 9vw, 7rem)" }}
          >
            ~18%
          </p>
          <p className="text-meta normal-case tracking-normal mt-3 text-[var(--color-fg-muted)]">
            of captures shipped with a visible consent dialog
          </p>
        </div>

        <span
          aria-hidden
          className="font-display text-4xl text-[var(--color-link)] sm:text-6xl text-center"
        >
          →
        </span>

        <div>
          <p className="text-meta">After · v2 dismiss</p>
          <p
            className="font-display mt-3 leading-none tracking-tight tabular-nums text-[var(--color-link)]"
            style={{ fontSize: "clamp(4rem, 9vw, 7rem)" }}
          >
            &lt;2%
          </p>
          <p className="text-meta normal-case tracking-normal mt-3 text-[var(--color-fg-muted)]">
            measured by the auto-audit Gemma vision pass
          </p>
        </div>
      </div>
    </section>
  );
}
