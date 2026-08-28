# hallmark-only / m3-fintech

## Timing
start: 1786028993
end:   1786029557

## Tool calls
total: 47
inspo: 0
breakdown: Read x17, Edit x18, Bash x7, Write x4, Agent x1

## What drove the design

Inferred from the brief: audience = self-employed designers, writers and contractors; use = start setting money aside; tone = editorial. Left to myself I would have built the fintech reflex, a navy-and-emerald trust palette with a dashboard card in the hero, and after dodging that I would have landed on the second reflex, monochrome Swiss restraint with a tight grotesk. Step 2.6's derivation ritual is what stopped both: it made me write the rejection down, then made an outside script pick from a seven-entry slate of things this audience already knows rather than letting me choose. The draw landed on 5/7, the seed-packet rack, and that decision cascaded into everything visible: flat two-colour print (a pine field with a carmine overprint on stone paper), a slab display face, and the page shaped as a packet front with the sowing information on the reverse. Both dealt wildcards, a letterpress playbill and Vignelli transit wayfinding, lost on product clarity and were discarded. The rejection table in `theme-axes.md` then changed a decision I had already made: my first palette was light paper / slab-serif / warm brick, which is Newsprint's exact triple, so the accent moved to a carmine rose at ~355 and the large colour was handed to a declared field role instead of the accent. Gate 54 killed the section labels I would otherwise have set above each heading, and `section-entry.md` replaced them with one repeated move, a change of paper, plus a real `<ol>` with `counter()` for the three steps, which also removed the three-column feature grid I had half-sketched. The "invent no metrics" rule (gate 46a and the eval's own rule 5) is why the hero visual is a schematic year band captioned as such rather than a balance chart, and why the proof sections are refusals and mechanics instead of numbers. The fresh-context finish review the skill mandates at Step 7 caught a real rendering bug I had shipped blind: percentage-height bars inside a grid with `align-items: end` collapse to hairlines, so the signature move was printing without its illustration.

## Friction

- No render available: puppeteer-core is not installed, so sloplint's `--render` tier and gates 23/34/44b could only be checked by arithmetic and by code reading, not by looking at the page.
- SKILL.md § 6 requires `tokens.css` at the project root; SPEC rule 1 requires one self-contained `index.html` with no local asset files. Resolved by inlining the token block in the page and writing `tokens.css` beside it as an unreferenced record, noted at the top of that file.
- `direction.md` R.2 warns that Claude renders any paper-lineage direction as cream + serif + lamplight amber; the drawn direction was a paper good, so the warning and the draw pulled against each other. Handled by giving the page's large colour to a saturated pine field rather than to the paper.
- The closing CTA has no destination to point at (the brief supplies no product URL), so it is a `<button>` with no handler rather than a self-anchoring link. Honest, but inert.
