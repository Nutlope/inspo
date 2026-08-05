# inspo-only / m1-meditation

## Timing
start: 1785927171
end:   1785927874

## Tool calls
total: 56
inspo: 4
breakdown: Read x1, ToolSearch x1, Bash x3, mcp__inspo__recommend x1, mcp__inspo__search_screens x1, mcp__inspo__find_examples_for_macrostructure x2, Write x2, Edit x5, mcp__Claude_Browser__resize_window x4, mcp__Claude_Browser__computer x16, mcp__Claude_Browser__tabs_select x1, mcp__Claude_Browser__navigate x2, mcp__Claude_Browser__javascript_tool x17

## What drove the design
`recommend` picked Bento Grid and returned a shortlist skewed to dark
SaaS dev-tools (Hex, Vimcal, Novu), which told me the brief's literal
wording was pulling the wrong genre; I ran a second `search_screens`
scoped to `industry: health` and that call did the real work. It
returned the actual Headspace capture, whose autopsy describes exactly
the thing Tenor is positioned against: pastel blobs, rounded pill
cards, a geometric sans, a blue CTA, and a bento grid. That single
result flipped my macrostructure decision - I had been ready to accept
Bento Grid, and I dropped it precisely because the incumbent competitor
already owns it. The same search returned psyche.co, whitecube and
mooala, all warm mid-paper editorial pages with roman-serif display and
no coloured buttons, which is where the palette (#E8E1D3 paper,
terracotta #B33F19, deep olive ink) and the Instrument Serif display
face came from; the `evidence` packet said grotesk-sans is the
category's gravity at 58%, so choosing a serif was a deliberate
position against it rather than an accident. The hero visual is the one
decision the archive did not touch: every exemplar leans on a floating
UI screenshot, and since I could not fetch remote images I drew a
"session score" in inline SVG instead - a pace line over ten minutes
with footfall ticks and four phase bands - which turned out to carry
the walking premise better than a phone mock would have. Structure is a
hybrid the archive's thin macrostructure coverage forced me to
assemble myself: marquee hero, dark manifesto band, a four-movement
narrative workflow, a catalogue-style session index, an editorial
method spread, and an objections grid aimed at people who already quit
Calm. I invented no numbers: the only figures on the page are session
lengths and minute markers, which are product structure rather than
metrics, and there are no testimonials, logos or prices.

## Friction
- `recommend`'s macrostructure pick was genre-blind for this brief; it matched on SaaS-landing-page vocabulary rather than on wellness, and its palette suggestion (Hex's gold/indigo) was unusable.
- `find_examples_for_macrostructure` for both `manifesto` (4 sites) and `narrative-workflow` (1 site) returned thin coverage, so neither could ground a page shape - the useful exemplars all came from the plain industry-filtered search.
- The Browser preview pane would only paint the top viewport; every screenshot of scrolled content came back blank paper. Worked around it by hiding preceding sections with JS so each section rendered at scroll 0.
- The archive's exemplar images cannot be used in the deliverable (no remote assets allowed), so all imagery had to be reasoned into CSS/SVG from the autopsies rather than referenced.
