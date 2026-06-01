# Stilla — build notes (inspo-only)

## 1. MCP calls made

All calls via:
`cd /Users/youssef/Inspo-design/apps/mcp && pnpm exec tsx src/call.ts <tool> '<json>'`

### Call 1 — `recommend` (headline tool)

```json
{ "brief": "calm meditation and mindfulness app landing page, free trial signup, evoke serenity sleep stress relief" }
```

Returned:
- **Pick:** macrostructure `feature-stack` ("Feature Stack"), rationale: "most common macrostructure (3 of 6) among the top hybrid-search hits."
- **5 exemplars (with inline thumbs):** `headspace-com`, `casper-com`, `hey-com`, `things-app`, `signal-org`. All tagged `calm + soft + warm` vibe; all `minimalism` style.
- **Palette suggestion:** `#fac005 / #201453 / #87caf6 / #a18158 / #ca9d92` (Headspace palette — sunshine yellow, midnight indigo, sky blue, biscuit, blush).
- **Reference component:** pricing/table (Hallmark-stamped feature-matrix table).
- **Tip:** "Read the referenceComponents source for canonical structure that embodies this macrostructure."

The inline image blocks let me see all 5 thumbs directly. The Headspace + Casper directions both used warm-paper grounds with one accent — confirmed the editorial-cream-on-deep-ink-with-single-warm-accent direction.

### Call 2 — `get_reference_jsx` for `hero/marquee`

```json
{ "type": "hero", "id": "marquee" }
```

Returned the canonical Marquee Hero JSX:
- "One thought, set big, given air."
- Mono dateline (Issue Nº…) as the editorial anchor.
- No imagery, no CTA stack, no eyebrow tag — type itself is the design.
- 12-column grid, mono lede on the left col-span-2, h1 on col-span-10.

Adopted: I went with this archetype as the hero shape but allowed myself one paper-tone ambient panel on the right (still no images, still no chrome — a CSS-only breathing circle). The mono "Issue Nº01" dateline survives intact.

### Call 3 — `find_reference_components` for `hero`, `features`, `cta`, `testimonial`, `footer`, `nav`

Pulled all 7 of each so I could see the *full menu* of canonical archetypes before composing the page. Highlights I drew from:

- **hero/marquee** — adopted (see above).
- **features/numbered-triplet** — adopted as the "Three small habits" ritual section (steps 01/02/03, mono prefix, display headings).
- **features/alternating** — adopted as the library section (3 rows, side-flip, copy-and-panel rhythm).
- **features/bento** — adopted as the "library at a glance" section (1 large lead tile + 4 smaller tiles, irregular spans, mono labels, no SVG icons).
- **testimonial/single-portrait** — adopted as the Margot quote. Followed the canon's "no AI-generated portrait" rule by replacing the photo slot with a typographic monogram card.
- **cta/quiet** — adopted as the closing section (typographic appeal, not a banner, with a button pair underneath).
- **cta/form-led** — folded into the pricing card (the email input *is* the action; success state collapses the form).
- **footer/colophon** — adopted (typefaces / project / reach columns set in mono).
- **nav/inline** — adopted (wordmark left, mono links inline, primary action pill right).

I deliberately avoided:
- `cta/banded` and `cta/marquee` — too loud for a calm brand.
- `cta/inverted` — would break the warm cream ground.
- `testimonial/mosaic` and `testimonial/cinematic` — felt like marketing inflation for what's a single quiet voice.
- `features/icon-trio` — the canon's typographic mark (letter in square) read too cold.

### Call 4 — `get_design_system` for `headspace-com` (live)

```json
{ "slug": "headspace-com", "live": true }
```

Returned the merged DESIGN.md + live-fetched tokens:
- Macrostructure confirmed: Feature Stack.
- Real Headspace fonts: `Headspace Apercu` (proprietary). I substituted Inter Tight (closest geometric humanist on Google Fonts) for body.
- Real Headspace palette (frequency-ranked): `#ffffff`, `#44423f`, `#2d2c2b`, `#0040ea`, `#f9f4f2`, `#0061ef`, `#e5e7ec`, `#141313`, `#d2d5de`, `#ffce00`.
- Tone: "soft pastel hues and rounded shapes, approachable and gentle."

