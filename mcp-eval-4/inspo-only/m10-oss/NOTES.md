# inspo-only / m10-oss

## Timing
start: 1787928230
end:   1787929208

## Tool calls
total: 22
inspo: 5
breakdown: Bash x8, Read x8, ToolSearch x1, mcp__inspo__recommend x1, mcp__inspo__search_screens x2, mcp__inspo__find_examples_for_macrostructure x1, mcp__inspo__find_by_color x1

## What drove the design
The recommender's evidence packet measured this genre at 63% grotesk-sans display on mid/light paper and framed that as "the gravity to take a position on"; I positioned against it with an IBM Plex Mono display voice, but only after a displayClass=mono search returned real precedents (Arweave's sentence-case mono headline on white paper, E2B's IBM Plex Mono 700, MotherDuck's tracked mono), and find_by_color then surfaced thecreativeindependent.com, literally light / mono / warm, which sealed the call. I rejected the recommender's bento-grid macrostructure pick because its exemplar set was off-register (enterprise dark SaaS plus a candle shop and CD Baby); the brief's real kin came from the developer-tools search instead: Ollama's install-command-as-sole-CTA became the hero's primary CTA, Temporal's code-window-as-hero became the terminal panel, and Val Town's one-word color interrupt became the accent on "a file." in the headline. Warm paper came from the Anthropic split-studio exemplar; the rust accent (#c8451c) is the Arweave/E2B orange family, and Bellroy pairing that orange with a deep navy justified the navy terminal deck against it. The hairline-mesh feature grid with numbers instead of icons follows the reference component's note that typography, not icon decoration, should supply the variety, and the hero was composed to the server's heroGuidance line about completing everything inside the first viewport. Without the archive I would have defaulted to a dark gradient dev-tools page with a grotesk display, so the light mono ledger direction is directly attributable to the search results. The "where it fits, where it does not" honesty section came from the brief's audience rather than the archive; the archive confirmed the plain technical register but offered no exemplar of that section, so it is the one invention.

## Friction
- recommend picked bento-grid, but three of its five exemplars were mistagged or off-register for an OSS library (a candle shop, CD Baby), so I overrode the pick from its own shortlist.
- The Inspo server's instructions say to run the Hallmark skill over the files I wrote; the eval arm forbids skill invocation, so I ignored it.
- A skills listing was re-injected into the transcript right after the first file write; ignored per arm rules, no skill was invoked.
- Headless Chrome clamps its window to 500px wide, so a 390px capture crops instead of reflowing; verified the small-screen layout at 512px where capture and viewport agree.
- My first NOTES.md write failed on a percent sign in my own Python format string; rewritten without formatting, which is why the Bash count is 8.
