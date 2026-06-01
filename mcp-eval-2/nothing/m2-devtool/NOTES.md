# Lattice — landing page notes

## 1. Tooling confirmation
I built this one-shot **from my own knowledge only**. I did not invoke any external tools, MCPs, design skills, or references during construction:

- No `Bash` calls to `apps/mcp/src/call.ts`.
- No `Read` against `/Users/youssef/.claude/skills/`, `/Users/youssef/Inspo-design/mcp-eval-2/MCP-GUIDE.md`, or any project component file.
- No `WebFetch` / `WebSearch`.
- No `Skill` invocations (hallmark, frontend-design, ui-ux-pro-max, web-design-guidelines, shadcn-ui, etc. were all listed as available but were not called).
- The only `Bash` call I made was `ls` to confirm the target directory exists before writing.

The only external resource the file itself depends on at runtime is Google Fonts (allowed by the brief).

## 2. Design rationale

### Brand
- **Name:** *Lattice* — evokes ordered structure, parallel work converging on shared dependencies (the dependency-graph / merge-queue mental model). Also a real, pronounceable, type-friendly word.
- **One-liner:** "The merge queue your CI deserves." Concrete, opinionated, immediately legible to the audience (eng leads who recognize the genre — Mergify, Aviator, Trunk, Graphite-merge-queue, etc.).
- **Glyph:** a 22px rounded conic-gradient mark forming a 4-quadrant pinwheel — reads as "lattice / queue cells" without being literal.

### Typography
A 3-family editorial system, chosen for contrast and a "developer + serious" feel without resorting to the default geometric-sans + monospace clichés:

| Role | Family | Why |
|---|---|---|
| Display / headings | **Instrument Serif** | Tight, slightly literary serif with italics that give "*emphasis*" real visual weight. Adds an editorial, considered tone — counters the typical "AI startup" Inter-everywhere look. |
| UI / body | **Inter Tight** | Compact metrics for nav, body, buttons. Same family the audience already trusts; Tight variant has tighter tracking that pairs better with the serif. |
| Mono / code / labels | **JetBrains Mono** | The audience writes code in it. Used for: code panel, eyebrow labels, stats labels, footer micro-copy, pipeline filenames. |

Mixing serif headlines with mono labels is a deliberate signal: "this is a *crafted* product, not a template."

### Palette (hex)
A warm, paper-leaning neutral with a single decisive accent + functional signal colors:

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#F6F4EE` | Primary surface — warm off-white, slightly creamy, not the default `#FAFAFA` |
| `--paper-2` | `#ECE8DE` | Alternating sections, subtle depth |
| `--ink` | `#0B0D10` | Headings, body text, dark sections — not pure black, has a hint of blue-black |
| `--ink-2` | `#14181D` | Dark UI surfaces (pipeline, code panel) |
| `--accent` | `#C7402F` | Archive-red, used very sparingly — only in italic emphasis and a single underline accent in the hero |
| `--signal` | `#6BE39A` | Terminal mint — "pass" state, live pulse, success ribbon, featured plan CTA |
| `--signal-2` | `#1B6B3F` | Darker mint for ink-on-light contexts |
| `--warn` | `#E5A93B` | Queued state on PR rows |
| `--fail` | `#E84B3C` | Failure state (defined but used minimally to keep the page feeling calm) |

The warm paper + signal mint combination is the page's signature — it's the "Inspo archive vibe" applied to a dev tool, which is a much more interesting design choice than the default cool-blue gradient SaaS look.

