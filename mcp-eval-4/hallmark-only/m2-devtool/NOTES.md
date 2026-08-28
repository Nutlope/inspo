# hallmark-only / m2-devtool

## Timing
start: 1786028989
end:   1786029649

## Tool calls
total: 52
inspo: 0
breakdown: Read x13, Bash x9, Edit x8, Write x4, mcp__Claude_Browser__computer x6, mcp__Claude_Browser__javascript_tool x5, mcp__Claude_Browser__navigate x3, mcp__Claude_Browser__resize_window x2, mcp__Claude_Browser__preview_start x1, Agent x1

## What drove the design

Pre-flight found an empty directory: no design.md, no font stack, no palette, no `TOGETHER_API_KEY`, and no reference archive on the session, so signal 8 never fired and the full standalone flow ran. Genre detection put this on modern-minimal (observability, platform engineers, B2B), and left alone I would have built exactly what that genre file describes: near-white paper, a confident grotesk display, two-column hero, one blue accent, pill CTAs. Step 2.6 is what stopped that. The reflex check made me write down both the first-order default (near-black terminal, neon green) and the second-order one (the Linear-clone monochrome page), and R.2 then declared "near-black surface, one neon accent, mono labels" already spent for this brief family, which closed off the fallback too. The slate of seven had to be concrete objects from a platform engineer's world across three material families, and `seed.mjs` drew entry 4 rather than letting me pick: **the seismograph drum chart**. That single draw decided the page. The hero visual went from "no enrichment, typography only" (my instinct for a dev tool) to a hand-built SVG recorder trace with one excursion boxed and annotated, because the drawn world made "a failure is an event located in time" the literal argument of the page; the section notation became a hairline with one blip repeated down the page rather than the change-of-paper bands I would otherwise have alternated; and the display face moved from a grotesk to a slab (Bitter) because § D's rejection table showed light-paper + grotesk + cool is Cobalt's exact coordinate and light + slab is occupied only by warm Newsprint. Colour posture went to **committed** so the dark instrument field could carry roughly a third of the surface as a surface token rather than as accent sprawl, which gate 23 would otherwise have failed. Two smaller steps changed shipped copy: gate 46a caught a line I had written reflexively ("Half of all pipeline breaks are environmental") and it was rewritten as a qualitative claim, and the same rule is why the break notice and the trace both carry captions saying the values are illustrative rather than recorded. The finish review in fresh context caught two things I had gone blind to: inline `oklch()` in SVG presentation attributes (gate 48, fixed by moving all SVG paint into CSS classes reading the tokens) and four footer links pointing at the same dead anchor, now cut to three real in-page destinations plus the CTA.

## Friction

- SKILL.md § 6 requires emitting `tokens.css` at the project root and importing it; the eval's deliverable rule 1 requires one self-contained `index.html` with no local asset files. Resolved by inlining the tokens in the page and writing `tokens.css` alongside it, unimported, with the conflict noted in its header.
- The Browser preview renders files outside the project folder as static snapshots: `computer scroll` timed out twice and screenshots after a JS scroll came back stale, so everything below the fold was verified mechanically (measured geometry, overflow and wrap checks in the page) rather than by eye.
- A `navigate` call without an explicit `tabId` landed on another eval arm's page in a shared browser tab, which cost a round trip to notice.
- The Step 1 design-context gate and the direction ritual both want a written answer from the user; running unattended, both were inferred and disclosed, which is the documented opt-out path but means the vibe line feeding the slate was self-supplied.
