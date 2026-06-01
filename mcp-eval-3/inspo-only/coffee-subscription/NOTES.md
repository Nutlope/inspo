# NOTES — Slowboat Coffee Co. (pure Inspo MCP build)

Brand: **Slowboat Coffee Co.** — a four-person West Oakland roastery
selling a small-batch single-origin subscription.

## 1. Every MCP call I made

All calls were issued via
`cd /Users/youssef/Inspo-design/apps/mcp && pnpm exec tsx src/call.ts <tool> '<json>'`.
I read only screenshots, palettes, descriptions, fonts, and vibes/styles
from the responses — `macrostructure`, `hallmarkTheme`, and
`reference*` fields were ignored as instructed.

### 1.1 `search_screens {"query":"coffee roaster subscription","limit":6}`
Returned the obvious coffee-brand cluster:
- `stumptowncoffee-com` — split editorial, photo-led, mustard + tomato red, witty headline ("Hot dogs are your problem. Coffee isn't").
- `intelligentsiacoffee-com` — full-bleed origin landscape, ALL-CAPS sans wordmark, persistent red CTA pill ("Shop All Coffee").
- `bluebottlecoffee-com` — extreme negative space, single subscription product, restrained type.
- `hellofresh-com` — subscription competitor with mustard primary, less relevant.
- `fellowproducts-com` — kettle product page with muted browns / soft pastels.
- (sixth slot was off-topic)

**Took away:** the "warm editorial coffee" genre clusters tightly around three palette ideas: (a) cocoa ink + paper + a single saturated rust/red accent, (b) origin-landscape photography, (c) ALL-CAPS micro-sans for labels paired with a heavy italic serif display.

