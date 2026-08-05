# both / m2-devtool

## Timing
start: 1785927241
end:   1785927905

## Tool calls
total: 63
inspo: 2
breakdown: Read x18, Bash x8, javascript_tool x9, computer(screenshot/scroll) x7, resize_window x4, Edit x4, navigate x3, Write x3, mcp__inspo__recommend x1, mcp__inspo__find_examples_for_macrostructure x1, preview_start x2, tabs_context x1, tabs_select x1, ToolSearch x1

## What drove the design

Inferred context, disclosed as the skill requires: audience = platform engineers who own the pipeline but did not write the code that broke it; use = connect one pipeline; tone = utilitarian-technical. The archive was detected as Hallmark's pre-flight signal 8, so the run went custom-derived (route 0.5) with no catalog theme, and the two rejection tables both bound.

**Where the archive and the skill actually met, decision by decision.**

1. *Display class - the archive won outright, and it changed a real decision.* Hallmark's `modern-minimal` genre file names Geist, Inter Tight and Space Grotesk and describes a "confident sans display"; left to the skill I would have shipped a grotesk, which is also where my own reflex sat. `recommend` measured 24 sites and returned grotesk-sans at 0.79, the only axis with a real consensus under the opposition rule's threshold (top band >= 0.5 and leading by >= 0.15). The opposition rule then forced the one thing the genre file was pointing at to be the thing I had to refuse. The display went to a slab (Zilla Slab, 0.04 of the archive's display share). That is the single largest change any tool made to this page, and neither aid would have produced it alone: the skill supplied the obligation, the archive supplied the target.

2. *Paper band and accent hue - the archive explicitly freed a decision the skill would have constrained.* Hallmark's R.2 spent table says the tech/developer family has worn out "near-black surface, one neon accent, mono labels", which reads as a ban on dark and a nudge toward something else without saying where. The archive's measured spread was flat on both axes (paper mid 0.38 / light 0.33 / dark 0.29; accent chromatic-other 0.46 / cool 0.42 / warm 0.13), so under the opposition rule neither axis has a default to refuse, and I recorded `no consensus` rather than manufacturing an opposition. The light buff paper and the warm signal red came from the scene sentence (a 09:12 Tuesday, deploy freeze at noon, daylit office) rather than from either tool. Useful finding: the archive's contribution here was negative evidence, and it stopped me inventing a fake opposition on two axes.

3. *Macrostructure - the skill won, against the archive's shortlist.* `recommend` picked Bento Grid (5 of the top hits) with Split Studio and Map/Diagram behind it, and all five exemplar autopsies described the same fold: centred headline, subhead, two pill CTAs, product screenshot floating in the lower 55%. I took none of it. Two of the skill's rules did the work: gate 47 bans re-drawn browser and terminal chrome, and rule 5 of the brief bans invented content, which between them make a screenshot-led bento impossible without a real product to screenshot. Narrative Workflow was chosen instead because the brief is literally a sequence ("before you open the logs"), and its file gave the mechanism: the stage number rides inside the heading via `counter()`, which is also how the shape stays clear of gate 54's eyebrow ban.

4. *Exemplar coverage - the archive reported thin and I continued.* `find_examples_for_macrostructure("narrative-workflow")` returned coverage of 1 site with a `thin: true` flag and pointed at Feature Stack and Split Studio as better-covered neighbours. Per the degradation table I stated the number and stayed on the unconstrained path; the single exemplar (a dark violet-gradient note app) fed nothing. This is the one archive call that returned almost no usable value.

5. *Fonts - the two aids agreed and neither one picked.* The archive's `faces` list was 12 families at one site each, a flat pool with no register to read off, so § C's "role-matched, never name-matched" rule had nothing to match against. Zilla Slab + IBM Plex Sans + IBM Plex Mono came from the drawn direction, not from either aid.

6. *Direction - the skill's draw, uninfluenced by the archive.* `seed.mjs` returned draw 1/7 with wildcards Filmstrip frame and Pharma sachet. Slate entry 1 was the aviation incident report; both wildcards lost on audience identification and product clarity, and Pharma sachet would additionally have walked straight back into the grotesk consensus I was obliged to oppose. Everything below the tokens comes from that draw: the two-weight rule under the masthead, the field-labelled finding sheet, the probable-cause statement set in red, the "four things it will not do" refusal block. The catalog rejection table cleared the triple at light / slab-serif / warm ~28 (nearest neighbour Newsprint, which differs on display class).

## Friction
- The Browser pane returned blank screenshots for everything below scroll 0 and timed out on `computer{action:"scroll"}`, so the batched visual inspection had to be done through `javascript_tool` geometry reads instead of by eye; only the fold was ever seen rendered.
- `preview_start` refused the `file://` URL, then hit a tab cap; a stray port collision (8791) served another arm's page and briefly looked like my own.
- Hallmark's `modern-minimal` genre file points hard at Geist/Inter-class sans display, which is exactly the axis the archive's opposition rule forced me off. The skill has no note reconciling a genre affinity with a measured consensus that contradicts it; I followed the opposition rule because it is the newer and more specific instruction, but the conflict is unstated.
- `find_examples_for_macrostructure` on a thin macrostructure costs a call and returns one row of noise; the shortlist from `recommend` had already told me Narrative Workflow was not in the archive's head.
