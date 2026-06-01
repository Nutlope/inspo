# Slowboat Coffee Co. — build log

A single-origin coffee subscription landing page, designed using **only the Inspo
MCP** (~1,287 real production sites) as reference. No Hallmark, no component
libraries, no templates. One self-contained `index.html` (inline `<style>` +
tiny vanilla `<script>`; Google Fonts via `<link>`).

This is **REDO #2**. The previous version's large left-hand display headline
overflowed the fold (cut off at 1280×800). This rebuild keeps the brand, slug,
palette, and the well-built lower page, and **rebuilds the hero to fit the first
viewport** while keeping the coffee-bag product-card visual device.

---

## The fix (the #1 requirement: hero fits 1280×800)

What was wrong before:
- `.hero` used `padding:48px 0 24px` (no `100svh` discipline), a `min-height:540px`
  copy column AND a `min-height:540px` dark panel, and a headline at
  `clamp(56px, 9.2vw, 132px)`. At 1280×800, promo (~40) + nav (~64) + 48 top pad +
  a 132px-capped 3–4-line headline + lede + CTAs + a 4-item stat block + a 540px
  panel blew well past 800px. The headline got clipped.

What this version does:
- `.hero{ min-height:100svh; display:flex; flex-direction:column; justify-content:center; }`
  — the hero owns the full first screen and **centres** its content in the space
  left after the sticky promo + nav, so there's no tall empty gap and nothing
  drops below the fold.
- Headline held to a **restrained** `clamp(40px, 5.2vw, 70px)` at `line-height:1.03`
  → lands in **3 balanced lines** ("Coffee for / people who / *actually* ~~drink~~ it.").
  No oversized display type. `text-wrap:balance`.
- Headline shortened from two sentences to one tight line so it fits cleanly.
- Stat row trimmed **4 → 3** items (72 hrs / 14 / $18) and made compact
  (`clamp(24px,2vw,28px)` numerals) so the left column stays short.
- Right panel reduced from `540px` to `height:min(72svh,560px)` and rebuilt from a
  three-bag scatter into **one composed coffee-bag product card** (cleaner, reads
  at thumbnail size, still the "bag device" the brief liked).
- Hero content carries **no scroll-reveal** — it paints solid immediately (only
  below-fold sections animate in).

