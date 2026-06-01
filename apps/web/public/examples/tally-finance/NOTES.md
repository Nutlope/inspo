# Tally — build log

A landing page for a friendly personal-finance & budgeting app, designed using **only** the Inspo MCP as reference (no Hallmark, no component libraries, no templates). Single self-contained `index.html` — inline CSS, one tiny vanilla JS reveal, Google Fonts via `<link>`.

## Premise

**Tally** is a warm, consumer budgeting app (explicitly *not* a business bank). The pitch: it turns your spending into one gentle weekly picture — a budget ring, tidy auto-categories, a safe-to-spend number, and a kind Sunday recap. Tone is "money that feels calmer," not spreadsheets-and-guilt. Headline: *Money that feels calmer.*

## How the Inspo MCP shaped it

Ran 9 MCP calls (`recommend`, `search_screens`, `get_design_system` ×4, `find_similar`, `find_by_color`, `get_screen`, `compare`). Key findings:

- **The direct peers lean cold.** `copilot-money` (a real consumer budgeting app) and `qonto-com` / `unit-co` (fintech) all default to indigo/teal — exactly the cold register the brief says to avoid. `recommend`'s `heroGuidance` was the steer for the fold discipline.
- **The warm, friendly register lives elsewhere.** Tracing warmth led to `pi-ai` ("welcoming and approachable," muted earthy + sage green + blush — the clearest match for the brief's emotional target), `owo-app` (warm butter-cream paper, bold rounded type, a "works with your favourite banks" trust strip — a genuinely *friendly* fintech), and `dia-com` (cream + warm brown + Inter Tight UI).
- **Hero composition study.** Viewed the actual hero/full captures for `owo-app`, `copilot-money`, `pi-ai`, `parachutehome-com`. `copilot-money` confirmed the consumer-budgeting pattern: a confident headline beside/above a real product mock (spending dashboard, ring, transactions) with a bank logo-cloud as trust. `pi-ai` confirmed the warm-paper + friendly-display + single-green-CTA discipline. I composed a **left headline + right phone mock** split that completes inside the fold, with the bank trust strip pinned at the bottom of the 100svh hero.

## Palette (traced to specific sites)

| Token | Hex | Traced from |
|---|---|---|
| `--paper` (oatmeal) | `#F5F0E6` | `pi-ai` muted earthy `#d5ccbb` + `owo-app` butter-cream background |
| `--ink` (warm brown-black) | `#2A2118` | `dia-com` `#69411b` + `owo-app` peach-900 `#331a00` |
| `--terra` (primary accent) | `#E0682E` | `pi-ai` `#ee7637`, `owo-app` peach `#ff8000` |
| `--moss` (money/growth green) | `#1E7A52` | `pi-ai` `#15895d` — friendly sage, deliberately **not** cold teal |
| `--blush` (soft detail) | `#F0BBC7` | `pi-ai` accent `#e794b5` |
| `--gold` (one chart series) | `#E0A53A` | warm-gold neighbour of `thecorrespondent-com` ochre family |

Distinctive accent: **terracotta** `#E0682E`, with green reserved for "money/growth" semantics (ring, income, savings). This is the warm, friendly fintech register the brief asked for — not the violet/teal default.

## Type

Friendly **grotesque** display register (matching the consumer-app feel of `owo-app`'s bold rounded Greed and `copilot-money`'s rounded type) rather than a serif — this also keeps Tally visually distinct from the gallery's serif-led bank example.

- **Display / headings:** Bricolage Grotesque (warm, slightly quirky humanist grotesque)
- **UI / body:** Inter (the `dia-com` Inter Tight family, regularised to Inter)
- **Numerals / labels:** JetBrains Mono — financial data and eyebrows love tabular mono

## Hero fits the fold (the #1 requirement)

Verified by rendering at **exactly 1280×800** (headless Chromium): nav, eyebrow, 2-line headline (`clamp(2.5rem,5vw,4.15rem)`, restrained max), supporting line, both CTAs, rating + security trust line, the **complete** phone mock (greeting, £840 budget ring, £62.40 safe-to-spend, transactions, two floating chips), **and** the "connects with 12,000+ banks" trust strip — all visually complete, nothing cut. Also verified at **390×844** (mobile: headline reflows to 2 lines, mock stacks below). Below-fold geometry confirmed via CDP (`docHeight 6716px`; features/how/recap/stats/testimonial/pricing/faq/cta/footer all present with real heights).

## Build details

- Product UI is 100% HTML/CSS/SVG — no raster photos. Budget ring is an SVG `stroke-dasharray` arc; trend chart and bar/category charts are inline SVG/CSS.
- `prefers-reduced-motion` fully respected (the IntersectionObserver bar/fill reveal and float animations no-op; smooth-scroll disabled).
- Sandbox-safe: no localStorage/cookies/same-origin APIs; the only JS is a one-time on-view reveal guarded by `IntersectionObserver` feature-detection.
- Fully responsive at 1280 and 390 (bento collapses 6→3/1 col, steps/recap/quote stack, pricing stacks with Plus first, chips hide on the narrowest widths).

## Reference slugs used (all verified to appear in tool results)

`pi-ai` · `owo-app` · `dia-com` · `copilot-money` · `parachutehome-com` · `thecorrespondent-com`