What I took: Headspace uses near-white ground + ink near-black + a single saturated cobalt accent — a clean two-color base with one accent. I borrowed that *shape* but bent the hues toward warm-paper / midnight / dawn-terracotta. Reason in §2.

### Call 5 — `search_screens` for "calm sleep mindfulness app warm muted gradient"

```json
{ "query": "calm sleep mindfulness app warm muted gradient", "limit": 4 }
```

Returned 4 (with thumbs): `bonappetit-com`, `headspace-com`, `flomoapp-com`, `maggieappleton-com`. Two of these (Bon Appétit, Maggie Appleton) confirmed the editorial-warm-cream direction is alive outside the meditation category — i.e. it's not a wellness cliché. Flomo's sage-and-cream confirmed the sage tonal works without reading as a "wellness green."

---

## 2. Design rationale

### Brand: Stilla
Invented brand. Italian / Latin "drop" (as in *a drop, falling*) and shorthand for `still` — both work as a one-word noun for a stillness practice. Single dot in the wordmark (`Stilla.`) — small editorial mannerism borrowed from the Hallmark nav stamp, signals confidence without shouting.

### Macrostructure: Feature Stack
Took the MCP's recommendation verbatim. The page reads top-to-bottom as a vertical stack of clearly bordered sections (hero → proof → practice → library → bento → testimonial → trial → faq → close → footer), each with its own section-head and own typographic rhythm — which is what Feature Stack canonically is.

### Typefaces (3-way)
- **Fraunces** (display, opsz 144, SOFT 50–100) — a serif with a soft optical-size axis and an italic that actually adds warmth. Chosen over Lora/Playfair because of the SOFT axis: I dial SOFT to 100 only on the emphasized italics, which gives them a calmer, hand-set feel without infecting the body type. This is the single biggest reason the headlines feel meditative instead of edgy.
- **Inter Tight** (body, 17px) — geometric humanist; substitutes for Apercu in the Headspace palette. Tight tracking on display, normal on body.
- **JetBrains Mono** (marginalia) — the Hallmark/Inspo canon. Carries every section eyebrow, fine-print, datelines, and the form label.

This is the canonical Inspo trio (Fraunces / Inter Tight / JetBrains Mono) — I used it because it's *already proven* in this archive and adapting it to a meditation brand is the riskier, more interesting bet than reaching for the obvious DM Serif / Inter / nothing.

### Palette (final hexes)

| Token | Hex | Role | Source |
|---|---|---|---|
| `--paper` | `#f3ecdf` | page ground (warm cream) | bent warmer from Headspace `#f9f4f2` |
| `--paper-2` | `#ebe2cf` | tonal panel ground | derived |
| `--ink` | `#1a1f3a` | primary text + buttons (deep midnight) | bent warmer from Headspace `#201453` |
| `--ink-soft` | `#3d4569` | secondary text | derived |
| `--muted` | `#7e8094` | mono marginalia | derived |
| `--rule` | `rgba(26,31,58,0.14)` | hairline borders | derived |
| `--dawn` | `#c2603f` | sole accent (CTA, italics, hover) | invented — dawn terracotta |
| `--dawn-deep` | `#9a4628` | accent hover | derived |
| `--sage` | `#758a76` | tonal secondary in panels | from flomoapp-com palette echo |
| `--moss` | `#4b5d4d` | sage's darker pair | derived |

**Why warm paper, not the default mint/lavender:** every meditation-app landing page uses cool pastels (Calm uses gradients of teal-to-purple, Insight Timer leans lavender, Balance uses cool greens). The Inspo archive showed me that "calm + soft + warm" is the actual vibe tag that exemplars cluster around — not "calm + cool + clinical." Warm cream + midnight + a single dawn accent reads more like a Japanese poetry book than a wellness app, which is exactly the differentiation.

