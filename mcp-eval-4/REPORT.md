# Eval 4 - four arms, five briefs, twenty pages

Run 2026-08-05 against Inspo at `df85c94` (measured axes, evidence
packet, coverage reporting) and the updated Hallmark at
`/Users/youssef/design-skill/skills/hallmark` (signal 8,
`reference-archive.md`, the opposition rule).

Arms: `nothing` (control) · `inspo-only` · `hallmark-only` · `both`.
Briefs: meditation app, CI observability, freelancer savings, ceramics
studio, product tour. All twenty pages built, all twenty verified.

No scoring pass: the user asked for pages, not numbers. What follows is
what is measurable plus what is visible, kept apart on purpose.

## Cost

| arm | avg tokens | avg tool calls | avg wall | avg page |
|---|---|---|---|---|
| nothing | 104,939 | 48 | 10m14s | 39 KB |
| inspo-only | 132,800 | 58 | 11m11s | 39 KB |
| hallmark-only | 167,471 | 45 | 9m34s | 26 KB |
| both | 202,929 | 59 | 12m19s | 28 KB |

Inspo costs about 28k over control, Hallmark about 63k, both together
about 98k. The skill arms produce visibly smaller pages for more
tokens, which is the discipline showing up as restraint rather than as
output.

## What is measurable

Two Hallmark Floor rules are mechanically checkable across every page:
gate 54 (no eyebrow / kicker / overline) and gate 38a-i (no italicised
word inside a roman heading).

| arm | eyebrow | italic in h1 |
|---|---|---|
| nothing | 4 / 5 | 4 / 5 |
| inspo-only | 2 / 5 | 2 / 5 |
| hallmark-only | 0 / 5 | 0 / 5 |
| both | 0 / 5 | 0 / 5 |

Perfect enforcement in both skill arms. The control reaches for both
patterns in four pages out of five, which is a good measure of how
strong the default is. Inspo alone halves the rate without being told
to; at n=5 that is a hint, not a result.

Mechanical verification of all twenty (serial, one browser, corrected
fold measurement): charset present 20/20, hero complete inside
1280x800 20/20, horizontal overflow at 1280 and at 375 zero across the
board, one benign SVG attribute warning.

## What the archive actually did

Confirmed working, with evidence in the pages:

- **The register correction fires in both directions.** On m5 two
  independent agents intended a dark page ("every NLE is dark"), the
  archive measured light at 0.63 and 0.67, and both inverted to light.
  This is the Eval 2 open issue #2 closing, and it is a measurement
  rather than a nudge: it can overrule a sound domain intuition.
- **Negative evidence turned out to matter as much as positive.**
  Flat axes (paper 0.38, accent 0.46) were repeatedly recorded as
  `no consensus`, which stopped agents manufacturing a fake opposition
  to a default the category does not have. Unplanned, and arguably the
  more valuable half.
- **The guardrail held 5/5 in `both`.** No `faces` name and no
  `anchors` hex crossed into any build. Register was taken, values were
  refused, exactly as the may/may-not-feed split specifies.
- **Coverage honesty changed behaviour.** `workbench` returned zero
  and its "rare in the wild, not wrong" wording is what one agent cited
  to justify building the shape from first principles instead of
  abandoning it.

## Where the two aids genuinely interact

The `both` arm reported the same mechanism on 3 of 5 briefs, and it is
a move neither aid makes alone: **Hallmark supplies the obligation to
oppose, Inspo supplies the thing to oppose.**

The sharpest instance, m2-devtool: Hallmark's `modern-minimal` genre
file explicitly recommends Geist / Inter Tight / Space Grotesk. The
archive measured grotesk-sans at 0.79, the only axis clearing the
consensus threshold, which obliged the build to refuse exactly what the
skill's own genre file recommends. The page ships a slab serif.

That also exposes a contradiction inside Hallmark worth fixing: a genre
file that names faces, against an opposition rule that can require
refusing them.

Related, on m3-fintech: Hallmark's static spent-defaults table says to
reject "navy and emerald trust palette" for fintech. The archive
measured 24 real fintech sites with paper band flat at 0.38 and accent
hue flat at 0.46 - the category has no such consensus. R.1 was
refusing a default the category does not actually have. This is the
clearest argument in the whole run for measuring rather than guessing.

## Where it did not work

Reported honestly, because the pages contradict some of the notes.

- **On m4-ceramics the archive did not differentiate.** The
  `inspo-only` agent reported that following a flagged outlier
  (Ferm Living, roman serif on warm cream) gave it the right register.
  The control arm, with no archive at all, landed in the same place:
  warm paper, Instrument Serif, an italicised accent word, terracotta,
  drawn vessels. The two pages are near siblings. The archive confirmed
  a default rather than breaking one, and the agent's own account of
  why does not survive looking at the output. **Agents are not reliable
  narrators about their own process; the pages are the evidence.**
- **`recommend`'s ranking matches vocabulary, not genre.** It returned
  five web-design agencies for a pottery studio, and Bento Grid for a
  meditation app off a dev-tool-skewed shortlist. Eval 2 logged this as
  open issue #1 and this change did not fix it: `avoid` and `evidence`
  were added on top of the existing hybrid ranker without touching the
  ranker. This is now the weakest link in the chain.
- **Thin coverage is honest but frequently useless.** Narrative
  Workflow's single exemplar is a violet-gradient note app; Catalogue's
  is Emigre. Correctly reported, contributed nothing to either build.
- **The `faces` pool is polluted.** Roughly a quarter are build-hash
  artefacts (`Exposure-09cb373df0d2138c`, `__degular_471322`).
  `pickDisplayFace` in `packages/shared/src/axes.ts` does not filter
  hashed or obfuscated font names. Straightforward fix.

## Harness faults (mine)

All twenty agents ran concurrently against one shared browser pane and
one shared scratchpad directory. Consequences, reported by 11 of 20
cells: tabs switching under running agents, screenshots returning a
sibling arm's page, a port collision, and one agent's screenshot script
overwritten mid-task. Several worked around it by driving Playwright
directly.

No arm was advantaged, so the comparison stands, but no agent could
verify its own page by eye. The corrective serial screenshot pass after
the fact is what produced the verification table above. Any future run
needs per-agent worktree isolation or explicit `tabId` on every call.

Second fault: SPEC's "one self-contained index.html" contradicts
Hallmark's mandatory `tokens.css` emit. Every Hallmark arm hit it and
resolved it the same way (inline, ship the portable copy unimported).
It cost the skill arms a compliance point they should not have paid.

## Artefacts

- `<arm>/<brief>/index.html` - the pages
- `<arm>/<brief>/NOTES.md` - per-cell timing, tool counts, rationale
- `_shots/` - fold, full-page and 375px captures of all twenty
- `_shots/report.json` - the mechanical verification pass
- `usage.json` - tokens, tool calls, wall time per cell
- `collect.mjs` - assembles the tables above

Serve with `python3 -m http.server 4041 --directory mcp-eval-4/` and
open `http://localhost:4041/<arm>/<brief>/`.
