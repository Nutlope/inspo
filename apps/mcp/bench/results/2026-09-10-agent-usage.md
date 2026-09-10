# Agent usage audit, 2026-09-10

Thirty real builds, not a synthetic call list: the three batches of
ten Fable 5.1 agents (high effort, Inspo MCP as the only tool) that
produced the current /examples gallery. Every number below is read
from the workflow transcripts, before the response-shape changes that
shipped the same day.

## What a build cost

| Per agent | Value |
|---|---|
| Inspo calls | 10.8 |
| Inspo result text | 148k chars, about 37k tokens |
| Inline thumbnails | 32 |
| Assistant turns | 38 |

Tool results are paid once and then re-read on every later turn, so
37k tokens of results sitting in context across ~25 later turns is
the real bill, not the 37k itself.

## Where the text went

| Tool | Calls | Chars | Avg / call | Share of Inspo text |
|---|---|---|---|---|
| search_screens | 77 | 1,694,035 | 22,000 | 38% |
| find_reference_components | 64 | 1,276,049 | 19,938 | 29% |
| recommend | 30 | 642,732 | 21,424 | 14% |
| get_screen | 64 | 207,209 | 3,237 | 5% |
| find_examples_for_macrostructure | 16 | 182,710 | 11,419 | 4% |
| find_by_color | 4 | 123,651 | 30,912 | 3% |
| find_similar | 5 | 107,065 | 21,413 | 2% |
| compare | 23 | 76,461 | 3,324 | 2% |
| get_design_system | 13 | 57,754 | 4,442 | 1% |
| find_components | 18 | 42,539 | 2,363 | 1% |
| get_reference_jsx | 11 | 38,471 | 3,497 | 1% |

Outside Inspo, the agents' own `Read` of their finished page (asked
for by the build prompt as a final rule check) was 1.35M chars across
30 builds, about 11k tokens each. That is the prompt's cost, not the
server's, and worth remembering when comparing arms.

## What was actually used

- **13% of returned sites were cited.** Agents pulled 25 to 56 distinct
  sites each and cited 4 or 5 as references. Every one of those ~40
  rows arrived in the full shape: four blob URLs, a description that
  repeated the tags, a six-field axes object, and the autopsy.
- **44 of 51 searches asked for `detail: "full"`** in the first twenty
  builds, because the results tip said "read each result's autopsy".
- **find_reference_components was called 2.1 times per build** and
  returned every archetype's complete React source each time (seven
  sources, ~19k chars). Only 11 `get_reference_jsx` calls across 30
  builds followed, and the pages are plain HTML, so the JSX was read
  for shape and discarded. The notes cite "the N1 Inline shape" and
  "the three-card pricing shape": the archetype note, not the code.
- **Pretty-printed JSON was 16-20% of every response.** Indentation
  and one-primitive-per-line arrays.
- **Evidence faces carried bundler artefacts.** `__Inter_f367f3`,
  `__esbuild_b38aaf` and camelCase CSS-in-JS names appeared as
  typefaces in use on 23 sites.
- **Wall time is model time.** The server answers in tens of ms; a
  build took 8 to 11 minutes of Fable output. Nothing to fix there.

## What changed

1. List rows (search, similar, by-colour, macrostructure examples,
   collections, recommend exemplars) use a lean shape: slug, title,
   northstar, palette, cleaned fonts, mode, macro slug, axes key with
   display face, one tag line. Image URLs are stated once per response
   as a pattern; `get_screen` keeps exact URLs.
2. `detail` gained a `standard` default: autopsy on the top three rows
   only. `full` is still there for a caller who will read every row.
3. `find_reference_components` returns an index (id, label, macro,
   note, the source's own JSDoc paragraph) with or without a type
   filter; `get_reference_jsx` serves one source. `recommend` does the
   same for its reference picks.
4. One-space JSON with primitive arrays folded onto one line.
5. Font names cleaned at the output boundary; evidence faces are
   counted after cleaning and capped at eight.
6. Tips cut to one line; server instructions gained a budget
   paragraph (one recommend, one or two searches, get_screen on the
   references you keep).

Response-cost bench, same calls, tokens before and after:

| Call | Before | After |
|---|---|---|
| recommend | 5,606 | 2,541 |
| search_screens, limit 6 | 4,807 | 1,713 |
| search_screens, limit 8, detail full | ~5,700 | 3,366 |
| find_similar, limit 8 | 7,068 | 2,242 |
| find_examples_for_macrostructure | 3,414 | 1,582 |
| find_reference_components, type hero | ~4,900 | 860 |
| get_screen | 827 | 748 |

Applied to the audited call mix, a typical build's Inspo text drops
from ~37k tokens to an estimated 12 to 14k, with no reference an agent
actually cited removed from what it can see. This has not yet been
validated on a fresh batch of agent builds; the next gallery batch
will run on the new shape and its transcripts should be audited the
same way.
