/* inspo-reference-component
 * type= cta | genre= editorial | theme= Inspo-paper
 * archetype= Sticky compact | diversification= floats at the foot, low
 *   contrast, single short action
 * states= default · hover · focus-visible
 * contrast= pass (46-50)
 *
 * Note - this is rendered inline here for the gallery. On a real page
 * the parent would add `position: fixed; bottom: 1rem; inset-inline: 0`
 * with z-index above the page body. See the commented sticky styles.
 */

export function CtaStickyCompact() {
  return (
    <section className="px-8 py-16 sm:px-14 sm:py-20">
      <div
        className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 border rule bg-[var(--color-bg)] px-6 py-4 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] /* On a real page: * position: fixed; bottom: 1rem; left: 1rem; right: 1rem; * z-index: 50; */"
      >
        <div>
          <p className="text-meta">Live now</p>
          <p className="font-display text-lg leading-tight">
            Install for your coding agent.
          </p>
        </div>
        <a
          href="#"
          className="inline-flex h-10 items-center gap-2 border rule px-5 font-mono text-xs tracking-normal text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          npx inspo init
          <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}
