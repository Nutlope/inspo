# M3 Photographer — Inspo-only run · NOTES

Brief: portfolio landing page for a freelance photographer who shoots portraits and travel work.
Constraint: Inspo MCP only. No Hallmark skill, no `/Users/youssef/.claude/skills/` access.

---

## 1. MCP calls made

| # | Tool | Args | Return summary |
|---|---|---|---|
| 1 | `recommend` | `{ brief: "portfolio landing page for a freelance photographer who shoots portraits and travel work — editorial, image-first, calm typography" }` | Picked **Feature Stack** (rationale: most common macro in top hybrid hits). Exemplars were all SaaS sites (Formstack, Airtable, Lyft Developers, Lookback, Clerk Changelog). Verdict: the picker over-rotated on the words "calm typography" toward SaaS landing pages — clearly wrong for a photographer. Useful signal: returned one reference component (`pricing/table`) and a generic palette suggestion `#2372e6 / #167a53 / #a7c2ec / #89776c / #b4b4b3`. **Decision: ignored the pick, treated `recommend` only as a sanity check and ran a more targeted search.** |
| 2 | `search_screens` | `{ query: "photographer portfolio editorial portraits travel image grid", limit: 8, style: "editorial" }` | Gold. 8/8 results were `macrostructure: portfolio-grid`, `hallmarkTheme: editorial:specimen` or `editorial:newsprint`. Best signal: **`pieterhugo-com`** (literal fine-art photographer portfolio — Roboto + Karla, near-monochrome b/w with #b46454 terracotta accent), **`ruvenafanador-com`** (portrait photographer, monochrome with #d83a45 / #e29149 warm accents, bento/feature-trio components), **`robin-noguier-com`** (image-first with case-study cards), **`works.studio`** and **`thrilljockey-com`** (clean editorial grid). Confirmed: this brief lives in `portfolio-grid` not `feature-stack`. |
| 3 | `find_examples_for_macrostructure` | `{ name: "portfolio-grid", limit: 6 }` | Returned 6 captures of 4ad.com (duplicate sub-pages of the same site). Low signal — burned a call. Lesson: this tool is alphabetical/page-pagination biased, not diversified across sites. Should use `search_screens` with a `macrostructure` filter instead. |
| 4 | `get_design_system` | `{ slug: "pieterhugo-com", live: true }` | Live-extracted real tokens: fonts = Roboto / Karla / -apple-system; palette = `#fff #000 #ccc #999 #222` + heuristic warm support roles `#b46454 / #6c342c / #d6ac8e / #d6b9a9`; tech = Cargo. Confirms a near-monochrome paper canvas with one terracotta. CSS vars unhelpful (Cargo-specific). |
| 5 | `get_design_system` | `{ slug: "ruvenafanador-com", live: true }` | Live tokens: fonts = Helvetica-Light / GD Sherpa, palette mostly white + black + greys, WordPress aspect-ratio CSS variables (`--wp--preset--aspect-ratio--3-4 / 4-3 / 16-9 / 9-16`). Confirms the **portrait-rich grid uses standard editorial aspect ratios** rather than custom crops — I picked these up in the `.plate--tall / --wide / --sq / --narrow / --strip` modifiers. |
| 6 | `find_reference_components` | `{ macro: "portfolio-grid" }` | 0 components. The 68 Hallmark references aren't tagged by macrostructure-slug match for portfolio-grid yet. Pivoted to type-based reference fetch. |
| 7 | `find_reference_components` | `{ type: "hero" }` | 7 hero archetypes returned with full JSX. Picked **Documentary**: "headline reads as the caption of a missing photograph; documentary credit sits in the margin." This is *literally* the photographer hero shape. Stole the structure: 8/12 left for headline + small dateline ("Plate Nº 24 · Marseille → Lisbon → Tangier · 2019 — present"), 4/12 right for a credit aside with `dl` of format/location/languages/repping. |
| 8 | `find_reference_components` | `{ type: "footer" }` | 7 footer archetypes. Picked **Address card** (`Ft8`) as the photographer's footer base — postal + email + hours + repping. Hallmark explicitly notes "No social row, no link map" and "icons in footers are an AI tell" — I followed both, kept the "Elsewhere" column text-only. Also borrowed the colophon's "Set in Fraunces, Inter Tight, JetBrains Mono" tagline for the bottom rule. |
| 9 | `find_reference_components` | `{ type: "features" }` | 7 feature archetypes. Picked **Alternating** for the "Current series" section — three rows alternating side per row, big mono ordinal where an image would be (in my version the ordinal sits beside an actual image plate). Also picked **Long-form** prose for the "Approach" section (three notes, marginal labels) — Hallmark calls out "the default AI-page output is a 3-column feature grid; this is the alternative when the brand voice deserves to be read, not scanned." That's the right voice for a photographer's "how I work" section. |
| 10 | `find_reference_components` | `{ type: "nav" }` | 7 nav archetypes. Picked **Inline minimal** (`N1`) — wordmark + 4 inline links + utility action on the right. Added a sticky-blur paper-tone bar (matches the editorial:specimen theme). |
| 11 | `search_screens` | `{ query: "image grid portfolio with project case studies large typography", limit: 6, macrostructure: "portfolio-grid" }` | Cross-reference. Confirmed Robin Noguier + works.studio + Magazine B as gold-standard portfolio-grid implementations. Magazine B in particular validated the warm earth palette family (`#bf6016 / #8b3810 / #e4a16c / #a47e5c / #cebda8`) which is what the editorial:specimen theme converges on. |
| 12 | `find_reference_components` type queries that **failed** | `{ type: "gallery" }` and `{ type: "feature" }` (singular) | Both rejected by enum validation. Valid enum: `hero / pricing / features / cta / nav / footer / testimonial / logo-cloud / faq / stat`. Worth knowing: `features` is the plural; there is no `gallery` type yet. |

Total: **11 successful Inspo MCP calls + 2 enum errors.**

---

## 2. Design rationale

**Macrostructure.** `portfolio-grid`, full stop. Every successful photographer reference in the archive is one — Pieter Hugo, Ruven Afanador, Robin Noguier, works.studio, designstudio, moshimoshimusic, thrilljockey. The `recommend` tool's auto-pick of `feature-stack` was wrong; I overrode it with the empirical evidence from `search_screens`.

**Theme.** `editorial:specimen` — the Hallmark theme tagged on every photographer/agency portfolio I pulled. That theme is a warm-paper canvas + ink type + one accent. I built the palette from the union of the Pieter Hugo and Ruven Afanador captures: paper `#F4F1EC`, ink `#1A1714`, muted `#6F665C`, accent terracotta `#B5563A` (a cousin of Pieter Hugo's `#b46454` and Magazine B's `#bf6016`). Pure CSS noise overlay gives the page a faint paper grain — defends against the flat-canvas tell.

**Typography.** Fraunces (display, italic for accents — leveraging the variable `opsz` and `SOFT` axes for optical sizing in the hero), Inter Tight (body, 1.55 line-height for editorial readability), JetBrains Mono (every marginal caption, dateline, plate number, dt label). This trio is the recurring stack across the Hallmark `editorial:Inspo-paper` references — the **Colophon** footer reference component literally lists it as its own typeface set. I leaned into it because it's the typographic vocabulary the reference layer is already speaking in.

**Hero (Documentary).** Lifted the structure from the canonical `hero/documentary` JSX: 8-col headline with mono "Plate Nº · location · date" dateline as marginalia, 4-col right-margin caption block with a `dl` of format / location / languages / representation. This is the exact thing a printed magazine does on a credits page, and it tells visitors instantly that they're looking at the work of a real working photographer.

**The grid.** Six column-track grid with irregular column-span on the cards (big 4-col, tall 2-col 3:4, wide 3-col 3:2, square, narrow 2-col 2:3, full-width strip 21:9). This breaks the 3×2 sameness AI defaults to (per the Hallmark Bento JSX note). Each plate has a permanent base caption *below* the image — italic display serif title + mono meta — and an overlay caption that fades in on hover. The plate number sits top-left in mono with `mix-blend-mode: difference` so it reads on any image. Photos are real Unsplash documentary frames, cropped to varied aspect ratios; the variety in crops carries the visual rhythm.

**Featured plate.** A second hero in the middle of the page — single 16:9 image with a gradient-darkened bottom-left caption block ("The keeper waits for the first thermal of the morning"). This is the magazine spread the rest of the page can refer back to. Editorial credit ("The Gentlewoman · Issue 32 · Read the spread →") sits below the image in mono.

**Series (Alternating rows).** Three project entries alternating image-left / image-right. Each row has a giant italic Roman numeral (i. ii. iii.) in display serif — the typographic ordinal that the Hallmark Alternating reference uses to provide visual variety without resorting to icons.

**Approach (Long-form prose).** Three essay paragraphs on portraiture / travel / commissions, each with a mono marginal label and a single-column body. Followed by a pull quote with an accent left-border — voice as content, not feature grid.

**Journal.** A three-up posts row with mono datelines and the underline-on-hover gradient micro-interaction.

**Clients.** A *hand-set list*, not a logo cloud. Twelve client names in italic display serif, each prefixed by a small numeric mono index ("01 — The Gentlewoman"). This is the photographer's version of "no AI-tell logo strip."

**CTA.** Dark band — paper-on-ink. Display serif headline with an italic accent line, an inline single-line form (email + brief + send) with hairline underline, all in mono caption type. The form turns into "Sent ✓" on submit (no real backend).

**Footer (Address card).** Four columns — Find me / Write / Repping / Elsewhere — all set as text, no icons. Matches the Hallmark Ft8 archetype's explicit "no social row" rule. Closes with set-in-typefaces colophon line.

**Anti-slop discipline that came from reading the references:**
- No SVG icons in nav, social row, or features (Hallmark "rotational SVG iconography is one of the strongest AI fingerprints").
- No generic 3-column feature grid — replaced with Alternating + Long-form prose.
- No "Lorem ipsum" or invented stock chrome — every image is a real Unsplash documentary photo, every name is plausible (Lina Ardèche, Atelier Mira / Iván Carreira, Penny Martin at The Gentlewoman, Granta No. 167).
- Sticky-blur nav uses real paper-tone backdrop blur, not a frosted-pill template.
- Aspect ratios pulled from the Ruven Afanador WordPress CSS vars (3:4, 4:3, 3:2, 16:9, 1:1) — the variety carries the rhythm.

---

## 3. Self-score

**8.5 / 10.**

**Why it earns it:**
- The brief was correctly read against the catalogue (portfolio-grid + editorial:specimen) instead of trusting the `recommend` pick, which was visibly wrong for the brief.
- The Documentary hero is the right shape for a photographer and is *traced* (not copied) from the Hallmark reference JSX with brief-appropriate content.
- The irregular grid spans + permanent + hover captions feel hand-set, not template-generated.
- Real copy throughout (no Lorem, no generic "Award-winning photographer who tells stories"), with plausible publication credits and a quoted endorsement that names a real magazine editor.
- The footer is an Address card not a sitemap, and the clients section is a typeset list not a logo cloud — both deliberate anti-slop choices the references prompted.
- Type system is fully resolved (display + body + mono, all loaded, used at calibrated weights, with Fraunces optical axis exercised).
- Responsive: tested in head from 320px to 1480px — single-column on small, 6-track grid on large, alternating rows flip correctly.
- Inline noise filter, accent-leftbar pull quote, marginalia datelines, mono dateline + italic display body in the journal: small editorial details that read as "magazine," not "page builder."

**Why not higher:**
- Only one section per *kind* — there's no second portrait series or second journal page to anchor the navigation links, so the nav is functionally aspirational. A real production cut would have anchor targets that actually go somewhere.
- No real dark-mode toggle even though the editorial:specimen palette would support one cheaply.
- The form is faux (no backend wiring, no validation copy).
- No JS-driven filter for the archive — the filter chips are decorative.
- Could push the type ramp further on display sizes (the hero is good, but a 12vw clamp could read even more like a print specimen at desktop widths).
- Would benefit from a second mono accent (small caps tabular nums for the journal dates) and from real `image-set()` for the photos.

These are deliberate scope cuts for a one-shot — none of them are problems with the design, they're just where I'd spend the next hour if there were one.
