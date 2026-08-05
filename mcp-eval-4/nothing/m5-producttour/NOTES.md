# nothing / m5-producttour

## Timing
start: 1785927195
end:   1785927917

## Tool calls
total: 55
inspo: 0
breakdown: Read x11, Write x2, Edit x20, Bash x17, mcp__Claude_Browser__navigate x2, mcp__Claude_Browser__resize_window x1, mcp__Claude_Browser__computer x1, mcp__Claude_Browser__tabs_create x1

## What drove the design
The brief says the screenshots carry the argument, so the first decision was
that every section had to contain a real interface, not an icon or an
illustration of one: a media bin, a transcript editor, a five-lane timeline, a
colour room with a before/after divider, and an export panel. Everything else
followed from that. Because no remote images are allowed, each "screenshot" is
CSS plus inline SVG, which pushed me to a dark editor UI where flat panels,
hairline borders and monospace timecode do most of the work and no photography
is needed; the one place a photograph was unavoidable, the viewer, I built as a
layered harbour sunset (gradient sky, SVG skyline and dock silhouette, a sun
disc with a water glint) after a first pass rendered as an orange sphere on a
purple field that read as a beach ball rather than footage. The same scene block
is reused inside the colour step with two CSS filters, desaturated on the left
of the divider and graded on the right, so the before/after is literally the
same frame. Copy is written as instructions rather than claims, and since the
brief forbids invented numbers there are no metrics anywhere: the only figures
on the page are UI state inside the mocks (timecode, clip durations,
resolution), and pricing is an explicit "plan & price TBC" placeholder. I added
a "What the tour left out" section - not a compositor, no live collaboration,
transcripts need a human pass, no mobile editor - because an honest tour is the
strongest thing a page like this can do without data. Type is one condensed
grotesque for headlines, Inter for prose, and JetBrains Mono for every label
that belongs to the software, which keeps chrome and page voice distinguishable.
No archive and no design skill were consulted, so every judgement here is mine;
the hero was composed directly against the 1280x800 rule and lands with the
whole editor window at 673px.

## Friction
The shared browser pane was occupied by other arms' pages and would not
navigate to my file (tab cap reached), so I screenshotted with the repo's local
Playwright instead.
A scroll-driven reveal (`animation-timeline: view()`) rendered every step visual
at opacity 0 in a full-page capture; removed it rather than ship a page that can
screenshot blank.
Alternating the step rows with `nth-child` counted the section header as a row,
and swapping order alone kept the narrow column narrow, so step 02's mock was
squeezed to a third of its width until I swapped the column widths too.
`.plain div` matched both the row and its inner wrapper, turning four headlines
into one-word-per-line columns; fixed with a child combinator.
Flex clips with nowrap labels forced 49px of horizontal overflow at 390px until
min-width:0 was applied inside the app mocks.
