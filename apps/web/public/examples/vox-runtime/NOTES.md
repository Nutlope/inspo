# Larynx — build log

**Slug:** `vox-runtime`
**Brand:** Larynx (renamed from the suggested "Vox"; slug kept as required)
**Prompt:** Build a product page for an AI voice-agents platform.
**Stack:** pure-inspo — single self-contained `index.html`, inline `<style>`, ~30 lines of vanilla JS, Google Fonts via `<link>`. No frameworks, no build step, no external bundles.
**Mode:** dark (warm brown-black, not the cold blue-black this genre defaults to)

---

## The premise

**Larynx is the runtime for production voice agents.** Write the agent in code, point it
at a phone number, deploy. The developer angle is the whole pitch: sub-300ms turn-taking,
native barge-in, mid-sentence function-calling, and a full transcript of every call —
delivered as a *runtime layer* so the agent code stays a dozen lines. The signature object
is a live phone-call console (transcript + latency meters + animated waveform), not a
generic dashboard.

## How I stayed distinct from "Conduit"

I read the existing `conduit` gallery entry first. It is: cold blue-charcoal `#0b0d12`, a
single saffron accent `#f0a657`, JetBrains Mono + Inter Tight + Fraunces, and a
left-headline / right-dashboard split. To diverge on every axis:

