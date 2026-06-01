/**
 * "Made with Inspo" — case-study manifest for the /examples pages.
 *
 * Every entry is a REAL page an agent built using only the Inspo MCP
 * (the pure-Inspo arm of the mcp-eval-3 experiment — no design skill,
 * no Hallmark templates, no reference JSX). The generated HTML is
 * copied verbatim into public/examples/<slug>/index.html and iframed.
 *
 * The metadata here is transcribed from each build's NOTES.md:
 *   - `prompt`      — the one-line brief the agent was given
 *   - `references`  — the catalogue screens it studied + what it took
 *                     (slugs all verified present in static-screens.json
 *                      so the /screens links never 404)
 *   - `mcpCalls`    — the actual tool calls it issued
 *   - `palette`     — final tokens, each traced to where it came from
 *   - `scoreSelf`   — the agent's own self-score (honest; the eval
 *                     report notes self-scores skew high)
 *
 * Effort is expressed as MCP calls + references studied — the truthful
 * "how long it took" for an agent build (no wall-clock stopwatch was
 * recorded; calls + refs are the real signal of work done).
 */

export interface ExampleReference {
  /** Catalogue siteSlug — links to /screens/<slug>. Verified to exist. */
  slug: string;
  /** What this reference contributed to the build. */
  took: string;
}

export interface ExampleMcpCall {
  tool: string;
  args: string;
  took: string;
}

export interface ExamplePaletteToken {
  token: string;
  hex: string;
  from: string;
}

export interface Example {
  /** URL id + public/examples/<slug>/ folder. */
  slug: string;
  brand: string;
  /** Short premise of the invented brand. */
  tagline: string;
  /** The brief the agent was handed. */
  prompt: string;
  /** Which toolchain — all current entries are pure Inspo. */
  stack: "pure-inspo" | "hallmark-inspo";
  /** Light/dark register of the generated page (drives preview chrome). */
  mode: "light" | "dark";
  /** Agent's own self-score out of 10. */
  scoreSelf: number;
  references: ExampleReference[];
  mcpCalls: ExampleMcpCall[];
  palette: ExamplePaletteToken[];
  /** One-paragraph note on the standout move in the build. */
  highlight: string;
}

