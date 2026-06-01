# Subtone — build log

**Prompt:** "Build a site for an electronic record label."
**Slug:** `subtone-records`
**Brand invented:** **Subtone** — an independent electronic record label, "Berlin, est. 2014." Deep house / dub techno / ambient / broken beat. Pressed to 180g wax, catalogued obsessively. Catalogue numbering `SUB-001 → SUB-041`. Featured release: **SUB-041 · Lena Kessler — "Halflight EP"**. Founders: M. Voss & Atria, Neukölln.
**Stack:** pure-inspo (one self-contained HTML file, inline CSS, ~60 lines of vanilla JS, Google Fonts via `<link>`). No frameworks, no build, no external JS, no images — all cover art is generated in CSS.
**Mode:** dark.

---

## The premise / standout move

Most "AI record label" pages reach for a streaming-app grid of stock album art. Subtone instead takes the **gallery-quiet, catalogue-obsessed register of real label sites** (Ninja Tune, XL, Ghostly) and pushes it through a **brutalist type-specimen hero** — the way artist/foundry sites in the archive open (Yann Novak, Cognition, Swiss Typefaces).

Two moves carry it:

1. **The wordmark hero.** `SUBTONE` is split into an outlined `SUB` (`-webkit-text-stroke`) + a solid indigo `TONE`, then "low rooms," is set in an italic **serif** dropped into an otherwise grotesk headline — the mixed-weight / mixed-style display trick lifted directly from **swisstypefaces-com** ("Big $ea / Dust Col / Low Rif" in alternating outline/fill/italic). It immediately reads "label with a typographic point of view," not "SaaS template."

2. **Zero-image, fully-generated cover art.** The featured release is a glowing concentric-ring "sub" record built from radial gradients + SVG-noise grain. The catalogue grid generates 8 deterministic covers from a per-record seed across four compositional styles (concentric rings / diagonal split / horizon bands / off-axis sun) and a coherent palette set anchored on the house indigo. The result is the *varied-but-coherent* density of the real **ninjatune-net** catalogue wall — with nothing loaded from the network. That keeps it dead-fast and perfectly sandbox-safe (no same-origin, no storage, no external assets).

---

## MCP calls, in order

| # | Tool | Args | What it gave |
|---|------|------|--------------|
| 1 | `search_screens` | `{"query":"electronic music record label","limit":8}` | The genre cluster: **xlrecordings**, **ghostly**, **moshimoshimusic**, **daptonerecords**, **thirdmanrecords**, beatport, spotify. Established that real label sites trend dark/monochrome, hero-fullbleed + portfolio/bento grid. |
| 2 | `search_screens` | `{"query":"brutalist experimental dark high contrast typography","limit":8}` | The brutalist cluster: **cognition-ai**, **leonardo-ai**, method, trychroma, tonal, olsonkundig. Gave me the dark type-specimen register + bracketed oversized type. |
| 3 | `get_design_system` | `{"slug":"ghostly-com","live":true}` | Electronic-label tone (muted, monochrome, portfolio-grid). Live fetch timed out; used captured palette only. |
| 4 | `get_design_system` | `{"slug":"cognition-ai","live":true}` | **High signal.** Live fonts: **GeistMono + nbInternational + stkBureauSerif** (mono + grotesk + serif). Live palette incl. off-white `#edeceb`. Confirmed the mono/grotesk/serif editorial-technical stack and dot-grid + bracket-type hero. |
| 5 | `search_screens` | `{"query":"techno rave club night experimental electronic acid neon","limit":6}` | Surfaced **yannnovak-com** (electronic artist, dark, real fonts) and **beatport-com** (dark club platform, electric accent). |
| 6 | `get_design_system` | `{"slug":"yannnovak-com","live":true}` | **Highest signal.** Real fonts **Barlow + Space Mono**; the actual CSS var `--wp--preset--font-family--barlow: "Barlow", "Space Grotesk", sans-serif` → justified **Space Grotesk** as display. Real tokens: surface `#04040c`, indigo `#3f3fbf`/`#9b9bdd`, container `1400px`, radius `0/3px`, mono buttons at `12px / .8px tracking`. This is the structural + palette backbone. |
| 7 | `get_design_system` | `{"slug":"phantom-land","live":true}` | Brutalist dark confirmation: Helvetica-Now grotesk, h2/h3 `56px / line-height .93`, radius `0`, `--color-primary:#fff / --color-secondary:#000`. Validated tight-leading oversized grotesk headings. |
| 8 | `find_similar` | `{"slug":"yannnovak-com","limit":6}` | Neighbours (ottografie, vanschneider, pacomepertant) — all specimen macrostructure, near-black + single chroma accent. Confirmed the house pattern is real and repeated. |
| 9 | `search_screens` | `{"query":"oversized type marquee ticker index list catalogue numbered","limit":6}` | **swisstypefaces-com** (marquee hero, mixed-weight display) + ortype/commercialtype (type-specimen). Sourced the marquee ticker + mixed outline/fill/italic headline. |
| 10 | `compare` | `{"slugs":["yannnovak-com","cognition-ai","beatport-com"]}` | Triangulated the house style: shared `minimalism`, specimen macrostructure on the artier two, `Ecosystem Index` density from beatport. Gave concrete scales to borrow (5 type steps, container 1400). |
| 11 | `find_by_color` | `{"hex":"#3f3fbf"}` | **Palette proof.** `#3f3fbf` on `#04040c` is an exact, real, repeated pairing — **scale-com Δ0.000**, yannnovak Δ0.000. Also surfaced **ninjatune-net** (real electronic label, dark album-art catalogue grid, "music catalog") — my closest genre+structure reference. |
| 12 | `get_screen` | `{"slug":"ninjatune-net"}` | Verified ninjatune for citation; confirmed dark, grid-of-album-art, indigo `#1042bd`, "gallery-like" catalogue. |

