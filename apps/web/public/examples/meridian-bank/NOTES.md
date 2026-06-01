# Meridian — build log

**Slug:** `meridian-bank`
**Brand:** Meridian
**Tagline:** The business bank that reads like a balance sheet, not a billboard — high-yield treasury, corporate cards, and wires that clear, for founders and finance teams who are done with toy fintech.
**Prompt:** "Create a marketing site for a modern business bank."
**Stack:** pure-inspo (hand-written HTML + inline CSS + one tiny sandbox-safe vanilla script; Google Fonts via `<link>`). No frameworks, no build, no external JS.
**Mode:** light (warm paper)
**Self-score:** 8.4 / 10

---

## The thesis

I searched the fintech cluster first and found the genre defaults to one of three cold registers: **deep violet** (Wealthfront, Astro, Rippling, Deel), **teal/steel** (Qonto, Unit, Ramp, AIR), or **orange-on-near-black dark mode** (Increase, Payhawk). That is exactly the AI-slop the brief warns about — every "modern bank" agent output looks like a crypto dashboard.

The differentiating signal was hiding in the high-value sites. **Mercury** is captured warm: clay `#dcbeae` / `#cdb2aa` over a green-black ink `#0c1c29`, vibe "calm / soft / earthy", Hallmark theme **soft:garden / editorial** — and `get_design_system --live` revealed it actually runs **Tiempos Headline** (a serif display). **Brex** live-extracted to **Flecha** (serif) + Inter + **Space Mono** on warm muted `#ccc4b4` with a burnt `#ff5900`. So the two most credible names in the set both pair a **serif display + grotesk + mono-for-numbers on warm tones** — the opposite of the slop.

`recommend()` confirmed the pattern across the warm Split Studio cluster: **Antimetal** (Test Signifier serif, gold/sand, editorial), **Italic** (Martina Plantijn serif, "Life is luxury", warm sand, soft:garden), **Geex** (Instrument Serif on warm grey), **Dawn** (Source Serif Pro). The move was clear:

> A **warm, paper-toned, editorial private-bank** register — serif display, clean grotesk, mono figures — that reads like a Swiss family bank's balance sheet, not a startup billboard. Macrostructure: **Split Studio** hero (Mercury / Qonto) → **Feature Stack** (Brex) below.

Brand POV follows from the type: Meridian is for people who *reconcile a general ledger* — treasury that earns, cards that close the books, wires that clear, every number in plain tabular figures.

---

## MCP calls, in order

1. `search_screens {"query":"business bank fintech finance dashboard landing page","limit":8}` — surfaced the core cluster: Qonto, Brex, Unit, Wealthfront, Payhawk, Mainstreet, Pleo, Rippling. Established that the genre splits into cold violet / teal / dark-orange.
2. `search_screens {"query":"modern banking finance product UI mock clean","limit":8}` — added Increase (banking APIs, dark, Untitled Sans), Public, Stripe-adjacent. Confirmed product-UI-mock heroes are the norm.
3. `get_design_system {"slug":"qonto-com","live":true}` — real tokens: QontoSans/PolySans, 4px base, radii 0–24, **and a hidden warm layer in its CSS vars** (`--color-sandgolddark:#654d35`, `--color-warning-50:#fff2d9`, `--color-orange-800:#ea9301`) under the cool blue surface.
4. `get_design_system {"slug":"increase-com","live":true}` — Untitled Sans, `--spacing:.25rem` base, tight radii 0/4/8/12. Confirmed the dark-mode default I wanted to avoid.
5. `get_design_system {"slug":"unit-co","live":true}` — Suisse International with **tight negative letter-spacing on headings** (h1 -0.56px), warm cream tokens (`--colour--light-peachy:#fcfacd`), `--colour--dark-green:#053222`. Gave me the moss-green secondary and the tight-grotesk heading instinct.
6. `get_screen {"slug":"mercury-com"}` + `search_screens {"query":"mercury ramp stripe business banking warm minimal"}` — confirmed Mercury's warm clay palette, split-studio macrostructure, soft:garden theme; pulled Ramp/Stripe/Pleo for the wider house style.
7. `get_design_system {"slug":"mercury-com","live":true}` — **the pivotal call.** Mercury runs `--font-tiempos-headline` (serif) + arcadia (grotesk). Proof a serious bank can be warm + serif.
8. `get_design_system {"slug":"brex-com","live":true}` — Brex runs **Flecha (serif) + Inter + Space Mono**, palette `#ffffff / #ff5900 / #15191e / #ccc4b4`. Locked serif-display + mono-figures + burnt accent as a *real* fintech pattern, not an invention.
9. `find_by_color {"hex":"#dcbeae"}` — traced Mercury's clay tone into a coherent **warm editorial cluster**: Knoll (`#d7beb2`, luxe), Brunello Cucinelli (ochre/taupe, "timeless elegance"), Maharishi (sepia serif), Outdoor Voices, Frankie Shop, MoMA. This is the "quiet luxury" paper palette the design leans on.
10. `compare {"slugs":["brex-com","mercury-com","qonto-com"]}` — triangulated the house style: shared `minimalism + brutalism`, light register, Split Studio / Feature Stack macrostructures, ~1440 container, 4px base.
11. `recommend {"brief":"warm, trustworthy business bank ... serif display, paper tones, editorial not crypto, split studio hero"}` — picked **Split Studio**, returned the serif-forward exemplars (Antimetal, Italic, Geex, Dawn) and the canonical Hallmark Split-Screen component (typography half + pure-CSS atmospheric panel, "never invent stock photos") — which I followed for the hero mock.
12. `find_similar {"slug":"mercury-com","limit":6}` — confirmed the Split Studio neighbourhood (Mercury sub-pages, Qonto, Deel) and that the structure holds across a real product's whole site.