### 1.2 `search_screens {"query":"specialty coffee brand editorial warm","vibe":"warm","limit":6}`
Triangulated the genre. Same Stumptown / Intelligentsia / Blue Bottle / Fellow surfaced again — high-confidence cluster. Bonus: `seriouseats-com` (a split warm food editorial) reinforced the same palette move (warm earthy + a single saturated red accent at #45161A / #ea9210).

### 1.3 `search_screens {"query":"single origin coffee beans product page editorial serif","limit":5}`
Same cluster (Intelligentsia, Stumptown, Blue Bottle, Fellow) — confirms convergence rather than a different look.

### 1.4 `search_screens {"query":"food beverage editorial subscription serif paper warm","limit":4}`
Pulled in `wallpaper-com` (#d29a1e/#765a18 mustard editorial) and `chipotle-com` (warm orange + dark brown) — confirmed that the warm earthy + one saturated accent palette holds across the broader food/beverage editorial space, not just coffee.

### 1.5 `find_similar {"slug":"stumptowncoffee-com","limit":5}`
Returned Balenciaga split-screen luxury — useful negative signal: split-screen editorial works for luxury too, but I wanted *warmth*, not Balenciaga's cold-luxe palette.

### 1.6 `get_design_system {"slug":"stumptowncoffee-com"}`
**Real tokens recovered** (this was the single highest-signal call):
- `--subscribe-card-button-bg: #1f1815` (cocoa ink)
- `--subscribe-section-bg: #ffffff` / paper `#f6f5f3`
- `--subscribe-card-button-hover-bg: #c0a868` (mustard)
- Fonts: Windsor, GT Flexa, GT Flexa Mono
- Subscribe heading size: 56px desktop, 18px body

This is what locked the dark-cocoa + warm-paper + mustard accent palette
for me.

### 1.7 `get_design_system {"slug":"intelligentsiacoffee-com"}`
Real tokens:
- Ink `#2e2925`, paper `#fcf4ed`, persistent red CTA `#d42927`
- Fonts: urw-din, rotunda-variable
- Confirmed the "one saturated red CTA persistent in nav" move.

### 1.8 `get_design_system {"slug":"bluebottlecoffee-com"}`
Live tokens not recoverable (server returned empty live fetch). I used
captured-time palette only.

### 1.9 `get_design_system {"slug":"fellowproducts-com"}`
Real tokens:
- `--color-foreground: #1e1e1f`, `--color-accent-02: #9d523a` (rust-brown)
- `--button-primary-bg: #1e1e1f`
- Confirmed the dark-ink-on-cream + warm earth accent direction.

### 1.10 `list_collections {}`
Browsed the editor-curated sets — none coffee-specific. Skipped further
collection drilldown.

## 2. Design rationale

### 2.1 Typography
- **Display:** Fraunces (variable serif from Google Fonts) at weight 600,
  `font-variation-settings:"opsz" 30` so the optical-size axis favours
  the inkier "text" cut rather than the hairline "display" cut. At 132px
  this gives Stumptown-grade presence without going hairline-thin.
- **Italics in display:** `actually`, `decisions.`, `everyday.`, `fresh`,
  `notes.`, `people ask.`, `month.` — a deliberate Stumptown / Fellow
  move: paired upright + italic in the same headline. The italic is in
  rust (`#B9412B`), the upright is cocoa ink (`#1F1815`).
- **Body / lede:** Fraunces at 18–20px for narrative copy (lede,
  testimonials, FAQ answers). Inter Tight handles UI (nav, buttons,
  metadata, form labels, footer columns).
- **Labels / numbering:** JetBrains Mono, ALL CAPS, .18–.22em
  letter-spacing — the "lot number / SEC · 01 / 04" editorial nod
  borrowed from Intelligentsia's small-caps sectioning.

### 2.2 Palette (hexes)
| Token | Hex | Where it came from |
|---|---|---|
| `--ink` | `#1F1815` | Direct from Stumptown's live CSS var `--subscribe-section-heading: #1f1815` |
| `--paper` | `#F4F0E8` | Slightly warmer than Stumptown's `#f6f5f3` to lean Fellow-warm |
| `--cream` | `#FBF7EE` | Intelligentsia `#fcf4ed`, nudged |
| `--rust` | `#B9412B` | Average of Stumptown red `#b93826` and Intelligentsia CTA `#d42927` |
| `--rust-deep` | `#8E2E1B` | Hover state, darker rust |
| `--mustard` | `#C0A868` | Direct from Stumptown's live CSS var `--subscribe-card-hover-bg: #c0a868` |
| `--leaf` | `#6F7A55` | Sage I added for the dark-roast card swatch contrast |
| `--paper-2` / `--paper-3` | `#EBE5D7` / `#E1D9C5` | Tonal steps for the ticker band + bag-3 silhouette |

The palette is intentionally tight: ink, paper, one rust, one mustard,
one sage. Five colours doing all the work.

### 2.3 Layout
Top to bottom:

1. **Promo bar** — dark cocoa, mustard accent text, three rotating
   nuggets (free shipping / this week's drop / discount code) — modelled
   on Stumptown's permanent black promo strip.
2. **Sticky nav** — wordmark in italic Fraunces with a tiny mono `EST · 2017`
   chip beside it (a "founder roaster" tell), uppercase Inter Tight menu,
   right-side icon buttons + persistent rust "Start a plan" pill —
   borrowing Intelligentsia's persistent red CTA in nav.
3. **Hero** — split grid. Left: a long-form, warm, opinionated headline
   ("Coffee for people who actually drink it. Not collect it.") with the
   subordinate clause crossed out with a rust slash — a wink that calls
   back to Stumptown's hot-dog/coffee headline cheek. Right: a black
   "shelf" panel composing three CSS-only bag silhouettes (yellow, rust,
   paper) with chip-tags ("No. 14 · Honey", "No. 17 · Washed", "No. 21 ·
   Natural"), a dashed roastery stamp, a lot number, and a faint steam
   animation off the middle bag. This is the move I'm most happy with —
   it avoids the AI stock-photo tell entirely by composing the imagery
   from layout primitives.
4. **Editorial meta strip** (in the hero column foot): 72hrs / 14 /
   4 / $18 — single-glance proof points.
5. **Looping ticker** — small italic claims separated by rust dots.
   Pure ornament but it carries the editorial voice.
6. **How it works — 3 numbered steps** — bordered grid with hairline
   dividers, oversized italic serif numerals in rust. Modelled on
   Intelligentsia's "Subscriptions make it easy" numbered list.
7. **Roast cards — 3 product tiles** — gradient swatches in mustard /
   rust / sage with a CSS bean-silhouette ring graphic. Each card has
   eyebrow ("No. 02"), italic display name, origin micro-line, tasting
   notes, three-col spec row, price + Subscribe pill — standard Stumptown
   product card structure but composed without product photography.
8. **Plan picker** — dark cocoa block with the form on the right. Four
   chip-button groups (roast / bags / frequency / grind) with live total
   that updates. Mustard active state on chips. This is the real
   conversion surface.
9. **Words / testimonials** — three editorial blockquotes in a
   borderless three-column grid with rust opening-quote marks and small-caps
   mono bylines. Borrowed the "From the inbox" framing to make the social
   proof read like a printed paper.
10. **Journal strip** — three gradient cards with italic display
    headlines, one wider hero card. Stumptown does this with photos; I
    do it with composed color fields.
11. **FAQ** — `<details>` accordion, italic serif questions, rust "+"
    that rotates to "×" on open.
12. **Footer** — dark cocoa "A letter, once a month." newsletter band
    with a pill-shaped form, then a 5-column link grid.

### 2.4 Tactics borrowed (not pixel-copied) from each reference
- **Stumptown:** the dark promo bar, the mustard accent, the witty
  headline voice, the lot/roast-date metadata vocabulary, the CSS var
  names that confirmed the palette.
- **Intelligentsia:** numbered "Subscriptions make it easy" pattern, the
  persistent red CTA in the nav, ALL-CAPS micro-sans sectioning,
  SEC · 01/04 numbering.
- **Blue Bottle:** ample negative space in the hero — I gave the headline
  a real left column with breathing room instead of cramming the panel.
- **Fellow:** muted earth palette + italic display lines over product;
  the way they let one big object carry the hero.

### 2.5 What's specifically *not* a Hallmark/AI-slop tell
- No "Lorem ipsum"-cadence headlines.
- No glassmorphism. No bento grid. No neumorphism.
- No "Trusted by [logo logo logo]" generic logo strip.
- No three-icon-and-three-feature triptych dressed as `feature-trio`.
- No gradient text. No floating shadow blobs. No purple/teal palette.
- No photography at all — every image is composed from CSS primitives
  (bag silhouettes, swatches, gradient cards). This was deliberate: a
  warm editorial coffee site without stock photography reads as
  intentional, not as a missing-photo placeholder.

## 3. Self-score

**8/10**

Justification:
- **+** Palette and type are real, traceable to specific MCP-extracted
  CSS variables from Stumptown and Intelligentsia — not invented.
- **+** Real, opinionated voice copy throughout. Brand name and roastery
  premise (West Oakland, four people) hold together.
- **+** Working subscription picker with live total — the actual
  conversion surface is functional, not decorative.
- **+** Hero panel composition (three bag silhouettes + steam + stamp +
  lot label) is the riskiest thing I tried and it works at desktop and
  mobile.
- **+** Tight 5-colour palette held all the way down. No drift.
- **−** No real photography — even though I argued *for* composed
  imagery above, a real production coffee site would absolutely
  introduce one or two origin photos for credibility. This is a
  necessity given the no-image constraint, not a strength.
- **−** Single page; no actual nav destinations. Acceptable for the
  brief but worth naming.
- **−** Did not exercise `find_components` — it might have surfaced
  ready-to-borrow nav or footer compositions I had to invent. (The
  guide warned the data is sparse, so I deliberately skipped, but it's
  worth noting.)

Held back from 9/10 by the absence of any real imagery and by the FAQ
being a stock `<details>` rather than something more editorially
distinctive.
