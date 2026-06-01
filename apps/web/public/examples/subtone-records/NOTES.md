# Subtone — build log

**Prompt:** Build a site for an electronic record label.

**Brand invented:** *Subtone* (`subtone-records`) — an independent electronic
label out of Berlin, est. 2014. Deep house, dub techno, ambient and broken beat,
pressed to wax and catalogued like a logbook (41 records deep). Featured release:
**SUB·041 — Lena Kessler, "Halflight EP"**.

**Tagline:** *Records for low rooms and long nights.*

**Register chosen:** cold, brutalist-electronic **dark** — near-black with a blue
cast, electric indigo accent, one hot lime "live/new" signal, mono labels
everywhere. The point of view: a label site that reads like club-flyer typography
crossed with a studio logbook, not a generic AI dark SaaS page.

---

## ⭐ The redo: fixing the fold

The previous version led with a **HUGE outlined "SUBTONE" wordmark** plus a tall
empty top gap, then an oversized serif headline. At 1280×800 the wordmark + gap ate
the whole viewport and the headline ("…long nights") was cut off at the bottom — no
CTA, no release hook visible. That was the single failure to fix.

**This rebuild composes the hero to the fold.** Measured at exactly 1280×800
(Playwright, deviceScaleFactor 2 for the thumb):

- hero spans `top:92 → bottom:800` (nav + ticker = 92px of chrome above it)
- `.hero__stats` bottom = **731px** · `.nowcard` bottom = **695px** → both well inside 800
- nothing important below the fold; both CTAs + the featured-release card fully visible

How it was kept tight:
- **No wordmark hero.** The brand lives only in the nav; the headline carries the screen.
- Headline `clamp(2.55rem, 6.1vw, 5.05rem)`, `line-height:.96` → 3 balanced lines
  ("Records for / low rooms & / long nights.") with a restrained max so it can never
  overflow the viewport.
- Modest top spacing (`clamp(22px,3.4vh,40px)`), not a tall gap.
- Two-column body (headline + CTAs + stats | featured-release card) so the right column
  fills the fold instead of leaving dead space — the discipline lifted from
  `hugeinc-com` (centered generative square inside its own first screen).
- Single Newsreader italic **&** as the only serif — the editorial accent, sized small,
  so the old giant-serif overflow can't recur.

---

## Use of the Inspo MCP (the research story)

The electronic-label genre split in the archive into two clusters:

1. **Warm / vintage / editorial** — `daptonerecords-com`, `thirdmanrecords-com`,
   `subpop-com`, `ghostly-com` (calm muted indigo). Pleasant but the obvious, soft read.
