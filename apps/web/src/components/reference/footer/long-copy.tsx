/* inspo-reference-component
 * type= footer | genre= editorial | theme= Inspo-paper
 * archetype= Long copy | diversification= closes the page with a small
 *   essay rather than a link map - manifesto in miniature
 * states= default + hover (single link)
 * contrast= pass (46-50)
 */

/**
 * Long-copy footer - a small essay at the end of the page. Reads as
 * the closing paragraph of a magazine piece. Reach for it when the
 * brand voice deserves the last word.
 */
export function FooterLongCopy() {
  return (
    <footer className="border-t rule bg-[var(--color-bg)] px-8 py-16 sm:px-14 sm:py-20">
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-12">
        <p className="text-meta lg:col-span-2">Last word</p>
        <div className="lg:col-span-10 space-y-5 max-w-[68ch] text-base leading-relaxed text-[var(--color-fg)]">
          <p>
            Inspo is a reference layer. Every site here was made by
            someone who cared about the work - we file it, credit it,
            and address it so the next person doesn&rsquo;t have to
            re-derive the same lessons from scratch. The catalogue
            grows slowly, by hand. Curation is the moat.
          </p>
          <p className="text-[var(--color-fg-muted)]">
            Owned and operated by Together AI. Free for everyone. The
            hosted instance never shows ads and never tracks readers.
          </p>
        </div>
      </div>
      <div className="mt-12 flex flex-wrap items-baseline justify-between gap-3 border-t rule pt-6 text-meta">
        <span>© {new Date().getFullYear()} - MIT</span>
        <a
          href="https://github.com/Luffixos/inspo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-fg)] hover:text-[var(--color-accent)]"
        >
          Read the source ↗
        </a>
      </div>
    </footer>
  );
}
