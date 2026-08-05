# both / m5-producttour

## Timing
start: 1785927260
end:   1785928033

## Tool calls
total: 65
inspo: 2
breakdown: Read x20, Bash x12, Edit x5, Write x2, ToolSearch x1,
mcp__inspo__recommend x1, mcp__inspo__find_examples_for_macrostructure x1,
Browser javascript_tool x7, Browser screenshot x6, Browser resize_window x4,
Browser navigate x3, Browser preview_start x1, Browser computer(scroll) x1,
Bash(sloplint) counted inside Bash x12

## What drove the design

The archive and the skill interacted at four decisions, and the archive won two
of them outright. **First, the display face.** The skill's genre file for
modern-minimal wants a Geist/Inter-class sans display and says so plainly; I had
started toward exactly that. `recommend` measured 24 feature pages at
grotesk-sans 0.88, and Hallmark's own opposition rule (reference-archive.md)
requires going against a real consensus on at least one axis. 0.88 is the
strongest number in the packet, so the opposed axis had to be display class, and
the page ships a slab serif (Zilla Slab) over IBM Plex Sans. The genre file lost
to a measurement. **Second, the paper band.** The instinct for a video editor is
a dark UI, and I intended dark before the packet arrived. The archive measured
light at 0.63; the draw then landed on "the camera report sheet", which is
literally paper, so I kept the light band and went with the archive there and
said so in the stamp. Reversed by evidence plus the draw, not by taste. **Third,
the accent.** The packet reported chromatic-other at 0.46 with anchors
`#0f71fa · #12a0ac · #584ab6 · #0830f4 · #0444fc`, i.e. the category is
overwhelmingly blue in practice. 0.46 is below the skill's own consensus floor
(>= 0.5, lead >= 0.15), so the rule says that axis is neither kept nor opposed;
I derived a report red ~28 from the direction instead of positioning against
blue. The skill's threshold stopped me over-reading the archive's own numbers.
**Fourth, the macrostructure, where the skill won.** The archive's shortlist put
Feature Stack first with 9 hits and 13 exemplars; Narrative Workflow had
`coverage: thin, sites: 1`. The brief is a step-by-step tour, which is what
Narrative Workflow is for, and reference-archive.md is explicit that a shortlist
entry taken because it ranked first is a default wearing evidence. I took the
thin shape and reported the count. Everything else was the skill alone: the
numbered `<ol>` with `counter()` as the section opening (its eyebrow ban left
few honest ways to number five steps), the fold-fit rule that sized the display
clamp at 3.4rem, and gate 47's ban on re-drawn browser chrome, which is what
turned "screenshots carrying the argument" into six labelled CSS/SVG diagrams
that say in their own captions that they are diagrams.

Inferences disclosed, since I was told to proceed unattended: audience = people
who cut video and are deciding whether this app fits their hands; use = start the
tour and read to the end; tone = technical.

## Friction
- Gate 47 (no re-drawn UI chrome, use real screenshots) versus a brief whose
  whole argument is screenshots, versus SPEC rule 3 (no remote images). Nothing
  in the skill resolves that trio; I resolved it by shipping diagrams that
  declare themselves as diagrams in the figcaption and the footer.
- SKILL.md Step 6 mandates emitting `tokens.css` at the project root on every
  build; SPEC rule 1 mandates one self-contained `index.html` and the harness
  forbids writing outside the brief directory. Tokens are inlined in `:root`
  instead, and `tokens.css` was not written.
- Genre detection fires twice on this brief: "video" routes atmospheric, "app /
  product tour" routes modern-minimal. The skill says ask an either/or; running
  unattended I broke the tie on the page's procedural job and took
  modern-minimal, then immediately deviated from that genre's type advice for
  the reason above.
- `find_examples_for_macrostructure("narrative-workflow")` returned one site,
  and that site (a dark violet note-taking app) had nothing to teach a paper-form
  page. The call cost a round trip and changed nothing except a number in the
  notes.
- Two `recommend` reference exemplars are tagged `"mode": "light"` while their
  own `axes` string says `dark`, so the tagged field is not usable; the measured
  `paperBand` in the evidence packet is.
- The browser pane went blank after the first screenshot and never recovered, so
  four of the six verification screenshots returned empty paper. Verification
  below the fold and at 320/375/768 had to be done mechanically through JS
  measurement instead of by eye.
