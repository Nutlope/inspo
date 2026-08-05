# inspo-only / m2-devtool

## Timing
start: 1785927176
end:   1785927809

## Tool calls
total: 49
inspo: 3
breakdown: Read x7, Write x2, Edit x10, Bash x9, ToolSearch x1, mcp__inspo__recommend x1, mcp__inspo__search_screens x1, mcp__inspo__find_examples_for_macrostructure x1, mcp__Claude_Browser__navigate x3, mcp__Claude_Browser__computer x3, mcp__Claude_Browser__resize_window x1, mcp__Claude_Browser__tabs_context x1, mcp__Claude_Browser__tabs_create x1, mcp__Claude_Browser__tabs_select x1

## What drove the design
The `recommend` evidence packet measured 24 sites in this genre and put the
category's gravity at light paper (46%), grotesk-sans display (75%) and a
cool or otherwise chromatic accent (83% between them). The dev-tool
exemplars it returned - Render, Turborepo, Novu, Canvas, Webflow - are
almost interchangeable: white page, big grotesk headline, one purple or
blue accent, a floating dashboard mock at 55% of the fold. I took the paper
and the display class with the gravity and deliberately broke the accent
axis, which is the decision the archive actually changed. My first instinct
was a signature brand colour on the CTAs; seeing five near-identical
purple-blue pages killed it. Instead colour became strictly semantic here:
red only where something failed, green only where it passed, grey where it
was skipped, and the CTA is plain ink. That is a defensible rule for a
product whose entire subject is a red build, and it is the one axis where
the genre is most crowded. The macrostructure pick was Bento Grid; I used
it for the "what it watches" section (the reference component's irregular
2x2 lead tile went in almost unchanged) but refused it for the page shape,
because the product's argument is a sequence - failure, evidence, verdict,
route - so the spine is a narrative workflow with a real artifact rendered
beside every step. `find_examples_for_macrostructure` for `workbench`
returned zero rows and said so plainly, which told me the shape was rare
rather than wrong, so the hero is a workbench: the verdict card is the
product's actual output, stage bar and diff and all, not an abstract
dashboard. Type is Archivo against JetBrains Mono, with the mono carrying
every piece of evidence on the page, so the reader can tell a claim from a
measurement by the face it is set in.

## Friction
- `recommend` pushed the palette suggestion from Mintlify (teal and cream), which is a documentation-site register and wrong for a failure-diagnosis page; ignored it and derived the palette from the semantics instead.
- The browser preview pane is shared across concurrently running arms: three navigate calls to my own file failed or landed on another arm's page, so I switched to a local Playwright screenshot script for all verification.
- My first hero used the display size the archive's exemplars imply at full width; in a 0.9fr column it became four lines and pushed the CTA and the provider line past 800px. Cut the display clamp from 63px to 49px, which fixed it.
