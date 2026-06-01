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
    "slug": "subtone-records",
    "brand": "Subtone",
    "tagline": "Records for low rooms and long nights.",
    "prompt": "Build a site for an electronic record label.",
    "stack": "pure-inspo",
    "mode": "dark",
    "scoreSelf": 8.6,
    "highlight": "Tight fold-complete hero (verified at 1280×800: hero 92→800, the headline, both CTAs and the featured-release card all inside) with generative CSS/SVG cover art and a mono studio-logbook system, traced to yannnovak / astrodither / hugeinc. The giant overflowing wordmark of the prior version is gone — the brand now lives in the nav.",
    "references": [
      {
        "slug": "yannnovak-com",
        "took": "Live surface #04040c, indigo #3f3fbf/#9b9bdd accents, Space Mono, and the release-card grid."
      },
      {
        "slug": "astrodither-robertborghesi-is",
        "took": "Violet/magenta #b14e88 cover tone and all-mono brutalist confidence on a #040c0c surface."
      },
      {
        "slug": "hugeinc-com",
        "took": "Fold composition: a generative square + sticky pill CTA inside the first screen; tight h1 tracking."
      },
      {
        "slug": "ghostly-com",
        "took": "Hot accent on a cold field (its #51feff cyan → my lime signal)."
      },
      {
        "slug": "xlrecordings-com",
        "took": "Industrial dark register + mono type + off-white ink."
      }
    ],
    "mcpCalls": [
      {
        "tool": "search_screens",
        "args": "{\"query\":\"electronic music record label brutalist\"}",
        "took": "Mapped the genre cluster."
      },
      {
        "tool": "recommend",
        "args": "{\"brief\":\"electronic record label dark brutalist hero with featured release\"}",
        "took": "Read heroGuidance; Marquee-Hero refs."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"xlrecordings-com\",\"live\":true}",
        "took": "#00120f surface, ABC ROM Mono."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"ghostly-com\",\"live\":true}",
        "took": "#912eff/#51feff electronic palette."
      },
      {
        "tool": "find_by_color",
        "args": "{\"hex\":\"#51feff\"}",
        "took": "Cyan-on-dark family."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"astrodither-robertborghesi-is\",\"live\":true}",
        "took": "#040c0c, Azeret Mono, violet."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"yannnovak-com\",\"live\":true}",
        "took": "#04040c, #3f3fbf, Space Mono (high-signal)."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"hugeinc-com\",\"live\":true}",
        "took": "MonumentGrotesk h1, fold discipline."
      },
      {
        "tool": "compare",
        "args": "{\"slugs\":[\"astrodither-robertborghesi-is\",\"hugeinc-com\",\"yannnovak-com\"]}",
        "took": "Shared dark/monochrome register."
      }
    ],
    "palette": [
      {
        "token": "--void",
        "hex": "#04040c",
        "from": "yannnovak-com live surface"
      },
      {
        "token": "--indigo",
        "hex": "#3f3fbf",
        "from": "yannnovak-com accent"
      },
      {
        "token": "--indigo-3",
        "hex": "#9b9bdd",
        "from": "yannnovak-com tint"
      },
      {
        "token": "--magenta",
        "hex": "#b14e88",
        "from": "astrodither-robertborghesi-is"
      },
      {
        "token": "--lime",
        "hex": "#c8f24a",
        "from": "hot signal — ghostly-com's #51feff role"
      },
      {
        "token": "--paper",
        "hex": "#edeceb",
        "from": "xlrecordings-com white family"
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
    "slug": "field-day-studio",
    "brand": "Field Day",
    "tagline": "We make brands move.",
    "prompt": "Build a landing page for an independent creative / design & motion studio.",
    "stack": "pure-inspo",
    "mode": "dark",
    "scoreSelf": 8.7,
    "highlight": "Type-forward obsidian hero — General Condition's confidence + Diffusion Studio's discipline, with Diffusion's --gradient-horizon recreated as a warm 'field day' glow behind the wordmark; verified complete in a 1280×800 fold with the headline, dual CTAs and the trusted-by row all inside.",
    "references": [
      {
        "slug": "diffusion-studio",
        "took": "Motion-studio register, gradient system (warmday/horizon/coast), Geist, radius scale, deep oklch(20%) canvas."
      },
      {
        "slug": "generalcondition-com",
        "took": "Type-forward confidence — giant display type filling the fold, heat red."
      },
      {
        "slug": "phantom-land",
        "took": "Stark obsidian register, --color-primary #fff / secondary #000, tight display line-height."
      },
      {
        "slug": "letude-group",
        "took": "--color-secondary #ee382b (flame), --color-gray #9597a7 (mute), deep graydark."
      },
      {
        "slug": "kvs-services",
        "took": "Monochrome specimen, SF Mono captions → mono label treatment."
      },
      {
        "slug": "factory-ai",
        "took": "Corroborated ember accent #ec864e (Δ0.016) via find_by_color."
      }
    ],
    "mcpCalls": [
      {
        "tool": "search_screens",
        "args": "{\"query\":\"creative studio agency portfolio bold typography hero\"}",
        "took": "The studio cohort."
      },
      {
        "tool": "recommend",
        "args": "{\"brief\":\"independent creative design and motion studio portfolio, bold confident type-forward hero, dark mode\"}",
        "took": "heroGuidance + Specimen macrostructure + Diffusion exemplar."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"diffusion-studio\",\"live\":true}",
        "took": "Gradient system + Geist + radius (high-signal)."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"generalcondition-com\",\"live\":true}",
        "took": "Giant display type register."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"phantom-land\",\"live\":true}",
        "took": "Obsidian primary/secondary."
      },
      {
        "tool": "find_by_color",
        "args": "{\"hex\":\"#e3884f\",\"limit\":6}",
        "took": "Corroborated the ember accent."
      },
      {
        "tool": "compare",
        "args": "{\"slugs\":[\"diffusion-studio\",\"generalcondition-com\",\"kvs-services\"]}",
        "took": "Shared dark register, scales, 1440 container."
      }
    ],
    "palette": [
      {
        "token": "--ink",
        "hex": "#0A0A0B",
        "from": "Diffusion Studio card oklch(20% 0 0) + Phantom --color-secondary #000000"
      },
      {
        "token": "--paper",
        "hex": "#F4F2ED",
        "from": "Diffusion --gradient-daylight #f5f3e8"
      },
      {
        "token": "--ember",
        "hex": "#E3884F",
        "from": "Diffusion --gradient-warmday/--gradient-horizon; Factory #ec864e (Δ0.016)"
      },
      {
        "token": "--flame",
        "hex": "#EC3C2C",
        "from": "L'Étude --color-secondary #ee382b / General Condition #fb1c0c"
      },
      {
        "token": "--coast",
        "hex": "#8AD0EB",
        "from": "Diffusion --gradient-coast terminal cyan"
      },
      {
        "token": "--mute",
        "hex": "#6F6E78",
        "from": "L'Étude --color-gray #9597a7, dimmed"
      }
    ]
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
    "slug": "tally-finance",
    "brand": "Tally",
    "tagline": "Money that feels calmer — friendly budgeting that actually sticks.",
    "prompt": "Build a landing page for a friendly personal-finance & budgeting app.",
    "stack": "pure-inspo",
    "mode": "light",
    "scoreSelf": 8.7,
    "highlight": "Warm oatmeal + terracotta/sage register traced to pi-ai & owo (escaping the cold-teal fintech default), with a left-headline / right phone-mock hero — budget ring, safe-to-spend, transactions, floating chips — that renders complete and balanced at exactly 1280×800.",
    "references": [
      {
        "slug": "pi-ai",
        "took": "Warm 'welcoming & approachable' palette (terracotta #ee7637 + sage #15895d + blush #e794b5) and friendly-paper hero discipline."
      },
      {
        "slug": "owo-app",
        "took": "Warm butter-cream paper, bold rounded consumer-money type, and the 'works with your banks' trust-strip pattern."
      },
      {
        "slug": "dia-com",
        "took": "Cream + warm-brown ink and Inter Tight UI/body register."
      },
      {
        "slug": "copilot-money",
        "took": "The consumer-budgeting hero pattern: confident headline beside a real spending/ring/transactions product mock."
      },
      {
        "slug": "parachutehome-com",
        "took": "Warm earth-tone, calm editorial composition reference."
      },
      {
        "slug": "thecorrespondent-com",
        "took": "Muted ochre/terracotta + warm-gold accent family for the chart series."
      }
    ],
    "mcpCalls": [
      {
        "tool": "recommend",
        "args": "{\"brief\":\"friendly personal finance and budgeting app for consumers, warm and approachable, product UI mock in hero\"}",
        "took": "heroGuidance (fit-the-fold discipline) + warm exemplar set."
      },
      {
        "tool": "search_screens",
        "args": "{\"query\":\"personal finance budgeting app warm friendly\"}",
        "took": "Surfaced owo-app, copilot-money, dia-com, qonto-com, unit-co."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"owo-app\",\"live\":true}",
        "took": "Warm peach/orange tokens + bold rounded type ramp."
      },
      {
        "tool": "find_similar",
        "args": "{\"slug\":\"owo-app\"}",
        "took": "Found copilot-money as the closest consumer-budgeting peer."
      },
      {
        "tool": "find_by_color",
        "args": "{\"hex\":\"#E8723A\"}",
        "took": "Confirmed warm-terracotta cohort incl. pi-ai #ee7637."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"dia-com\",\"live\":true}",
        "took": "Cream + warm-brown tokens, Inter Tight body family."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"pi-ai\",\"live\":true}",
        "took": "Earthy/pastel palette + 'approachable' tone confirmation."
      },
      {
        "tool": "compare",
        "args": "{\"slugs\":[\"pi-ai\",\"owo-app\",\"copilot-money\"]}",
        "took": "Confirmed pi-ai/owo = warm register, copilot = cold default."
      }
    ],
    "palette": [
      {
        "token": "--paper",
        "hex": "#F5F0E6",
        "from": "pi-ai earthy #d5ccbb + owo-app butter-cream background"
      },
      {
        "token": "--ink",
        "hex": "#2A2118",
        "from": "dia-com #69411b + owo-app peach-900 #331a00"
      },
      {
        "token": "--terra",
        "hex": "#E0682E",
        "from": "pi-ai #ee7637 + owo-app peach #ff8000"
      },
      {
        "token": "--moss",
        "hex": "#1E7A52",
        "from": "pi-ai #15895d (friendly sage, not cold teal)"
      },
      {
        "token": "--blush",
        "hex": "#F0BBC7",
        "from": "pi-ai accent #e794b5"
      },
      {
        "token": "--gold",
        "hex": "#E0A53A",
        "from": "thecorrespondent-com ochre family"
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
    "slug": "slowboat-coffee",
    "brand": "Slowboat Coffee Co.",
    "tagline": "Coffee for people who actually drink it.",
    "prompt": "Build a landing page for a coffee subscription.",
    "stack": "pure-inspo",
    "mode": "light",
    "scoreSelf": 8.7,
    "highlight": "Warm editorial coffee hero, rebuilt to fit 1280×800 exactly (CTAs at 670px, panel at 795px — all above the fold), keeping a CSS-composed coffee-bag product card as the visual device. Palette and the playful-serif/grotesque/mono type system traced to Stumptown, Fellow and Intelligentsia.",
    "references": [
      {
        "slug": "stumptowncoffee-com",
        "took": "Live CSS vars gave the exact ink #1f1815 + mustard #c0a868; its warm playful-serif + grotesque + editorial-mono pairing set the type system."
      },
      {
        "slug": "intelligentsiacoffee-com",
        "took": "Confirmed the persistent-red CTA register and the numbered, editorial subscription voice."
      },
      {
        "slug": "fellowproducts-com",
        "took": "Muted earth browns (#5a3c29/#82563c) for the warm ink-soft and the let-one-object-carry-the-hero device."
      },
      {
        "slug": "seriouseats-com",
        "took": "Validated the warm-earthy + single-saturated-accent palette holds across food editorial."
      },
      {
        "slug": "bluebottlecoffee-com",
        "took": "Ample negative space in the hero — room for the headline's left column to breathe."
      }
    ],
    "mcpCalls": [
      {
        "tool": "recommend",
        "args": "{\"brief\":\"landing page for a single-origin coffee subscription, small-batch roastery, warm editorial\"}",
        "took": "Read heroGuidance for the fit-the-fold discipline; Split-Studio direction."
      },
      {
        "tool": "search_screens",
        "args": "{\"query\":\"coffee roastery subscription\"}",
        "took": "Surfaced the coffee cluster — Stumptown, Intelligentsia, Blue Bottle, Fellow."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"stumptowncoffee-com\",\"live\":true}",
        "took": "Exact tokens ink #1f1815 + mustard #c0a868 and the real font pairing."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"fellowproducts-com\",\"live\":true}",
        "took": "Terracotta + warm browns for the ink-soft."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"intelligentsiacoffee-com\",\"live\":true}",
        "took": "Reds + editorial fonts."
      },
      {
        "tool": "find_by_color",
        "args": "{\"hex\":\"#C0A868\"}",
        "took": "Confirmed the mustard sits in a real warm cluster."
      },
      {
        "tool": "compare",
        "args": "{\"slugs\":[\"stumptowncoffee-com\",\"intelligentsiacoffee-com\"]}",
        "took": "Triangulated the shared warm-editorial register."
      }
    ],
    "palette": [
      {
        "token": "--ink",
        "hex": "#1F1815",
        "from": "stumptowncoffee-com live var --subscribe-section-heading (exact)"
      },
      {
        "token": "--paper",
        "hex": "#F4F0E8",
        "from": "warm paper, family of stumptown #f6f5f3 / intelligentsia #fcf4ed"
      },
      {
        "token": "--cream",
        "hex": "#FBF7EE",
        "from": "stumptown active-pill-text #f6f5f3 family"
      },
      {
        "token": "--mustard",
        "hex": "#C0A868",
        "from": "stumptowncoffee-com live var --subscribe-card-hover-bg (exact)"
      },
      {
        "token": "--rust",
        "hex": "#B9412B",
        "from": "stumptowncoffee-com palette #b93826; corroborated by intelligentsia #d42927"
      },
      {
        "token": "--ink-soft",
        "hex": "#3A2E26",
        "from": "fellowproducts-com warm browns #5a3c29/#82563c family"
      }
    ]
  },
  {
    "slug": "vox-runtime",
    "brand": "Larynx",
    "tagline": "The runtime for production voice agents — write it in code, point it at a number, ship.",
    "prompt": "Build a product page for an AI voice-agents platform.",
    "stack": "pure-inspo",
    "mode": "dark",
    "scoreSelf": 8.7,
    "highlight": "Balanced split hero measured to fit 1280×800 exactly (CTAs at y532–578, ~160px of below-fold headroom); a warm amber-on-brown-black live-call console — animated waveform, transcript + live tool-call chip, latency meters — deliberately distinct from Conduit's blue dashboard.",
    "references": [
      {
        "slug": "vapi-ai",
        "took": "Tight display type ramp + dark voice-AI register."
      },
      {
        "slug": "ollama-com",
        "took": "Restrained 2-line hero over a single console object; amber/gold accent #fcd63e."
      },
      {
        "slug": "animejs-com",
        "took": "Warm-dark ground #252423 + --hex-orange-1 #ffa828."
      },
      {
        "slug": "pipe-com",
        "took": "Warm-orange #e1512d accent on near-black, left-headline split."
      }
    ],
    "mcpCalls": [
      {
        "tool": "search_screens",
        "args": "{\"query\":\"AI voice agents developer platform runtime\"}",
        "took": "Surfaced the voice cluster; confirmed genre defaults to blue → went warm."
      },
      {
        "tool": "find_by_color",
        "args": "{\"hex\":\"#C7402F\"}",
        "took": "Warm-red/orange neighbours to anchor the accent."
      },
      {
        "tool": "recommend",
        "args": "{\"brief\":\"AI voice agents developer runtime product page, dark warm amber, voice waveform motif\"}",
        "took": "Picked Split Studio; read heroGuidance for the fold discipline."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"vapi-ai\",\"live\":true}",
        "took": "Display type ramp / tracking."
      },
      {
        "tool": "get_design_system",
        "args": "{\"slug\":\"animejs-com\",\"live\":true}",
        "took": "Warm-dark palette source."
      },
      {
        "tool": "find_similar",
        "args": "{\"slug\":\"animejs-com\"}",
        "took": "Led to ollama-com amber split."
      },
      {
        "tool": "search_screens",
        "args": "{\"query\":\"dark amber orange terminal developer tool waveform audio\",\"mode\":\"dark\"}",
        "took": "pipe-com warm orange."
      },
      {
        "tool": "compare",
        "args": "{\"slugs\":[\"vapi-ai\",\"ollama-com\",\"animejs-com\",\"pipe-com\"]}",
        "took": "Confirmed shared Split Studio macrostructure + scales."
      }
    ],
    "palette": [
      {
        "token": "--bg",
        "hex": "#16110B",
        "from": "anime.js #252423 ground, pulled warmer/darker"
      },
      {
        "token": "--bg-card",
        "hex": "#221B12",
        "from": "warm raised surface, same family"
      },
      {
        "token": "--amber",
        "hex": "#FFB23B",
        "from": "ollama #fcd63e × anime --hex-orange-1 #ffa828"
      },
      {
        "token": "--amber-deep",
        "hex": "#E1762A",
        "from": "pipe-com #e1512d, warmed"
      },
      {
        "token": "--gold-soft",
        "hex": "#FCD98A",
        "from": "ollama #fce480 raised tone"
      },
      {
        "token": "--signal",
        "hex": "#79D49A",
        "from": "rare status-only green (anime turquoise family)"
      },
      {
        "token": "--ink",
        "hex": "#F4ECDD",
        "from": "warm paper, project editorial convention"
      }
    ]
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
    }
];

export function getExample(slug: string): Example | undefined {
  return EXAMPLES.find((e) => e.slug === slug);
}
