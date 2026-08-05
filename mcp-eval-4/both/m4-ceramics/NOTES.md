# both / m4-ceramics

## Timing
start: 1785927255
end:   1785927894

## Tool calls
total: 57
inspo: 2
breakdown: Read x25 (16 skill/spec files, 9 render screenshots), Bash x17, Write x4, Edit x5, ToolSearch x1, mcp__inspo__recommend x1, mcp__inspo__find_examples_for_macrostructure x1, preview_start x2 (both failed), tabs_context x1

Step 1 inferences, disclosed as the skill requires: audience = people who buy one considered object and keep it, and people looking for a weekend class in Lisbon; use = see the current batch and book a weekend at the wheel; tone = austere-editorial. Genre: editorial (silent default). Pre-flight found an empty directory, no design.md, no font stack, no palette, no framework, and signal 8 firing from the connected Inspo toolset, so every build on this session routes custom-derived (Step 2.6 route 0.5). No Step 1 question was asked; SPEC.md was treated as "go ahead".

## What drove the design

The archive and the skill interacted at five specific points, and the archive lost three of them, won one, and changed one decision outright.

**1. Structure. Archive proposed, skill overruled.** `recommend` returned Split Studio as the pick (8 of the top hits) with Marquee Hero and Type Specimen behind it. I rejected all three. The archive's hybrid search matched on the words "studio" and "small-batch" and handed back design agencies (Geex, FURO, 14islands, Portal One), not object sellers, so the shortlist was measuring the wrong category. The skill's rule that a shortlist entry chosen because it ranked first is "a default wearing evidence" is exactly the guard that mattered here. I took Catalogue instead: this brief is an inventory of objects plus a weekend schedule, and a diptych would have made the studio the subject rather than the pots.

**2. The reflex check. Archive won outright, and it changed the palette.** This is the one place the archive did work no guess could have done. R.1 normally asks the model to guess the category default; the packet measured 24 rows at mid paper 0.50, grotesk-sans display 0.71, chromatic-other accent 0.42. Two of those clear the skill's consensus threshold (top band >= 0.50 and leading the second by >= 0.15); the accent axis is flat and I marked it `no consensus`, which the opposition rule says neither satisfies nor violates. I opposed both live axes: dark paper against a measured mid, condensed display against a measured grotesk. Without the measurement I would have guessed the ceramics default as "cream paper, roman serif, terracotta" and opposed *that* instead, which is a different and softer opposition, and the page would very likely have come out light. The dark glazed field is the archive's doing.

**3. The draw, which the archive had no say in.** `seed.mjs` landed on slate entry 6 of 7, the Lisbon municipal enamel timetable board, and dealt Line-printer output and Seed packet as wildcards. Both were discarded on the skill's two-axis weigh-in: Line-printer loses on audience identification (a person buying one good bowl does not live in batch reports) and Seed packet loses on product clarity (a seed packet promises future growth; a plate is a finished object). Enamel won on a fact the wildcards could not touch: vitreous enamel is fired glaze on steel, the same process as the product, so the page's material and the studio's material are literally the same trick. That produced the drenched posture and the signature move, every band of the page is its own fired glaze.

**4. The catalogue cell. Archive changed the decision.** `find_examples_for_macrostructure("catalogue")` reported thin coverage, one site (Emigre), which the skill says to state rather than paper over. One site was enough. The Emigre capture draws each catalogue cell as a full colour field with the name set inside it and no border at all. I had been intending bordered cards with a small glaze swatch chip. I dropped the card entirely: each piece now sits in its own glaze field, separated by a 1px rule-coloured grid gap, which also keeps the page off the top rung of the skill's surface-escalation ladder. Composition taken, compliance not.

**5. Fonts and colour values. Skill won, archive supplied register only.** The packet's `faces` pool (Instrument Serif x2, BentonSans, Petrona, PP Neue Machina) and its `anchors` (`#b42e04`, `#fa5c9a`, `#c59461`, ...) were read as bands, not values, per the may/may-not-feed table. Nothing was pasted. Display is Big Shoulders Display, chosen for the board lineage, body is Spectral. The accent was derived from the direction, a copper-reduction turquoise at ~195 degrees, which also had to clear the skill's *own* rejection table: dark plus display-condensed-bold plus warm is Manifesto's triple, so a warm accent was off the table before the archive was consulted at all. Two rejection tables, both binding, and the catalog one was the tighter constraint.

Everything else was the skill alone: the ban on eyebrows shaped how every section opens (a change of paper, repeated, plus a real `<ol>` with `counter()` for the firings); gate 46 turned the size and price rows into labelled placeholders with one line at the head of the batch explaining why; and gate 44b drove the hero down to a Stage posture that ends at roughly 680px on a 1280x800 fold.

## Friction

- The archive's category match was wrong for this brief: `recommend` on a ceramics studio returned five web-design agencies. The `evidence` block was still useful because it measures axes rather than semantics, but the exemplars and the shortlist were noise, and an arm that trusted the shortlist would have built an agency page for a pottery.
- The macrostructure I actually wanted had one exemplar in 784 sites. Coverage reporting was honest about it, but a one-row "consensus" is a single opinion.
- Direct conflict between SPEC and skill: SKILL.md Step 6 mandates a `tokens.css` at project root imported by the page CSS, and the SPEC mandates one self-contained `index.html` with no local asset files. I resolved it by emitting `tokens.css` alongside as the portable export and keeping the identical block inline in the page, with a comment saying so. The `@import` was written first and then removed.
- Chrome headless refuses to render below a 500px viewport, so the first 375px screenshot was a 500px render cropped to 375 and looked like a horizontal-overflow bug that did not exist. Verified for real by loading the page in a 375px-wide iframe inside a 520px window.
- `preview_start` could not open the file, and the browser pane was at its tab cap with other arms' pages in it, so all verification went through a local python server plus headless Chrome instead.
- Port 8791 was already bound by another arm's server, so the first screenshot returned a different brief's page entirely. Caught only because the image was obviously a video editor.
