# m3 — Photographer landing (no-tools control)

## 1. Tooling confirmation

No external tools, MCP servers, design skills, or reference files were consulted.
I did not Read the `mcp-eval-2/MCP-GUIDE.md`, did not touch `~/.claude/skills/`,
and did not invoke `frontend-design`, `ui-ux-pro-max`, `hallmark`, `shadcn-ui`,
or any other Skill. The Figma MCP, Chrome MCP, and Preview MCP were not loaded
via ToolSearch. Only the built-in `Bash` and `Write` tools were used (one `Bash`
call to mkdir + ls, one `Write` for index.html, one `Write` for this NOTES.md).
Google Fonts is loaded via `<link>`, which the brief explicitly permits.

## 2. Design rationale

**Persona.** Mira Okafor — independent portrait + travel photographer based
between Lisbon and Lagos. The persona unlocks a specific visual register
(warm Iberian + West-African coastal palette, slow film aesthetic) rather
than a generic "photographer template".

**System.**

- **Palette** — warm paper `#efe9df` ground, soft secondary paper for stripped
  sections, deep ink `#1a1714` (not pure black) for body, a single sienna
  accent `#b8442d` plus a deep-moss secondary for italic counter-color. This
  gives the page a darkroom / editorial-print feel and keeps every photo tile
  reading as warm/film rather than cold/digital.
- **Type** — Fraunces (variable, with optical-size + SOFT axes pushed at large
  sizes) as the display + editorial serif; Inter Tight for UI/body; JetBrains
  Mono for the eyebrows, captions, and the index numerals. The trick that
  carries the personality is mixing roman + italic Fraunces *inside* the same
  display lines so the headlines read like a magazine cover, not a headline tag.
- **Layout** — wide 1320 max, generous gutters with `clamp()` so everything
  scales fluidly. The page uses a recurring magazine-index motif: a small mono
  eyebrow ("No. 04 / Spring '26"), serif headline, italic-color accent. Hero
  uses an oversized 184px display headline with letter-spacing tightened to
  -0.04em — the kind of confidence that signals "real portfolio" instantly.

**Sections (chosen to feel like a real portfolio, not boilerplate):**

1. Sticky nav with a wet-print radial brand mark (no SVG needed).
2. Magazine-style hero meta strip with city coordinates + availability stamp.
3. Display headline mixing roman + italic + an oversized punctuation amp.
4. Lede paragraph + a circular "11 years" rotated rubber-stamp badge.
5. A marquee strip of process keywords (Portra 400 / Mamiya 7 / …) for texture.
6. An 8-tile asymmetric photo mosaic on a 12-col grid (and a 6-col mobile
   variant) — each tile has a numbered index, caption pill, and a duotone
   gradient fallback that's blended *into* the Unsplash source URL so even if
   the network image fails, the tile still looks intentional and on-palette.
7. About — a sticky left label ("01.") next to a long-form editorial body
   with italic in-line emphasis, ending in a hand-signed sig + meta.
8. Selected work — a list (not a grid!) of 7 commissions, with a hidden
   `preview` card that fades + rotates in on hover at the right edge. Reads
   like a magazine TOC; differentiates from every other portfolio template.
9. Services — a 3-up bordered grid (single-pixel ruled, not card-shadows),
   each service with a letter index, a hyphen-prefixed feature list, and a
   "from €" price line. Real pricing details = trust.
10. Press — italic Fraunces wordmarks on hairline rules; hover lifts +
    accent-colors. Avoids the dreaded grayscale logo wall.
11. A full-bleed pull quote with a giant decorative left curly-quote at 18%
    opacity — the breathing-room moment.
12. Journal — 3-up cards with 4:5 photos, mono category eyebrow + date.
13. Dark contact section flipping the palette (ink ground, paper text, sienna
    glow from upper-right). Display headline matches the hero in scale to
    bookend the page. 4-col contact grid for studio / second base / elsewhere
    / representation.
14. Mono footer.

**Micro-details that defend against "AI-generated landing page" look:**

- Subtle paper grain via two stacked dotted radial-gradients on body bg.
- Italic Fraunces is *colored* (sienna or deep moss) — not just styled — so
  the visual rhythm of the page reads as editorial typography, not text decor.
- Index numerals everywhere (No. 042, № 001, 01., 02. …) — borrows the print
  magazine convention.
- Hover affordances are quirky but restrained: work-list items shift padding
  + reveal a rotated card preview; service tiles brighten to cream; nav CTA
  arrow translates; press wordmarks lift + recolor; client wordmarks are
  italic, not grayscale logos.
- Real, specific copy. Cereal, Monocle, Apartamento, Casa Fortuna, Loewe.
  Lisbon street address. Mamiya 7 + Portra 400. "From €1,400". Specificity
  is the single biggest differentiator from AI slop.
- `clamp()` on every major font-size and on the gutter — properly responsive
  with one breakpoint per concern, not 8 stacked media queries.
- `prefers-reduced-motion` respected.
- Marquee is keyframe-based with a duplicated track so it loops seamlessly.
- All photo placeholders use a duotone gradient `linear-gradient(...)` plus an
  Unsplash `source.unsplash.com` URL with `background-blend-mode:multiply` —
  this guarantees the photos *always* look graded into the palette, never
  jarring, even if Unsplash returns a different image on each load.

## 3. Self-score

**Score: 8.5 / 10**

**What it does well**
- Distinct identity. The Lisbon/Lagos persona + film-stamp + magazine-index
  motif make this read as a real photographer's site, not "portfolio.html".
- Editorial typography. Fraunces used at the right optical sizes with mixed
  roman/italic in single lines + colored italics is the single highest-signal
  design move, and it's used consistently from hero to contact.
- Strong information architecture: hero → recent frames → about → work index
  → services → press → quote → journal → contact. Each section has its own
  visual treatment (mosaic vs list vs grid vs dark inverse).
- Real micro-interactions: work-list preview-on-hover, nav-CTA arrow nudge,
  marquee strip, service-tile color shift, lifted press wordmarks.
- Photo treatment that *cannot* break: duotone gradient under each Unsplash
  fetch, so even with no network we never see broken-image grey.
- Genuine responsive design via `clamp()` + per-section breakpoints; mobile
  collapses the work-list to a 3-col, the mosaic to a 6-col, services to 1-col.

**What stops it from being a 10**
- Photography itself is fake — gradients + Unsplash random, not commissioned
  work, which a real photographer's site would obviously have curated.
- No actual case-study pages behind the work-list; only the index exists.
- One static page only — a true 10/10 portfolio is at minimum an index + a
  case study template + a single-image lightbox.
- Marquee + paper grain are nice touches but I would have done a custom film
  loader and a tiny GL grain shader if I were treating this as production.
- The brand-mark radial gradient is a clever shortcut; a real shoot would
  have a wordmark or monogram in SVG.

Net: confidently in "I would ship this for a freelance photographer client"
territory, but a notch under "this is the site that wins them an award".