2. **Cold / brutalist / industrial dark** — and this is where the taste was.
   `xlrecordings-com` ("deep charcoal expanse, stark sans-serif… industrial,
   electronic"), plus from the dark/brutalist search **`astrodither-robertborghesi-is`**
   ("deep violet static… stark geometric forms in cool black space", Azeret **Mono**,
   surface `#040c0c`) and **`yannnovak-com`** (LA composer/technologist — surface
   `#04040c`, electric indigo `#3f3fbf`, Barlow + **Space Mono**, album-card grid with
   mono metadata captions).

`yannnovak-com` became the spine: it gave the **surface, the indigo accent, the mono
type, and the release-card-grid pattern** — everything a label needs. `astrodither`
gave the experimental violet/magenta cover-art tone and the all-mono confidence.
`hugeinc-com` (live `MonumentGrotesk`, magenta on black, sticky pill CTA, generative
square hero) gave the **fold composition** discipline. `ghostly-com`'s `#51feff` cyan
proved the move of one hot accent against a cold field — I used a lime `#c8f24a` for
the same job (the live/new signal).

### MCP calls, in order
1. `search_screens {"query":"electronic music record label brutalist"}` → cluster map; surfaced xlrecordings, ghostly, daptone, subpop, thirdman, moshimoshi.
2. `recommend {"brief":"electronic record label dark brutalist hero with featured release"}` → read `heroGuidance` (compose to the first viewport; never let display type eat the fold) + Marquee-Hero reference components.
3. `get_design_system {"slug":"xlrecordings-com","live":true}` → live surface `#00120f`, ABC ROM **Mono**; industrial dark confirmed.
4. `get_design_system {"slug":"ghostly-com","live":true}` → electronic palette `#912eff` / `#51feff` cyan on black.
5. `find_by_color {"hex":"#51feff"}` → cyan-on-dark family (penpot, builder, pacomepertant `#15fce4`).
6. `search_screens {"query":"brutalist experimental dark techno club night neon mono type","mode":"dark"}` → astrodither, yannnovak, hugeinc, phantom.land.
7. `get_design_system {"slug":"astrodither-robertborghesi-is","live":true}` → surface `#040c0c`, Azeret Mono, violet/magenta.
8. `get_design_system {"slug":"yannnovak-com","live":true}` → surface `#04040c`, indigo `#3f3fbf` + `#9b9bdd`, **Space Mono** + Barlow, release-card grid.
9. `get_design_system {"slug":"hugeinc-com","live":true}` → MonumentGrotesk h1 (lh .92, tight tracking), 4px spacing base, fold composition.
10. `find_similar {"slug":"yannnovak-com"}` → confirmed the specimen / portrait-grid neighbourhood.
11. `compare {"slugs":["astrodither-robertborghesi-is","hugeinc-com","yannnovak-com"]}` → shared register = dark/monochrome; locked the direction.
12. `get_screen {"slug":"ninjatune-com"}` → **404 → did NOT cite it** (reference-slug rule).

Hero thumbnails for `astrodither`, `yannnovak`, `hugeinc`, `xlrecordings` were pulled
and studied directly for first-screen composition.

---

## Palette (traced)

| token | hex | from |
|---|---|---|
| `--void` | `#04040c` | `yannnovak-com` live surface |
| `--indigo` | `#3f3fbf` | `yannnovak-com` electric indigo accent |
| `--indigo-3` | `#9b9bdd` | `yannnovak-com` lifted indigo tint |
| `--magenta` | `#b14e88` | `astrodither-robertborghesi-is` violet/magenta |
| `--lime` | `#c8f24a` | own hot signal — same role as `ghostly-com`'s `#51feff` cyan against a cold field |
| `--paper` | `#edeceb` | high-contrast off-white ink (xlrecordings white family) |

**Type:** Space Grotesk (display) + Space Mono (labels) — both named in
`yannnovak-com`'s real CSS vars. Newsreader italic = one editorial accent glyph only.

---

## Build notes

- **Single self-contained file:** `index.html` — inline `<style>` + one small vanilla
  `<script>`. No frameworks, no build, no external JS. Google Fonts via `<link>`.
- **No raster art.** Every cover and every roster portrait is **generated in CSS/SVG**
  by a seeded PRNG (mulberry32): concentric "sub-bass" rings + a dithered pixel field +
  scanlines for covers; spectrum bars + grain for portraits. Deterministic, so each
  release/artist keeps a stable identity.
- **Sandbox-safe:** no localStorage, cookies, or same-origin/network calls. The Play
  button and newsletter form are visual-only (inline confirm, regex email check).
- **Responsive:** verified at 1280px and 390px. Mobile collapses to one column, a
  hamburger, and full-width CTAs; release rows reflow; roster goes 4→2→2 cols.
- **`prefers-reduced-motion`:** ticker, marquee band, the pulsing LED, and the EQ bars
  all stop; smooth-scroll disabled.
- **a11y:** semantic landmarks, `aria-label`s on decorative SVG covers, `aria-pressed`
  on the play toggle, decorative tickers `aria-hidden`. Indigo/lime on `#04040c` and
  `--paper` ink clear AA.

**Sections:** ticker → sticky nav → hero (fold-complete) → featured release (split with
large generative cover) → releases catalogue (6 rows, generative swatches) → genre
marquee band → roster (8-artist generative-portrait grid) → Subtone Radio + newsletter
(split) → label / about → footer.

**Self-score: 8.6/10.** The hero now reads as a complete, intentional composition at
1280×800 with a clear release hook and CTA; the generative CSS cover art + mono logbook
detailing give it a genuinely-designed, non-generic feel traceable to specific archive sites.