- **Warm, not cold ground.** True brown-black `#16110B` (traced to gehry-getty's ochre-dark
  warmth + netlify's `#181a1c`), pulled deliberately warm. Reads instantly different from
  Conduit's blue-black.
- **Brighter, more amber accent** `#FFB23B` (phosphor amber) vs Conduit's muted saffron, plus
  a *rare* second functional note — an "on air" signal-green `#7FD49A` used only for
  live-call status. Conduit uses one note.
- **Different type stack:** Space Grotesk (display) + Spline Sans Mono (the genre's lingua
  franca) + Inter (body). No serif at all — clean separation from Conduit's Fraunces italics.
- **Different hero composition:** centered headline over a *live-call transcript console with
  an animated waveform*, not a right-side product dashboard.

## MCP calls, in order

1. `search_screens {"query":"AI platform developer product dark","limit":8}` — surfaced the
   whole AI/devtool cluster: retellai, launchdarkly, galileo-ai, beam-ai, hightouch, hex-tech,
   featurebase, diffusion-studio. Confirmed the genre default is **indigo/blue on charcoal** —
   exactly what I wanted to avoid.
2. `search_screens {"query":"voice agent calls audio waveform","limit":8}` — the direct
   competitors: **retellai-com**, **vapi-ai**, daily-co, otter-ai, beam-ai, animaapp. Told me
   the voice-AI lane is saturated with blue/indigo; a warm amber would own the category visually.
3. `get_design_system {"slug":"vapi-ai","live":true}` — pulled the real **avantt** display ramp
   (h1 80px / weight 600 / line-height 0.9 / letter-spacing −4px) and **Geist Mono** as the
   mono. This ramp (huge, tight, near-1.0 leading) is the basis for my Space Grotesk hero.
4. `get_design_system {"slug":"daily-co","live":true}` — real **DM Sans + DM Mono** pairing
   and a coral/rose accent `#dc3d64`; confirmed mono-as-lingua-franca for the genre.
5. `find_by_color {"hex":"#e8a13c"}` — tested whether amber lives in the archive. Returned
   **netlify-com** (apricot-on-charcoal) and **gehry-getty-edu** (brutalist ochre-dark with
   Roboto Mono) among warm-amber sites. This *earned* the amber-on-dark direction with real
   captures.
6. `search_screens {"query":"developer tools terminal dark amber warm monospace","limit":6}`
   — surfaced **netlify-com** explicitly: "Deep charcoal canvas … luminous apricot accents,"
   `#f9b23b`. The exact warm-dark-devtool register I built.
7. `get_design_system {"slug":"netlify-com","live":true}` — live tokens: real dark ground
   `#181a1c`, **Martian Mono** in the font stack, brand apricot `#f9b23b` / `#fcbc54`. Primary
   source for my amber.
8. `recommend {"brief":"…voice agents…warm dark…amber…waveform"}` — picked **Split Studio** as
   the dominant macrostructure for the brief; exemplars reaffirmed vapi/daily.
9. `find_similar {"slug":"vapi-ai","limit":6}` — neighbours surfaced **axiom-co** (warm-dark
   observability using **BerkeleyMono** + Inter, warm peach `#e89c80`) and **genelec-com** (a
   pro-audio brand, warm gold `#ab8e43` on `#3c270b`). Axiom anchored the premium-mono choice;
   Genelec validated warm-gold as an audio-adjacent palette.
10. `get_screen` on all six cited slugs (axiom-co, genelec-com, gehry-getty-edu, netlify-com,
    vapi-ai, retellai-com) — verified every reference resolves before citing it.

## Palette, traced to source

| Token | Hex | Traced to |
|---|---|---|
| `--bg` warm ink | `#16110B` | gehry-getty-edu ochre-dark (`#6c4c1c`) warmth + netlify `#181a1c`, pulled warm |
| `--amber` accent | `#FFB23B` | netlify-com `#f9b23b` / `#fcbc54`; gehry-getty-edu `#fca443` |
| `--amber-deep` | `#C97F1E` | darkened netlify apricot for pressed/shadow states |
| `--ink` cream | `#F7EFE2` | warm-white reading text for a warm ground (vs cold #eef0f3 in the cluster) |
| `--live` signal | `#7FD49A` | functional "on air" green — kept rare; echoes the cluster's green status hues |

## Type, traced to source

- **Display — Space Grotesk** at 92px / weight 600 / letter-spacing −0.045em / line-height
  0.96. Built to match the *ratio* of Vapi's avantt ramp (80px / 0.9 / −4px), scaled up.
- **Mono — Spline Sans Mono.** The genre's lingua franca: axiom-co (BerkeleyMono), netlify
  (Martian Mono), daily (DM Mono), vapi (Geist Mono). Used for eyebrows, code, meters, nav CTAs.
- **Body — Inter.** Appears across the cluster (featurebase, default-com, axiom, polar).

## Macrostructure

`recommend` picked **Split Studio** for the brief, but the cluster's heavy hitters
(featurebase, rippling, netlify) read as **Feature Stack**. I built a feature-stack flow —
hero → how-it-works → bento features → quickstart split → stats → pricing → CTA → footer —
with one Split-Studio moment (the quickstart: copy left, terminal right).

## The standout move

The hero's **live-call console**: a transcript that types in turn-by-turn with an "On air"
pulse, paired with a CSS waveform animating per-bar (staggered `animation-delay`), a 287ms
turn-latency meter, and live tool-call chips. It's the product's value proposition rendered
as a single believable object — and it makes the page unmistakably *voice* rather than yet
another dev-infra dashboard. The amber waveform motif then recurs as a through-line: in the
brand mark glyph, the latency feature card, and a generated waveform along the closing CTA's
bottom edge.

## Verification

Rendered with Playwright (the worker's Chromium) at exact viewports:
- **1280px:** innerWidth 1280, no horizontal overflow, full nav, h1 92px.
- **390px:** innerWidth 390, **no horizontal overflow**, hamburger nav + single CTA, h1 ~37px,
  every section reflows to a real single-column mobile layout (console stacks, bento → 1 col,
  pricing stacks with the featured plan first).
- Constraints checked: no localStorage/cookie/sessionStorage, one inline script, sandbox-safe,
  `prefers-reduced-motion` disables all animation.

## Self-score

**8.6 / 10.** Strong, specific premise; a genuinely distinct warm-amber palette traced to real
captures (netlify, gehry-getty); a signature live-call/waveform motif that reinforces "voice";
disciplined single-accent system; real fonts grounded in the cluster; verified beautiful at
both widths. Held back from higher by relying on web fonts (a self-hosted display face like
Vapi's avantt would push the craft further) and a couple of decorative-only SVG icons.
