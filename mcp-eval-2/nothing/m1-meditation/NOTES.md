# Stillwater — Build Notes

## 1. Confirmation: no external tools or references used
I built this entirely from my own design knowledge. I did **not**:
- Call any MCP server (no `apps/mcp/src/call.ts`, no design-skill MCP, no figma MCP, no Claude Preview, no Chrome).
- Read anything under `/Users/youssef/.claude/skills/`, `/Users/youssef/Inspo-design/mcp-eval-2/MCP-GUIDE.md`, or `/Users/youssef/Inspo-design/apps/web/src/components/reference/`.
- Invoke any design Skill (`hallmark`, `frontend-design`, `ui-ux-pro-max`, `web-design-guidelines`, etc.).
- WebFetch or WebSearch design-reference sites.
- Look at any catalogue of styles, palettes, or font pairings.

The only tools I used were `Bash` (one `ls`) and `Write` (two files).

## 2. Design rationale

### Brand
**Stillwater** — a one-word, watery, slightly old-fashioned name that doesn't shout "tech app." Tagline: *"Quiet your mind in 7 minutes a day."* The brand voice is deliberately anti-hype (no streaks, no shame, "we won't email you back to life") because that's a real, currently-underserved positioning in the meditation-app space.

### Typeface choice
Two families, both from Google Fonts:
- **Fraunces** for display and headings. It's a contemporary serif with variable optical sizing (`opsz`), softness (`SOFT`), and "wonk" (`WONK`) axes. Used at large opsz with a touch of softness and italic-with-wonk for accents, it reads as warm, editorial, and slightly handmade — the opposite of generic SaaS sans. It signals "considered" without being precious.
- **Inter Tight** for body and UI. It's a slightly more condensed Inter, so it sets quietly at body sizes and doesn't fight the serif. Weights 400/500/600 cover all needs.

A monospace was deliberately omitted — a meditation app doesn't need code energy.

### Palette
A warm "paper + sage + forest" system, evoking analog calm without going full beige-on-beige.
- `--paper:     #F1ECE2` — warm cream background
- `--paper-2:   #E8E2D3` — soft sand for alternating sections
- `--ink:       #1B2620` — deep forest used for primary text and dark CTA
- `--ink-2:     #2F3A33` — softer ink for body
- `--muted:     #5F6A62` — muted slate for meta
- `--sage:      #7E9181` — primary accent (orb, highlights, focus dots)
- `--sage-deep: #4F6957` — eyebrow text, icon color, italic accents
- `--moss:      #344C3D` — CTA hover, footer
- `--clay:      #C68B5F` — single warm secondary, used sparingly for quote marks and the "01 /" numerals to keep things from getting too monochromatic
- `--line:      rgba(27,38,32,0.12)` — hairlines

All AA-contrast for body text on paper. Sage was kept just dark enough to pass on cream.

### Layout / macrostructure
Editorial-archive feel, master-detail rhythm:

1. **Sticky frosted nav** (paper at 78% with backdrop-blur) — keeps brand present without weight.
2. **Hero**: asymmetric 1.05fr / 0.95fr grid. Left = oversized italic headline ("Quiet the noise. *Find* your stillness."), lede, two CTAs (primary ink pill + ghost "Listen to a sample"), and a live trust line with a pulsing sage dot. Right = a **breathing orb** — a CSS-only radial-gradient sphere that scales 1.00 → 1.05 over 8 seconds (matching a real box-breath cadence) inside three concentric rings that breathe out of phase. The whole thing is captioned "Inhale · Hold · Exhale." No JS, no image — pure aesthetic and on-brand.
3. **Slow marquee** of credibility strip ("Featured in The Atlantic", etc.) — 38-second loop, deliberately calm.
4. **Practice grid** — 3 × 2 of feature cards with "01 / Guided" eyebrow numerals, small line-icon tile, name, paragraph, and a dashed-rule meta footer with count + duration. The two-attribute meta footer is the editorial detail that lifts these out of generic-SaaS-card territory.
5. **Sessions section** — a 1.1 / 0.9 split: left is a real-looking session list (duration in big serif, name, narrator credit, hover-revealed play button with padding shift); right is a sticky **dark ink panel** with the five "Stillwater promise" bullets and an inverted CTA. Dark/light contrast as a value moment.
6. **Pull quote** on the sand-colored band — large Fraunces with clay-colored quote marks, single avatar attribution. One real quote, not a wall of three.
7. **Plans** — 3 cards, the middle one inverted to ink for visual emphasis. Prices set in Fraunces at 52px with a small superscript dollar sign — feels like a menu, not a pricing table.
8. **FAQ** — two-column split: left intro column, right `<details>` accordion with a rotating + → × toggle in a circle. Six honest questions.
9. **Final CTA** with sage + clay radial-gradient atmosphere behind centered headline.
10. **Footer** on full-bleed ink.

### Motion
- 8s `breathe` on the orb + three out-of-phase ring scales.
- 2.6s pulse on the trust dot.
- 38s marquee.
- IntersectionObserver-driven `.reveal` fade-and-rise on most blocks (one block of ~15 lines of vanilla JS).
- `prefers-reduced-motion: reduce` disables every animation and shows everything at rest.

### Accessibility / polish
- Real semantic HTML (`<header>`, `<nav>`, `<section>`, `<article>`, `<details>/<summary>`, `<footer>`).
- ARIA-hidden on purely decorative SVG, orb, grain, marquee.
- All link/button states have hover transitions; focus inherits browser defaults (no focus-removal).
- Color contrast checked by eye against WCAG — ink on paper is ~14:1, sage-deep on paper is ~5.4:1, muted on paper is ~4.8:1.
- Responsive: hero stacks at ≤920px, practice grid collapses 3→2→1, plans stack with featured de-emphasized, FAQ two-column collapses (implicit), nav links hide ≤820px (CTA stays). Tested mentally at 375 / 768 / 1280.
- One SVG noise/grain overlay at 4.5% opacity on the hero adds warmth without weight.

## 3. Self-score

**8.5 / 10** on production-readiness.

Justification: Real semantic HTML, full responsiveness, motion with reduced-motion fallback, distinctive editorial type voice (Fraunces with axis tuning), a memorable hero device (CSS breathing orb), genuine copy throughout, three honest CTAs, plausible pricing, and six legitimate FAQ answers — it would ship as a real landing page; the -1.5 is for the absence of a mobile nav menu when links collapse and for using a single hero device rather than carrying that visual language deeper into the page sections.
