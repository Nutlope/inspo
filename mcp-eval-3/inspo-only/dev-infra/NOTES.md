# Conduit landing page — NOTES

Brief: "Create a developer infrastructure product page."
Output: single self-contained `index.html`, dark mode, fictional brand "Conduit"
(durable background-job / workflow runtime, in the Inngest / Temporal /
Trigger.dev space).

## 1. MCP calls + what I took from each

| # | Tool | Args | What I took |
|---|---|---|---|
| 1 | `search_screens` | `{query:"developer infrastructure platform API", limit:6}` | Six anchors for the genre: developer.apple.com, postman, insomnia.rest, supabase, render, linode. Inline thumbs confirmed the dominant aesthetic — dark mode, monochrome ground, single bold accent, terminal/dashboard hero device, swiss-ish type, dense feature grids. Palettes leaned cool (purple/blue) with isolated warm accents. |
| 2 | `search_screens` | `{query:"edge compute serverless platform deploy", limit:6}` | Vercel, Heroku, Scale, Railway, Travis-CI plus one more. Triangulated: hero either centred-text + abstract mark (Vercel light gradient) OR left-aligned headline + right-side terminal mock (Railway dark). Vercel was the outlier in light mode; the rest were dark. |
| 3 | `search_screens` | `{query:"queue background jobs workers database developer", vibe:"technical", limit:5}` | Apple dev, Neon, Supabase, MongoDB. Confirmed the "left headline + right dashboard preview" pattern is the genre default. Neon used dark+saturated waveform accent; Supabase used Build-in-a-weekend / Scale-to-millions color-accented second-line headline trick. |
| 4 | `find_similar` | `{slug:"railway-com", limit:4}` | Pulled bun.sh and anthropic.com. Bun's hero uses italic serif as an accent inside a sans-serif H1 ("Bun is a *fast* JavaScript package manager") — adopted that pattern verbatim (the *what* — the device — not the literal words). |
| 5 | `search_screens` | `{query:"developer pricing tiers plans saas dark", limit:4}` | Ghost pricing and GitKraken pricing. Confirmed three-tier vertical card pattern with the middle card "featured" via accent border/badge. |
| 6 | `get_design_system` | `{slug:"vercel-com"}` | Real fonts: Geist + Geist Mono. Showed me Vercel uses tightly-tracked sans + monospace pairing — no serif. Confirms monospace is part of the lingua franca for the genre. |
| 7 | `get_design_system` | `{slug:"railway-com"}` | Real fonts: Inter Tight + JetBrains Mono + IBM Plex Serif. Real bg: `hsl(250, 24%, 9%)` — deep slate-near-black. Confirmed my hunch that the genre's body sans is something like Inter Tight, mono is JetBrains Mono, and dark bg sits around #11–#15 with a slight blue/purple cast. Adopted Inter Tight + JetBrains Mono outright. |
| 8 | `get_design_system` | `{slug:"supabase-com"}` | Confirmed `--brand-default` is a single dominant accent; rest is grayscale. Reinforced the one-accent rule. |
| 9 | WebFetch + Read on hero PNGs | railway, bun, vercel, neon, supabase | Looked at the actual screenshots. Vercel hero is *centered* with a vivid prismatic mark — atypical for the genre. Railway/Bun/Neon all use *left-aligned headline + dashboard preview on the right* with a single hot accent. Supabase uses a *centered* headline with the second line colored in brand-green. I went with the Railway/Bun composition because (a) it's the genre default and (b) it gives more real estate to a believable dashboard mock. |

## 2. Design rationale (where the page came from, line by section)

**Brand: Conduit** — a fictional managed runtime for durable background jobs and
workflows. Tagline: "Background jobs that *don't lose* the plot." The italic
serif "don't lose" mirrors Bun's "Bun is a *fast* package manager" device — a
single warm hand-written-feeling word inside an otherwise mechanical headline.
Personality without theme-park.

**Color system:** one warm accent (`#f0a657`, a soft saffron) sitting on a deep
near-black ground (`#0b0d12`) with two darker panel tones for surface
elevation. The accent is used *sparingly* — primary CTA, italic accent in
headlines, code-tab underline, focus rings, pricing badge, and tasteful pulses
in the dashboard mock. Everything else is grayscale. This is the lesson from
the inspo set: dev-infra pages live or die on restraint with color.

I avoided every common dev-infra accent I saw in the corpus (Vercel yellow,
Supabase green, Bun pink, Railway purple, Neon turquoise) — saffron is in the
warm family but isn't any of those brand colors. Original.

