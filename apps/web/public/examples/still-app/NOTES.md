# Still — build log

**Prompt:** Build a landing page for a meditation & sleep app.

**Brand invented:** *Still* — a meditation & sleep app built around **one quiet hour**.
The point of view: most apps hand you a library of tracks and a streak counter and
make *you* do the work. Still does the deciding — a single, unbroken sixty-minute
descent (Arrive → Unwind → Wander down → Fade) that ends with you already asleep.
No streaks, no badges, no morning to optimise.

**Tagline:** *The hour before sleep is the one that decides it.*

**Register chosen:** warm **deep-night** ("lamplight in the dark") — not cold tech-dark,
not the soft-pastel Headspace cliché. This is the differentiated, non-generic read for a
product whose whole job is the dark.

---

## Why this direction (the research story)

The genre split cleanly into two clusters in the archive:

1. **Soft warm pastels** — Headspace (`headspace-com`), Parachute (`parachutehome-com`),
   Mooala (`mooala-com`). The obvious, very-AI choice for "meditation app."
2. **Warm deep-night / contemplative** — and this is where the taste was. Searching the
   dark cluster surfaced **David Whyte** (`davidwhyte-com`), a *poet's* site: hairline
   Canela serif headlines, earthy ochre + muted sage, "spacious contemplative depth."
   The color-anchor search around its ochre then pulled a whole luxe-warm-dark family:
   **Flos** (`flos-com`, "deep charcoal expanse… subtly luxurious"), **Louis Poulsen**
   (`louispoulsen-com`, "warm golden liquid light… quiet luxury"), **Huck** (`huckmag-com`,
   "sun-drenched vintage serif").

The lighting brands (Flos, Louis Poulsen) sealed the metaphor: **a warm light in the
dark.** That became the whole page — a breathing lamp glow on a near-black warm field.

---

## MCP calls, in order

1. `search_screens {"query":"meditation sleep calm mindfulness app","limit":8}`
   → mapped the genre. Headspace (pastel/bento), **Eight Sleep** (the literal sleep
   product — "sculpted cool minimalism," Split Studio), Parachute (warm bedding).
