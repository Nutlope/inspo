# Ceramics studio — Inspo-only run

Brief: "Design a ceramics studio site."
Studio invented: **Kiln & Bough** — a two-person stoneware studio in a converted dairy barn outside Hudson, NY.

## 1. MCP calls + what I took from each

All calls via `cd /Users/youssef/Inspo-design/apps/mcp && pnpm exec tsx src/call.ts <tool> '<args>'`.

| # | Tool | Args | What I took |
|---|---|---|---|
| 1 | `search_screens` | `{query:"ceramics pottery studio handmade", limit:8}` | Heath Ceramics is the obvious anchor — warm tones, ample whitespace, restrained type. Also surfaced multiple studio/atelier sites (Studio Gang, NB Studio, Antinomy Studio) showing how craft studios commonly use a split-layout with one heroic image + a restrained left text column. |
| 2 | `search_screens` | `{query:"artisan craft warm editorial earthy minimal", vibe:"warm", limit:6}` | Confirmed the warm/earthy/calm/soft trio is the right vibe cluster. Fellow Products and Alden Shoe both lean on muted browns + cream + a single saturated terracotta-red accent. |
| 3 | `find_similar` | `{slug:"heathceramics-com", limit:6}` | Mostly Heath sub-pages — useful for understanding their grid (large hero, mid-weight serif headings, copy set in a sans with generous leading, very small all-caps mono for meta info). |
| 4 | `get_design_system` | `{slug:"heathceramics-com", live:true}` | Heath's *actual* live palette is far more muted than the heuristic palette (`#26211b`, `#f5f4ee`, `#d1ccc6`, `#9a8d81`, `#dd5640`). Live fonts: Benton Sans + Monaco. This was the highest-signal data point — I used it to set my paper/ink/clay tokens instead of the louder yellow-gold hero crops. |
| 5 | `search_screens` | `{query:"editorial serif natural materials atelier studio", style:"editorial"}` | Re-surfaced Studio Gang & Antinomy. Antinomy's pale-clay/tan/warm-grey palette (`#b48944`, `#dac39e`, `#917f60`) reinforced the warm-paper direction. |
| 6 | `search_screens` | `{query:"editorial magazine large serif clay terracotta"}` | Apartamento + Magazine B — both use very large display serif as the hero. Apartamento in particular gave me the idea to lean hard on an italic display serif for one accent word per heading. |
| 7 | `get_design_system` | `{slug:"aldenshoe-com", live:true}` | Confirmed the editorial-heritage colour move: a deep oxblood as ink/structure plus warm cream paper plus a single rust-orange accent. |
| 8 | `get_screen` | `{slug:"apartamentomagazine-com"}` | Used the full record to confirm the "specimen" framing — one big object, generous margin, all chrome pushed to the edges. |
| 9 | `search_screens` | `{query:"shop wares table objects collection light beige cream"}` | The Frankie Shop and Fellow Products surfaced again — the warm-cream + saturated-terracotta colour-story is well-trodden in the artisanal-commerce space. Confirmed I wasn't off-piste. |
| 10 | `search_screens` | `{query:"furniture wooden handmade workshop earth tones"}` | Artek's `#866b4b` warm-wood neutrals + the very tight, almost lowercase wordmark were a tiny influence on the brand mark direction (I went with a small clay-pellet glyph instead). |
| 11 | `list_collections` / `get_collection` (editorial-layouts) | `{}` | The editor blurb — *"sites that read like printed objects. Drop caps, single columns, footnotes set in mono"* — gave me explicit permission to lean into the mono small-caps meta labels and the "№ 01 — The Summer Collection" eyebrows. |

I read the live thumbs from Heath, Apartamento, Alden, and Artek directly to confirm composition (single hero + ample air on Heath, big italic display serif on Apartamento, dark espresso top frame on Alden, centered wordmark over photography on Artek).

I did **not** call `recommend`, `find_reference_components`, `get_reference_jsx`, or `find_examples_for_macrostructure`, and I ignored the `macrostructure` / `hallmarkTheme` / `tags.components` fields in every response.

## 2. Design rationale

**Studio identity.** "Kiln & Bough" — *kiln* for the firing process, *bough* for the studio's wooded setting. Greenport, NY (real town near Hudson) grounds the copy. Two named makers (Margit Roth & Owen Kessler) so the about copy isn't generic.

