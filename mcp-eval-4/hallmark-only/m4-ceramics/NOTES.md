# hallmark-only / m4-ceramics

## Timing
start: 1785927222
end:   1785927727

## Tool calls
total: 41
inspo: 0
breakdown: Read x18, Write x4, Edit x5, Bash x7, mcp__Claude_Browser__resize_window x1, mcp__Claude_Browser__computer x1, mcp__Claude_Browser__tabs_context x1, mcp__Claude_Browser__tabs_create x1, mcp__Claude_Browser__navigate x1, mcp__Claude_Browser__preview_start x1, mcp__ccd_session__mark_chapter x1

## What drove the design
The theme choice is where the skill did the most work. My unaided instinct for
"independent ceramics studio" was cream paper, a high-contrast serif and a
terracotta accent, which is Hallmark's Atelier or Newsprint almost exactly; the
Rotation block's mirror test ("would this combination have come out for a
neighbouring brief?") killed it, because that same system would come out for a
Copenhagen leather workshop or a Provençal soap maker without changing a token.
Riso replaced it: the theme-axes table let me check that mid pink stock, a
grotesk-heavy display and a cool spot ink is a coordinate nothing else in the
craft register occupies, and the material argument turned out to be specific to
this brief rather than decorative (blush stock reads as unfired clay, the blue
spot ink as azulejo glaze, and a studio that prints its own workshop posters is
a plausible reason for the whole register). The eyebrow ban (gate 54) and
`section-entry.md` changed the page's spine: I had planned small-caps labels
over each section heading and a hand-typed "01 / 02 / 03" on the product list,
and instead the sections are separated only by a change of paper, the ware is a
real `<ol>` with `counter()` drawing the plate numbers, and one drop cap does
the work the labels were going to do. The image-need table in
`hero-enrichment.md` fired on the "product catalogue" row, which says real
product photos, placeholder until the user provides; since no network images
are allowed here, that resolved into a hand-built SVG of vessel *profiles*
(a printer's plate sheet, honestly drawn) plus one labelled "photographs of the
current run: to come" line, rather than the fake product tiles I would otherwise
have grid-ed out. The no-invented-metrics rule removed prices, dimensions, group
sizes and dates from the layout, so the workshop block became a `<dl>` with two
real facts and three visibly italicised "to confirm" values instead of a pricing
card. `finish.md`'s one-filled-primary rule demoted the workshop CTA from a
second solid button to an outlined one. Sloplint caught a real defect I would
have shipped: the accent-blue button on pink stock measured 3.82:1, fixed with a
dedicated `--color-accent-deep` fill and an `--color-accent-ink` knockout.

## Friction
- The Browser pane refused `file://` access to my own output ("the user declined access"), so desktop and mobile were verified mechanically via sloplint and arithmetic rather than by eye; sloplint's `--render` tier was also unavailable (no puppeteer-core).
- Before that, the shared Browser pane's active tab was another eval cell's page (`inspo-only/m3-fintech`), which I screenshotted once before realising it was not mine; different brief, so no cross-contamination on this cell, but worth recording.
- SKILL.md mandates emitting `tokens.css` at the project root on every build, while SPEC.md rule 1 mandates one self-contained `index.html` with inline CSS. Resolved by inlining the tokens in the page and emitting `tokens.css` beside it as an unreferenced portable copy.
- Sloplint gate 25 (measure 45-75ch) fires on the studio marginalia, which is deliberately a 32ch outer-margin column per `layout-and-space.md` § Asymmetry techniques. Dismissed on the record in `.hallmark/log.json` rather than "fixed" into a normal paragraph.
- The Riso spec asks for one IntersectionObserver section-reveal, but `hero-discipline.md` bans scroll-fade-everything and the anti-pattern list flags animate-on-scroll; I cut the scroll reveals entirely and kept only the single hero settle.
