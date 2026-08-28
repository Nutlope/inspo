# hallmark-only / m4-ceramics

## Timing
start: 1786029000
end:   1786029721

## Tool calls
total: 70
inspo: 0
breakdown: Read x15, Edit x23, mcp__Claude_Browser__* x20 (javascript_tool x7, screenshot x5, resize_window x3, computer scroll x3, preview_start x1, navigate x1), Bash x8, Write x3, Agent x1

## What drove the design

The brief is a ceramics studio, so the page I would have written without the skill is the one everybody writes: terracotta and oatmeal on linen-white paper, a big serif, photographs of hands on a wheel. Hallmark's Step 2.6 derivation ritual killed that in two moves. R.1 made me reject not just the category default but the second-order "tasteful" fallback (bone paper, high-contrast serif, hairlines everywhere), and R.2's spent-defaults table named my own rendition prior out loud: warm bookish briefs come out of me cream, serif and lamplit whatever the draw said. That is exactly where I was heading. R.3 then forced seven concrete artifacts from the studio's own world rather than seven moods, and R.4's `seed.mjs` draw, not my taste, picked entry 1: the kiln log book. That single decision produced the whole page: a continuous ruled sheet behind every section, tabular mono fields, a hero built around the firing curve rather than a product shot, and sections entered from a margin rail of process metadata. The second decision the skill changed was colour. My derived triple came out light paper / grotesk-sans / cool ~262, which the rejection table in `theme-axes.md` showed is Cobalt's exact coordinate; rather than move the accent (cobalt oxide is a real ceramics material and the argument for the palette) I moved the display class to slab-serif, which the log book wanted anyway. Gate 54 also changed a structural decision: my first instinct was a log-entry line above each heading (`CONE 9 · REDUCTION`), which is an eyebrow with a costume on, so the metadata went into a left margin rail beside the body instead, after the heading in DOM order. Everything else the skill supplied was hygiene rather than direction: sloplint caught six Floor gate-48 oklch literals I had improvised into the dark band, a failing hover contrast, an undefined accent-ink token, and two filled primary buttons, all fixed. The fresh-context reviewer caught a contract line that no longer described the shipped headline and two nav links pointing at the same anchor.

## Friction
- The eval's "one self-contained index.html, no local asset files" rule contradicts Hallmark's "always emit tokens.css"; I wrote tokens.css alongside as a record and kept the page fully inlined.
- Rule 5 (invent no numbers) fought the log-book direction, which is made of numbers. I kept only physical craft constants (cone 06, cone 9, roughly 1000 °C and 1280 °C) and replaced every studio-specific figure (dimensions, prices, capacities, group size, kiln volume, dates) with a labelled "to confirm" field.
- The preview pane renders file:// pages outside the project as static snapshots: scrolled screenshots came back blank, so everything below the fold was verified by measuring boxes with `javascript_tool` rather than by eye.
- `sloplint --render` is unavailable here (puppeteer-core not installed), so the render-tier gates ran as static checks only.
- One `javascript_tool` call silently executed against another eval arm's tab because no `tabId` was passed; caught it and pinned the tab thereafter. Nothing was written to that arm.
