# hallmark-only / m2-devtool

## Timing
start: 1785927208
end:   1785927679

## Tool calls
total: 22
inspo: 0
breakdown: Read x14, Write x3, Edit x8, Bash x5, mark_chapter x1, browser resize/navigate/screenshot/tabs_create x5

## What drove the design
The brief is a CI observability tool whose whole claim is causal ("why it broke"), so I
built the page around a diagram of how a verdict is assembled rather than around a feature
grid: four evidence readings on the left, converging wires in the middle, one verdict block
on the right, with the single reading that carried the verdict drawn in coral. That came
from Hallmark's macrostructure catalogue, where Map / Diagram was a shape I would not have
reached for on a devtool brief; my untouched instinct was a Bento or feature-stack SaaS
page. The skill's mirror test ("would this combination come out for a neighbouring brief?")
is what killed my first theme pick: I had chosen Ledger, the dark navy terminal option, and
a dark mono devtool page is exactly what any neighbouring devtool brief would also get, so
I moved to Coral, warm near-white paper with one coral signal, and spent the whole accent
budget on the semantics of failure (the failing step, the decisive evidence wire, the source
line) instead of on decoration. Two further decisions were changed by specific steps rather
than by taste: the hero-enrichment gate routes dev-tool briefs to "no imagery, typography
only", which pulled the diagram out of the hero and put it below the fold as the page's
body, and that in turn let the hero take the Banner posture (compressed, 52dvh) so the map's
opening line peeks at the fold. Gate 54 (no eyebrows) removed a mono "Verdict" label I had
written above the verdict sentence; it became a caption below the block naming the evidence
it read from, which is a better idea than the one it replaced. Gate 47 (no re-drawn chrome)
kept me from drawing a terminal or PR-comment window, so the example verdict is set as plain
typography inside a `<figure>` with a caption that says the wording is an example. The "What
it will not tell you" section is mine, not the skill's, but the skill's ban on invented
metrics is what made a refusal section the obvious way to fill space that would otherwise
have wanted proof numbers.

## Friction
- Coral's canonical display face is General Sans, hosted on Fontshare; the brief allows only Google Fonts, so I substituted Geist and recorded the swap in the stamp.
- Hallmark requires a `tokens.css` at the project root on every build; the brief requires one self-contained `index.html` with no local asset files. I followed the brief and inlined the tokens, so that part of the skill's contract is unmet on purpose.
- The hero-enrichment file routes dev-tool briefs to typography-only, while the chosen macrostructure (Map / Diagram) says the diagram IS the page. Resolved by keeping the hero typographic and making the diagram the body, but the two files do not acknowledge each other.
- No visual verification: the shared browser pane was occupied by other agents' files and refused to open mine, and sloplint's `--render` tier needs puppeteer-core, which is not installed. Step 7 ran as the static sweep plus a manual gate walk only.
- sloplint flagged an undefined `--color-accent-ink` because a 2px legend swatch counts as an accent-filled surface; the token exists now but nothing sets text on accent.
