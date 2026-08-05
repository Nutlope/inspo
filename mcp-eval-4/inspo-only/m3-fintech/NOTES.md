# inspo-only / m3-fintech

## Timing
start: 1785927181
end:   1785927677

## Tool calls
total: 45
inspo: 3
breakdown: Read x4, ToolSearch x1, Write x2, Edit x10, Bash x13, mcp__inspo__recommend x1, mcp__inspo__search_screens x1, mcp__inspo__get_design_system x1, mcp__Claude_Browser__preview_start x1, mcp__Claude_Browser__navigate x1, mcp__Claude_Browser__resize_window x1, mcp__Claude_Browser__computer x1, mcp__Claude_Browser__tabs_create x1

## What drove the design
`recommend` measured the genre at light paper (50%), grotesk-sans display (79%) and cool accent (50%), and picked Feature Stack. I took the paper and the structure with the grain and went hard against the display axis: a light-weight roman serif for the display face, because the audience is designers and writers and the 79% grotesk consensus is exactly what makes every fintech page look like the last one. That was not my prior; before the evidence packet I had assumed a warm serif was a risk in a money product, and `search_screens` on `industry: fintech, paperBand: light` settled it by showing Public.com doing precisely that move and reading as the most trustworthy page in the set. The second and larger change came from the same search: five of six fintech exemplars used a phone mockup as the hero visual, and Wise's autopsy called out its live currency converter replacing the illustration as the page's signature. I had planned a stylised phone; I built an interactive set-aside ledger instead, where the rate segmented control actually recomputes the split, which turns the product's one mechanic into the hero rather than describing it. `get_design_system` on public-com supplied concrete values I adopted: display weight 300, near-zero border radius (0 and 6px), a 4px base step, and a roughly 4:1 display-to-body jump. Palette is my own: warm off-white paper in the light band but off the cold white Coinbase and Stash default to, a terracotta accent against the cool consensus, and a deep green reserved strictly as a data colour for money that is not yours. The brief's no-invented-metrics rule steered the structure too, replacing the logo cloud and stat strip that every exemplar carries with a mechanism diagram, an explicitly labelled illustrative year chart, and an FAQ that answers what a freelancer is actually afraid of.

## Friction
- The Browser preview pane returned other eval arms' pages under my own file URL twice, once as a stale snapshot and once as a different brief entirely; I stopped trusting it and drove Playwright from the worker's node_modules instead.
- The shared scratchpad directory was also being written to by a concurrent arm, so my `full.png` came back as another arm's page until I moved output into a uniquely named subfolder.
- `recommend`'s five exemplars for this brief skewed to dark developer-tool SaaS (Superlist, Huly, Featurebase) and were close to useless for a savings product; the fintech-filtered `search_screens` call was where the real evidence was.
- The global no-em-dash rule collided with prose I had already written; the mechanical replacement produced comma splices that needed a second pass to repunctuate.