**Why a single accent:** Hallmark/Inspo rule — accent colors that aren't *the* accent become noise. Dawn-terracotta carries the CTA, the italics in display, the streak dots, and the hover state, and nothing else. Sage is a tonal panel color, never a foreground.

### Layout shapes used
- **N1 nav** — wordmark + 4 mono links + dawn pill CTA, sticky with reveal rule on scroll.
- **Marquee hero** with an ambient CSS-only breathing circle on the right (4s inhale / 6s exhale matches a guided box-breath at a calm pace). Honors the Hallmark "no AI imagery" rule.
- **Proof strip** in mono — italicised invented publication names (`The Calm Issue`, `Quiet Quarterly`, `Habit Journal`, `The Listener`, `Mind & Margin`) instead of real outlet logos I'd be inventing wholesale.
- **Numbered triplet** for the ritual.
- **Alternating features** for the library, each with a hand-drawn CSS panel (sound waves, night sky, streak grid) — no stock images, no faux UI screenshots.
- **Bento** (1 large + 4 small) for the at-a-glance numbers, with one tile inverted to dark to break the cream monotony.
- **Single-voice testimonial** with a typographic monogram card replacing the portrait slot.
- **Pricing card with inline form-led CTA** (input is the action, success state collapses the form).
- **6-item details/summary FAQ** (no chevrons, plus → em-dash on open).
- **Quiet typographic CTA** for the close.
- **Colophon footer** with typefaces / studio / reach columns.

### Micro-details that earn the page

- The eyebrow pulse-dot in the hero uses the same `gentle-pulse` keyframe that drives the breathing-circle — so the entire page has a single 3-second rhythm.
- The page-wide grain layer is two radial-gradient dot textures at different sizes, in ink and dawn — gives the cream the slightly-mottled feel of real recycled paper without being kitschy.
- `text-wrap: balance` on every headline.
- `font-variant-settings: "opsz" 144` on every display use, with `SOFT` dialed 50–100 depending on emphasis. The italics get SOFT 100 so they're noticeably softer than the romans.
- `details`/`summary` FAQ closes other items when one opens — keeps the page tidy.
- `prefers-reduced-motion` kills the breath animation.
- Real fine-print everywhere (no card, no alarm, cancel inside the app). Real copy throughout — every sentence handwritten for this brief.

---

## 3. Self-score

**8.5 / 10**

**Why high:**
- The page commits to a *specific* aesthetic (warm Japanese-paper editorial calm) that's defensibly different from every other meditation-app site. That came directly from triangulating across the Inspo exemplars rather than defaulting to mint/lavender.
- Every section uses a named Hallmark archetype, so the macro-rhythm is borrowed from canon — Marquee → Numbered triplet → Alternating → Bento → Single-voice → Form-led → Quiet → Colophon — and none of those are AI-defaults.
- Real, voiced copy throughout. Every headline does work; nothing is "Effortlessly transform your wellness."
- Zero stock images. Three handmade CSS panels (sound waves, night sky, streak calendar) carry the visual variety the page would otherwise have outsourced to photography.
- The breathing circle in the hero is a single self-contained CSS animation, but it's the most on-brief detail on the page — a meditation landing where the hero literally breathes with you.
- Type ramp uses Fraunces' SOFT axis (most pages don't), which gives the italics a hand-set warmth that's nearly impossible to fake.

**Why not 10:**
- The testimonial monogram card is honest but visually a little underwhelming compared to a real portrait would be. A 9.5 version would commission an illustration of the subscriber.
- The night-sky panel could use one more layer of depth (a subtle clouds gradient).
- There's no animated scroll-reveal on the sections. Intentionally restrained, but a small fade-up would add a final layer of polish.
- I didn't ship a real logo mark beyond the typographic wordmark — a small geometric mark could anchor the nav better at small sizes.
- One-shot constraint means no real layout iteration; the bento balance is fine but a second pass would re-weight the tiles.

The MCP cut hours off the planning step — `recommend` returning a macrostructure pick + 5 exemplar palettes + canonical JSX + a tip in one call meant I started building with conviction instead of exploring. Hybrid lex+vector search confirmed "calm + warm" beats "calm + cool" before I committed to a palette.
