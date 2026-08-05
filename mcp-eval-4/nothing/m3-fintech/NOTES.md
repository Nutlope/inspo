# nothing / m3-fintech

## Timing
start: 1785927157
end:   1785927912

## Tool calls
total: 64
inspo: 0
breakdown: Read x15, Bash x14, Edit x14, mcp__Claude_Browser__computer x9, mcp__Claude_Browser__javascript_tool x5, Write x2, mcp__Claude_Browser__navigate x2, mcp__Claude_Browser__resize_window x2, mcp__Claude_Browser__tabs_select x1

## What drove the design
The brief's one real idea is that freelance income is jagged and the tax
deadline is not, so I made that contrast the spine of the page rather
than a feature list: the headline states it in two lines, and section 01
is a twelve-month bar chart where each bar carries its reserved share at
the base and a dashed line marks the average month. That chart is the
only "hero visual" the argument actually needs, so the hero itself got a
product panel instead: a reserve balance, three paid invoices with the
amount held back from each, and a spendable total at the foot, which
shows the mechanic in one glance. Rule 5 shaped a lot of the copy: with
no metrics, testimonials or logos available, I dropped the usual social
proof band entirely and replaced it with a "built for the awkward parts"
grid about late payers, the one enormous month, non-monthly deadlines
and multiple reserves, all of which are product logic rather than
claims. Every figure on the page is illustrative and is labelled that
way (a "Sample view" tag on both panels, "Illustrative shape, not data
from any account" under the chart, and a footer line), which felt like
the honest reading of that rule rather than stripping numbers out of a
banking UI where they are the whole point. Typography is two faces only:
Instrument Serif for display, because a high-contrast serif reads as
"my money is being taken seriously" without the cold blue-gradient
fintech default, and Inter Tight with tabular figures for everything
numeric. The palette is warm ledger paper, near-black ink, a single
reserve green that always and only means "held back", and a clay accent
used exactly once for the average line, so colour carries meaning
instead of decoration. No tool or skill influenced any of this; the only
tools I used were a browser and headless Chrome to look at what I had
built. Three changes came out of looking rather than thinking: the
display size dropped from 66px to 62px because the headline was breaking
"lumpy." onto its own line, a three-item base row was added under the
hero because the fold was bottom-heavy with dead space, and two section
heads were split into heading-left / standfirst-right because five
identical left-stacked heads left the right half of the page hollow.

## Friction
- The Browser pane went to visibilityState "hidden" after a scroll call timed out, so every screenshot after that returned a blank surface even though the DOM was fine; I fell back to Playwright via headless Chrome.
- The shared scratchpad is being written by the other arms concurrently, so my first full-page render was overwritten between the screenshot and the crop; I moved to a private subdirectory.
- headless Chrome with --window-size taller than the viewport produced a transparent (black when flattened) image below the fold, which sent me down a dead end before switching to Playwright.
- The global no-em-dash rule bit inside CSS comments, not prose; caught it on a final grep.
