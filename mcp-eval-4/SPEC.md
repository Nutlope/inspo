# Eval 4 - shared spec

Four arms x five briefs. Same brief text, same deliverable rules, one
variable: which design aids the agent may use.

Arms live at `mcp-eval-4/<arm>/<brief>/`:

- `nothing`      no reference archive, no design skill
- `inspo-only`   Inspo MCP only
- `hallmark-only` Hallmark skill only
- `both`         Inspo MCP + Hallmark

## The five briefs

**m1-meditation** - Tenor. A meditation app for people who cannot sit
still: ten-minute sessions you do while walking. Audience is restless
professionals who have bounced off Headspace and Calm.

**m2-devtool** - Sightline. Observability for CI pipelines: it tells
you why the build broke before you open the logs. Audience is platform
engineers at 50-500 person companies.

**m3-fintech** - Even. A savings app for freelancers with irregular
income; it sets aside tax money automatically as invoices land.
Audience is self-employed designers, writers and contractors.

**m4-ceramics** - Kiln & Co. An independent ceramics studio in Lisbon
selling small-batch tableware and running weekend workshops. Audience
is people who buy one good object rather than ten cheap ones.

**m5-producttour** - Reelframe. A video editing app. This page is a
guided tour of the product in use: what you actually do with it, step
by step, screenshots carrying the argument rather than marketing copy.

## Deliverable rules (identical for every arm)

1. One self-contained `index.html` in your brief directory. Inline all
   CSS in a `<style>` block. No build step, no framework, no local
   asset files.
2. `<meta charset="utf-8">` in `<head>`. Non-negotiable: these pages
   lean on typographic glyphs and omitting it produces mojibake.
3. Web fonts via a Google Fonts `<link>` are allowed and encouraged.
   No other network calls: no CDN scripts, no remote images. Any
   imagery must be CSS or inline SVG.
4. The hero must be complete within 1280x800 - nav, headline,
   supporting line, primary CTA, and any hero visual all visible
   without scrolling.
5. Invent no metrics, testimonials, customer logos or case-study
   counts. If a layout wants a number you were not given, either use a
   labelled placeholder or choose a different layout.
6. A real page, not a fragment: hero through footer.

## Required: `NOTES.md` in your brief directory

Write it last. Exactly these sections:

```
# <arm> / <brief>

## Timing
start: <epoch seconds>
end:   <epoch seconds>

## Tool calls
total: <n>
inspo: <n>            # 0 for arms without the archive
breakdown: <tool name xN, tool name xN, ...>

## What drove the design
<4-8 sentences. The decisions you made and what actually caused each
one. If a tool or a skill changed a decision, say which decision and
what it was before. If it did not change anything, say that plainly -
"the archive confirmed what I already intended" is a real and useful
finding.>

## Friction
<Anything that fought you: a tool that returned something useless, an
instruction that contradicted another, a dead end. One line each, or
"none".>
```

Get `start` and `end` with `date +%s` as your first and last shell
commands.

Do not score your own page. Do not write any file outside your own
brief directory.
