# Sprout — Build Notes (No-Tools / One-Shot)

## 1. Tooling confirmation

No external tools, MCP servers, design skills, or reference files were consulted to produce this page. Specifically:

- No `Skill` invocations (ui-ux-pro-max, hallmark, frontend-design, shadcn, etc.)
- No `WebFetch`, `WebSearch`, `Claude_in_Chrome`, or `Claude_Preview` calls
- No `Figma` MCP queries
- No reads of `/Users/youssef/.claude/skills/`, `/Users/youssef/Inspo-design/mcp-eval-2/MCP-GUIDE.md`, or any reference component in the repo
- Only tool calls used: a single `Bash` to `mkdir` the output directory, and two `Write` calls (this file + `index.html`)

Everything in `index.html` — layout, palette, typography, copy, illustrations, SVG marks, micro-interactions — was authored cold from internal design knowledge.

## 2. Design rationale

### Brand
"Sprout" — a verb-y, organic name for a fintech aimed at people who feel late to the money game. It pairs with a green palette and the recurring "plant a tree" / "grow quietly" metaphor in the copy. The mark is a stylized leaf-pair with a stem, drawn in two shades of lime so it reads at small sizes.

### Audience
Young people (early-20s to early-30s) who are slightly intimidated by traditional finance UIs. The voice is warm and a touch self-deprecating ("zero shame", "people who weren't supposed to be good at money"), which differentiates the brand from the aggressive, performance-bro tone common in the category (Robinhood, eToro) and the sterile-bank tone (Schwab, Fidelity).

