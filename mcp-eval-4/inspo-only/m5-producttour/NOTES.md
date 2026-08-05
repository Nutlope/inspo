# inspo-only / m5-producttour

## Timing
start: 1785927191
end:   1785928285

## Tool calls
total: 88
inspo: 3
breakdown: Bash x39, Read x22, Claude_Browser (preview_start/navigate/resize/computer/javascript) x13, Edit x8, Write x2, mcp__inspo__recommend x1, mcp__inspo__find_examples_for_macrostructure x1, mcp__inspo__search_screens x1, ToolSearch x1

## What drove the design
My starting instinct was a dark page, because every video editor I can picture is dark chrome, and `recommend` came back measuring the features genre as 67% light paper, 79% grotesk display, accent split with no strong winner. That flipped the decision: the page became warm light paper (#F3F1EC) with the product mocks as dark objects sitting on it, which is a better argument anyway for a tour where the screenshots are supposed to carry the weight - dark figure on light ground makes each mock read as a specimen rather than as more page. `recommend` picked feature-stack; I checked `find_examples_for_macrostructure` on narrative-workflow because the brief is explicitly sequential, found only one site in the archive for it, and took the tool's own advice to use the better-covered feature-stack spine with numbered steps layered on top. The Calendly and n8n exemplars both put a real UI mock in the fold rather than an illustration, which settled the hero: a full editor window (bin, program monitor, inspector, four-track timeline) built entirely in CSS, opposite the headline. A `search_screens` pass on the creator industry turned up Diffusion Studio, the only real timeline-UI capture in the set, and its coloured clip blocks on near-black is what my timeline mocks are modelled on. Accent is an acid green (#C8EE3F) used only as playhead, selection, and render progress - the archive's accent axis had no consensus to obey, so I chose the one colour that behaves like a state indicator inside a video tool. Type is Inter Tight with JetBrains Mono for timecodes, track labels and shortcuts, which sits with the genre's grotesk gravity while the mono does the work of making the page feel like an application. Copy discipline came from the brief and rule 5: no metrics, no logos, no claims of speed, so every number on the page is a timecode, a level, or a file name inside a fictional project.

## Friction
- The Claude Browser pane and headless Chrome are shared with the other eval arms running concurrently: my tab got navigated to another arm's page mid-session, and one headless screenshot returned a completely different arm's design. Had to move to a unique port plus a fresh `--user-data-dir` per capture to trust anything.
- Headless Chrome silently wrote no file on roughly half its invocations, so every capture needed a retry loop.
- Full-page screenshots are misleading against `min-height:100svh`: a 4400px-tall window makes the hero 4400px tall, so I had to render a flattened copy to review anything below the fold.
- Inline `<span>` elements used as sliders/labels ignored height and stacking in three mocks; only caught it by rendering, not by reading the markup.
- `find_examples_for_macrostructure` on narrative-workflow returned a single site, which is honest but not enough to read a genre off (the tool says so itself).