2. `recommend {"brief":"calm minimal landing page for a meditation and sleep app…"}`
   → suggested Bento Grid + gave the canonical **bento component source** ("6 irregular
   tiles — varied spans defeat the 3×2 sameness AI defaults to"). Drove my Soundscapes grid.
3. `search_screens {…"deep night dark calm…", mode:"dark"}`
   → most dark hits were techy/cold (LaunchDarkly, Bun, Default) — confirmed those are the
   WRONG calm. The one gem: **`davidwhyte-com`** ("earthy ochre + muted sage, contemplative").
4. `find_similar {"slug":"eightsleep-com"}`
   → split-studio neighbours (Peloton, Bun) — confirmed Split Studio as the macrostructure.
5. `get_design_system {"slug":"davidwhyte-com", live:true}` → **highest-signal call.**
   Canela Text h1 at **weight 100**, line-height 1.1; Canela *Italic* for h2; palette
   ochre `#ad8253` / cream `#d4bda5` / deep brown `#572a06` / sage `#8c999d`.
6. `get_design_system {"slug":"eightsleep-com", live:true}` → ink `#1c0c06`, muted `#ccb4a4`,
   sage `#536c32`; NeueMontreal grotesque, body 17px, base-4 spacing, 1440 container,
   tight heading letter-spacing.
7. `find_by_color {"hex":"#ad8253"}` → the warm-dark luxe family: Louis Poulsen `#d49434`,
   Flos `#2c2014` + `#d5bca3`, Huck. Traced my amber + ink from here.
8. `get_screen {"slug":"davidwhyte-com"}` → verified slug + record.
9. `get_design_system {"slug":"flos-com", live:true}` → ink `#2c2014`; **grain-texture
   overlay** (`--color-background-image: …/grain/white.jpg`) and `--color-light: 244,239,231`.
   Borrowed the faint film-grain idea.
10. `compare {"slugs":["davidwhyte-com","flos-com","louispoulsen-com"]}` → confirmed shared
    DNA: minimalism + editorial, warm earth palettes, Split Studio / Marquee Hero.
11. `get_screen` ×2 to verify `louispoulsen-com` + `huckmag-com` resolve (no 404s).

Also pulled the actual hero captures (David Whyte, Flos, Louis Poulsen, Eight Sleep) and
studied composition: giant hairline serif headline, small serif-italic eyebrow, minimal
sticky nav, a bottom-left "Explore" cue, boxed/ghost CTAs over a warm-lit dark field.

---

## Palette, traced to source

| Token | Hex | Traced to |
|---|---|---|
| `--ink` | `#16110D` | Flos ink `#2c2014`, deepened toward night |
| `--ink-2/3` | `#1F1813` / `#261E17` | warm panels between Flos `#2c2014` and black |
| `--cream` | `#ECE3D6` | David Whyte support `#d4bda5`, lifted for body text on dark |
| `--cream-dim` | `#B6AB99` | David Whyte `#7d5f48` family (muted body) |
| `--amber` | `#D49434` | **Louis Poulsen `#d49434`** — the lamplight accent |
| `--amber-soft` | `#C8A874` | David Whyte support `#ad8253`, warmed |
| `--umber` | `#572A06` | **David Whyte accent `#572a06`** (deep brown depth) |
| `--sage` | `#8C999D` | **David Whyte support `#8c999d`** (cool counterweight glow) |
| paper/grain | `244,239,231` | Flos `--color-light` + a faint fractal-noise overlay |

Single warm accent (amber) + a cool sage counter-glow keep it from going monochrome-brown.

## Type, traced to source

- **Display: Fraunces** (200/300, optical sizing on). A free Google stand-in for David
  Whyte's **Canela** — same high-contrast Didone-ish hairline at low weight, soft serifs,
  contemplative. Used near-hairline (200) for all headlines, italic for the amber accents,
  echoing Canela Text 100 / Canela Italic.
- **Body: Inter Tight** (400–600). A clean grotesque standing in for Eight Sleep's
  **NeueMontreal**; body at 17px, tight tracking on uppercase meta labels.
- Macrostructure: **Split Studio** (David Whyte / Eight Sleep / Flos) for the hero +
  contemplative stack; **irregular Bento** (from `recommend`) for Soundscapes.

---

## The standout move

The hero is a **living, breathing lamp.** A soft radial amber glow sits low-center behind
the hairline serif headline and slowly breathes on a **4-7-8 cadence** (21% inhale, hold,
long exhale) — the exact breath the app's body-scan is paced to, and the page says so. It's
pure CSS (`@keyframes breathe`), mirrored in the closing CTA's lamp, with drifting dust
motes and a faint Flos-style film grain over the warm-night field. So the page doesn't just
*describe* a wind-down — it performs one, and the copy ("the same cadence the light on this
page is breathing") closes the loop. Fully disabled under `prefers-reduced-motion`.

## Craft notes
- Pure single file, no framework/build, no external JS. Google Fonts via `<link>` only.
- No `localStorage`/cookies/same-origin — verified zero console errors in a headless render.
- Genuinely responsive: bento → single column, full-width CTAs, hamburger nav, hidden
  clock, re-stacked stats at 390px. Verified by screenshotting every section at **both
  1280px and 390px** (Chrome DevTools protocol, reveals forced for the static capture).
- Reveal-on-scroll via IntersectionObserver, with a timeout safety-net so content can
  never get stuck hidden in an unusual sandbox.

## Self-score: **8.6 / 10**
Distinctive register that avoids both AI-default pastel-wellness and cold tech-dark; every
token + the type pairing trace to specific captured sites; the breathing-lamp concept is
genuinely on-brief and memorable. Held back from 9 only by being CSS-glow rather than real
photography/footage (the genre's hero captures lean on film), and the proof section's
intentional asymmetry leaves desktop whitespace some will read as empty rather than calm.

## References
- `davidwhyte-com` — the keystone: hairline serif display, ochre/sage/brown palette, contemplative editorial tone.
- `eightsleep-com` — sleep-product structure: Split Studio, ink, grotesque body, base-4 spacing, container width.
- `flos-com` — warm-charcoal ink `#2c2014`, grain-texture overlay idea, luxe dark restraint.
- `louispoulsen-com` — the amber lamplight accent `#d49434` and the "warm light in dark" hero mood.
- `huckmag-com` — corroborated the warm-ochre / burnt-umber editorial register from the color search.