### Aesthetic direction
A warm, editorial, "tactile financial" feel rather than the dominant glassy-blue fintech stereotype. Influences in my head:
- Editorial: warm paper background (#F4F1EC), generous serif headlines, hairline rules, mono captions
- Garden/organic accent: deep moss green as primary brand color, sprouting lime as the accent — colors that don't say "bank"
- Hand-crafted touches: a tilted receipt with paper-edge feel, hand-drawn-feeling coins, slight rotation on the phone and floating tiles, conic-gradient portfolio donut

### Type system
- Instrument Serif (display, headlines, balances, plan prices) — gives an unmistakably editorial, warm character at large sizes. Italics are used for emphasis on key words ("Invest", "quietly", "right now") to lend rhythm.
- Inter (body & UI) — neutral, modern, excellent at 14-16px.
- JetBrains Mono (financial figures and labels) — signals "real numbers" without screaming spreadsheet.

### Color system
- Paper: #F4F1EC base, #EBE6DE secondary — warm and inviting
- Ink: #141312 + #3A3733 — black with a brown undertone so it sits in the warm system
- Accent: deep moss #1E3A2B; sprouting lime #C7E07A for highlights
- Supporting: amber, plum, tomato — used sparingly for category coding (portfolio donut, illustration variety) so the page reads cohesive but not monochrome.

### Layout & rhythm
- Hero on a 1.05/0.95 column grid so copy gets the visual weight but the phone-mockup composition (phone + two floating tiles) takes the right field
- Asymmetric feature grid (7/5 then 4/4/4) to break the boring "three identical cards" pattern — the dark inverted card in the top row creates strong color contrast and prevents grid monotony
- A black numbers band breaks the warm flow and gives the eye somewhere bold to land
- Pricing on a contrasting paper-2 swatch, with the middle plan elevated and in moss green
- FAQ uses a 3-column grid (number / question / +) with details-based accordion that closes siblings
- Final CTA reuses the dark color from the numbers band, giving the page a sandwich of warm-dark-warm-dark-warm-dark — a recognizable rhythm

### Illustrations (no images, all CSS/SVG)
- Round-up illustration: tilted receipt with line-by-line breakdown and floating coin tokens (gradient + shadow + keyframe bob)
- Auto-invest: conic-gradient donut chart with center label and full legend with percentages
- Goals: three horizontal mini progress bars on amber stock
- Safety: lock icon in an ink rounded-rect with inset paper background
- Forecast: SVG growth curve with translucent area fill and a glowing end-point dot
- Phone screen: full app mock with balance card (gradient + radial accent), goal card with progress bar, and three transactions with icon chips — each piece sized accurately for a 300×600 frame
- Two floating tiles around the phone (sparkline & goal) provide context and break the rectangular silhouette

### Microcopy
Every section ledes with a real, opinionated sentence — no "Reimagining the future of finance." Highlights:
- Hero: "Save without thinking. Invest without flinching fear." (with "flinching" struck through to "fear" — visual gag that telegraphs the brand's emotional honesty)
- Round-ups: "Every coffee becomes a quiet little contribution."
- Safety: "Bank-grade, kid-on-TikTok proof."
- CTA: "The best time to plant a tree was 20 years ago. The second best time is right now."
- Testimonial: "I didn't change my life — I just stopped fighting it."

### Interactions
- Sticky translucent nav with a border that appears on scroll
- IntersectionObserver-based reveal animation on cards, plans, stats, testimonials, and floating tiles (one-shot per element)
- Hover lift + shadow on cards/plans
- Accordion FAQ that auto-closes siblings (custom `<details>` styling with grid layout for the number/question/icon row)
- The newsletter input swaps the button label to "Sent ✓" on submit (purely for the demo)

### Responsiveness
- Hero collapses to single column under 980px; the phone re-centers and the floating tiles reposition
- Feature grid: 12-col → 2-col at 880px → 1-col at 560px
- Pricing & steps & testimonials collapse to 1-col at the same breakpoint
- Nav links and the "Sign in" ghost CTA hide under 880px (a mobile menu would be the next step in a real ship, intentionally omitted to keep this single-file and one-shot)
- Floating tiles around the phone hide under 520px so the phone doesn't get crowded

### Accessibility quick-pass
- All decorative SVGs use `aria-hidden="true"`
- Semantic landmarks (`<header>`, `<main>`, `<section>`, `<footer>`, `<nav>`)
- All interactive elements are anchors or buttons, not divs
- Color contrast on body text and CTAs comfortably above WCAG AA (warm paper + ink 14:1+; moss + lime CTA ~7.5:1)
- Real email input with `type=email`, `required`, and an associated aria-label
- Focus styles preserved on inputs (border-color shift to lime)

## 3. Self-score

**8.5 / 10**

### Why it's strong
- Clear, opinionated visual identity that *isn't* the default fintech glassy-blue look — the warm-paper + moss + lime feels distinct and on-brand for a young, design-forward audience
- Editorial type system used consistently (italics for emphasis, mono for numbers) gives the page a magazine quality rather than a SaaS-template quality
- Real, varied content density: hero with phone, asymmetric feature grid with five different illustration styles, numbers band, steps, pricing, testimonials with three card variants, multi-question FAQ, dual-CTA footer block — substantially more than a template
- Copy has voice and a point of view; almost no filler sentences
- All illustrations and icons are inline SVG/CSS — no placeholder images, no lorem ipsum, no broken assets
- Real micro-interactions (reveal-on-scroll, accordion behavior, sticky nav border, hover lift)
- Honest responsive plan that holds together at 320, 768, and 1200+ widths

### Why it isn't a 10
- One-shot constraint meant no time for a custom mobile nav (links just hide); a shipping version would need a hamburger + slide-in panel
- The phone-mockup composition is dense — at the smallest breakpoint the floating tiles are hidden, which loses a bit of context
- A truly polished version would have a custom 404 favicon, OG image, JSON-LD schema, and a real, animated brand mark (e.g., a leaf that grows on hover)
- The category color-coded transaction icons in the phone mock are charming but could be tightened with a more consistent metaphor
- No dark mode — for this brand it would be a beautiful inversion (warm paper -> deep ink with the same lime accent), and skipping it leaves design opportunity on the table
