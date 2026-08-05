# hallmark-only / m5-producttour

## Timing
start: 1785927225
end:   1785927877

## Tool calls
total: 58
inspo: 0
breakdown: Read x26 (19 skill/spec docs, 6 screenshots, 1 partial re-read), Bash x16, Edit x7, Write x4, mcp__Claude_Browser__resize_window x1, mcp__Claude_Browser__navigate x1, mcp__Claude_Browser__tabs_context x1, mcp__Claude_Browser__tabs_create x1, mcp__inspo__* x0

## What drove the design

Inferences, disclosed as the skill requires: audience = editors and video makers sizing up a new editor, use = start the tour and then get the app, tone = technical (cool, nocturnal). Pre-flight found an empty directory: no fonts, no palette, no framework, and no reference archive on the session, so signal 8 was absent and the build took the catalog route rather than custom-derived. The skill's genre detection is what put this page in the dark: "video" routes to **atmospheric**, and I would otherwise have built a light modern-minimal SaaS page, because "product tour" reads as SaaS first. From atmospheric I took **Midnight** (cool azure on midnight blue, Geist 300 display, Geist Mono label voice), which then decided that timecode-ish labels, the one cool glow, and fade-only motion were the vocabulary. The biggest single change came from **gate 47 plus deliverable rule 3**: the brief says screenshots should carry the argument, the skill forbids re-drawn browser, device, or IDE chrome, and the spec forbids image files. My default would have been mocked app windows with a title bar; instead every stage carries a hand-built CSS/SVG **schematic with a `<figcaption>` that names it as a diagram**, and the hero caption says outright that nothing on the page is a capture. The macrostructure moved for a related reason: **Workbench** is the catalogue's literal "guided tour of the app in use" and I picked it first, then dropped it because it is built around real screenshot frames I cannot supply; **Narrative Workflow** carries the same argument through numbered stages, and its rule that the stage number rides inside the heading (with `<ol>` + `counter()`) is what kept `01 · THE TOUR` style eyebrows off the page, which is where I would have started. Gate 42/43 pushed the chrome off its defaults: the nav became a chapter rail that tracks the stage you are reading, and the footer a single statement line plus one mono colophon row, instead of wordmark-links-CTA and four link columns. The **Ledge** hero posture (tall void, content resting at the base, inverted padding) was chosen against the neutral Settled default because it puts the timeline schematic on the fold's bottom edge, which is where a video app's timeline actually lives; and finish.md's one-filled-primary rule turned the closing CTA from a second blue button into a typographic link with an underline that draws.

## Friction

- The skill demands `tokens.css` at the project root, imported by the page CSS; the spec demands one self-contained `index.html` with no build step. Resolved in the spec's favour: values are inlined in the page, and `tokens.css` ships alongside as the portable record, unimported.
- The brief asks for screenshots to carry the argument while the deliverable rules forbid remote images and local asset files, so no honest screenshot was possible at all. Diagrams plus explicit captions were the only route that did not fabricate a UI capture.
- Genre detection fired twice ("video" to atmospheric, "product tour" to modern-minimal); the skill says ask one either/or, which an unattended run cannot do. Picked atmospheric on the stronger signal and recorded it.
- The browser pane could not open this file (other arms held every tab and the tab cap was reached), so verification ran through headless Chrome instead. Old headless clamps the window to a 500 px minimum, so 320 and 375 px had to be checked by rendering the page inside fixed-width iframes.
- `sloplint --render` was unavailable (puppeteer-core not installed), so gates 23, 34 and 44 were confirmed from rendered screenshots and a scrollWidth probe rather than by the script's render tier.