**Total: 12 MCP calls.**

---

## Palette, traced to source

| Token | Hex | Traced to |
|---|---|---|
| `--paper` | `#F4F1EA` | warm-paper register from **italic-com** `#d4c5a6` / **antimetal-com** `#c5bba7`, lifted to a true page surface (also the editorial:specimen paper family from the `find_by_color` cluster) |
| `--card` | `#FBF9F4` | raised warm white above `--paper` |
| `--line` / `--line-2` | `#DAD2C2` / `#CABFA9` | hairlines pulled from the same warm sand family (Brex muted `#ccc4b4`, Knoll `#d7beb2`) |
| `--ink` | `#16221C` | **mercury-com** ink `#0c1c29`, warmed toward a green-black to sit on paper |
| `--ink-mute` | `#8C8B7E` | **brex-com** live grey `#60646c` / `#6f737b` family, warmed |
| `--ember` | `#BE4423` | **brex-com** `#fc5c04` / live `#ff5900` + **knoll** `#f4572f`, deepened to a refined private-bank burnt-orange |
| `--clay` | `#DCBEAE` | **mercury-com** accent `#dcbeae` (exact) |
| `--moss` | `#1E3A2B` | **unit-co** `--colour--dark-green:#053222` / **italic-com** `#174e36` — the deep-green "old money" register on the corporate card + security band |
| `--gold` | `#B07A1E` | **antimetal-com** `#d8971f` / **hypereffekt** `#be8222`, for the yield bar gradient terminus |

**Type:** Fraunces (display serif) stands in for Mercury's Tiempos Headline / Antimetal's Test Signifier / Italic's Martina Plantijn; **Inter Tight** (grotesk body) for arcadia / Geist / Suisse; **JetBrains Mono** for all figures, because Brex's Space Mono made mono-for-numbers the genre's literal money signal. (Fraunces + Inter Tight + JetBrains Mono is also the existing gallery house stack — it's the right Google-Fonts cast for these captured faces.)

---

## The standout move

The hero is a **Split Studio** (Mercury/Qonto), but the right half is a fully hand-built **treasury console rendered in pure CSS/SVG** — operating balance in tabular Fraunces with a live-ticking cents counter, an inline SVG yield sparkline with a gradient fill, a four-row transaction ledger (Stripe payout *cleared*, AWS card charge *posted*, a SWIFT wire *sent*, a treasury sweep *interest*), and a floating "Wire approved — 2 of 2 signers" chip. It obeys the Hallmark rule the `recommend()` reference component spelled out — **never invent stock photos; build the atmosphere in code** — so there isn't a single raster image on the page. The whole thing says "this is a tool you reconcile with," which is the brand's entire premise, and the warm-paper + serif + tabular-mono treatment is what keeps it from reading like every other cold fintech dashboard in the archive.

The page then drops into a **Feature Stack** (Brex): a six-up feature grid, two alternating splits (a treasury yield calculator with a real comparison bar — *+$86k/yr vs a big bank*; and a deep-green metal corporate card showpiece), a four-up stat strip in serif numerals, a dark "boring where it counts" security band (the one inverted moment, using `--ink` + `--moss`), three-tier pricing with the burnt-ember featured tier, a CSS-only FAQ, and a clay-gradient end CTA.

## Honesty / constraints
- Renders cleanly at **1280px** (two-column hero + dashboard) and **390px** (hero stacks, dashboard sits below the copy, floating chip and tab overflow drop out, all grids collapse to one column). Breakpoints at 980/900/880/820/760/680/520/430/420.
- No `localStorage` / cookies / clipboard / fetch / external JS — verified. The only script gently increments the balance and bails under `prefers-reduced-motion`.
- Every reference cited below appeared in a tool result above (verified via `get_screen` / search payloads), so no `/screens/<slug>` will 404.