### Verified (Playwright/Chromium at exactly 1280×800)
- Hero section height: **800px** (== viewport).
- CTAs bottom: **670px** · stat row bottom: **773px** · panel bottom: **795px**.
- All three `withinFold` checks: **true**. Nothing important below the fold.
- Re-checked at **390px**: headline scales to the 40px floor, CTAs stack, stats
  wrap, panel flows below. Mobile hero is allowed to scroll (the fold guarantee is
  a desktop contract — that's the dimension the gallery thumbnail renders at).
- The 1280×800 thumbnail (`thumb.jpg`) was regenerated from this corrected hero.

---

## Palette — traced to specific Inspo sites

| Token        | Hex       | Traced from |
|--------------|-----------|-------------|
| `--ink`      | `#1F1815` | **stumptowncoffee-com** live CSS var `--subscribe-section-heading: #1f1815` (exact) |
| `--paper`    | `#F4F0E8` | warm paper, in the family of stumptown `#f6f5f3` / intelligentsia `#fcf4ed` |
| `--cream`    | `#FBF7EE` | stumptown `--subscribe-filter-pill-active-text: #f6f5f3` family |
| `--mustard`  | `#C0A868` | **stumptowncoffee-com** live CSS var `--subscribe-card-hover-bg: #bfac7b` / `#c0a868` (exact) — the distinctive accent's anchor |
| `--rust`     | `#B9412B` | **stumptowncoffee-com** palette `#b93826`; corroborated by **intelligentsiacoffee-com** `#d42927` red |
| `--rust-deep`| `#8E2E1B` | darker shade of the above for hovers |
| `--ink-soft` | `#3A2E26` | **fellowproducts-com** warm browns `#5a3c29`/`#82563c` family |

Distinctive accent = the **rust/terracotta `#B9412B`** (Stumptown red), with the
**mustard `#C0A868`** (Stumptown's exact card-hover gold) as the warm secondary —
both pulled from the live design-system dump, not guessed.

## Fonts (`get_design_system live:true`)
Stumptown's live stack is bespoke (Windsor, GT Flexa, STC-Adso) and not on Google
Fonts. To honour that **warm playful-serif + clean-grotesque** pairing with
available faces, I used:
- **Fraunces** (display/serif) — optical serif with the same warm, slightly
  playful Windsor-adjacent character; `opsz` set high for headlines.
- **Inter Tight** (sans/body) — clean grotesque, the role GT Flexa plays on
  Stumptown.
- **JetBrains Mono** (labels/eyebrows/specs) — the editorial mono detailing seen
  across the coffee/editorial cluster (lot numbers, "No. 17", spec rows).

(This trio is also the house editorial system for this workspace.)

## Hero composition discipline (studied from real coffee/editorial heroes)
- **intelligentsiacoffee-com** — left-aligned headline in 2 lines + short
  supporting line + a **single** CTA, all complete in the upper-left of its first
  screen. This is the restraint model I matched: modest type, no overflow.
- **stumptowncoffee-com** — Split Studio: headline on one side, **coffee-bag**
  product visual on the other, both balanced to the fold; warm ink + gold. Source
  of the bag device and palette.
- **fellowproducts-com** — lowercase warm headline left, single product visual
  right, modest top spacing. Confirmed the "visual on one side" balance.
- **seriouseats-com** — warm ochre/charcoal editorial split (food/coffee register).

## Layout
- Split hero (≈1.06 / 0.94), vertically centred at `100svh`.
- Below the fold (scrolls normally): announcement ticker → "How it works" (3
  numbered steps, Intelligentsia-style) → three house-roast cards (CSS-composed
  swatches + bean glyph) → an interactive **plan picker** (roast / bags / cadence /
  grind with live price) → testimonials → journal strip → FAQ (`<details>`) →
  newsletter + footer.

## Constraints honoured
- No raster photos. The coffee bag, roast swatches, bean glyphs, steam, and
  journal covers are **all CSS/SVG**. Paper grain is an inline SVG `feTurbulence`.
- Sandbox-safe: no `localStorage`, cookies, or same-origin APIs. The only JS is a
  plan-picker toggle/price calc and an IntersectionObserver reveal that **never
  hides above-fold content** (degrades to fully-visible if JS doesn't run).
- `prefers-reduced-motion: reduce` pauses the announcement ticker and turns off
  the rising steam, the rotating "roasted this week" stamp, and all scroll reveals.
- Responsive and composed at **1280px** and **390px**.

## MCP calls (≥5)
1. `recommend` (brief: single-origin coffee subscription) — read `heroGuidance`
   ("fit the FIRST VIEWPORT… never let display type eat the viewport").
2. `search_screens` "coffee roastery subscription" — surfaced the coffee cluster:
   bluebottlecoffee-com, intelligentsiacoffee-com, stumptowncoffee-com,
   fellowproducts-com, seriouseats-com.
3. `get_design_system` **stumptowncoffee-com** `live:true` — exact tokens
   `#1f1815`, `#c0a868`/`#bfac7b`, `#b93826` + real font stack. (Highest signal.)
4. `get_design_system` **fellowproducts-com** `live:true` — terracotta `#9d523a`,
   warm browns; Specimen macrostructure.
5. `get_design_system` **intelligentsiacoffee-com** `live:true` — fonts
   (urw-din / rotunda), reds `#d42927`, warm `#fcf4ed`.
6. `find_by_color` `#C0A868` — confirmed the warm-gold family across the archive.
7. `get_screen` **stumptowncoffee-com** — verified slug + Split Studio.
8. `find_similar` **stumptowncoffee-com** — split-studio neighbours (Balenciaga,
   Karen Walker) confirming the product-on-one-side hero pattern.
9. `compare` stumptown vs intelligentsia — both light, minimal+editorial, warm.

All cited slugs appeared in tool results (so `/screens/<slug>` won't 404).
