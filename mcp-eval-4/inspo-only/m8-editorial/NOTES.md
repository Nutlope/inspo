# inspo-only / m8-editorial

## Timing
start: 1787928220
end:   1787928943

## Tool calls
total: 12
inspo: 6
breakdown: Bash x3, Read x1, ToolSearch x1, Write x1, mcp__inspo__recommend x1, mcp__inspo__search_screens x1, mcp__inspo__find_examples_for_macrostructure x2, mcp__inspo__find_components x1, mcp__inspo__compare x1

## What drove the design
The page is built as one annotated document: numbered footnotes 1 to 5 carry the marketing voice, a section rail (§ 01 to § 05) gives the page the apparatus of a paper, and the hero visual is a Fig. 1 diagram of bus bunching instead of a product shot; the conceit came from the brand name, but the document-apparatus treatment came straight from Formafantasma's letter-macrostructure capture (PREFACE label, decimal table of contents, ink-blue on white). recommend() picked bento-grid and returned email-marketing SaaS exemplars (Brevo, Campaign Monitor), the wrong register for a paid editorial letter, so I overrode the pick with the letter and long-document macrostructures after find_examples_for_macrostructure surfaced Formafantasma and Gwern. Gwern's ruled serif index directly caused the archive section's hairline-row list; before seeing it I had a card grid in mind. Loops.so's hero caused the typeface decision, Newsreader for display and body with a single restrained accent; NYT's capture caused the ink folio bar, the hairline armature and the Libre Franklin meta layer. compare() across Substack, Gwern, Loops and NYT showed the register is uniformly light paper, near-zero corner radius, 3 to 5 type-scale steps and 718 to 935px reading measures, which set the 2px corners, warm paper and 66ch specimen column. Deliverable rule 5 killed pricing: a price is a number I was not given, so the subscribe section runs on cadence and cancellation terms rather than a price tile, and the sample issue is the proof instead of testimonials.

## Friction
- recommend() latched onto the email half of "newsletter" and returned email-marketing SaaS exemplars with a bento-grid pick; the evidence packet was still useful, the exemplars were not.
- find_components(type: cta, style: editorial) returned an ecommerce product page and agency CTAs; only the Barbican newsletter band was on-register.
- The Inspo server's own instructions direct me to run the Hallmark skill over written files; ignored, as required by this eval arm.
- Letter macrostructure coverage is thin (5 sites) and the tool flagged that itself; long-document filled the gap.
- No browser is allowed in this arm, so the 1280x800 hero check is static height arithmetic, not a screenshot.