**Palette.**
- `#f3ede4` warm paper (lifted from Heath's live `#f5f4ee`, knocked very slightly warmer).
- `#1f1813` near-black espresso (Heath's `#26211b`).
- `#a44a25` terracotta (a tighter, more saturated reading of Heath's `#dd5640` / Alden's `#ad411a` / Antinomy's `#b48944` family).
- `#3a4a32` mossy green as the single cool note (used only for the "Garden series" badge — earned, not decorative).
- `#c98b3b` gold for the dark-section eyebrow accent.

**Type.** Fraunces as the display serif because:
1. It's a variable font with `SOFT` and `WONK` axes, which lets me push the italic version into a more *handwritten*, ceramic-y register for accent words ("hands.", "clay.", "barn.", "kiln week.").
2. It has the warmth of a foundry serif but reads clean at small sizes.
3. Inter Tight for body keeps things modern without competing with the serif.
4. JetBrains Mono for the small-caps mono meta labels, taking the cue from the editorial-layouts collection blurb.

**Layout.** Six distinct sections, each with a numbered eyebrow ("№ 01 — The Summer Collection"), thin hairline rules, and an asymmetric two-column header (title left, aside right). This rhythm came directly from looking at how Studio Gang, NB Studio and Apartamento sequence their pages — each section reads like a chapter, with a hard rule above and ample breathing room below.

- **Util bar + nav** — Heath puts a thin dark utility bar above the warm-paper nav; I borrowed the move because it gives the page a definite "top edge" before the wide hero.
- **Hero** — display serif + italic accent + small mono meta row, with a single tall ceramic photograph on the right. Lifted directly from the Heath/Artek pattern.
- **Marquee ribbon** — italic serif factoids on a slightly darker paper stripe. Gives the page a small editorial breath between hero and grid.
- **Collection grid** — six pieces, 12-col masonry with `span-3/4/5` widths so no two rows are identical. Card body is paper-toned, separated from the image by a hairline. Price + size are set in serif/mono — this is the move that immediately reads as "boutique studio" rather than "Shopify default."
- **Dark maker section** — full-bleed espresso with a real ceramicist portrait, italic terracotta accent in the title, a left-rule blockquote. Borrowed the dark interlude move from Magazine B's product spread.
- **Process** — four small steps in a hairline-divided table. Read like notes from the studio rather than marketing copy.
- **Journal** — three cards, no descriptions, just title + tag + meta. Restrained on purpose, the way Apartamento under-explains its issue covers.
- **Visit** — the only section I let get *playful*: a fake topographic map (CSS-only repeating gradients) with a pin and a floating address card. Maps are usually iframes; doing it in CSS keeps the page one self-contained file *and* feels more like a hand-drawn studio illustration.
- **Newsletter** — single centered display headline with italic accent + a thin pill-shaped form. The note "twelve letters a year · unsubscribe in one click" is the sort of copy a real small studio writes.
- **Footer** — dark, four columns, italic terracotta-gold "Bough" inside the wordmark. The bottom rule ends with "Site built with patience" because real small studios sign their footers.

**Imagery.** Hero, collection grid, maker portrait, and all three journal cards use real Unsplash photographs that I verified individually with `curl -I` before committing. I had to find replacements after my first guess at URL slugs returned 404s — used `WebFetch` against `unsplash.com/photos/<id>` pages to extract canonical `images.unsplash.com/photo-...` URLs from a known-good slug list.

**Real copy.** No lorem ipsum anywhere. Studio history, kiln process, glaze recipes, opening hours, throwing-demo times, address (118 Mill Creek Rd, Greenport NY 12534 — invented), an italic-set "Margit, 2026" quote, and a Penland School reference (which is a real ceramics school) all sit in their right places.

**Micro details that matter.**
- A small pulsing terracotta dot on the "Wood-fired this week" pill.
- Hover state on the hero photograph (subtle 1.06× zoom with mouse-following offset), gated behind `prefers-reduced-motion`.
- Three different "piece badge" colours (`clay`, `bough`, default) so the row reads as a curated rack of stock rather than a uniform grid.
- The brand wordmark sits next to a tiny `EST. MMXIX` in JetBrains Mono — the kind of date glyph a print designer would set.
- The `Open Saturdays` headline italicises *Saturdays* alone — a print typesetter's move.
- Footer copyright is in Roman numerals (MMXXVI), matching the EST. mark.

## 3. Self-score

**8.0 / 10**

Justification:
- **What works (the 8):** The page reads convincingly as a real production studio site. Hierarchy is calm and editorial; the palette is restrained and earned (sampled from Heath's live extraction, not guessed); the type ramp is decisive (one serif display + one sans body + mono meta — no font soup); imagery is real and on-brief; copy is concrete (named makers, real-looking address, real-sounding glaze names) rather than vague; mobile collapses cleanly; the dark maker interlude gives the page a definite middle act; the visit/map section has actual personality rather than being a Google Maps embed; the footer signs off in a way a small studio would. Six distinct sections each carry their own weight.
- **Why not a 9:** The collection grid is competent but not surprising — six cards of broadly the same shape, which is a safer move than Heath's actual mixed-aspect grid. The fake CSS topographic map is a fun flourish but reads slightly "designer indulgence." The plate stage in the hero uses a single photograph rather than something more interactive or composed. There's no actual product-detail page, no quick-view modal, no add-to-cart UX — this is a landing page, not a storefront, which is fine for the brief but limits depth.
- **Why not lower:** I didn't lean on any taxonomy vocabulary (no `split-studio`, no `editorial:atelier`, etc.) and didn't read Hallmark templates or reference components. The design decisions all trace back to specific things I saw in the Inspo screenshots: the dark utility bar on Heath, the italic display serif on Apartamento, the rust-on-cream on Alden, the editor's "drop caps and footnotes set in mono" blurb from the editorial-layouts collection. The output stands on its own without leaning on the design skill's recipes.

The page is at `index.html` in this directory.
