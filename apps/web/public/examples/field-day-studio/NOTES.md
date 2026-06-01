# Field Day — build log

An example landing page for the "Made with Inspo" gallery. Designed using **only**
the Inspo MCP archive as reference — no Hallmark, no templates, no component libraries.

**Brand:** Field Day — an independent design & motion studio.
**Tagline:** "We make brands move."
**Register:** Deep obsidian, type-forward (dark mode).

---

## The brief, distilled

Build a confident, type-forward landing page for an independent creative / design &
motion studio. Give it a point of view (selected work, a few clients, a manifesto
line). The hero must be visually complete inside a 1280×800 fold.

---

## MCP research (10 calls)

| # | Tool | Args | What it gave me |
|---|------|------|-----------------|
| 1 | `search_screens` | `"creative studio agency portfolio bold typography hero"` | The studio cohort: L'Étude, Stinkstudios, Phantom, Bindery, KVS, Podium, General Condition, NB Studio. |
| 2 | `recommend` | brief: studio, type-forward, dark | `heroGuidance` (fold discipline, restrained display max) + exemplars Diffusion Studio, KVS, Brand Appart. Picked macrostructure **Specimen**. |
| 3 | `get_design_system` live | `letude-group` | Tokens: `--color-secondary #ee382b`, `--color-gray #9597a7`, deep `--color-graydark #151515`, `--screen: 100dvh`. |
| 4 | `get_design_system` live | `phantom-land` | `--color-primary #ffffff / --color-secondary #000000`; tight display (h2/h3 lh 0.93). Confirms the stark obsidian register. |
| 5 | `get_design_system` live | `diffusion-studio` | **The high-signal call.** A real motion studio. Geist Variable; radius 0/10/14/26; deep `oklch(20% 0 0)` cards; and a whole **gradient system** — `--gradient-warmday`, `--gradient-horizon`, `--gradient-coast`, `--gradient-daylight`. This is the motion-studio signature I traced. |
| 6 | `get_design_system` live | `generalcondition-com` | The type-forward register: `Right Serif Wide Black` h1 at **180px / lh 0.8**, electric `#fb1c0c`. Confidence reference for giant display type. |
| 7 | `find_by_color` | `#e3884f` | Corroborated the warm accent: Factory `#ec864e` (Δ0.016), Centre Pompidou `#ea8537`, Wellcome `#cb5324`. The ember is real & widely used. |
| 8 | `compare` | diffusion / generalcondition / kvs | Side-by-side: all dark; spacing + type-scale steps; container 1440 across the board. |
| + | visual study | hero PNGs of diffusion / generalcondition / phantom / kvs | **Composition discipline** — see below. |

(`get_screen` not needed separately — every cited slug appeared in `search_screens` /
`recommend` / `find_by_color` results above, so `/screens/<slug>` resolves.)

## Hero-composition study (the point of the exercise)

Looked at the actual fold of four references:

- **Diffusion Studio** — small red eyebrow → crisp 2-line white headline → muted
  gray support line → one outlined CTA → product/work visual carrying a warm radial
  gradient. Everything above the fold, left-aligned, disciplined.
- **General Condition** — giant red serif filling the screen edge-to-edge, framed,
  with a small support block + CTA tucked to one side. Loud and *complete*.
- **Phantom** — full work-index grid (the portfolio register).
- **KVS** — monochrome specimen, mono captions.

**Synthesis for Field Day:** General Condition's *confidence* + Diffusion's
*discipline* + Diffusion's *warm horizon gradient* as the signature. A dark,
type-forward hero where the display type is big but bounded by `clamp()` so it never
eats the viewport, with the gradient behind it reading literally as a "field day" of
light.

---

## Palette — traced to specific Inspo sites