**Typography:** Inter Tight for body + headlines (Railway's real stack),
JetBrains Mono for code/captions/eyebrows, Fraunces italic as the *single*
serif moment in each H2. Three fonts, used surgically. No font soup.

**Hero composition:** Asymmetric grid — bold left-aligned headline + lead +
install snippet + dual CTA on the left, a believable dashboard preview on the
right. The dashboard isn't a hero illustration: it's the actual product UI,
with workspaces sidebar, live timeline strip, and a list of recent runs each
with a status dot. The status dots have meaning (ok / running / warn / DLQ /
fail) and the running one blinks. There's a subtle grid overlay + warm glow on
the hero, masked to a soft radial fade — the Railway "painted backdrop" trick
applied with restraint.

**Trust strip:** I refused to invent SVG logos for fictional companies; instead
I wrote six made-up brand names in *different real type styles* (italic serif,
all-caps sans, monospace) which reads more honestly than fake wordmarks and is
genuinely common (Vercel's logo cloud is mostly wordmarks).

**Features section:** three columns inside a single bordered grid (hairline
dividers, no card boxes). Each cell has an icon, a tight H3, a body
paragraph, and a monospace meta-line. The meta-line trick (`retry · backoff ·
replay`) is borrowed from how dev-infra docs label sections.

**Code + bullets section:** Split layout. Left: numbered prose. Right: a real
syntax-highlighted code block with three real language tabs (TS/Python/Go)
showing the *exact same workflow* in each — the universal dev-infra trick that
signals "first-class SDKs." The TS example uses a realistic concurrency
declaration, `step.run()` memoisation, and a 24h sleep. Tab switching is one
JS function and works.

**Stats strip:** 2.4B runs/month, 99.995%, 38ms P50, 14+ regions. Specific
numbers, not round ones, in a four-column hairline-divided strip with a
slightly elevated panel color.

**How it works:** Three-column flow (Install / Author / Ship) with a real
preview snippet under each step. Last preview ends with `✓ live at
acme.conduit.run` which reads like an actual deploy log.

**Testimonial:** Single quote + a five-row "before/after migration card" — the
card format is more interesting than a face + name + stars, and it's specific
(deleted Sidekiq + 2 Lambdas + 600 LOC, on-call from 14→2). The numbers tell
the story.

**Pricing:** Three tiers (Hobby / Team / Enterprise), middle featured with the
accent border + "Most picked" badge. Each tier has a name, price, one-sentence
audience, and bullet list. Pricing copy is honest about metering
(`$0.40 per million steps`, sleep is free, no per-CPU charges) — specific
enough to be believable, original enough to not crib any one competitor.

**FAQ:** Native `<details>` accordion with a custom plus/x indicator that
rotates and morphs on open. First one opens by default. Six questions covering
the real dev-infra objections (vs queues, do I rewrite, where does code run,
languages, pricing model, free tier).

**End CTA:** A bordered panel inside the section, with a soft radial glow
escaping the lower-right corner. Same headline device (italic accent).

**Footer:** Five-column grid (brand + 4 categories), status pill with
`99.998% / 30d` and a pulse dot — same dot used in nav and elsewhere for
brand continuity. Bottom row includes a fake build number with today's date.

**Polish details that took the most time but matter:**

- Status dots in the dashboard *blink* on running, are *amber* on retry, *red*
  on DLQ — and the timeline bars at the top tick every 1.2s via JS, so the
  hero feels alive without being noisy.
- Eyebrows are monospace + uppercase + tracked + prefixed with `//` — the
  comment-syntax detail that says "we ship code for a living."
- The install snippet has a working copy button (uses `navigator.clipboard`,
  swaps text to `copied`).
- Selection color is the accent. Focus rings are the accent at 2px with 3px
  offset. Dark-mode-only — no system-preference toggle, the genre is
  unambiguously dark.
- All text is real product copy. The TS code compiles in spirit. Numbers,
  region counts, tier prices, and SLA percentages are all internally
  consistent.

**What I deliberately did NOT do:**

- No fake testimonials with photos. No "Loved by 10,000 teams." No bento
  grid (it doesn't fit the genre's reference set — Vercel/Railway/Neon don't
  use it). No glassmorphism. No 3D blob mascots. No gradient text. No
  emoji-as-iconography.

## 3. Self-score

**Score: 8.6 / 10**

**What earns it:**

- Hero composition reads as production-quality on first sight (the screenshot
  I captured confirms this) — equivalent visual density and information
  hierarchy to Railway / Bun / Neon.
- Single coherent accent applied with restraint across nav, headlines,
  dashboard, code tabs, pricing, focus rings, selection. No color soup.
- Real fonts from a real reference (Railway's actual stack: Inter Tight +
  JetBrains Mono), with Fraunces italic as the *one* personality moment.
- Copy is specific, not generic. Numbers are internally consistent. The
  pricing is honest about metering. The FAQ answers real objections.
- The dashboard mock is *believable*: workspaces sidebar with counts, live
  timeline, runs list with named events, status dots that *mean* something,
  one blinking "running" state, one warn state, one DLQ. Not a fake
  illustration.
- Three real language tabs (TS/Python/Go) of the same workflow — the
  universal dev-infra trick that signals first-class SDKs.
- Accessibility hits: semantic landmarks, focus rings, aria-labels on
  decorative regions, alt text where it matters, color contrast clears AA on
  every text/background pair I'm using.
- Responsive at 1024 / 768 / 375 (grid collapses correctly, sidebar hides on
  narrow dashboard, code block scrolls horizontally).

**What costs the 1.4:**

- Customer "logos" are typeset names. More honest than fake SVG logos, but
  visually less rich than the real thing.
- Dashboard mock is static-ish (only the timeline bars + one blinking dot
  animate). A few more micro-animations (incoming run animating in every few
  seconds) would push it from "convincing" to "magnetic."
- No real product illustrations or diagrams beyond the dashboard — a section
  on, e.g., how `step.run()` persists state would benefit from a small SVG
  flow diagram. I left it as prose to stay one-file and keep scope tight.
- The end CTA could carry more weight; right now it borrows the same hero
  device twice in the page (italic accent), which is fine but slightly
  rhymes too tightly. A different closing visual idea would diversify.
- Some sections (features, pricing) use very similar hairline-grid styling.
  More structural variety between sections would lift the rhythm.

**Honest take:** This is in the upper range of what's reasonable to expect
from one HTML file built from pure visual research, with no design skill or
component library. The visual decisions (dark, one warm accent, italic serif
moment, dashboard mock as hero) are all directly traceable to specific
references I saw in the Inspo corpus, but the execution is original — I
didn't crib copy, layout, or color from any one site. The page feels like it
belongs in the same shelf as Railway / Bun / Neon, not like a parody of them.