(12 calls total — well past the ~5 minimum. Hero captures of yannnovak, cognition, beatport, ninjatune-full and swisstypefaces were pulled and viewed to internalise the visual register.)

---

## References (all verified present in tool results — `/screens/<slug>` resolves)

- **yannnovak-com** — *the backbone.* Near-black `#04040c` surface, electric indigo `#3f3fbf`/`#9b9bdd`, Space Mono labels at tight tracking, the metadata-row catalogue layout (title / album / year), 0–3px radius. Most of Subtone's token set traces here.
- **ninjatune-net** — *the genre + structure proof.* Real electronic label; its dense, gallery-like wall of album art is exactly the catalogue grid I built (and its teal `#1d6d59` seeds one of my cover palettes).
- **cognition-ai** — *the brutalist register.* Live fonts (mono + grotesk + **serif**) justified my three-family system; dot-grid hero background and the bracketed/oversized type move; off-white ink `#edeceb`.
- **swisstypefaces-com** — *the hero move.* Marquee macrostructure + the mixed outline/fill/italic oversized headline → my `SUB`(outline) `TONE`(indigo) + italic-serif "low rooms,".
- **beatport-com** — *the club-platform energy.* Dark surface + electric accent + dense release rows; reinforced "loud, catalogued, electronic" over "calm SaaS."
- **phantom-land** — *grotesk discipline.* Tight-leading oversized grotesk headings (lh ~.93), radius 0, pure black/white token base.

---

## Palette, traced to source

| Token | Hex | Traced to |
|-------|-----|-----------|
| `--void` (surface) | `#04040c` | **yannnovak-com** surface + **scale-com** (Δ0.000 on the indigo pairing via `find_by_color`) |
| `--void-2/3`, `--line`, `--line-2` | `#07070f` … `#26263a` | Derived dark ramp off `--void` (rounded to a consistent step), matching the hairline-on-near-black look of yannnovak / ottografie |
| `--paper` (ink) | `#edeceb` | **cognition-ai** live palette (off-white) |
| `--paper-d/m` | `#a9a9b8` / `#6c6c82` | Dim/mute ink steps (yannnovak greys `#848484`/`#b4b4b4` region) |
| `--indigo` (accent) | `#3f3fbf` | **yannnovak-com** electric indigo — exact value |
| `--indigo-2` | `#5a5ad6` | Lift of the accent for hover |
| `--indigo-3` (tint) | `#9b9bdd` | **yannnovak-com** lifted indigo — exact value |
| `--lime` (signal) | `#c8f24a` | **typesense-org** `#bbf258` — one hot accent, used only for "New"/live dots |

Cover-art palette set (in the JS): house indigo, plus teal seeded from **ninjatune-net** `#1d6d59`, violet, graphite, magenta-dusk, deep-blue, a single warm amber, moss — kept low-saturation and dark so the grid stays coherent.

---

## Typography (real, from get_design_system)

- **Display + UI:** **Space Grotesk** — named in yannnovak-com's actual CSS var `--wp--preset--font-family--barlow: "Barlow", "Space Grotesk", sans-serif`; stands in for cognition's nbInternational / phantom's Helvetica Now grotesk register.
- **Labels / data:** **Space Mono** — yannnovak-com's real button font (`12px`, tracked). Used for the ticker, eyebrows, catalogue numbers, stats, footer.
- **Editorial accent:** **Newsreader** (italic) — echoes cognition-ai's live **stkBureauSerif**; used for artist names and the manifesto pull-quote to break the grotesk/mono with a literary note.

---

## Macrostructure

Specimen hero (yannnovak / cognition) → featured-release editorial block → **dense catalogue grid (ninjatune)** with per-tile metadata rows (yannnovak) → roster **index list** (type-specimen) → serif manifesto band → plain-text dispatch signup (the newsletter-signup component seen across the label cluster) → footer with a giant outlined `SUBTONE` outro. A **marquee ticker** (swisstypefaces) tops the whole thing.

---

## Responsiveness & sandbox safety

- Verified by headless render at **1280px** (desktop tile + detail) and **390px** (mobile tile). Above-the-fold is striking at both; the hero headline was retuned at ≤560/≤380 so "long nights" never clips.
- Catalogue grid: 4-col → 3-col (≤920) → 2-col (≤560). Featured block, subscribe band and footer all collapse to single column; roster condenses to name + tags.
- No `localStorage` / `sessionStorage` / `cookie` / `indexedDB`; no external JS; no images. Subscribe form acknowledges inline (no network, no storage). `prefers-reduced-motion` disables the marquee. Confirmed zero sandbox-unsafe APIs by grep.

---

## Self-score: **8.6 / 10**

Strengths: genuinely non-generic hero with a real typographic idea; the zero-image generative cover system gives the dense-catalogue feel of a real label while staying fast and sandbox-pure; every token and font traces to a verifiable captured site; both widths are considered, not squished. Two things keeping it short of a 9+: the procedural covers are striking but obviously generative (a real label would have photography/art direction), and the page is single-locale English with invented copy. Within the constraints (pure Inspo, one file, no assets) it lands as a believable, opinionated independent-label site with attitude.