| Token | Hex | Traced from |
|---|---|---|
| `--ink` | `#0A0A0B` | Diffusion Studio card `oklch(20% 0 0)` deepened toward Phantom `--color-secondary #000000` |
| `--ink-2 / -3` | `#111114 / #17171B` | raised panels, one/two steps up |
| `--paper` | `#F4F2ED` | Diffusion `--gradient-daylight` `#f5f3e8`, warmer than Phantom `#ffffff` |
| `--paper-2` | `#B7B5AD` | muted body |
| `--mute` | `#6F6E78` | L'Étude `--color-gray #9597a7`, dimmed |
| **`--ember`** | **`#E3884F`** | **PRIMARY ACCENT** — Diffusion `--gradient-warmday` / `--gradient-horizon` warm node; echoed by Factory `#ec864e` (Δ0.016) via `find_by_color` |
| `--flame` | `#EC3C2C` | L'Étude `--color-secondary #ee382b` / General Condition `#fb1c0c` |
| `--coast` | `#8AD0EB` | Diffusion `--gradient-coast` / `--gradient-horizon` terminal cyan |

The hero/contact glow `--horizon` is Diffusion Studio's `--gradient-horizon`
recreated faithfully (orange→cyan radial). The wordmark/`<em>` fill `--warmday`
is the warmday variant.

## Type

- **Geist** (300–900) — the *actual* typeface on Diffusion Studio. Used for the
  type-forward display (weight 800, lh 0.88, tracking −0.05em) and all UI/body.
- **Geist Mono** — eyebrows, labels, captions, footer meta — in the spirit of KVS
  Studio's SF Mono captions and Diffusion's `--font-mono`.
- Both from Google Fonts via `<link>`. No exotic licensed serif needed; Geist at 900
  carries the studio confidence.

## Geometry

- Radius `14 / 10` — straight from Diffusion's `0/10/14/26` scale.
- Container `1320px` (near the shared 1440, tuned for the 1280 stage).
- Spacing on a 4px base, fluid `clamp()` throughout.

---

## The hero & the fold (the #1 requirement)

- `min-height: 100svh`. Three-row flex column: status row (top) · headline + lede
  (centered, `flex:1`) · clients row (bottom). This keeps the headline optically
  centered while pinning the clients ticker to the fold edge.
- Headline `clamp(50px, 10.2vw, 150px)` — big, but the **restrained max** is the
  whole point: it never overflows 1280×800.
- Modest `padding-top: 84px` clears the fixed nav with no tall empty gap.
- **Verified by rendering at exactly 1280×800 and 390×844** (Playwright). Both folds
  are complete: nav, status, eyebrow, headline, lede, both CTAs, and the clients row
  are all visible, nothing cut. Screenshots reviewed and iterated (bumped the
  headline once for more presence after confirming it still fit).

## Page below the fold (scrolls)

Marquee of services → **01 Selected Work** (5 tiles, all visuals composed from
CSS/SVG — concentric "sonar" rings, a zigzag wordmark path, layered waveforms, a
packaging mock, a type specimen; no raster photos) → **02 Studio** manifesto
(big-type pull quote) → **03 Capabilities** (three cards + a 4-up stats strip) →
**04 Contact** ("Have a field day.") → footer.

## Craft / constraints

- Single self-contained file. Pure HTML + inline `<style>` + one tiny vanilla
  `<script>` (IntersectionObserver reveal-on-scroll). No frameworks, no build, no
  external JS bundles.
- **Sandbox-safe:** no localStorage / cookies / same-origin APIs.
- **`prefers-reduced-motion`:** kills the pulse, marquee, reveal transitions and
  smooth-scroll; reveals fall back to fully visible (also a no-JS / no-IO fallback).
- **Responsive:** verified at 1280px and 390px. Nav collapses to a burger, CTAs go
  full-width, grids reflow to one column, stats to 2-up.
- Only files written live under `public/examples/field-day-studio/`. No edits to
  `lib/examples.ts`, no git, no dev server touched.

## Verified reference slugs (all appeared in tool results)

`diffusion-studio` · `generalcondition-com` · `phantom-land` · `letude-group` ·
`kvs-services` · `factory-ai`
