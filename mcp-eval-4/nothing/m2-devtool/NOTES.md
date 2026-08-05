# nothing / m2-devtool

## Timing
start: 1785927170
end:   1785927584

## Tool calls
total: 35
inspo: 0
breakdown: Read x1, Write x2, Edit x6, Bash x5, Claude_Browser.computer(screenshot) x6, Claude_Browser.computer(scroll) x3, Claude_Browser.javascript_tool x8, Claude_Browser.navigate x1, Claude_Browser.resize_window x1, Claude_Browser.preview_start x1, Claude_Browser.tabs_create x1

## What drove the design
The brief hands you the product's entire argument in one clause: it tells you why the build broke before you open the logs. So I made the verdict itself the hero visual rather than a dashboard, a gradient, or an abstract graphic. The hero is a two-column split: a three-line headline on the left, and on the right a card that shows a red pipeline with the diagnosis already written under it, so the reader sees the promise being kept before reading a word of marketing copy. Palette and type came from the audience: platform engineers read monospace all day, so JetBrains Mono carries everything machine-generated (labels, stage names, evidence, key/value rows) and Instrument Sans carries anything a human wrote, which makes the register legible without any decoration. Colour is kept semantic and scarce: a near-black ink on a cool paper, with red used only to mean failure and green only to mean pass, so the eye tracks build state rather than branding. The "loop" section (five numbered steps ending in "you read the log instead, this is the fourth time today") exists because the audience needs the pain named in their own vocabulary before they will accept a claim about automated root-cause analysis, and it costs nothing in invented numbers. The second big visual is the same verdict rendered as a dark terminal-style pull request comment, which both proves the product ships where the work happens and gives the page one inversion of value so it does not read as an unbroken slab of paper. Rule 5 shaped the copy more than anything else: with no metrics, testimonials or logos available, the credibility has to come from specificity of mechanism, so the FAQ answers scope, data residency, wrong verdicts and messy pipelines instead of a proof-bar of numbers, and both mock UIs carry a visible "illustrative" caption. No tool or skill was consulted, so nothing changed my mind mid-build; the sequencing (hero, problem, three-step mechanism, verdict anatomy, failure classes, platform objections, CTA) was chosen up front and survived unedited.

## Friction
- The Browser pane is shared across the four parallel arms: my JS scroll landed on another arm's tab once, and after that screenshots of my tab returned a blank background because a sibling arm's page was fronted. I verified layout numerically (hero bottom at 801px, zero horizontal overflow) instead of visually, and I did not use anything I glimpsed of the other arms.
- Adding a caption under the verdict panel broke the two-column grid on the first attempt (the caption became a third grid item); it needed a wrapper div, caught by a tag-balance check rather than by eye.
