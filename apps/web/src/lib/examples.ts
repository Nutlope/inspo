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
];

export function getExample(slug: string): Example | undefined {
  return EXAMPLES.find((e) => e.slug === slug);
}