export const EXAMPLES: Example[] = [
  {
    slug: "slowboat-coffee",
    brand: "Slowboat Coffee Co.",
    tagline: "A four-person West Oakland roastery selling a small-batch single-origin subscription.",
    prompt: "Build a landing page for a coffee subscription.",
    stack: "pure-inspo",
    mode: "light",
    scoreSelf: 8.0,
    highlight:
      "The hero composes three coffee-bag silhouettes, drifting steam, a roastery stamp and a lot number entirely from CSS primitives — a warm editorial coffee site with zero stock photography, which reads as intentional rather than unfinished.",
    references: [
      { slug: "stumptowncoffee-com", took: "The dark promo bar, mustard accent, witty headline voice, lot/roast-date metadata — and the live CSS vars (--subscribe-card-button-bg #1f1815, hover #c0a868) that locked the palette." },
      { slug: "intelligentsiacoffee-com", took: "The numbered 'subscriptions made easy' pattern, the persistent red CTA in the nav, ALL-CAPS micro-sans section numbering." },
      { slug: "bluebottlecoffee-com", took: "Ample negative space in the hero — gave the headline a real left column with room to breathe." },
      { slug: "fellowproducts-com", took: "Muted earth palette + italic display lines over product; letting one big object carry the hero." },
      { slug: "seriouseats-com", took: "Confirmed the warm-earthy + single-saturated-accent palette holds across food editorial, not just coffee." },
    ],
    mcpCalls: [
      { tool: "search_screens", args: '{"query":"coffee roaster subscription","limit":6}', took: "Surfaced the coffee cluster — Stumptown, Intelligentsia, Blue Bottle, Fellow." },
      { tool: "search_screens", args: '{"query":"specialty coffee brand editorial warm","vibe":"warm"}', took: "Triangulated the genre — same cluster reappeared at high confidence." },
      { tool: "get_design_system", args: '{"slug":"stumptowncoffee-com"}', took: "Recovered real tokens: cocoa ink #1f1815, mustard #c0a868, fonts Windsor / GT Flexa. The single highest-signal call." },
      { tool: "get_design_system", args: '{"slug":"intelligentsiacoffee-com"}', took: "Ink #2e2925, paper #fcf4ed, persistent red CTA #d42927." },
      { tool: "get_design_system", args: '{"slug":"fellowproducts-com"}', took: "Foreground #1e1e1f, rust-brown accent #9d523a — confirmed dark-ink-on-cream + warm earth." },
    ],
    palette: [
      { token: "--ink", hex: "#1F1815", from: "Stumptown's live CSS var --subscribe-section-heading" },
      { token: "--paper", hex: "#F4F0E8", from: "Stumptown #f6f5f3, nudged warmer toward Fellow" },
      { token: "--rust", hex: "#B9412B", from: "Average of Stumptown red #b93826 and Intelligentsia CTA #d42927" },
      { token: "--mustard", hex: "#C0A868", from: "Stumptown's live CSS var --subscribe-card-hover-bg" },
      { token: "--leaf", hex: "#6F7A55", from: "Sage added for dark-roast card contrast" },
    ],
  },
  {
    slug: "rohe-and-earl",
    brand: "ROHE & EARL",
    tagline: "A small, slow-made clothing house. Edition 04, “Slow Linen”, releases 06.26.",
    prompt: "Build a fashion brand website.",
    stack: "pure-inspo",
    mode: "light",
    scoreSelf: 8.0,
    highlight:
      "Paper is #F1ECE3, not #FFFFFF — identifiably 'white' at a glance but unmistakably warm next to true white. That single choice makes the brand read as small-house / made-thing instead of mass-market. One chromatic colour (clay) appears in exactly five places, so it stays expensive.",
    references: [
      { slug: "karenwalker-com", took: "Its captured warm palette (#d5baa3 / #7d5838) anchored the cream + sienna direction." },
      { slug: "ysl-com", took: "YSL's palette — red #b9412b, clay #c0a37c — became the accent reference for the single chromatic colour." },
      { slug: "sandro-paris-com", took: "Cold pure-white reference — a negative signal that pushed the paper warmer." },
      { slug: "aritzia-com", took: "Mass-market white baseline to deliberately diverge from." },
      { slug: "mrporter-com", took: "Editorial menswear structure + the global-stockists footer pattern." },
      { slug: "highsnobiety-com", took: "Accent red #b8403a folded into the composed clay." },
    ],
    mcpCalls: [
      { tool: "search_screens", args: '{"query":"fashion brand editorial atelier"}', took: "Found the slow-fashion / editorial house cluster." },
      { tool: "search_screens", args: '{"query":"display serif fashion designer atelier cream tones","color":"warm"}', took: "YSL, Sandro, Karen Walker — validated warm-cream + sienna." },
      { tool: "get_design_system", args: '{"slug":"karenwalker-com"}', took: "Real warm captured palette to anchor paper + ink." },
      { tool: "find_similar", args: '{"slug":"karenwalker-com"}', took: "Neighbouring slow-fashion houses to confirm the genre." },
    ],
    palette: [
      { token: "--paper", hex: "#F1ECE3", from: "Split the difference between Karen Walker warm + Aritzia/Sandro cold-white" },
      { token: "--ink", hex: "#1A1612", from: "Warm near-black, not #000 — prints like ink, not pixels" },
      { token: "--clay", hex: "#A8482E", from: "Composed: YSL #b9412b × Karen Walker #74240c × Highsnobiety #b8403a" },
      { token: "--stone", hex: "#C8BFB0", from: "Muted divider tone" },
      { token: "--paper-2", hex: "#E8E1D3", from: "Raised paper for the atelier section" },
    ],
  },
  {
    slug: "kiln-and-bough",
    brand: "Kiln & Bough",
    tagline: "A two-person stoneware studio in a converted dairy barn outside Hudson, NY.",
    prompt: "Design a ceramics studio site.",
    stack: "pure-inspo",
    mode: "light",
    scoreSelf: 8.0,
    highlight:
      "get_design_system on Heath Ceramics with live:true returned the brand's actual muted palette (#26211b / #f5f4ee / #dd5640) — far quieter than the loud yellow-gold hero crops. That live token pull set the whole paper/ink/clay system and kept the studio feeling earthy and hand-made.",
    references: [
      { slug: "heathceramics-com", took: "Highest-signal call — live palette #26211b / #f5f4ee / #dd5640 + fonts Benton Sans / Monaco set the paper/ink/clay tokens." },
      { slug: "antinomy-studio", took: "Pale-clay / tan / warm-grey palette (#b48944 / #dac39e / #917f60) reinforced the warm-paper direction." },
      { slug: "artek-fi", took: "Warm-wood neutrals (#866b4b) + the tight near-lowercase wordmark influenced the brand mark." },
      { slug: "aldenshoe-com", took: "#ad411a folded into the terracotta blend." },
      { slug: "apartamentomagazine-com", took: "Editorial warm-paper magazine reference for the section rhythm." },
    ],
    mcpCalls: [
      { tool: "search_screens", args: '{"query":"ceramics studio handmade stoneware"}', took: "Found the craft-studio cluster." },
      { tool: "get_design_system", args: '{"slug":"heathceramics-com","live":true}', took: "Live muted palette + Benton Sans / Monaco — the data point the whole system hangs on." },
      { tool: "search_screens", args: '{"query":"editorial serif natural materials atelier studio","style":"editorial"}', took: "Studio Gang + Antinomy — warm-paper confirmation." },
      { tool: "search_screens", args: '{"query":"furniture wooden handmade workshop earth tones"}', took: "Artek's warm-wood neutrals informed the wordmark." },
    ],
    palette: [
      { token: "--paper", hex: "#F3EDE4", from: "Heath's live #f5f4ee, knocked slightly warmer" },
      { token: "--espresso", hex: "#1F1813", from: "Heath's #26211b near-black" },
      { token: "--terracotta", hex: "#A44A25", from: "Tighter reading of Heath #dd5640 / Alden #ad411a / Antinomy #b48944" },
      { token: "--moss", hex: "#3A4A32", from: "Single cool note — used only for the 'Garden series' badge" },
      { token: "--gold", hex: "#C98B3B", from: "Dark-section eyebrow accent" },
    ],
  },
  {
    slug: "conduit",
    brand: "Conduit",
    tagline: "A durable background-job / workflow runtime — in the Inngest / Temporal / Trigger.dev space.",
    prompt: "Create a developer infrastructure product page.",
    stack: "pure-inspo",
    mode: "dark",
    scoreSelf: 8.6,
    highlight:
      "The hero's right-hand dashboard mock is a believable product UI — workspaces sidebar with counts, a live timeline that ticks every 1.2s, a runs list with status dots that actually mean something (ok / running / warn / DLQ / fail), one of them blinking. Not a hero illustration; the product itself.",
    references: [
      { slug: "railway-com", took: "Its real font stack (Inter Tight + JetBrains Mono + IBM Plex Serif), deep slate bg hsl(250 24% 9%), and the left-headline + right-dashboard composition — adopted outright." },
      { slug: "vercel-com", took: "Geist + Geist Mono; the one centered-hero outlier in the genre — studied, then deliberately avoided." },
      { slug: "supabase-com", took: "Confirmed the single --brand-default accent with everything else grayscale — the one-accent rule." },
      { slug: "bun-sh", took: "The italic-serif accent word inside a sans H1 ('Bun is a *fast* package manager') — adopted the device, not the words." },
      { slug: "neon-tech", took: "Dark ground + a single saturated accent." },
      { slug: "postman-com", took: "Genre anchor for the developer-platform aesthetic." },
    ],
    mcpCalls: [
      { tool: "search_screens", args: '{"query":"developer infrastructure platform API","limit":6}', took: "Six genre anchors — Apple dev, Postman, Insomnia, Supabase, Render, Linode. Dark, monochrome, single accent." },
      { tool: "search_screens", args: '{"query":"edge compute serverless platform deploy","limit":6}', took: "Vercel, Heroku, Railway, Travis — triangulated the hero composition split." },
      { tool: "find_similar", args: '{"slug":"railway-com","limit":4}', took: "Pulled Bun + Anthropic; Bun's italic-serif-in-sans headline device." },
      { tool: "get_design_system", args: '{"slug":"railway-com"}', took: "Real fonts Inter Tight + JetBrains Mono, bg hsl(250 24% 9%) — adopted the stack." },
      { tool: "get_design_system", args: '{"slug":"vercel-com"}', took: "Geist + Geist Mono; confirmed mono is part of the genre's lingua franca." },
    ],
    palette: [
      { token: "--accent", hex: "#F0A657", from: "Soft saffron — warm family, but deliberately none of Vercel-yellow / Supabase-green / Bun-pink / Railway-purple / Neon-turquoise" },
      { token: "--ground", hex: "#0B0D12", from: "Deep near-black, in the Railway slate family" },
    ],
  },
  {
    "slug": "still-app",
    "brand": "Still",
    "tagline": "A meditation & sleep app built around one quiet hour — a single, unbroken sixty-minute descent that ends with you already asleep, with no streaks, badges, or morning to optimise.",
    "prompt": "Build a landing page for a meditation & sleep app.",
    "stack": "pure-inspo",
    "mode": "dark",
    "scoreSelf": 8.6,
    "highlight": "The hero is a living, breathing lamp: a soft radial amber glow sits low-center behind a hairline Fraunces serif headline and slowly breathes on a 4-7-8 cadence (21% inhale, hold, long exhale) — the exact breath the app's body-scan is paced to, and the copy says so ('the same cadence the light on this page is breathing'). It's pure CSS, mirrored in the closing CTA's lamp, layered with drifting dust motes and a faint Flos-style film grain over a warm near-black night field. So the page doesn't just describe a wind-down, it performs one. Fully disabled under prefers-reduced-motion. The whole 'warm light in the dark' concept came directly from tracing the meditation brief into Inspo's lighting-brand cluster (Flos, Louis Poulsen) rather than the obvious pastel-wellness default.",
    "references": [
      {
        "slug": "davidwhyte-com",
        "took": "The keystone reference — a poet's site giving the hairline high-contrast serif display (Canela at weight 100, italic accents), the ochre/sage/deep-brown palette, and the contemplative editorial tone. Drove the type system and most palette tokens."
      },
      {
        "slug": "eightsleep-com",
        "took": "The literal sleep-product structure: Split Studio macrostructure, warm ink, a clean grotesque body (NeueMontreal → Inter Tight), 17px body, base-4 spacing, and container width."
      },
      {
        "slug": "flos-com",
        "took": "Warm-charcoal ink #2c2014 (deepened to my --ink), the grain-texture overlay idea (its --color-background-image grain), and luxe dark restraint."
      },
      {
        "slug": "louispoulsen-com",
        "took": "The amber lamplight accent #d49434 and the 'warm golden light in darkness' hero mood that became the breathing-lamp concept."
      },
      {
        "slug": "huckmag-com",
        "took": "Corroborated the warm-ochre / burnt-umber editorial register surfaced by the find_by_color search around #ad8253."
      }
    ],
    "mcpCalls": [
      {
        "tool": "search_screens",
        "args": "{\"query\":\"meditation sleep calm mindfulness app\",\"limit\":8}",
        "took": "Mapped the genre: split between pastel (Headspace) and the literal sleep product Eight Sleep (Split Studio, 'sculpted cool minimalism')."
      },
      {
        "tool": "recommend",
        "args": "{\"brief\":\"calm minimal landing page for a meditation and sleep app\"}",
        "took": "Suggested Bento Grid and returned the canonical bento component source ('irregular tiles defeat the 3x2 sameness'), which shaped the Soundscapes grid."
      },
      {
        "tool": "search_screens",
        "args": "{\"query\":\"deep night dark calm serene ambient wellness\",\"mode\":\"dark\",\"limit\":8}",
        "took": "Showed most dark hits are cold/techy (wrong calm) and surfaced the one gem, davidwhyte-com — confirming the contemplative warm-dark direction."
      },
      {
        "tool": "find_similar",
        "args": "{\"slug\":\"eightsleep-com\",\"limit\":6}",
        "took": "Returned Split Studio neighbours (Peloton, Bun), confirming Split Studio as the hero macrostructure for the genre."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"davidwhyte-com\",\"live\":true}",
        "took": "Highest-signal call: Canela Text h1 at weight 100 / line-height 1.1, Canela Italic h2, and the exact ochre/cream/brown/sage palette tokens."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"eightsleep-com\",\"live\":true}",
        "took": "Real tokens: warm ink #1c0c06, muted #ccb4a4, sage #536c32, grotesque body 17px, base-4 spacing, 1440 container, tight heading tracking."
      },
      {
        "tool": "find_by_color",
        "args": "{\"hex\":\"#ad8253\",\"limit\":6}",
        "took": "Pulled the warm-dark luxe family — Louis Poulsen #d49434, Flos #2c2014/#d5bca3, Huck — from which I traced the amber accent and the deep ink."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"flos-com\",\"live\":true}",
        "took": "Confirmed ink #2c2014 and exposed the grain-texture overlay + --color-light 244,239,231, inspiring the faint film grain."
      }
    ],
    "palette": [
      {
        "token": "--ink",
        "hex": "#16110D",
        "from": "Flos ink #2c2014, deepened toward night"
      },
      {
        "token": "--ink-2",
        "hex": "#1F1813",
        "from": "warm panel between Flos #2c2014 and black"
      },
      {
        "token": "--cream",
        "hex": "#ECE3D6",
        "from": "David Whyte support #d4bda5, lifted for body text on dark"
      },
      {
        "token": "--cream-dim",
        "hex": "#B6AB99",
        "from": "David Whyte #7d5f48 muted-body family"
      },
      {
        "token": "--amber",
        "hex": "#D49434",
        "from": "Louis Poulsen #d49434 — the lamplight accent"
      },
      {
        "token": "--amber-soft",
        "hex": "#C8A874",
        "from": "David Whyte support #ad8253, warmed"
      },
      {
        "token": "--umber",
        "hex": "#572A06",
        "from": "David Whyte accent #572a06 (deep brown depth)"
      },
      {
        "token": "--sage",
        "hex": "#8C999D",
        "from": "David Whyte support #8c999d (cool counterweight glow)"
      }
    ]
  },
  {
    "slug": "meridian-bank",
    "brand": "Meridian",
    "tagline": "The business bank that reads like a balance sheet, not a billboard — high-yield treasury, corporate cards, and wires that clear, for founders and finance teams done with toy fintech.",
    "prompt": "Create a marketing site for a modern business bank.",
    "stack": "pure-inspo",
    "mode": "light",
    "scoreSelf": 8.4,
    "highlight": "The whole page rejects the cold violet/teal/dark-mode default that the fintech cluster (Wealthfront, Qonto, Increase, Payhawk) falls into, and commits instead to a warm-paper editorial private-bank register traced to the two most credible names in the archive: Mercury (captured clay #dcbeae over green-black ink, actually running Tiempos Headline serif) and Brex (live-extracted to Flecha serif + Space Mono + burnt #ff5900). The standout build move is the hero: a Split Studio (Mercury/Qonto macrostructure) whose right half is a fully hand-built treasury console in pure CSS/SVG — a live-ticking tabular-Fraunces balance, an inline SVG yield sparkline, a four-row transaction ledger, and a floating 'wire approved, 2 of 2 signers' chip — with not a single raster image anywhere. Serif display + grotesk + mono-for-figures on warm paper is what keeps a money product from looking like every cold crypto dashboard in the set.",
    "references": [
      {
        "slug": "mercury-com",
        "took": "The pivotal proof: captured warm clay accent #dcbeae over green-black ink #0c1c29, Split Studio macrostructure, soft/editorial vibe, and a live design system running Tiempos Headline serif — the entire warm-serif-bank thesis and the --clay/--ink tokens."
      },
      {
        "slug": "brex-com",
        "took": "Live-extracted to Flecha (serif) + Inter + Space Mono on warm muted #ccc4b4 with burnt #ff5900 — validated serif-display + mono-figures + ember-accent as a real fintech pattern; source of --ember and --ink-mute."
      },
      {
        "slug": "italic-com",
        "took": "Warm-paper Split Studio with Martina Plantijn serif and sand #d4c5a6/#d1ae81 ('Life is luxury') — anchored the --paper page surface and the luxe-editorial tone."
      },
      {
        "slug": "antimetal-com",
        "took": "Editorial Split Studio with Test Signifier serif + Geist on gold/sand #d8971f/#c5bba7 — confirmed the serif+grotesk-on-warm pattern and seeded --gold and the paper hairlines."
      },
      {
        "slug": "unit-co",
        "took": "Suisse with tight negative letter-spacing on headings and --colour--dark-green #053222 — informed the tight-grotesk heading treatment and the --moss 'old money' green on the card + security band."
      },
      {
        "slug": "qonto-com",
        "took": "Split Studio business-account reference; real 4px spacing base, 0–24 radii, 1440 container, plus a hidden warm sand/gold layer in its CSS vars that justified going warm."
      },
      {
        "slug": "increase-com",
        "took": "The dark-mode banking-API default (Untitled Sans, .25rem base, 0/4/8/12 radii) I deliberately rejected — the negative reference that proved the cold register was the slop to avoid."
      },
      {
        "slug": "knoll-com",
        "took": "Surfaced by find_by_color on Mercury's clay tone (#d7beb2, luxe/calm) — part of the warm 'quiet luxury' editorial cluster that set the hairline and surface family."
      }
    ],
    "mcpCalls": [
      {
        "tool": "search_screens",
        "args": "{\"query\":\"business bank fintech finance dashboard landing page\",\"limit\":8}",
        "took": "Core fintech cluster (Qonto/Brex/Unit/Wealthfront/Payhawk); showed the genre splits into cold violet/teal/dark-orange."
      },
      {
        "tool": "search_screens",
        "args": "{\"query\":\"modern banking finance product UI mock clean\",\"limit\":8}",
        "took": "Added Increase, Public, Stripe-adjacent; confirmed product-UI-mock heroes are the genre norm."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"qonto-com\",\"live\":true}",
        "took": "Real tokens (4px base, 1440 container) plus a hidden warm sand/gold layer in CSS vars under the cool blue surface."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"increase-com\",\"live\":true}",
        "took": "Untitled Sans, .25rem base, tight 0/4/8/12 radii — the dark default I chose to avoid."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"unit-co\",\"live\":true}",
        "took": "Tight negative heading tracking and --colour--dark-green #053222 / cream tokens — fed --moss and the heading style."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"mercury-com\",\"live\":true}",
        "took": "The pivot: Mercury runs --font-tiempos-headline (serif) + arcadia — proof a serious bank can be warm + serif."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"brex-com\",\"live\":true}",
        "took": "Flecha serif + Inter + Space Mono, palette #ffffff/#ff5900/#15191e/#ccc4b4 — locked serif+mono+ember as a real pattern."
      },
      {
        "tool": "find_by_color",
        "args": "{\"hex\":\"#dcbeae\"}",
        "took": "Traced Mercury's clay into a coherent warm editorial cluster (Knoll, Brunello Cucinelli, MoMA) — the quiet-luxury paper family."
      },
      {
        "tool": "compare",
        "args": "{\"slugs\":[\"brex-com\",\"mercury-com\",\"qonto-com\"]}",
        "took": "Triangulated house style: shared minimalism+brutalism, light register, Split Studio/Feature Stack, ~1440 container, 4px base."
      },
      {
        "tool": "recommend",
        "args": "{\"brief\":\"warm, trustworthy business bank for founders, serif display, paper tones, editorial not crypto\"}",
        "took": "Picked Split Studio; returned serif-forward exemplars and the canonical Hallmark Split-Screen 'no stock photos' component I followed for the hero."
      }
    ],
    "palette": [
      {
        "token": "--paper",
        "hex": "#F4F1EA",
        "from": "warm-paper register from italic-com #d4c5a6 / antimetal-com #c5bba7, lifted to a true page surface"
      },
      {
        "token": "--card",
        "hex": "#FBF9F4",
        "from": "raised warm white above paper, same sand family"
      },
      {
        "token": "--line-2",
        "hex": "#CABFA9",
        "from": "warm hairline from brex-com muted #ccc4b4 / knoll #d7beb2 family"
      },
      {
        "token": "--ink",
        "hex": "#16221C",
        "from": "mercury-com ink #0c1c29, warmed toward a green-black for paper"
      },
      {
        "token": "--ink-mute",
        "hex": "#8C8B7E",
        "from": "brex-com live grey #60646c / #6f737b, warmed"
      },
      {
        "token": "--ember",
        "hex": "#BE4423",
        "from": "brex-com #fc5c04 / live #ff5900 + knoll #f4572f, deepened for a refined private-bank burnt-orange"
      },
      {
        "token": "--clay",
        "hex": "#DCBEAE",
        "from": "mercury-com accent #dcbeae (exact)"
      },
      {
        "token": "--moss",
        "hex": "#1E3A2B",
        "from": "unit-co --colour--dark-green #053222 / italic-com #174e36 — 'old money' green"
      },
      {
        "token": "--gold",
        "hex": "#B07A1E",
        "from": "antimetal-com #d8971f / hypereffekt #be8222, for the yield-bar gradient terminus"
      }
    ]
  },
  {
    "slug": "the-fold-quarterly",
    "brand": "The Fold",
    "tagline": "An independent print quarterly about the things we keep, mend, and pass on — Issue Seven, The Repair Issue.",
    "prompt": "Design a website for an independent print magazine.",
    "stack": "pure-inspo",
    "mode": "light",
    "scoreSelf": 8.4,
    "highlight": "The lead-essay split contains a magazine cover constructed entirely in CSS — a 3:4 plate with a hard ink border, an offset paper drop-shadow, and a giant ghost '07' numeral bleeding off the bottom-right corner behind the cover wordmark — turning the editorial-split into an actual newsstand object with zero raster assets. It's apartamentomagazine-com's 'cover as hero' idea rebuilt from scratch. Paired with a giant Bodoni Moda masthead pulled to the page edge and an italic oxblood ampersand, the page reads unmistakably as a printed periodical rather than a SaaS landing page.",
    "references": [
      {
        "slug": "apartamentomagazine-com",
        "took": "The core analog: a real print magazine on a Specimen macrostructure with a cover-as-hero treatment. Source of the paper neutral (#ddcab1, Δ0.000) and the oxblood accent (#9e2118)."
      },
      {
        "slug": "eyemagazine-com",
        "took": "Live CSS vars revealed the Helvetica + Georgia editorial pairing → mapped to Archivo (grotesque) + Newsreader (serif). Confirmed the oxblood/crimson register (#a10c37)."
      },
      {
        "slug": "commercialtype-com",
        "took": "Type Specimen genre signature — huge type, hard rules, vast negative space, one hot accent. Its ink #4c047c became the muted plum --plum."
      },
      {
        "slug": "magazine-b-com",
        "took": "Warm, earthy, muted brand-magazine palette (#cebda8, #bf6016) — reinforced the warm-paper ground and the gold marginalia accent."
      },
      {
        "slug": "logicmag-io",
        "took": "An actual independent print magazine on a split-studio layout; validated the editorial-split feature section and the grotesque label spine (Apercu)."
      },
      {
        "slug": "frontierclimate-com",
        "took": "Corroborated the warm-neutral paper field (#d9c9a8) via find_by_color, confirming the paper foundation is traced, not invented."
      },
      {
        "slug": "ortype-is",
        "took": "Type-specimen reference (verified via get_screen) — restraint model: stark rules, one red accent, type as the whole show."
      }
    ],
    "mcpCalls": [
      {
        "tool": "search_screens",
        "args": "{\"query\":\"independent print magazine editorial type-forward specimen\",\"limit\":8}",
        "took": "Located the editorial cluster: apartamentomagazine, eyemagazine, logicmag, magazine-b, smashing, knowable."
      },
      {
        "tool": "recommend",
        "args": "{\"brief\":\"Independent print magazine, editorial, big serif type, asymmetric layout, archive index, warm paper\"}",
        "took": "Bento-Grid lean + reference component source confirming 'typography supplies the variety, no icons' editorial discipline."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"apartamentomagazine-com\",\"live\":true}",
        "took": "Confirmed Specimen macro + cover-as-hero; curated palette #fcec44/#9e2118/#688ea0/#ddcab1."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"eyemagazine-com\",\"live\":true}",
        "took": "High-signal type find: --font-sans Helvetica + --font-serif Georgia → Archivo + Newsreader."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"magazine-b-com\",\"live\":true}",
        "took": "Warm earth palette #bf6016/#8b3810/#cebda8 ('earthy, muted, warm') → paper + gold direction."
      },
      {
        "tool": "find_similar",
        "args": "{\"slug\":\"apartamentomagazine-com\",\"limit\":6}",
        "took": "Neighbours all Specimen (amitm, vanschneider) — confirmed the Specimen page-shape for the hero."
      },
      {
        "tool": "search_screens",
        "args": "{\"query\":\"editorial magazine serif display type ramp issue contents masthead\",\"limit\":6}",
        "took": "The type-specimen vein: commercialtype, ortype, camelot, rosetta — set huge-type + hard-rule genre signature."
      },
      {
        "tool": "compare",
        "args": "{\"slugs\":[\"apartamentomagazine-com\",\"eyemagazine-com\",\"commercialtype-com\"]}",
        "took": "Triangulated the house style: editorial + minimalism + swiss, light mode, deep ink + one hot accent."
      },
      {
        "tool": "find_by_color",
        "args": "{\"hex\":\"#ddcab1\"}",
        "took": "Traced the paper: exact Apartamento value (Δ0.000), same family in magazine-b/frontierclimate/fermliving — proved the paper foundation is real."
      }
    ],
    "palette": [
      {
        "token": "--paper",
        "hex": "#EFE7D6",
        "from": "apartamentomagazine-com muted #ddcab1 (Δ0.000), warmed toward magazine-b-com #cebda8 / frontierclimate-com #d9c9a8"
      },
      {
        "token": "--ink",
        "hex": "#211A14",
        "from": "warm near-black body ink for uncoated paper (editorial cluster body register, not pure #000)"
      },
      {
        "token": "--oxblood",
        "hex": "#9E2118",
        "from": "apartamentomagazine-com support #9e2118, kin to eyemagazine-com #a10c37 — the single accent"
      },
      {
        "token": "--plum",
        "hex": "#4C2A4A",
        "from": "commercialtype-com ink #4c047c, muted to sit on paper"
      },
      {
        "token": "--teal",
        "hex": "#466A78",
        "from": "apartamentomagazine-com #688ea0, desaturated"
      },
      {
        "token": "--gold",
        "hex": "#C68A1E",
        "from": "logicmag-io #a5841c / magazine-b-com #bf6016 territory — marginalia accent"
      }
    ]
  },
  {
    "slug": "subtone-records",
    "brand": "Subtone",
    "tagline": "An independent Berlin electronic label for deep house, dub techno, ambient and broken beat — pressed to wax, mastered loud, and catalogued obsessively (SUB-001 → SUB-041).",
    "prompt": "Build a site for an electronic record label.",
    "stack": "pure-inspo",
    "mode": "dark",
    "scoreSelf": 8.6,
    "highlight": "The page rejects the obvious 'streaming-app grid of stock album art' and instead runs the gallery-quiet, catalogue-obsessed register of real label sites (Ninja Tune, XL, Ghostly) through a brutalist type-specimen hero. Two moves carry it: a wordmark headline that splits SUBTONE into an outlined SUB (-webkit-text-stroke) plus a solid indigo TONE and drops an italic serif 'low rooms,' into the otherwise grotesk display — the mixed outline/fill/italic trick lifted straight from swisstypefaces-com; and a fully image-free generative cover system. The featured release is a glowing concentric-ring 'sub' record built from radial gradients and SVG-noise grain, and the catalogue wall generates eight deterministic covers from a per-record seed across four compositional styles on a coherent indigo-anchored palette.",
    "references": [
      {
        "slug": "yannnovak-com",
        "took": "The structural + palette backbone: near-black #04040c surface, electric indigo #3f3fbf/#9b9bdd, Space Mono labels at tight tracking, the title/album/year metadata-row catalogue layout, 0-3px radius; its real CSS var justified Space Grotesk as the display face."
      },
      {
        "slug": "ninjatune-net",
        "took": "Genre + structure proof — a real electronic label whose dense, gallery-like wall of album art is exactly the catalogue grid; its teal #1d6d59 seeds one of the generated cover palettes."
      },
      {
        "slug": "cognition-ai",
        "took": "The brutalist register: live fonts (mono + grotesk + serif) justified the three-family system, the dot-grid hero background and bracketed/oversized type move, and the off-white ink value #edeceb."
      },
      {
        "slug": "swisstypefaces-com",
        "took": "The hero move — marquee macrostructure plus the mixed outline/fill/italic oversized headline that became SUB(outline) TONE(indigo) + italic-serif 'low rooms,'."
      },
      {
        "slug": "beatport-com",
        "took": "Club-platform energy — dark surface with an electric accent and dense release rows; pushed the page toward 'loud, catalogued, electronic' over 'calm SaaS'."
      },
      {
        "slug": "phantom-land",
        "took": "Grotesk discipline — tight-leading oversized grotesk headings (line-height ~.93), radius 0, and a pure black/white token base."
      }
    ],
    "mcpCalls": [
      {
        "tool": "search_screens",
        "args": "{\"query\":\"electronic music record label\",\"limit\":8}",
        "took": "Surfaced the genre cluster (xlrecordings, ghostly, thirdmanrecords, beatport); established dark/monochrome, hero-fullbleed + grid as the label norm."
      },
      {
        "tool": "search_screens",
        "args": "{\"query\":\"brutalist experimental dark high contrast typography\",\"limit\":8}",
        "took": "Surfaced the brutalist cluster (cognition-ai, method, trychroma, tonal); gave the dark type-specimen register and bracketed oversized type."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"cognition-ai\",\"live\":true}",
        "took": "High signal: live fonts GeistMono + nbInternational + stkBureauSerif (mono+grotesk+serif) and live off-white #edeceb; confirmed dot-grid + bracket-type hero."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"yannnovak-com\",\"live\":true}",
        "took": "Highest signal: real fonts Barlow + Space Mono and the CSS var pointing to Space Grotesk; exact tokens for surface, indigo, container 1400px, radius 0/3px, mono buttons at 12px."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"phantom-land\",\"live\":true}",
        "took": "Brutalist confirmation: grotesk headings at line-height .93, radius 0, --color-primary #fff / --color-secondary #000."
      },
      {
        "tool": "find_similar",
        "args": "{\"slug\":\"yannnovak-com\",\"limit\":6}",
        "took": "Neighbours (ottografie, vanschneider, pacomepertant) all specimen + near-black + single chroma accent — confirmed the house pattern repeats."
      },
      {
        "tool": "search_screens",
        "args": "{\"query\":\"oversized type marquee ticker index list catalogue numbered\",\"limit\":6}",
        "took": "swisstypefaces-com (marquee + mixed-weight display) and ortype/commercialtype (type-specimen) — sourced the ticker and mixed outline/fill/italic headline."
      },
      {
        "tool": "compare",
        "args": "{\"slugs\":[\"yannnovak-com\",\"cognition-ai\",\"beatport-com\"]}",
        "took": "Triangulated the house style: shared minimalism, specimen macrostructure on the artier two, Ecosystem-Index density from beatport."
      },
      {
        "tool": "find_by_color",
        "args": "{\"hex\":\"#3f3fbf\"}",
        "took": "Palette proof: #3f3fbf on #04040c is a real repeated pairing (scale-com Δ0.000, yannnovak Δ0.000) and surfaced ninjatune-net as the closest genre+structure match."
      },
      {
        "tool": "get_screen",
        "args": "{\"slug\":\"ninjatune-net\"}",
        "took": "Verified ninjatune for citation; confirmed dark, gallery-like album-art catalogue grid with indigo #1042bd."
      }
    ],
    "palette": [
      {
        "token": "--void",
        "hex": "#04040c",
        "from": "yannnovak-com surface; scale-com Δ0.000 via find_by_color"
      },
      {
        "token": "--paper",
        "hex": "#edeceb",
        "from": "cognition-ai live palette (off-white ink)"
      },
      {
        "token": "--indigo",
        "hex": "#3f3fbf",
        "from": "yannnovak-com electric indigo (exact value)"
      },
      {
        "token": "--indigo-3",
        "hex": "#9b9bdd",
        "from": "yannnovak-com lifted indigo (exact value)"
      },
      {
        "token": "--lime",
        "hex": "#c8f24a",
        "from": "typesense-org #bbf258 — single hot signal accent"
      },
      {
        "token": "--line-2",
        "hex": "#26263a",
        "from": "derived hairline step off --void, matching yannnovak/ottografie hairline-on-near-black"
      }
    ]
  },
  {
    "slug": "osteria-nera",
    "brand": "Osteria Nera",
    "tagline": "A 14-seat tasting-menu restaurant in Torino where chef Lucia Maranzano serves one nightly 11-course menu by candlelight — no choices but the wine.",
    "prompt": "Create a landing page for a fine-dining tasting-menu restaurant.",
    "stack": "pure-inspo",
    "mode": "dark",
    "scoreSelf": 8.6,
    "highlight": "A candlelit table composed entirely in CSS — since restaurants have no stock photos in the archive, the hero atmosphere is built from primitives: a warm-grain near-black ground, two layered radial gradients that pool candlelight and fall off into black (tracing Louis Poulsen's 'golden liquid light' and Eleven Madison Park's warm earth), a plated fifth course rendered from gradients and border-radius (sauce smear, quenelle, foraged leaf, scattered spice-dust), and a keyframed flickering taper (killed under prefers-reduced-motion). The 11-course menu is then set as a numbered Roman carte in Dinner by Heston's Specimen voice, so the movements themselves are the hero content rather than decoration around a photo — restrained, expensive, and the deliberate dark opposite of the warm-light coffee example, drawn from the same archive.",
    "references": [
      {
        "slug": "deathandcompany-com",
        "took": "Keystone: live EB Garamond + near-black ground + oxblood red (#b32614); the dark, 'sophisticated and slightly mysterious' atmosphere and Marquee-Hero feel."
      },
      {
        "slug": "elevenmadisonpark-com",
        "took": "Live Inter Tight + EB Garamond pairing (my exact type system) and the warm earth palette behind candle amber #C9882E / flesh #E3A074."
      },
      {
        "slug": "dinnerbyheston-com",
        "took": "The Specimen macrostructure for fine dining — typography as the hero, monochrome 'quiet authority' — modeled by the numbered menu carte and restrained type ramp."
      },
      {
        "slug": "atomixnyc-com",
        "took": "Warm rust family (#c95535/#471e13/#e3a696) and grotesque-for-UI confirmation (live Libre Franklin)."
      },
      {
        "slug": "olsonkundig-com",
        "took": "Dark Type-Specimen scaffold — proof that a near-black field plus a large serif plus vast space reads as 'considered ethos'; used for the menu band."
      },
      {
        "slug": "louispoulsen-com",
        "took": "The 'warm golden liquid light, quiet luxury' glow-on-dark mood behind the CSS candlelight gradients."
      }
    ],
    "mcpCalls": [
      {
        "tool": "search_screens",
        "args": "{\"query\":\"restaurant fine dining tasting menu\",\"limit\":8}",
        "took": "Surfaced the hospitality cluster: dinnerbyheston (dark Specimen), atomixnyc, elevenmadisonpark, mirazur."
      },
      {
        "tool": "search_screens",
        "args": "{\"query\":\"luxe hospitality elegant serif warm\",\"limit\":8}",
        "took": "Confirmed the luxe spine (Goyard, Chanel, Italic) — restraint + serif + huge negative space."
      },
      {
        "tool": "search_screens",
        "args": "{\"query\":\"dark moody editorial restaurant atmospheric\",\"limit\":8}",
        "took": "Found the dark-atmospheric pillar: deathandcompany ('deep charcoal expanse, slightly mysterious'), mubi."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"dinnerbyheston-com\",\"live\":true}",
        "took": "Macrostructure Specimen; monochrome/muted/high-contrast; confirmed typography-as-hero on a near-monochrome field."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"deathandcompany-com\",\"live\":true}",
        "took": "Keystone: live EB Garamond + #000/#fff + brand red #b32614 — elegant serif on near-black with oxblood accent."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"elevenmadisonpark-com\",\"live\":true}",
        "took": "Live Inter Tight + EB Garamond (the canonical tasting menu uses my exact two faces); warm palette → candle amber."
      },
      {
        "tool": "find_similar",
        "args": "{\"slug\":\"deathandcompany-com\",\"limit\":6}",
        "took": "Death & Co sub-pages (all Marquee-Hero) + louispoulsen 'warm golden liquid light' — validated warm-glow-on-dark."
      },
      {
        "tool": "compare",
        "args": "{\"slugs\":[\"deathandcompany-com\",\"elevenmadisonpark-com\",\"dinnerbyheston-com\"]}",
        "took": "Common styles minimalism+editorial across all three; triangulated the house style: serif-led, one big idea per screen."
      },
      {
        "tool": "find_by_color",
        "args": "{\"hex\":\"#8a1c12\"}",
        "took": "Tight real cluster around the oxblood (#882219, #871812, #86201c, #872414) — proves the accent is from real captures."
      },
      {
        "tool": "get_screen",
        "args": "{\"slug\":\"deathandcompany-com\"}",
        "took": "Verified the keystone slug/record so the reference never 404s."
      }
    ],
    "palette": [
      {
        "token": "--ink",
        "hex": "#0C0A08",
        "from": "Death & Co live #000, warmed slightly toward brown per Dinner by Heston's muted monochrome"
      },
      {
        "token": "--bone",
        "hex": "#ECE6D8",
        "from": "Death & Co live #fff warmed toward bone — EMP/Atomix neutrals are warm, never cold white"
      },
      {
        "token": "--oxblood",
        "hex": "#8A1C12",
        "from": "Death & Co brand red #b32614 deepened; center of the find_by_color #8a1c12 cluster"
      },
      {
        "token": "--ember",
        "hex": "#B23A24",
        "from": "lifted oxblood for hovers, between Death & Co #b32614 and Atomix #c95535"
      },
      {
        "token": "--amber",
        "hex": "#C9882E",
        "from": "Eleven Madison Park #c57838 / Louis Poulsen #d49434 — the candle-gold accent"
      },
      {
        "token": "--flesh",
        "hex": "#E3A074",
        "from": "EMP #e1b997 + Atomix #e3a696 — warm highlight on serif emphasis and the plated food"
      }
    ]
  },
  {
    "slug": "vox-runtime",
    "brand": "Larynx",
    "tagline": "The runtime for production voice agents — write the agent in code, point it at a phone number, and deploy, with sub-300ms turn-taking and a full transcript of every call.",
    "prompt": "Build a product page for an AI voice-agents platform.",
    "stack": "pure-inspo",
    "mode": "dark",
    "scoreSelf": 8.6,
    "highlight": "The hero's live-call console: a transcript that types in turn-by-turn under an 'On air' pulse, paired with a per-bar animated CSS waveform, a 287ms turn-latency meter, and live tool-call chips. It renders the product's value proposition as one believable object and makes the page unmistakably about voice rather than another dev-infra dashboard. The amber waveform then recurs as a through-line — in the brand mark, the latency feature card, and a generated waveform along the closing CTA's bottom edge — while a single luminous amber accent on a deliberately warm brown-black ground keeps the whole page disciplined and distinct from the cold-blue norm of the category.",
    "references": [
      {
        "slug": "netlify-com",
        "took": "Primary amber source — 'deep charcoal canvas, luminous apricot accents' (#f9b23b/#fcbc54) and Martian Mono in the font stack; earned warm-amber-on-dark with a real capture."
      },
      {
        "slug": "gehry-getty-edu",
        "took": "Warm ochre-on-dark (#fca443/#6c4c1c) + Roboto Mono — validated the brown-black ground and amber accent as a real, non-generic dark palette."
      },
      {
        "slug": "vapi-ai",
        "took": "Real display ramp from avantt (h1 80px / line-height 0.9 / letter-spacing -4px); basis for the tight, confident Space Grotesk hero. Also a closest-premise competitor to diverge from."
      },
      {
        "slug": "axiom-co",
        "took": "Warm-dark observability tool using BerkeleyMono + Inter with a warm peach support color; anchored the premium-mono choice and the warm-dark-devtool register."
      },
      {
        "slug": "daily-co",
        "took": "Real DM Sans + DM Mono pairing and a warm coral accent; confirmed mono-as-lingua-franca and that the voice lane is otherwise saturated with blue/indigo."
      },
      {
        "slug": "genelec-com",
        "took": "A pro-audio brand with a warm gold palette (#ab8e43 on #3c270b); validated warm-gold as an audio-adjacent direction surfaced via find_similar on vapi-ai."
      }
    ],
    "mcpCalls": [
      {
        "tool": "search_screens",
        "args": "{\"query\":\"AI platform developer product dark\",\"limit\":8}",
        "took": "Mapped the AI/devtool cluster (retell, launchdarkly, galileo, beam, hex); confirmed the genre default is indigo/blue on charcoal."
      },
      {
        "tool": "search_screens",
        "args": "{\"query\":\"voice agent calls audio waveform\",\"limit\":8}",
        "took": "Found the direct voice-AI competitors (retellai, vapi, daily, otter); confirmed the lane is blue/indigo-saturated, so warm amber would own it."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"vapi-ai\",\"live\":true}",
        "took": "Real avantt display ramp (80px/0.9/-4px) and Geist Mono — the ratio behind my hero type."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"daily-co\",\"live\":true}",
        "took": "Real DM Sans + DM Mono and a coral accent; reinforced mono-as-lingua-franca."
      },
      {
        "tool": "find_by_color",
        "args": "{\"hex\":\"#e8a13c\"}",
        "took": "Confirmed amber lives in the archive; surfaced netlify-com and gehry-getty-edu as warm-amber captures."
      },
      {
        "tool": "search_screens",
        "args": "{\"query\":\"developer tools terminal dark amber warm monospace\",\"limit\":6}",
        "took": "Surfaced netlify-com's 'charcoal canvas + luminous apricot' — the exact register I built."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"netlify-com\",\"live\":true}",
        "took": "Live tokens: dark ground #181a1c, Martian Mono, brand apricot #f9b23b/#fcbc54 — primary amber source."
      },
      {
        "tool": "recommend",
        "args": "{\"brief\":\"developer platform to build and deploy AI voice agents that handle phone calls, warm dark UI, amber accent\"}",
        "took": "Picked Split Studio as dominant macrostructure; exemplars reaffirmed vapi/daily."
      },
      {
        "tool": "find_similar",
        "args": "{\"slug\":\"vapi-ai\",\"limit\":6}",
        "took": "Neighbours surfaced axiom-co (BerkeleyMono, warm peach) and genelec-com (warm gold pro-audio)."
      },
      {
        "tool": "get_screen",
        "args": "{\"slug\":\"axiom-co\"}",
        "took": "Verified every cited reference slug resolves before citing it."
      }
    ],
    "palette": [
      {
        "token": "--bg",
        "hex": "#16110B",
        "from": "warm brown-black — traced to gehry-getty-edu ochre-dark (#6c4c1c) + netlify-com dark #181a1c, pulled warm"
      },
      {
        "token": "--amber",
        "hex": "#FFB23B",
        "from": "netlify-com brand apricot #f9b23b/#fcbc54 and gehry-getty-edu #fca443"
      },
      {
        "token": "--amber-deep",
        "hex": "#C97F1E",
        "from": "darkened netlify apricot for pressed/shadow states"
      },
      {
        "token": "--ink",
        "hex": "#F7EFE2",
        "from": "warm-white reading text chosen for a warm ground (vs the cold #eef0f3 seen across the cluster)"
      },
      {
        "token": "--live",
        "hex": "#7FD49A",
        "from": "functional 'on air' signal-green, kept rare; echoes the cluster's green status hues"
      }
    ]
  }
];

export function getExample(slug: string): Example | undefined {
  return EXAMPLES.find((e) => e.slug === slug);
}
