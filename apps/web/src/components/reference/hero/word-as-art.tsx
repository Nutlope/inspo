/* Hallmark · component: hero · genre: editorial · theme: Inspo-paper
 * archetype: Word-as-art · diversification: single word stretched edge
 *   to edge, the headline is reduced to its essence
 * states: default (static)
 * contrast: pass (46-50)
 */

/**
 * Word-as-art — one word, set to fill the viewport width. The page
 * doesn't lead with a sentence; it leads with a noun. Marginalia
 * underneath supplies the rest. Common in foundry catalogues and
 * cinema posters; reach for it when the brief has *one* core word.
 */
export function HeroWordAsArt() {
  return (
    <section className="border rule bg-[var(--color-bg)] overflow-hidden px-6 py-16 sm:py-24">
      <p className="text-meta px-2 sm:px-8">A specimen</p>

      <p
        className="
          font-display mt-6 leading-[0.85] tracking-tight
          flex justify-center
        "
        style={{
          fontSize: "clamp(5rem, 26vw, 22rem)",
          fontStretch: "100%",
        }}
        aria-label="Archive"
      >
        <em className="italic">Archive</em>
      </p>

      <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-3 px-2 sm:grid-cols-3 sm:px-8">
        <p className="text-meta text-[var(--color-fg)]">
          noun · ar·chive · /ˈɑːkaɪv/
        </p>
        <p className="text-meta normal-case tracking-normal text-[var(--color-fg-muted)] sm:col-span-2">
          A collection of historical documents or records — filed,
          credited, addressable. Studied, not copied.
        </p>
      </div>
    </section>
  );
}
