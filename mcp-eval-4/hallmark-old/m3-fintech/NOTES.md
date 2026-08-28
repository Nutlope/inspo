# hallmark-only / m3-fintech

## Timing
start: 1785927218
end:   1785927725

## Tool calls
total: 48
inspo: 0
breakdown: Read x18, Edit x14, Bash x7, Write x4, mcp__Claude_Browser__resize_window x1, mcp__Claude_Browser__navigate x1, mcp__Claude_Browser__tabs_context x1, mcp__Claude_Browser__tabs_create x1, mcp__Claude_Browser__preview_start x1

## What drove the design

Pre-flight found an empty directory: no fonts, no palette, no motion library, no
framework, and (recorded as absent) no reference archive, so signal 8 never fired
and the theme route stayed catalog rather than custom-derived. The skill's Step 1
inference disclosure is what pushed me off my first instinct: writing down
"audience = self-employed designers and writers, tone = warm, plain, concrete"
made the cool-blue fintech palette I would otherwise have reached for look wrong
in one line, and I routed to the Field theme (warm cream, warm ink, a single
marigold highlighter) instead of the Cobalt/Ledger register the category expects.
The mirror test then changed the structure: a neighbouring brief (an invoicing
tool) would have got the same hero-plus-three-feature-cards page, so the middle of
the page became things that only this product can say - a real `<ol>` for the
three-step mechanic, a tinted band arguing that a fixed monthly transfer assumes a
fixed month, a "things Even does not do" list, and a rate section that refuses to
guess a number. Gate 54 (no eyebrows, ever) is the single rule that most changed
the markup: my default section openings were all small-caps labels, and replacing
them with one repeated full-bleed hairline plus one change of paper is what makes
the page read as set rather than assembled. Gate 46a plus the brief's rule 5
killed the illustration I first sketched, an example invoice with an amount on it;
the drawn artifact now carries labels only ("Invoice paid", "Yours to spend",
"Set aside for tax") and the income figure has bars with no figures and a caption
saying it is an illustration. The Field theme file dictated three concrete things
I would not have done unprompted: the primary button is ink-filled rather than
accent-filled, the marigold appears exactly once as a highlighter behind the
x-height of one phrase, and every shadow is warm-tinted at hue 70. The contrast
gates (40-41) caught two real bugs during the sweep: the muted ink at 57% L was
only 3.2:1 on cream and the accent-coloured step numerals were 1.8:1, both fixed
by darkening tokens rather than by moving colour around. Gate 44b caught a third:
the hero lede ran six lines at 1280x800, and shortening it to two is a copy fix
the fold check forced.

## Friction

- No render tier: puppeteer-core is not installed for `sloplint --render`, the Browser pane had hit its tab cap (the other arms hold nine tabs) and direct file navigation was refused, so gates 34, 44b, 49 and the 320-768px sweep were verified from code by the skill's stated no-render path instead of by eye.
- Hallmark requires emitting `tokens.css`; the brief requires one self-contained `index.html`. Resolved by inlining the tokens in the page and shipping `tokens.css` alongside as the portable copy the page does not import.
- The first waiver line I wrote was rejected by sloplint as malformed (it wants a numeric gate id); since no font gate had actually fired, the honest fix was to delete the waiver and record the deliberate display-face choice in the stamp instead.
- `typography.md` lists Source Serif among banned-by-reflex serifs while the Field theme names Source Serif 4 as its display face. Followed the theme, per the skill's rule that a theme's named faces win.
- Genre routing is ambiguous for this brief: a tax tool for freelancers is neither "SaaS/B2B" nor "fun/consumer". Went playful (its warm-serious end, which is where Field lives) and said so in the stamp.
