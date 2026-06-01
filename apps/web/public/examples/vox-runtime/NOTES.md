# Larynx — build log

**Slug:** `vox-runtime` (kept as required)
**Brand:** Larynx
**Prompt:** Build a product page for an AI voice-agents platform.
**Stack:** pure-inspo — one self-contained `index.html`, inline `<style>`, ~40 lines of
vanilla JS, Google Fonts via `<link>`. No frameworks, no build step, no external bundles.
**Mode:** dark (warm brown-black, deliberately not the cold blue-black this genre defaults to)

---

## The REDO (why this version exists)

The previous hero used an oversized centered 4-line headline ("Ship voice agents that sound
like they're listening.") that ate the whole viewport and pushed the two CTAs to the very
bottom edge — they were cut off in the 1280×800 thumbnail. That is the single most common
hero failure, and it failed it.

**This rebuild fixes it by composition, not by luck:**

- **Balanced two-column split** instead of a centered monolith. Left = eyebrow + headline +
  sub + CTAs + meta. Right = a compact live-call console. Both columns are vertically
  centered, so the headline never has to be huge to fill the screen.
- **Restrained headline.** `clamp(2.4rem, 4.15vw, 3.85rem)`, lands in **2 lines** at 1280px
  (matches `recommend`'s heroGuidance: "a confident hero headline is ~clamp(2.5rem,5vw,4.5rem),
  not 8rem"). The accent phrase "pick up on the first ring" carries an amber gradient underline.
- **Modest top spacing** (`padding-top: 92px` to clear the absolute nav — no tall empty gap).
- **Measured, not eyeballed.** Rendered headless at exactly 1280×800 and read DOM rects:
  hero = 0→800px (`min-height: 100svh` resolves to one viewport), CTAs sit at **532→578px**,
  meta at 604→623, console 224→638. Everything important lives between 224 and 638 with
  ~160px of breathing room below. Nothing is cut. Re-verified after every edit.

## The premise

**Larynx is the runtime for production voice agents.** Write the agent in code (a prompt, a
voice, the tools it may call), point it at a phone number, ship. The pitch is the *runtime*
layer: sub-300 ms turn-taking, native barge-in, mid-call function calls, and a transcript of
every call. The signature object is a **live phone-call console** — animated waveform, a
two-turn transcript with a live `reschedule_order(...)` tool chip, an "ON AIR · 00:24"
status, and three latency meters (287 ms / barge-in on / 1 tool call live). Not a generic
dashboard.

## How I stayed distinct from "Conduit" (the existing dark-dev-infra entry)

Conduit is: cold blue-charcoal `#0b0d12`, muted saffron `#f0a657`, JetBrains Mono + Inter
Tight + Fraunces, left-headline / right-**dashboard** split. I diverge on every axis:

- **Warm, not cold ground.** True brown-black `#16110B` (traced to anime.js `#252423`,
  pulled darker/warmer) — reads instantly different from a blue-black.
- **Brighter amber accent** `#FFB23B` (ollama `#fcd63e` × anime `--hex-orange-1 #ffa828`) plus
  a warm-orange `#E1762A` (pipe-com `#e1512d`), and a *rare* signal-green `#79D49A` used only
  for "on air" / healthy status. Conduit uses a single muted note.
- **Different type stack:** Space Grotesk (display) + Spline Sans Mono (the dev-genre lingua
  franca) + Inter (body). **No serif at all** — clean separation from Conduit's Fraunces.
- **Different hero object:** a live-**call** console (waveform + transcript + meters), not a
  product dashboard, and a voice/waveform motif throughout (logo glyph, hero visual, brand).

## MCP calls (8 substantive)

1. `search_screens {"query":"AI voice agents developer platform runtime"}` — surfaced the
   voice cluster: **retellai-com**, **vapi-ai**, beam-ai, **daily-co**, launchdarkly-com,
   galileo-ai. Confirmed the genre defaults to blue/indigo — my cue to go warm.
2. `find_by_color {"hex":"#C7402F"}` — warm-red/orange neighbours (rijksmuseum, animejs-com,
   pipe-com via later calls) to anchor the accent away from the cold cluster.
3. `recommend {"brief":"AI voice agents developer runtime … dark warm amber, waveform motif"}`
   — picked **Split Studio** macrostructure; returned the split-screen reference component
   (`clamp(2.5rem, 5.5vw, 4.5rem)` headline) and the **heroGuidance** I built to.
4. `get_design_system {"slug":"vapi-ai","live":true}` — type ramp discipline (h1 80/0.9/-4px
   tracking → tight display, big negative tracking) and dark voice-AI register.
5. `get_design_system {"slug":"animejs-com","live":true}` — the **warm-dark palette source**:
   bg `#252423`, `--hex-orange-1 #ffa828`, coral/corail surfaces. DIN-style geometric display.
6. `find_similar {"slug":"animejs-com"}` — led to **ollama-com** (amber/gold `#fcd63e`
   split-studio, terminal aesthetic, restrained 2-line hero + code-console object).
7. `search_screens {"query":"dark amber orange terminal developer tool waveform", mode:"dark"}`
   — **pipe-com** (`#e1512d` warm orange on near-black, left-headline split).
8. `compare {"slugs":["vapi-ai","ollama-com","animejs-com","pipe-com"]}` — confirmed all four
   share the Split Studio macrostructure; locked spacing (4/8/16) + radius decisions.

Also studied hero **composition** by pulling the actual hero captures for ollama-com,
pipe-com and anime.js: ollama lands a 2-line headline over a single console object;
pipe keeps a modest left headline beside a right visual — both leave generous fold room.
That restraint is what I matched.

## Palette (traced to specific sites)

| token        | hex       | from |
|--------------|-----------|------|
| `--bg`       | `#16110B` | anime.js `#252423` ground, pulled warmer/darker |
| `--bg-card`  | `#221B12` | warm raised surface in same family |
| `--amber`    | `#FFB23B` | ollama `#fcd63e` × anime `--hex-orange-1 #ffa828` |
| `--amber-deep`| `#E1762A`| pipe-com `#e1512d`, warmed |
| `--gold-soft`| `#FCD98A` | ollama `#fce480` raised tone |
| `--signal`   | `#79D49A` | rare status-only green (anime turquoise family) |
| `--ink`      | `#F4ECDD` | warm paper, project editorial convention |

## Type

- **Display:** Space Grotesk (geometric, technical — echoes vapi/anime DIN register without copying)
- **Mono:** Spline Sans Mono (nav, eyebrows, code, meters — the dev-genre lingua franca)
- **Body:** Inter
- Headline tracking `-0.025em`, line-height `1.02`; the genre's tight, confident display treatment.

## Page structure (Split Studio, scrolls below the fold)

1. Hero — balanced split, fits 1280×800 (the whole point)
2. Logo strip — "In production at"
3. How it works — syntax-highlighted `agent.ts` console + 4 numbered steps
4. The runtime — feature trio (barge-in / mid-call function calls / transcripts & replay)
5. Stats band — 287 ms / 19 regions / 99.98% / 60+ languages
6. Observability — live-calls panel (with a "slow tool" amber badge) + checklist
7. CTA — "From `npm i` to a ringing phone in an afternoon" + copyable command
8. Footer

## Responsiveness & a11y

- Verified at **1280px** (2-line headline, full balanced fold) and **390px** (clean single
  column, full-width CTAs, console below). Full-page scroll verified at both widths.
- `prefers-reduced-motion`: confirmed `animation-name: none` — the waveform freezes to a
  static meter and the status pulse stops.
- Sandbox-safe: no localStorage/cookies; the copy button wraps `navigator.clipboard` in
  try/catch and never depends on it. Visuals are pure CSS/SVG — no raster photos.
- Inline SVG favicon (waveform glyph) so there are **zero failed network requests**.
- Console: no errors; 34 waveform bars render; all three fonts load.

## Verification artifacts

Rendered with headless Chrome (via playwright-core in /tmp, driving the system Chrome):
- DOM-rect fold measurement at 1280×800 (CTAs at y 532–578, well above the 800 fold)
- 2× crisp fold, full-page scroll, 390px mobile + mobile full-page
- Network + console + reduced-motion checks all clean
- `thumb.jpg` regenerated at exactly 1280×800 to replace the stale broken-hero thumbnail
