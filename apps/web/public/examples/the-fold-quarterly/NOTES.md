# The Fold — Build Log

**Slug:** `the-fold-quarterly`
**Brand:** The Fold — *A Quarterly of Repair*
**Premise:** An independent print quarterly about the things we keep, mend, and pass on. Issue Seven — *The Repair Issue* — ships 21 June 2026. 168 pp, offset on uncoated Munken Pure, edition of 3,000, printed in Ghent.
**Prompt:** "Design a website for an independent print magazine."
**Stack:** pure-inspo (hand-written HTML + inline CSS + one tiny vanilla JS drawer; Google Fonts only). No frameworks, no Hallmark, no component libraries.
**Register built:** light.

---

## The point of view
Not a generic "magazine" — a *specific* editorial premise. The Repair Issue argues for visible mending (kintsugi, darned sweaters, a Lisbon cobbler). That premise drove every typographic choice: a high-contrast Didone masthead like a newsstand cover, warm uncoated-paper ground, oxblood single accent, gold marginalia — the look of a thing printed on purpose.

## How I used Inspo (MCP calls, in order)
1. `search_screens {"query":"independent print magazine editorial type-forward specimen","limit":8}` — found the editorial cluster. Surfaced **apartamentomagazine-com** (actual print magazine, Specimen macro, lemon/oxblood/paper), **eyemagazine-com** & **logicmag-io** (design mags, newsprint theme), **magazine-b-com** (warm ochre brand mag), **smashingmagazine-com**, **knowablemagazine-org**, **crackmagazine-net**.
2. `recommend {"brief":"Independent print magazine, editorial, big serif type, asymmetric layout, archive index, warm paper"}` — returned a Bento-Grid lean + exemplars; reference component source confirmed the editorial discipline (irregular tiles, "typography supplies the variety, no icons"). Paper suggestion `#c47c6c…` noted but I went warmer/lighter.
3. `get_design_system {"slug":"apartamentomagazine-com","live":true}` — confirmed Specimen macro + the magazine-cover treatment; curated palette `#fcec44 / #9e2118 / #688ea0 / #ddcab1`. (Live frequency palette was WordPress defaults — low signal, ignored per the tool's own warning.)
4. `get_design_system {"slug":"eyemagazine-com","live":true}` — the high-signal type find: real CSS vars `--font-sans: Helvetica` + `--font-serif: Georgia`. The classic grotesque-+-serif editorial pairing → I mapped it to **Archivo** (grotesque) + **Newsreader** (serif).
5. `get_design_system {"slug":"magazine-b-com","live":true}` — warm earth palette `#bf6016 / #8b3810 / #cebda8` ("earthy, muted, warm") → reinforced the paper + gold direction.
6. `find_similar {"slug":"apartamentomagazine-com","limit":6}` — neighbours all Specimen: **amitm-com**, **vanschneider-com** (type-specimen, B/W, single red), plus Apartamento section captures. Confirmed the Specimen page-shape for the hero.
7. `search_screens {"query":"editorial magazine serif display type ramp issue contents masthead","limit":6}` — the **type-specimen** vein: **commercialtype-com**, **ortype-is**, **camelot-typefaces-com**, **rosettatype-com**. These set the genre signature: huge type, hard rules, vast negative space, one hot accent.
8. `get_design_system {"slug":"commercialtype-com","live":true}` + `compare {"slugs":["apartamentomagazine-com","eyemagazine-com","commercialtype-com"]}` — triangulated the house style: **editorial + minimalism + swiss, light mode**, deep ink (`#4c047c` plum) + hot accent. → my `--plum #4C2A4A` is that value muted to sit on paper.
9. `find_by_color {"hex":"#ddcab1"}` — traced the paper. `#ddcab1` is Apartamento's exact muted value (Δ 0.000); the same warm-neutral family recurs in **magazine-b-com** `#cebda8`, **frontierclimate-com** `#d9c9a8`, **fermliving-com** `#daccb8`, **lyfehotels-com** `#dcc8b2`. Verified my paper foundation is real, not invented.

Verification: `get_screen` run on `logicmag-io` and `ortype-is` to confirm those slugs resolve. Every cited reference appeared in a tool result.

## Palette, traced to source
| Token | Hex | Traced to |
|---|---|---|
| `--paper` | `#EFE7D6` | apartamentomagazine-com muted `#ddcab1` (Δ0.000 via find_by_color), warmed toward magazine-b-com `#cebda8` / frontierclimate-com `#d9c9a8` |
| `--ink` | `#211A14` | warm near-black for ink on uncoated paper (the editorial cluster's body register, not pure #000) |
| `--oxblood` | `#9E2118` | apartamentomagazine-com support `#9e2118` (kin to eyemagazine-com `#a10c37`) — THE single accent |
| `--plum` | `#4C2A4A` | distilled from commercialtype-com ink `#4c047c`, muted to fit paper |
| `--teal` | `#466A78` | apartamentomagazine-com `#688ea0`, desaturated |
| `--gold` | `#C68A1E` | logicmag-io `#a5841c` / magazine-b-com `#bf6016` territory — marginalia accent |

## Type system (real editorial faces)
- **Bodoni Moda** (Didone, variable opsz) — masthead + display. The magazine-cover voice from apartamentomagazine-com / eyemagazine-com / the type-specimen cluster.
- **Newsreader** (variable opsz serif) — body + leads. A real publication body serif standing in for eyemagazine-com's Georgia.
- **Archivo** (grotesque) — nav, labels, captions. Maps to eyemagazine-com's Helvetica spine + logicmag-io's Apercu.
- **JetBrains Mono** — folios, the index, the colophon line (periodical metadata register).

## Macrostructure
Built as **Specimen → Index → editorial-split**, all seen in references:
- Hero = Specimen (apartamentomagazine-com): giant Didone "The Fold", asymmetric meta column, edition strip.
- Contents = Index: numbered features, hanging folios, page numbers, hard rules (the contents page of a real magazine).
- Lead essay = editorial-split (logicmag-io split-studio): drop-cap essay teaser beside a *constructed* cover plate (CSS only — ghost "07" numeral, no external image).
- Plus a running marquee strapline, a full-bleed Didone pull-quote band, a stockists/numbers index table, a printed order-card subscribe block, and an imprint colophon.

## The standout move
The **constructed cover plate** in the lead-essay split: a 3:4 "magazine cover" built entirely in CSS — hard ink border, an offset paper drop-shadow, and a giant ghost "07" numeral bleeding off the bottom-right corner behind the cover wordmark. It turns the editorial-split into an actual newsstand object without a single raster asset, which is exactly the apartamentomagazine-com "cover as hero" idea rebuilt from scratch. Paired with the giant Bodoni masthead pulled to the page edge and the italic oxblood ampersand, the page reads unmistakably as a *printed* periodical, not a SaaS landing page.

## Responsive
- 1280px: three-column masthead grid, 1.55fr/0.95fr hero, 4-up edition strip, split features, two-column index tables.
- 390px: hero collapses to single column with an 18ch statement, masthead swaps to a real hamburger + slide-in drawer (vanilla JS, no storage — sandbox-safe), edition strip → 2×2, contents folios narrow to 46px, all split sections stack, sub-form goes vertical. The masthead font clamps down so the giant Didone never overflows.

## Self-score: 8.4 / 10
Strong, genuinely distinctive editorial identity grounded in traced Inspo tokens and real magazine faces; the cover plate + masthead are memorable; fully responsive with a true mobile layout. Held back from higher: it's type/structure-led with no photography (deliberate — a constructed cover instead), and a couple of micro-rhythms (the marginalia gold) could be pushed further across more sections.