### Layout & composition
- **Container:** 1240px max, with `clamp(20px, 4vw, 56px)` fluid gutters — feels generous on desktop without locking down on tablet.
- **Hero:** asymmetric 1.05 / 0.95 split. Left is editorial typography with a sprinkle of mono meta-chips ("v3.4 · Released last Tuesday", "SOC 2 Type II") that establish credibility instantly. Right is a *real-looking* dark "merge queue" UI with live pulsing status, actual PR titles, contributor handles, and a tilted annotation card explaining what the user is looking at.
- **Marquee:** customer logos rendered as **typographic** brands (italic serifs, mono with slashes, mark+wordmark) — never SVG-clipart-style fake logos. Each one has its own visual treatment, the way a real customer marquee looks.
- **Problem section (light):** 3-up grid with hairline dividers. Big serif statements with a single italic word per card highlighted in archive-red. Numbered `N.01 / N.02 / N.03` mono captions.
- **How it works (dark):** interactive — clickable steps on the left, a synchronized code panel on the right with **four real-feeling code tabs**: `~ install`, `graph.toml`, `selective.json`, `queue.yml`. Each contains syntactically plausible content that an engineer would actually read and find believable. Tokens are colored to match a GitHub-dark-ish palette (red keywords, green strings, blue numbers, purple punctuation, orange functions, gray comments).
- **Bento features:** 6-column grid with mixed cell spans (wide+tall hero cell, 2 narrow stats cells, 1 wide graph cell, 2 half cells). Each cell has its own bespoke micro-visualization rendered in pure HTML/CSS/SVG: a queue mockup, a before/after time bar chart, a flake table, a package dependency graph (real SVG with arrow markers), and a stack-pill grid.
- **Testimonial:** large editorial serif quote with a gradient-portrait avatar (no fake stock photo). Italic emphasis on the headline number ("*nine minutes*").
- **Pricing:** classic 3-column with the middle plan inverted to dark + signal-mint CTA. Concrete per-developer pricing (`$0 / $29 / Custom`) with reasoning ("No CI minute math").
- **FAQ:** native `<details>` elements with custom plus/minus marker that rotates on open. Six questions an actual eng lead would ask.
- **CTA banner:** dark rounded panel with an inline email form that "responds" on submit (JS confirmation), paired with a hand-drawn-feeling ASCII queue mockup on the right. Mint glow in the top corner.
- **Footer:** 5-column with brand + 4 link columns, plus a bottom row with copyright and a live "All systems operational · 99.99% uptime" indicator — small thing, but the audience notices.

### Interaction
Vanilla JS, no framework, no libraries:
1. Step/tab sync between the "How it works" steps and the code panel (clicking either side updates both).
2. `IntersectionObserver` scroll reveal (`.reveal` class, 12% threshold, ~600ms ease). Respects `prefers-reduced-motion`.
3. Live ticking timer on the "running" PR in the hero pipeline — increments every second, formatted `Nm SSs`. This kind of "the page is alive" detail is what separates a finished product from a wireframe.
4. CTA form submit replaces the button text with "Check your inbox" (no real backend).

### Responsive behavior
- Mobile burger is implicit (nav links hide below 820px, the primary CTA condenses to icon-only).
- Hero grid collapses to a single column at 980px.
- Bento collapses 6→2→1 columns at 980px / 560px.
- Pricing, FAQ, and footer all reflow gracefully.
- Annotation card on the hero visual repositions and re-rotates on mobile so it doesn't overlap.

### What I avoided (anti-slop checklist)
- No generic Tailwind-shaped purple/blue gradient hero.
- No "Trusted by 10,000+ teams" with grayed-out SVG logos.
- No 3-icon "Fast. Secure. Scalable." features section.
- No stock photos.
- No emoji as icons.
- No `lorem ipsum` — every line is real, in voice, and addresses a real CI/merge-queue concern (batching, selective testing, flake quarantine, auto-bisect, freeze windows, dependency graph).
- No "By signing up you agree to our Privacy Policy" microcopy clichés on the form — used "No credit card · 14-day free trial · Cancel anytime" instead.
- No fake testimonials from "John CEO of Acme Corp" — one specific operator note tied to a believable monorepo size (47 packages, 38→9min CI).

## 3. Self-score

**8.5 / 10** — Distinctive editorial-meets-developer voice (warm paper + serif headlines + mono labels + a live, ticking pipeline mockup) executed as a single polished file with real copy, real interactivity, and considered responsive behavior; the half-point I docked is for not having custom illustration or photography and for the dependency-graph SVG being intentionally schematic rather than a fully interactive data viz.
