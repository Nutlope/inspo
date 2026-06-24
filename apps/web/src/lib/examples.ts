/**
 * "Made with Inspo" - case-study manifest for the /examples pages.
 *
 * Every entry is a REAL page an agent built using only the Inspo MCP
 * (the pure-Inspo arm of the mcp-eval-3 experiment, nothing but the
 * Inspo MCP). The generated HTML is copied verbatim into
 * public/examples/<slug>/index.html and iframed.
 *
 * The metadata here is transcribed from each build's NOTES.md:
 *   - `prompt`      - the one-line brief the agent was given
 *   - `references`  - the catalogue screens it studied + what it took
 *                     (slugs all verified present in static-screens.json
 *                      so the /screens links never 404)
 *   - `mcpCalls`    - the actual tool calls it issued
 *   - `palette`     - final tokens, each traced to where it came from
 *   - `scoreSelf`   - the agent's own self-score (honest; the eval
 *                     report notes self-scores skew high)
 *
 * Effort is expressed as MCP calls + references studied - the truthful
 * "how long it took" for an agent build (no wall-clock stopwatch was
 * recorded; calls + refs are the real signal of work done).
 */

export interface ExampleReference {
  /** Catalogue siteSlug - links to /screens/<slug>. Verified to exist. */
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
  /** Which toolchain - all current entries are pure Inspo. */
  stack: "pure-inspo";
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
    "slug": "switchboard",
    "brand": "Switchboard",
    "tagline": "Small-batch mechanical keyboards built for the millisecond under your fingers.",
    "prompt": "Switchboard: a studio designing and selling high-end mechanical keyboards for people who care how typing feels, precise, tactile, product-led.",
    "stack": "pure-inspo",
    "mode": "dark",
    "scoreSelf": 8.5,
    "references": [
      {
        "slug": "hugeinc-com",
        "took": "The one screen deep-studied via get_design_system. Supplied the type discipline: a single tight grotesk at near-1.0 line-height with negative tracking, anodized-dark mode, and a Specimen macrostructure that the build adopts wholesale (each keyboard treated like a type specimen)."
      },
      {
        "slug": "hardwareoperations-com",
        "took": "Top hit on both hardware searches. Modeled the macrostructure: mechanical hardware shown as gallery object on a calm dark stage, plus the warm metallic accent (copper/orange) over cool charcoal that became the page's --copper token."
      },
      {
        "slug": "matveyan-com",
        "took": "Dark technical reference. Confirmed the near-black ground, mono-labeled spec rows, and a single warm-rust accent against cool greys as the working palette for a precise, control-room product page."
      },
      {
        "slug": "price-pierce-co-uk",
        "took": "A Specimen-tagged industrial-material page. Reinforced the material-led layout language: all-caps mono datelines, restrained framing, and warm umber-on-dark for a craft-hardware feel."
      },
      {
        "slug": "surface-com",
        "took": "Premium-hardware product reference surfaced in the specs search. Informed the product-led structure: hero device staged above the fold, then a calm feature/spec stack with the hardware itself as the visual."
      }
    ],
    "mcpCalls": [
      {
        "tool": "recommend",
        "args": "high-end mechanical keyboards studio, precise, tactile, product-led, premium hardware",
        "took": "Opening orchestrator call. Returned a Marquee-Hero pick plus exemplars and a palette suggestion, grounding the build in real references before any code was written."
      },
      {
        "tool": "search_screens",
        "args": "premium hardware product dark tactile",
        "took": "Surfaced the dark hardware cluster (hardwareoperations, matveyan, dolby) that set the near-black ground and warm-metal accent direction."
      },
      {
        "tool": "find_examples_for_macrostructure",
        "args": "specimen",
        "took": "Pulled Specimen exemplars, which became the page's organizing idea: each keyboard presented like a type specimen with mono datelines and rules."
      },
      {
        "tool": "search_screens",
        "args": "product detail specs hardware technical precise",
        "took": "Returned product-detail and premium-hardware pages (surface, price-pierce) that shaped the bill-of-materials spec sheet and feature stack."
      },
      {
        "tool": "get_design_system",
        "args": "hugeinc-com",
        "took": "The deepest study. Pulled Huge's real tokens: tight grotesk type ramp at ~0.92 line-height, dark mode, Specimen structure, which the type and section rhythm closely follow."
      },
      {
        "tool": "find_reference_components",
        "args": "hero",
        "took": "Fetched canonical hero component shapes to anchor the above-the-fold lockup against the staged keyboard visual."
      },
      {
        "tool": "find_reference_components",
        "args": "hero",
        "took": "Second hero pass to compare hero variants before committing to the split headline-plus-product-mock layout."
      },
      {
        "tool": "search_screens",
        "args": "precise technical hardware specs grid",
        "took": "Surfaced spec-grid and bento references (elastic, typotheque, lucide) that informed the four-up hero stat strip and the switches/spec grids."
      },
      {
        "tool": "get_reference_jsx",
        "args": "hero",
        "took": "Retrieved the marquee hero JSX as the structural template for the hero, then re-implemented it in hand-written HTML/CSS with the CSS keyboard mock."
      }
    ],
    "palette": [
      {
        "token": "--ink",
        "hex": "#0a0b0e",
        "from": "Near-black page ground; the control-room dark mode the hardware searches converged on, letting the copper accent and metal keys glow."
      },
      {
        "token": "--paper",
        "hex": "#e8e6df",
        "from": "Warm off-white body text and key legends; a paper-toned light against the ink, keeping the dark page from going clinical."
      },
      {
        "token": "--copper",
        "hex": "#c8743f",
        "from": "Primary copper accent: CTAs, accent keys, force-curve bars, callout lines. The warm-metal note lifted from the hardware/render references."
      },
      {
        "token": "--copper-2",
        "hex": "#e08a4e",
        "from": "Brighter copper for hover states, italic emphasis in headlines, and prices; the lit edge of the same metal."
      },
      {
        "token": "--muted",
        "hex": "#6b6f7a",
        "from": "Cool grey for mono meta labels, datelines, and spec keys; the technical, low-key voice under the headlines."
      },
      {
        "token": "--line",
        "hex": "#23262e",
        "from": "Hairline rule color separating every section, card, and spec row; the precise editorial grid that organizes the Specimen layout."
      }
    ],
    "highlight": "Every keyboard on the page is pure CSS: flex-weighted key divs laid out across rows, then reused at three scales, a full 75% board on the hero stage, mini boards inside each catalogue card, and an exploded build diagram with a layered case stack and mono callouts on the spec sheet, no images anywhere."
  },
  {
    "slug": "vestige",
    "brand": "Vestige",
    "tagline": "Quiet Vessels: twelve artists consider the container, across ceramic, textile, film and bronze.",
    "prompt": "Vestige, a contemporary art gallery announcing its new exhibition: editorial, image-led, restrained typography.",
    "stack": "pure-inspo",
    "mode": "light",
    "scoreSelf": 8.6,
    "references": [
      {
        "slug": "gagosian-com",
        "took": "palette + type: deep-studied via get_design_system. The warm-paper-and-ink editorial mood and the serif-body / restrained-display contrast became the page's core voice (Cormorant Garamond display over Inter Tight)."
      },
      {
        "slug": "pacegallery-com",
        "took": "macrostructure + layout: deep-studied via get_design_system. The asymmetric split of left text block against a single large art panel, plus the muted-on-warm restraint, shaped the hero grid and the works section."
      },
      {
        "slug": "audocph-com",
        "took": "palette: deep-studied via get_design_system. Its muted, earthy, near-monochrome studio palette (#958569 / #4d4537 / #c7bfb1) anchored the warm-paper-and-clay color choices."
      },
      {
        "slug": "mori-art-museum",
        "took": "macrostructure: top exemplar from the agent's own recommend(photographic) re-run. The exhibition-announcement shape, on-view date line and current-show eyebrow informed the hero meta block."
      },
      {
        "slug": "serpentinegalleries-org",
        "took": "type + accent: exemplar from the recommend/search re-run. The gallery 'now open' exhibition hero with a terracotta accent over restrained editorial type reinforced the muted clay accent and on-view framing."
      }
    ],
    "mcpCalls": [
      {
        "tool": "recommend",
        "args": "brief: contemporary art gallery announcing a new exhibition, editorial and image-led with restrained typography",
        "took": "Set the direction: returned the Photographic macrostructure and gallery exemplars (Gagosian, Mori, Serpentine), pointing the build at warm-paper editorial restraint."
      },
      {
        "tool": "search_screens",
        "args": "query: contemporary art gallery editorial exhibition image-led restrained typography",
        "took": "Widened the candidate pool with Pace, Artforum, ICA Boston and e-flux, confirming the muted-earthy, image-led gallery convention."
      },
      {
        "tool": "get_design_system",
        "args": "gagosian-com",
        "took": "Pulled the core voice: warm paper, ink text, serif-body / condensed-display contrast that became the page's typographic spine."
      },
      {
        "tool": "get_design_system",
        "args": "pacegallery-com",
        "took": "Recovered the split image/text layout and muted sage-on-warm palette that shaped the hero and works grid."
      },
      {
        "tool": "find_examples_for_macrostructure",
        "args": "photographic",
        "took": "Confirmed the Photographic macrostructure with concrete gallery exemplars, validating the image-led, captioned-art-panel composition."
      },
      {
        "tool": "get_design_system",
        "args": "audocph-com",
        "took": "Locked the muted, earthy, near-monochrome palette that anchored the clay-and-paper color tokens."
      },
      {
        "tool": "find_reference_components",
        "args": "hero",
        "took": "Sought a canonical editorial hero shape to model the asymmetric meta-plus-art-panel fold (no canonical component matched, so the hero was hand-composed from the exemplars)."
      }
    ],
    "palette": [
      {
        "token": "--paper",
        "hex": "#f4f1ea",
        "from": "Warm off-white page ground, the gallery-paper base recovered from Gagosian's and Audocph's muted editorial backgrounds."
      },
      {
        "token": "--ink",
        "hex": "#1a1714",
        "from": "Near-black warm ink for headlines and body, the high-contrast text color in the studied editorial references."
      },
      {
        "token": "--accent",
        "hex": "#7a3b2e",
        "from": "Muted terracotta / clay accent for italic emphasis, links and primary-button hover, echoing the terracotta accents seen in Serpentine and the earthy reference palettes."
      },
      {
        "token": "--muted",
        "hex": "#857c6e",
        "from": "Warm taupe for eyebrows, captions and metadata, lifted from Audocph's support/muted earth tones."
      },
      {
        "token": "--paper-2",
        "hex": "#ece7db",
        "from": "Slightly deeper paper tone for image wells and the visit card, a quiet tonal step within the warm-paper system."
      },
      {
        "token": "--line",
        "hex": "#d8d1c2",
        "from": "Hairline rule color separating sections, the restrained 1px divider that carries the editorial structure."
      }
    ],
    "highlight": "No external images at all: every artwork in the hero and the staggered works grid is generative, a warm CSS gradient washed over an inline SVG line-drawing of a vessel, so the whole image-led gallery renders from pure markup."
  },
  {
    "slug": "axiom-labs",
    "brand": "Axiom",
    "tagline": "Intelligence, understood: building the theoretical foundations of machine intelligence, and the systems that make them honest.",
    "prompt": "Axiom, an AI research lab: serious and scientific, but beautiful.",
    "stack": "pure-inspo",
    "mode": "dark",
    "scoreSelf": 8.5,
    "references": [
      {
        "slug": "anthropic-com",
        "took": "The primary reference, deep-studied via get_design_system. Its design system handed over the exact palette the page runs on - warm near-black #141413, warm off-white #f0eee6, terracotta #d97757 - plus the serif-body-against-bold-sans pairing and the restrained, intellectual macrostructure (left-flush headline, supporting line, no loud CTA)."
      },
      {
        "slug": "blackforestlabs-ai",
        "took": "Deep-studied via get_design_system as the second AI-lab reference. Reinforced the frontier-lab register: a clean technical sans, a dark luminous canvas, and a single quiet accent glow - which the page echoes in its radial-gradient orbital hero viz."
      },
      {
        "slug": "contralabs-com",
        "took": "Surfaced by the 'deepmind anthropic openai research lab' search as a fellow 'frontier lab'. Confirmed the editorial-serif-on-warm-ground direction and the calm, manifesto-style mission voice that the page's serif Mission block adopts."
      },
      {
        "slug": "digitalocean-com",
        "took": "Top hit when the agent ran find_examples_for_macrostructure 'stat-led'. Supplied the macrostructure for the By-the-numbers section: a three-up grid of oversized figures with terse labels, which the page extends with superscript footnote markers."
      }
    ],
    "mcpCalls": [
      {
        "tool": "recommend",
        "args": "brief: AI research lab, serious and scientific but beautiful, mission, research areas",
        "took": "Opened the run; returned the Specimen macrostructure pick plus exemplars, framing the editorial-on-warm direction before any code was written."
      },
      {
        "tool": "search_screens",
        "args": "AI research lab serious scientific dark",
        "took": "Pulled the AI-lab cohort (Black Forest Labs, Anthropic, e2b) that became the visual reference set for a dark, technical lab."
      },
      {
        "tool": "get_design_system",
        "args": "blackforestlabs-ai",
        "took": "Pulled the first lab's design system: clean technical sans on a dark luminous canvas with a single accent glow, mirrored in the page's orbital hero viz."
      },
      {
        "tool": "search_screens",
        "args": "research lab manifesto stat led dark scientific",
        "took": "Recovered stat-led references (DigitalOcean, Tinybird, Institute of Health), seeding the footnoted By-the-numbers grid."
      },
      {
        "tool": "search_screens",
        "args": "deepmind anthropic openai research lab",
        "took": "Found Anthropic and Contra Labs - the closest peers - confirming Anthropic as the lead reference and the frontier-lab tone."
      },
      {
        "tool": "get_design_system",
        "args": "anthropic-com",
        "took": "The decisive call: returned the exact palette (#141413 near-black, #f0eee6 warm off-white, #d97757 terracotta) and serif/sans pairing the finished page is built on."
      },
      {
        "tool": "find_examples_for_macrostructure",
        "args": "stat-led",
        "took": "Returned DigitalOcean as the canonical stat-led layout, shaping the three-up oversized-figure stats section."
      },
      {
        "tool": "find_reference_components",
        "args": "hero",
        "took": "Fetched canonical hero compositions to anchor the above-the-fold layout (eyebrow meta row, serif headline, supporting line, dual CTA) within the first viewport."
      },
      {
        "tool": "find_reference_components",
        "args": "stat",
        "took": "Fetched canonical stat-block components, informing the figure-plus-label rhythm and superscript footnote treatment of the metrics section."
      }
    ],
    "palette": [
      {
        "token": "--bg",
        "hex": "#141413",
        "from": "Warm near-black canvas lifted verbatim from Anthropic's design system; the dark, intellectual ground the whole page sits on."
      },
      {
        "token": "--fg",
        "hex": "#f0eee6",
        "from": "Warm off-white for body and headlines, again straight from the Anthropic palette; keeps the dark mode warm rather than clinical."
      },
      {
        "token": "--accent",
        "hex": "#d97757",
        "from": "Terracotta accent (Anthropic's signature) used for italic headline words, hover states, the orbital hero dot, and superscript footnote marks."
      },
      {
        "token": "--fg-muted",
        "hex": "#87867f",
        "from": "Muted warm grey for supporting copy and meta labels, holding the serious-but-readable hierarchy."
      },
      {
        "token": "--surface",
        "hex": "#211f1d",
        "from": "Slightly raised warm-charcoal surface for card hovers and the stats section, giving depth without leaving the monochrome warm range."
      },
      {
        "token": "--rule",
        "hex": "rgba(240,238,230,0.09)",
        "from": "Hairline rule tint (the off-white at low opacity) that draws the section borders and grid lines structuring the editorial layout."
      }
    ],
    "highlight": "The standout move is the hero's orbital viz: a pure-SVG concentric-ring system with two counter-rotating bands of nodes orbiting a soft pulsing terracotta core over a radial-gradient halo - a quiet, scientific diagram of intelligence that reads as beautiful rather than decorative."
  },
  {
    "slug": "fernroot",
    "brand": "Fernroot",
    "tagline": "Small-batch natural skincare grown from the forest floor, foraged in the Olympic foothills and never synthetic.",
    "prompt": "Fernroot, a natural skincare brand: warm, editorial, tactile.",
    "stack": "pure-inspo",
    "mode": "light",
    "scoreSelf": 8.4,
    "references": [
      {
        "slug": "buly1803-com",
        "took": "The apothecary anchor the agent flagged itself ('an actual apothecary/skincare brand'). Drove the heritage-shop voice: numbered preparations (Nº 01-04), the ingredient-glossary marquee, hand-poured ritual copy and the apothecary product taxonomy."
      },
      {
        "slug": "fellowproducts-com",
        "took": "Deep-studied design system. Source of the muted-mauve / warm-neutral tonal palette and the product-as-tonal-silhouette move, echoed in the hero stage where the amber dropper bottle emerges from a matching warm gradient rather than a hard cutout."
      },
      {
        "slug": "joindawn-com",
        "took": "Deep-studied for its warm editorial type pairing (Source Serif Pro + Figtree); informed the serif-display-over-clean-sans hierarchy that became Cormorant Garamond headlines with italic accent words against Inter body."
      },
      {
        "slug": "ritual-com",
        "took": "Recovered from the agent's own range/ingredients searches. Contributed the science-meets-warmth supplement-shop layout cues: italic-emphasis word in the headline, the stat band (98% / 12k+ / 1/10) and the trust-signal review macrostructure."
      },
      {
        "slug": "hay-com",
        "took": "Recovered from the apothecary/editorial search. Reinforced the warm-sand neutral ground and quiet centered-wordmark editorial restraint that shaped the parchment background and the calm catalogue grid of preparations."
      }
    ],
    "mcpCalls": [
      {
        "tool": "recommend",
        "args": "Warm editorial tactile natural skincare brand, hero product, ingredients ethos",
        "took": "Opened the session: returned the macrostructure pick plus warm-vibe exemplars and a palette suggestion, orienting the agent toward an editorial product-led shape."
      },
      {
        "tool": "search_screens",
        "args": "warm editorial natural skincare beauty product page",
        "took": "First broad scan for skincare-adjacent editorial pages to seed the reference shortlist."
      },
      {
        "tool": "search_screens",
        "args": "editorial skincare beauty product hero serif typography warm earthy",
        "took": "Narrowed toward serif-driven, warm/earthy treatments, steering type direction to a high-contrast garamond display."
      },
      {
        "tool": "find_examples_for_macrostructure",
        "args": "photographic",
        "took": "Pulled photographic-macrostructure exemplars; helped weigh a photo-led hero before settling on a built SVG product stage."
      },
      {
        "tool": "get_design_system",
        "args": "fellowproducts-com",
        "took": "Lifted the muted warm-neutral palette and product-as-silhouette logic that shaped the hero bottle staging and tonal range cards."
      },
      {
        "tool": "find_examples_for_macrostructure",
        "args": "specimen",
        "took": "Surfaced specimen-style product/object exemplars, confirming the centered single-product focal treatment for the hero and range tiles."
      },
      {
        "tool": "search_screens",
        "args": "apothecary skincare product range ingredients ethos editorial",
        "took": "The query that surfaced Buly 1803, the apothecary anchor; locked in the numbered-preparations and ingredient-ethos structure."
      },
      {
        "tool": "get_design_system",
        "args": "buly1803-com",
        "took": "Extracted the heritage-apothecary system: numbered SKUs, ingredient glossary and hand-poured ritual language that became the spine of the copy."
      },
      {
        "tool": "search_screens",
        "args": "natural organic skincare product ingredients botanical editorial warm",
        "took": "Gathered botanical/ingredient framing references, feeding the six-botanical ethos list and the foraged field-note voice."
      },
      {
        "tool": "search_screens",
        "args": "product range grid collection skincare cosmetics warm neutral",
        "took": "Confirmed the four-up warm-neutral catalogue grid pattern used for the range section."
      },
      {
        "tool": "search_screens",
        "args": "testimonial reviews editorial warm quote serif",
        "took": "Sourced the serif quote-led testimonial treatment that became the pull-quote ritual band and the three review cards."
      },
      {
        "tool": "get_design_system",
        "args": "joindawn-com",
        "took": "Final reference: a warm editorial serif+sans pairing that confirmed the Cormorant + Inter type system and italic-accent headline approach."
      }
    ],
    "palette": [
      {
        "token": "--paper",
        "hex": "#f3ebdd",
        "from": "Warm parchment page background, the tactile soft-paper ground for the whole light-mode build, reinforced by a multiply paper-grain overlay."
      },
      {
        "token": "--ink",
        "hex": "#2a2418",
        "from": "Near-black warm brown for headlines and body, keeping the editorial type rich rather than pure black."
      },
      {
        "token": "--forest",
        "hex": "#33402f",
        "from": "Deep moss green for italic accent words, the primary CTA fill and the footer, carrying the 'forest floor' premise."
      },
      {
        "token": "--amber",
        "hex": "#a85a2a",
        "from": "Burnt amber accent on eyebrows, links, the dropper-bottle glass gradient and selection highlight, the brand's warm signal color."
      },
      {
        "token": "--ink-mute",
        "hex": "#8a7c66",
        "from": "Dusty taupe for eyebrows, captions and metadata, the quiet editorial micro-type layer."
      },
      {
        "token": "--rose",
        "hex": "#c98a72",
        "from": "Clay rose used for the Salal Balm colorway and avatar gradients, broadening the botanical earth palette."
      }
    ],
    "highlight": "The whole hero product is hand-built in SVG: an amber glass dropper bottle with a layered glass gradient, dropper bulb and inner stem, gently floating on a 7s loop above a warm radial 'stage' with sketched leaves and pip-dot ingredient chips, with each range card carrying its own miniature bottle in its own colorway."
  },
  {
    "slug": "tracewell",
    "brand": "Tracewell",
    "tagline": "Every signal, one timeline: unified logs, traces, and metrics for the people who get paged.",
    "prompt": "Tracewell, a developer observability platform for logs, traces and metrics: technical dark SaaS landing page.",
    "stack": "pure-inspo",
    "mode": "dark",
    "scoreSelf": 8.6,
    "references": [
      {
        "slug": "unkey-com",
        "took": "Primary reference, the only screen deep-studied via get_design_system. Set the whole palette logic: a single bright accent (Tracewell's teal #3dd6c4) glowing on a near-black ground, mono eyebrows with tracking, and the dark dev-tools restraint."
      },
      {
        "slug": "temporal-io",
        "took": "Code window pattern. Tracewell's tabbed, syntax-highlighted integration block (node.ts / main.go / app.py with mac-style dots, line numbers, and a copy button) mirrors Temporal's code-editor-as-proof on a dark technical ground."
      },
      {
        "slug": "ghost-org",
        "took": "Dark dashboard panel. Informed the framed hero product surface (window chrome bar, live dot, charts) and the metrics sparkline, lifting product UI into the hero as evidence."
      },
      {
        "slug": "dovetail-com",
        "took": "Macrostructure and proof layout. A Feature Stack with a dark product-UI panel as hero evidence and a left-aligned headline, the spine Tracewell follows."
      },
      {
        "slug": "sourcegraph-com",
        "took": "Feature-stack section rhythm. The vertical cadence of headline + sub + product proof per section, plus the developer-tools tone, maps to Tracewell's how-it-works, features, integrate, pricing, CTA stack."
      }
    ],
    "mcpCalls": [
      {
        "tool": "recommend",
        "args": "developer observability platform for logs, traces and metrics, technical dark SaaS",
        "took": "Confirmed the dark dev-tools direction and surfaced exemplars (Novu, Mintlify, Hex); the agent leaned past the bento pick toward a feature-stack spine."
      },
      {
        "tool": "search_screens",
        "args": "dark developer observability logs traces metrics dashboard",
        "took": "Surfaced Unkey plus the dark-dashboard cohort (Ghost, Dovetail, Sourcegraph, Fullstory), seeding the framed product-panel hero and the feature-stack layout."
      },
      {
        "tool": "get_design_system",
        "args": "unkey-com",
        "took": "The one deep study. Pulled Unkey's real tokens (near-black bg, single accent, mono h3, Inter body) which Tracewell adapted into its own teal-on-charcoal system."
      },
      {
        "tool": "search_screens",
        "args": "dark saas terminal code block syntax highlighting technical hero",
        "took": "Returned Temporal, Tabnine and Sourcegraph; grounded the syntax-highlighted, multi-tab code window in the integration section."
      },
      {
        "tool": "find_examples_for_macrostructure",
        "args": "feature-stack",
        "took": "Locked the page shape: real Feature Stack exemplars confirmed the stacked how-it-works to CTA structure before any code was written."
      }
    ],
    "palette": [
      {
        "token": "--bg",
        "hex": "#08090c",
        "from": "Near-black page ground, the dark technical SaaS base echoing Unkey's near-black canvas."
      },
      {
        "token": "--accent",
        "hex": "#3dd6c4",
        "from": "Signal teal: primary CTA fill, eyebrows, the healthy trace spans and live pulse, the single bright accent on dark in the Unkey mold."
      },
      {
        "token": "--surface",
        "hex": "#11141b",
        "from": "Raised panel fill for the hero trace window, feature cards, and code window, one step up from the bg."
      },
      {
        "token": "--border",
        "hex": "#1e2330",
        "from": "Hairline borders separating sections, panels, and the nav, giving the page its precise, gridded technical feel."
      },
      {
        "token": "--text",
        "hex": "#e8ecf4",
        "from": "Primary off-white body and headline ink for high legibility against the near-black ground."
      },
      {
        "token": "--violet",
        "hex": "#9d7af0",
        "from": "One of the per-service span colors (with amber, rose, blue) coding the trace waterfall so each hop reads distinctly."
      }
    ],
    "highlight": "The hero is a live trace-waterfall UI built in pure HTML and CSS: a windowed panel where each request hop (gateway, pay-svc, postgres, redis, a failing inv-svc span glowing rose) is an offset, color-coded bar, with a teal scanline sweeping the timeline, the product's whole pitch literalized as its own interface."
  },
  {
    "slug": "chalkline",
    "brand": "Chalkline",
    "tagline": "18,000 sq ft of bouldering, lead walls, and a training cave, built by climbers for climbers in Brooklyn.",
    "prompt": "Chalkline, a bouldering and climbing gym: bold and energetic.",
    "stack": "pure-inspo",
    "mode": "dark",
    "scoreSelf": 8.4,
    "references": [
      {
        "slug": "generalcondition-com",
        "took": "Deep-studied via get_design_system and the top hit on both searches. Set the core strategy the page runs on: a single electric accent burning on a near-black field (#fb1c0c on #0a0a0a) over a faint structural grid. Chalkline inherits that exact move, swapping red for ember orange and turning the grid into the SVG wall."
      },
      {
        "slug": "tigerbeetle-com",
        "took": "Deep-studied via get_design_system. A dark-mode, bold geometric-sans page whose orange support color (#ed541e) sits right next to Chalkline's ember (#ff4d1c). Confirmed the accent direction and the bold, technical type-on-black treatment."
      },
      {
        "slug": "tempo-fit",
        "took": "Top result for the agent's 'bold energetic sport fitness brand dark' search. A deep-crimson sport hero built on athlete energy and a left-text / right-visual split; informed the energetic fitness-brand framing and the confident asymmetric hero balance."
      },
      {
        "slug": "underarmour-com",
        "took": "Search hit. Hyper-condensed industrial all-caps headline slammed onto near-black athletic photography. Validated Chalkline's macrostructure choice: a Bebas Neue condensed display run uppercase at huge scale for raw athletic weight."
      },
      {
        "slug": "analogue-co",
        "took": "Search hit. Near-black canvas, a lone red accent, and monospace uppercase micro-labels above bold headings. Mirrors Chalkline's JetBrains Mono section numbers (01 / The Walls) and its single-accent, one-loud-color discipline."
      }
    ],
    "mcpCalls": [
      {
        "tool": "recommend",
        "args": "Bold energetic bouldering and climbing gym landing page",
        "took": "Opened with a broad orchestrator pull to pick a macrostructure and surface exemplars; returned a Specimen pick plus bold-typography references that pointed toward a type-forward hero."
      },
      {
        "tool": "search_screens",
        "args": "bold energetic sport fitness brand dark",
        "took": "Pulled the sport-brand cluster (tempo-fit, underarmour-com, generalcondition-com) that anchored the dark, energetic athletic direction and the electric-accent-on-black strategy."
      },
      {
        "tool": "get_design_system",
        "args": "generalcondition-com",
        "took": "Drilled into the reference's exact palette and grid: electric accent on near-black with a faint structural grid, the spine of Chalkline's whole look."
      },
      {
        "tool": "search_screens",
        "args": "bold typography hero dark energetic accent",
        "took": "Second pass to confirm the bold-display-on-dark convention; reinforced the condensed uppercase headline and single-accent treatment seen across the hits."
      },
      {
        "tool": "get_design_system",
        "args": "tigerbeetle-com",
        "took": "Final check on a dark, bold geometric-sans page whose orange support color sits beside Chalkline's ember, locking in the accent hue and technical type tone before writing."
      }
    ],
    "palette": [
      {
        "token": "--bg",
        "hex": "#0c0c0c",
        "from": "Near-black canvas the whole page is built on, the dark mode the references converged on (generalcondition / tigerbeetle / analogue)."
      },
      {
        "token": "--ember",
        "hex": "#ff4d1c",
        "from": "The single electric accent: CTAs, nav underlines, section numbers, the V6 route on the wall, and the full-bleed CTA banner. The one loud color, the way the references used theirs."
      },
      {
        "token": "--chalk",
        "hex": "#f4f1ea",
        "from": "Warm off-white for body text and the wordmark, named for climbing chalk; the calm counterweight to ember on black."
      },
      {
        "token": "--route",
        "hex": "#b6e845",
        "from": "Lime 'route' green used as a second route color on the SVG wall and on beginner class tags, adding a flash of energy without diluting the ember."
      },
      {
        "token": "--bg-2",
        "hex": "#141414",
        "from": "Raised panel tone for cards, the wall SVG ground, and the ticker bar, giving the dark layout quiet depth."
      },
      {
        "token": "--line",
        "hex": "#2a2a2a",
        "from": "Hairline borders that draw the grid of facility cards and class cells, echoing generalcondition's structural-grid framing."
      }
    ],
    "highlight": "The hero centers a hand-built SVG bouldering wall: paneled overhang, scattered holds, and three color-coded route traces (chalk-white V2 slab, ember V6 roof, lime V10 project) climbing past floating mono grade tags toward a tiny stick-figure climber, the whole brand premise rendered as pure code."
  },
  {
    "slug": "hewn-type",
    "brand": "Hewn",
    "tagline": "An independent foundry releasing Caxton, a contemporary book serif drawn for the long read.",
    "prompt": "Hewn, an independent typeface foundry releasing a new serif; type-specimen led.",
    "stack": "pure-inspo",
    "mode": "light",
    "scoreSelf": 8.6,
    "references": [
      {
        "slug": "klim-co-nz",
        "took": "Primary reference, deep-studied via get_design_system. Donated the whole colour logic: a single warm rust accent (Klim's #cc4716) landing on near-black ink over a warm-grey/paper ground, used sparingly on one pill and nothing else. Also set the restraint of the type-specimen-as-object hero."
      },
      {
        "slug": "camelot-typefaces-com",
        "took": "Primary reference, deep-studied via get_design_system. Contributed the specimen-as-content macrostructure and the high-contrast serif-display vs grotesque-label tension, plus the mono micro-labels and numbered section marginalia (Nº 02, Nº 03)."
      },
      {
        "slug": "commercialtype-com",
        "took": "Recovered from the agent's own search/recommend queries. Lent the editorial-catalogue spine: rigorous two-column section heads with left-rail labels, italicised publication names in the in-use quotes, and the academic licensing/foundry structure."
      },
      {
        "slug": "thedesignersfoundry-com",
        "took": "Recovered candidate from the live search. Reinforced the rust-red display accent on a light specimen page and the all-caps mono ticker/label treatment used across the strip and weight cells."
      },
      {
        "slug": "ourtype-com",
        "took": "Recovered candidate from the live search. Modelled the oversized high-contrast serif headline with italic accent flourish (the clamp(3.6rem,11.5vw,10.5rem) Caxton hero and the accent-coloured italic glyphs)."
      }
    ],
    "mcpCalls": [
      {
        "tool": "recommend",
        "args": "independent typeface foundry releasing a new serif - type specimen led landing p",
        "took": "Anchored the build on the type-specimen macrostructure and surfaced Klim, Camelot, Commercial Type and Ourtype as exemplars."
      },
      {
        "tool": "search_screens",
        "args": "type foundry serif specimen release",
        "took": "Confirmed the foundry exemplar set and exposed the rust/red-on-light specimen pages (Klim, The Designers Foundry) that shaped the accent."
      },
      {
        "tool": "get_design_system",
        "args": "klim-co-nz",
        "took": "Pulled Klim's real tokens: the warm-grey paper ground and the lone rust accent (#cc4716) that became Hewn's #b8451f."
      },
      {
        "tool": "get_design_system",
        "args": "camelot-typefaces-com",
        "took": "Grounded the high-contrast serif/grotesque pairing and the mono micro-labels driving the section numbering."
      },
      {
        "tool": "find_examples_for_macrostructure",
        "args": "type-specimen",
        "took": "Validated the specimen page-shape (weights grid, anatomy trio, pangram, in-use, licensing) before writing."
      },
      {
        "tool": "find_reference_components",
        "args": "",
        "took": "Checked for a canonical specimen component; none existed, so the page shape was written by hand from the autopsy notes."
      },
      {
        "tool": "find_reference_components",
        "args": "hero",
        "took": "Looked for canonical hero shapes to honour the above-the-fold rule for the oversized Caxton headline."
      }
    ],
    "palette": [
      {
        "token": "--paper",
        "hex": "#f4f0e9",
        "from": "Warm off-white ground, the 'screens that have learned to pretend they are paper' premise; echoes Klim's warm-grey canvas."
      },
      {
        "token": "--ink",
        "hex": "#161413",
        "from": "Near-black body and display ink for the high-contrast serif, the dark half of the specimen's tonal pair."
      },
      {
        "token": "--accent",
        "hex": "#b8451f",
        "from": "Rust/terracotta accent on the buy pill, italic glyphs and numbered labels, a single warm break lifted straight from Klim's #cc4716 orange."
      },
      {
        "token": "--accent-2",
        "hex": "#d9663b",
        "from": "Lighter terracotta used in the dark footer for hover states and the italic wordmark flourish."
      },
      {
        "token": "--muted",
        "hex": "#8a8278",
        "from": "Warm taupe-grey for mono datelines, glyph-count meta and dimmed secondary text."
      },
      {
        "token": "--rule",
        "hex": "#d8d1c4",
        "from": "Hairline rules dividing the weight grid, feature cells and section bands, the quiet skeleton of the catalogue."
      }
    ],
    "highlight": "The standout move is the interactive pangram board: a JetBrains-Mono toggle that flips a full Latin-Extended specimen line live between Regular, Italic, Bold and Bold Italic, turning the page into a working type tester rather than a static brochure."
  },
  {
    "slug": "steeproom",
    "brand": "Steeproom",
    "tagline": "Stone-ground matcha, single-origin leaves, and a room built for slowing down.",
    "prompt": "Steeproom, a modern matcha and tea bar: calm, minimal, refined.",
    "stack": "pure-inspo",
    "mode": "light",
    "scoreSelf": 8.4,
    "references": [
      {
        "slug": "cuyana-com",
        "took": "Deep-studied via get_design_system. Source of the soft, muted warm-paper palette and the understated-luxury restraint: warm beige ground, muted earth accents, text floated directly on imagery with no card chrome."
      },
      {
        "slug": "lyfehotels-com",
        "took": "Deep-studied via get_design_system. Gave the page its split-studio macrostructure (text column beside an atmospheric panel) and its luxe-calm warm palette of olive, tan and cream."
      },
      {
        "slug": "norrona-com",
        "took": "Recovered from the agent's own search. A split-studio exemplar: confirmed the text-left / visual-right hero balance and the asymmetric-but-calm fold layout the build adopts."
      },
      {
        "slug": "greenhouse-io",
        "took": "Recovered from the agent's own search. A mint-green split-studio with an italicized serif accent word, echoed in Steeproom's green-matcha editorial type and the italic emphasis in the headline."
      },
      {
        "slug": "sweetgreen-com",
        "took": "Recovered from the agent's own search. A warm, food-and-hospitality reference that reinforced the appetite-warm tone, generous spacing and single-subject focus carried into the menu and hero."
      }
    ],
    "mcpCalls": [
      {
        "tool": "recommend",
        "args": "calm minimal refined matcha tea bar, ceremony, warm natural materials",
        "took": "Opened the build: returned a macrostructure pick, five real exemplars and a canonical bento reference component, grounding the page in archive references before any code was written."
      },
      {
        "tool": "search_screens",
        "args": "minimalist cafe tea ceremony calm natural",
        "took": "Surfaced the calm warm-toned hospitality and ecommerce set (Cuyana, Outdoor Voices, Norrona) that anchored the soft, natural-materials direction."
      },
      {
        "tool": "get_design_system",
        "args": "cuyana-com",
        "took": "Pulled Cuyana's real tokens: the warm-beige ground, muted earth accents and quiet serif treatment that became Steeproom's paper-and-matcha palette."
      },
      {
        "tool": "search_screens",
        "args": "matcha green tea ceremony japanese minimal",
        "took": "Narrowed to the green-forward references (Sweetgreen, Greenhouse) that justified the matcha-green accents and the italic serif emphasis."
      },
      {
        "tool": "get_design_system",
        "args": "lyfehotels-com",
        "took": "Pulled Lyfehotels' warm olive-tan-cream system and split-studio shape, which set the hero's two-column structure and luxe-calm mood."
      },
      {
        "tool": "find_reference_components",
        "args": "hero",
        "took": "Fetched a canonical hero component for above-the-fold structure, informing the fold-fit split hero (nav, eyebrow, headline, CTAs and the matcha panel all complete in the first viewport)."
      }
    ],
    "palette": [
      {
        "token": "--paper",
        "hex": "#f3eee4",
        "from": "Warm off-white page ground, lifted from Cuyana's muted-beige canvas; carries the calm, paper-like base."
      },
      {
        "token": "--ink",
        "hex": "#20271c",
        "from": "Near-black green-tinted ink for headings and body, keeping text warm rather than cold black."
      },
      {
        "token": "--matcha",
        "hex": "#3a4a2f",
        "from": "Deep matcha green: the primary accent on CTAs, the logo mark, the locations section and italic headline emphasis."
      },
      {
        "token": "--matcha-3",
        "hex": "#8aa06b",
        "from": "Light tea-leaf green used in the radial logo mark, footer eyebrows and the SVG bowl's foam highlights."
      },
      {
        "token": "--clay",
        "hex": "#b0894f",
        "from": "Warm clay-brown secondary accent, echoing Lyfehotels' tan; lands on menu tags, quote marks and the whisk handle."
      },
      {
        "token": "--cream",
        "hex": "#f7f3ea",
        "from": "Pale cream for text reversed onto the matcha panel, the dark footer and the green locations block."
      }
    ],
    "highlight": "The split hero's right panel is a fully hand-built SVG: a glazed chawan bowl with a radial matcha surface, drifting foam islands and a bamboo chasen, crowned by a pure-CSS plume of rising, fading steam, no images, just gradients and keyframes."
  },
  {
    "slug": "vaultline",
    "brand": "Vaultline",
    "tagline": "Your passwords, yours alone: encrypted on your device before they ever touch the cloud.",
    "prompt": "Vaultline, a privacy-first password manager: clean and trustworthy.",
    "stack": "pure-inspo",
    "mode": "dark",
    "scoreSelf": 8.4,
    "references": [
      {
        "slug": "featurebase-app",
        "took": "Deep-studied via get_design_system; its violet support token (#5942e8 / #9d88f3) and dark raised surfaces (#1c144c) directly seeded Vaultline's #6e56cf accent ramp and layered near-black card stack, plus the Inter type system and feature-stack rhythm."
      },
      {
        "slug": "obsidian-md",
        "took": "Live search top hit and the closest mode/palette twin: near-black canvas with a single purple accent (#7c3ceb) on pills and headline emphasis. Confirmed Vaultline's restraint of one violet accent against deep dark, and the product-UI-as-proof hero composition."
      },
      {
        "slug": "signal-org",
        "took": "Live search top hit for the privacy brief. A proof-led, trust-first privacy product with indigo palette; reinforced the credibility framing (audit badges, plain-language security promise) carried into Vaultline's dateline eyebrow and hero proof row."
      },
      {
        "slug": "kagi-com",
        "took": "Live search hit; a privacy-focused SaaS whose calm, manifesto-style hero and trust copy ('restore your privacy') informed the structure of Vaultline's headline plus supporting trust line and the security-model section framing."
      },
      {
        "slug": "ghost-org",
        "took": "Live search hit; supplied the move of embedding a realistic dark product dashboard mock (stats, chart) as the hero's central proof, echoed in Vaultline's vault-card stack and the monospaced encryption-flow diagram."
      }
    ],
    "mcpCalls": [
      {
        "tool": "recommend",
        "args": "privacy-first password manager, clean and trustworthy, security-focused",
        "took": "Opening orchestrator call to ground the build; returned a macrostructure pick plus exemplar set and a palette suggestion, setting the dark, technical direction."
      },
      {
        "tool": "search_screens",
        "args": "security privacy saas dark trustworthy minimal",
        "took": "Surfaced the privacy/security cohort (Signal, Kagi, Obsidian, Ghost) that defined the dark, minimal, trust-led visual language Vaultline adopts."
      },
      {
        "tool": "get_design_system",
        "args": "featurebase-app",
        "took": "Pulled the full DESIGN.md for the strongest dark-SaaS match; its violet tokens and dark surfaces became Vaultline's accent ramp and card surfaces, and its Inter ramp set the type system."
      },
      {
        "tool": "search_screens",
        "args": "password vault encryption security hero badge",
        "took": "Hunted specifically for vault/encryption hero patterns and trust badges, feeding the hero proof row (Cure53, SOC 2, GitHub) and the encrypted-status badge treatment."
      },
      {
        "tool": "find_reference_components",
        "args": "hero",
        "took": "Requested canonical hero component references to anchor the above-the-fold composition (eyebrow, headline, dual CTA, supporting visual)."
      },
      {
        "tool": "get_reference_jsx",
        "args": "hero",
        "took": "Pulled the hero reference markup to model the split text-plus-visual layout that became the copy column beside the floating vault-card stack."
      },
      {
        "tool": "find_reference_components",
        "args": "features",
        "took": "Gathered feature-section references that shaped the bento grid and the lead tile with its inline terminal/generator visual."
      }
    ],
    "palette": [
      {
        "token": "--bg",
        "hex": "#0b0c14",
        "from": "Near-black blue-tinted canvas; the dark base that anchors the whole page (mode: dark)."
      },
      {
        "token": "--bg-card",
        "hex": "#141726",
        "from": "Raised card surface for vault cards, bento tiles and the crypto diagram, gradient-paired with --bg-elev #11131f."
      },
      {
        "token": "--accent",
        "hex": "#6e56cf",
        "from": "Signature violet, derived from the featurebase reference; drives primary buttons, the brand mark, and accent glows."
      },
      {
        "token": "--accent-bright",
        "hex": "#8b73e8",
        "from": "Lighter violet for headline emphasis (em), section labels, and hover states."
      },
      {
        "token": "--fg",
        "hex": "#e9eaf2",
        "from": "Off-white primary text for headlines and body on the dark field."
      },
      {
        "token": "--green",
        "hex": "#4ade80",
        "from": "Trust/status green for the Encrypted badge, check icons, and the live 'all systems encrypted' dot."
      }
    ],
    "highlight": "The hero floats a stacked, slightly fanned set of vault cards (real favicons, masked passwords, an 'Argon2id / synced 2m ago' footer) crowned by a floating shield badge, then backs it with a pure-CSS, monospaced encryption-flow diagram that walks master password to Argon2id to XChaCha20 to cloud blob, turning abstract zero-knowledge crypto into something you can actually read."
  },
  {
    "slug": "crate-and-cut",
    "brand": "Crate & Cut",
    "tagline": "Dig deeper, spin louder: new and vintage vinyl, hand-picked turntables, and the DJ gear the pros actually use, all under one Brooklyn roof.",
    "prompt": "Crate & Cut, a shop for vinyl records and DJ equipment; retro-tech and bold.",
    "stack": "pure-inspo",
    "mode": "dark",
    "scoreSelf": 8.5,
    "references": [
      {
        "slug": "belledonne-com",
        "took": "Deep-studied via get_design_system; the Specimen macrostructure and product-as-sculpture centering shaped the hero's single spotlit record, and its warm-tan-on-muted palette logic informed the tan (#c5a06a) hardware accent."
      },
      {
        "slug": "idyllic-co-nz",
        "took": "Top loud-vintage exemplar from the recommend pass; its maximalist energy and oversized cropped display type fed the Archivo Black headlines, the orange marquee, and the giant footer wordmark."
      },
      {
        "slug": "raycast-com",
        "took": "Surfaced on the dark/high-contrast search; its near-black field with a single hot accent and centered display type validated the #14110d ground plus orange-puncture treatment used across the page."
      },
      {
        "slug": "matveyan-com",
        "took": "Dark-mode candidate with a warm rust accent and a circular orbiting hero object; reinforced the spinning-record visual as the page's central motif against a monochrome dark field."
      },
      {
        "slug": "deel-com",
        "took": "High-contrast split-hero reference; its one color-broken accent word against a dark ground echoes the orange 'louder.' break in the headline and the asymmetric text-left / visual-right hero grid."
      }
    ],
    "mcpCalls": [
      {
        "tool": "recommend",
        "args": "retro-tech bold vinyl record shop and DJ equipment store, loud and warm with hig",
        "took": "Returned the Specimen macrostructure pick plus warm/retro-leaning exemplars (belledonne-com et al), setting the page's product-spotlight spine."
      },
      {
        "tool": "search_screens",
        "args": "bold retro ecommerce shop editorial layout",
        "took": "Pulled bold editorial commerce references that informed the bordered feature/category grids and the section-numbered editorial sequencing (01 Featured, 02 Departments, 03 Ethos)."
      },
      {
        "tool": "get_design_system",
        "args": "belledonne-com",
        "took": "Mined the chosen exemplar's real tokens and Specimen layout, grounding the centered hero specimen and the warm-tan-on-dark accent direction."
      },
      {
        "tool": "search_screens",
        "args": "bold retro tech dark high contrast product showcase",
        "took": "Surfaced dark high-contrast product showcases (raycast-com, matveyan-com) that confirmed the near-black ground with a single orange accent and a rotating hero object."
      },
      {
        "tool": "find_reference_components",
        "args": "hero",
        "took": "Looked up canonical hero components to anchor the marquee-hero treatment GLM-5.2 layered onto the Specimen spine."
      },
      {
        "tool": "get_reference_jsx",
        "args": "hero",
        "took": "Fetched the hero reference source to study its structure before writing the asymmetric two-column hero with the spinning-record visual."
      }
    ],
    "palette": [
      {
        "token": "--ink",
        "hex": "#14110d",
        "from": "Near-black warm brown page ground; the dark, high-contrast retro-tech base the whole shop sits on."
      },
      {
        "token": "--paper",
        "hex": "#f4ede0",
        "from": "Warm cream foreground for body text and primary buttons; the 'paper sleeve' contrast against the ink."
      },
      {
        "token": "--orange",
        "hex": "#ff5c1f",
        "from": "Hot signal orange accent: the record label, headline 'louder.' break, CTAs, marquee dots, and active-nav underline."
      },
      {
        "token": "--orange-deep",
        "hex": "#c43d10",
        "from": "Deeper burnt-orange used in the hero's radial glow gradients for warmth and depth."
      },
      {
        "token": "--tan",
        "hex": "#c5a06a",
        "from": "Muted brass/tan for the turntable hardware, stylus arm, and SVG product line-art; the vintage-equipment tone."
      },
      {
        "token": "--green",
        "hex": "#3da558",
        "from": "Secondary sale-badge green, the one cool note that keeps the warm palette from feeling monochrome."
      }
    ],
    "highlight": "A pure-CSS vinyl record that actually spins on an 8-second loop (and pauses on hover for a tactile feel), complete with a tan SVG tonearm dropped at the groove and a hot-orange center label reading Crate & Cut."
  },
  {
    "slug": "subtone-records",
    "brand": "Subtone",
    "tagline": "Records for low rooms and long nights.",
    "prompt": "Build a site for an electronic record label.",
    "stack": "pure-inspo",
    "mode": "dark",
    "scoreSelf": 8.6,
    "highlight": "Tight fold-complete hero (verified at 1280×800: hero 92→800, the headline, both CTAs and the featured-release card all inside) with generative CSS/SVG cover art and a mono studio-logbook system, traced to yannnovak / astrodither / hugeinc. The giant overflowing wordmark of the prior version is gone - the brand now lives in the nav.",
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
        "from": "hot signal - ghostly-com's #51feff role"
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
      "tagline": "The business bank that reads like a balance sheet, not a billboard - high-yield treasury, corporate cards, and wires that clear, for founders and finance teams done with toy fintech.",
      "prompt": "Create a marketing site for a modern business bank.",
      "stack": "pure-inspo",
      "mode": "light",
      "scoreSelf": 8.4,
      "highlight": "The whole page rejects the cold violet/teal/dark-mode default that the fintech cluster (Wealthfront, Qonto, Increase, Payhawk) falls into, and commits instead to a warm-paper editorial private-bank register traced to the two most credible names in the archive: Mercury (captured clay #dcbeae over green-black ink, actually running Tiempos Headline serif) and Brex (live-extracted to Flecha serif + Space Mono + burnt #ff5900). The standout build move is the hero: a Split Studio (Mercury/Qonto macrostructure) whose right half is a fully hand-built treasury console in pure CSS/SVG - a live-ticking tabular-Fraunces balance, an inline SVG yield sparkline, a four-row transaction ledger, and a floating 'wire approved, 2 of 2 signers' chip - with not a single raster image anywhere. Serif display + grotesk + mono-for-figures on warm paper is what keeps a money product from looking like every cold crypto dashboard in the set.",
      "references": [
        {
          "slug": "mercury-com",
          "took": "The pivotal proof: captured warm clay accent #dcbeae over green-black ink #0c1c29, Split Studio macrostructure, soft/editorial vibe, and a live design system running Tiempos Headline serif - the entire warm-serif-bank thesis and the --clay/--ink tokens."
        },
        {
          "slug": "brex-com",
          "took": "Live-extracted to Flecha (serif) + Inter + Space Mono on warm muted #ccc4b4 with burnt #ff5900 - validated serif-display + mono-figures + ember-accent as a real fintech pattern; source of --ember and --ink-mute."
        },
        {
          "slug": "italic-com",
          "took": "Warm-paper Split Studio with Martina Plantijn serif and sand #d4c5a6/#d1ae81 ('Life is luxury') - anchored the --paper page surface and the luxe-editorial tone."
        },
        {
          "slug": "antimetal-com",
          "took": "Editorial Split Studio with Test Signifier serif + Geist on gold/sand #d8971f/#c5bba7 - confirmed the serif+grotesk-on-warm pattern and seeded --gold and the paper hairlines."
        },
        {
          "slug": "unit-co",
          "took": "Suisse with tight negative letter-spacing on headings and --colour--dark-green #053222 - informed the tight-grotesk heading treatment and the --moss 'old money' green on the card + security band."
        },
        {
          "slug": "qonto-com",
          "took": "Split Studio business-account reference; real 4px spacing base, 0-24 radii, 1440 container, plus a hidden warm sand/gold layer in its CSS vars that justified going warm."
        },
        {
          "slug": "increase-com",
          "took": "The dark-mode banking-API default (Untitled Sans, .25rem base, 0/4/8/12 radii) I deliberately rejected - the negative reference that proved the cold register was the slop to avoid."
        },
        {
          "slug": "knoll-com",
          "took": "Surfaced by find_by_color on Mercury's clay tone (#d7beb2, luxe/calm) - part of the warm 'quiet luxury' editorial cluster that set the hairline and surface family."
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
          "took": "Untitled Sans, .25rem base, tight 0/4/8/12 radii - the dark default I chose to avoid."
        },
        {
          "tool": "get_design_system",
          "args": "{\"slug\":\"unit-co\",\"live\":true}",
          "took": "Tight negative heading tracking and --colour--dark-green #053222 / cream tokens - fed --moss and the heading style."
        },
        {
          "tool": "get_design_system",
          "args": "{\"slug\":\"mercury-com\",\"live\":true}",
          "took": "The pivot: Mercury runs --font-tiempos-headline (serif) + arcadia - proof a serious bank can be warm + serif."
        },
        {
          "tool": "get_design_system",
          "args": "{\"slug\":\"brex-com\",\"live\":true}",
          "took": "Flecha serif + Inter + Space Mono, palette #ffffff/#ff5900/#15191e/#ccc4b4 - locked serif+mono+ember as a real pattern."
        },
        {
          "tool": "find_by_color",
          "args": "{\"hex\":\"#dcbeae\"}",
          "took": "Traced Mercury's clay into a coherent warm editorial cluster (Knoll, Brunello Cucinelli, MoMA) - the quiet-luxury paper family."
        },
        {
          "tool": "compare",
          "args": "{\"slugs\":[\"brex-com\",\"mercury-com\",\"qonto-com\"]}",
          "took": "Triangulated house style: shared minimalism+brutalism, light register, Split Studio/Feature Stack, ~1440 container, 4px base."
        },
        {
          "tool": "recommend",
          "args": "{\"brief\":\"warm, trustworthy business bank for founders, serif display, paper tones, editorial not crypto\"}",
          "took": "Picked Split Studio; returned serif-forward exemplars and the canonical Split-Screen 'no stock photos' component I followed for the hero."
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
          "from": "unit-co --colour--dark-green #053222 / italic-com #174e36 - 'old money' green"
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
    "highlight": "Type-forward obsidian hero - General Condition's confidence + Diffusion Studio's discipline, with Diffusion's --gradient-horizon recreated as a warm 'field day' glow behind the wordmark; verified complete in a 1280×800 fold with the headline, dual CTAs and the trusted-by row all inside.",
    "references": [
      {
        "slug": "diffusion-studio",
        "took": "Motion-studio register, gradient system (warmday/horizon/coast), Geist, radius scale, deep oklch(20%) canvas."
      },
      {
        "slug": "generalcondition-com",
        "took": "Type-forward confidence - giant display type filling the fold, heat red."
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
      "tagline": "A meditation & sleep app built around one quiet hour - a single, unbroken sixty-minute descent that ends with you already asleep, with no streaks, badges, or morning to optimise.",
      "prompt": "Build a landing page for a meditation & sleep app.",
      "stack": "pure-inspo",
      "mode": "dark",
      "scoreSelf": 8.6,
      "highlight": "The hero is a living, breathing lamp: a soft radial amber glow sits low-center behind a hairline Fraunces serif headline and slowly breathes on a 4-7-8 cadence (21% inhale, hold, long exhale) - the exact breath the app's body-scan is paced to, and the copy says so ('the same cadence the light on this page is breathing'). It's pure CSS, mirrored in the closing CTA's lamp, layered with drifting dust motes and a faint Flos-style film grain over a warm near-black night field. So the page doesn't just describe a wind-down, it performs one. Fully disabled under prefers-reduced-motion. The whole 'warm light in the dark' concept came directly from tracing the meditation brief into Inspo's lighting-brand cluster (Flos, Louis Poulsen) rather than the obvious pastel-wellness default.",
      "references": [
        {
          "slug": "davidwhyte-com",
          "took": "The keystone reference - a poet's site giving the hairline high-contrast serif display (Canela at weight 100, italic accents), the ochre/sage/deep-brown palette, and the contemplative editorial tone. Drove the type system and most palette tokens."
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
          "took": "Showed most dark hits are cold/techy (wrong calm) and surfaced the one gem, davidwhyte-com - confirming the contemplative warm-dark direction."
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
          "took": "Pulled the warm-dark luxe family - Louis Poulsen #d49434, Flos #2c2014/#d5bca3, Huck - from which I traced the amber accent and the deep ink."
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
          "from": "Louis Poulsen #d49434 - the lamplight accent"
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
    "tagline": "Money that feels calmer - friendly budgeting that actually sticks.",
    "prompt": "Build a landing page for a friendly personal-finance & budgeting app.",
    "stack": "pure-inspo",
    "mode": "light",
    "scoreSelf": 8.7,
    "highlight": "Warm oatmeal + terracotta/sage register traced to pi-ai & owo (escaping the cold-teal fintech default), with a left-headline / right phone-mock hero - budget ring, safe-to-spend, transactions, floating chips - that renders complete and balanced at exactly 1280×800.",
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
      "tagline": "A 14-seat tasting-menu restaurant in Torino where chef Lucia Maranzano serves one nightly 11-course menu by candlelight - no choices but the wine.",
      "prompt": "Create a landing page for a fine-dining tasting-menu restaurant.",
      "stack": "pure-inspo",
      "mode": "dark",
      "scoreSelf": 8.6,
      "highlight": "A candlelit table composed entirely in CSS - since restaurants have no stock photos in the archive, the hero atmosphere is built from primitives: a warm-grain near-black ground, two layered radial gradients that pool candlelight and fall off into black (tracing Louis Poulsen's 'golden liquid light' and Eleven Madison Park's warm earth), a plated fifth course rendered from gradients and border-radius (sauce smear, quenelle, foraged leaf, scattered spice-dust), and a keyframed flickering taper (killed under prefers-reduced-motion). The 11-course menu is then set as a numbered Roman carte in Dinner by Heston's Specimen voice, so the movements themselves are the hero content rather than decoration around a photo - restrained, expensive, and the deliberate dark opposite of the warm-light coffee example, drawn from the same archive.",
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
          "took": "The Specimen macrostructure for fine dining - typography as the hero, monochrome 'quiet authority' - modeled by the numbered menu carte and restrained type ramp."
        },
        {
          "slug": "atomixnyc-com",
          "took": "Warm rust family (#c95535/#471e13/#e3a696) and grotesque-for-UI confirmation (live Libre Franklin)."
        },
        {
          "slug": "olsonkundig-com",
          "took": "Dark Type-Specimen scaffold - proof that a near-black field plus a large serif plus vast space reads as 'considered ethos'; used for the menu band."
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
          "took": "Confirmed the luxe spine (Goyard, Chanel, Italic) - restraint + serif + huge negative space."
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
          "took": "Keystone: live EB Garamond + #000/#fff + brand red #b32614 - elegant serif on near-black with oxblood accent."
        },
        {
          "tool": "get_design_system",
          "args": "{\"slug\":\"elevenmadisonpark-com\",\"live\":true}",
          "took": "Live Inter Tight + EB Garamond (the canonical tasting menu uses my exact two faces); warm palette → candle amber."
        },
        {
          "tool": "find_similar",
          "args": "{\"slug\":\"deathandcompany-com\",\"limit\":6}",
          "took": "Death & Co sub-pages (all Marquee-Hero) + louispoulsen 'warm golden liquid light' - validated warm-glow-on-dark."
        },
        {
          "tool": "compare",
          "args": "{\"slugs\":[\"deathandcompany-com\",\"elevenmadisonpark-com\",\"dinnerbyheston-com\"]}",
          "took": "Common styles minimalism+editorial across all three; triangulated the house style: serif-led, one big idea per screen."
        },
        {
          "tool": "find_by_color",
          "args": "{\"hex\":\"#8a1c12\"}",
          "took": "Tight real cluster around the oxblood (#882219, #871812, #86201c, #872414) - proves the accent is from real captures."
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
          "from": "Death & Co live #fff warmed toward bone - EMP/Atomix neutrals are warm, never cold white"
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
          "from": "Eleven Madison Park #c57838 / Louis Poulsen #d49434 - the candle-gold accent"
        },
        {
          "token": "--flesh",
          "hex": "#E3A074",
          "from": "EMP #e1b997 + Atomix #e3a696 - warm highlight on serif emphasis and the plated food"
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
    "highlight": "Warm editorial coffee hero, rebuilt to fit 1280×800 exactly (CTAs at 670px, panel at 795px - all above the fold), keeping a CSS-composed coffee-bag product card as the visual device. Palette and the playful-serif/grotesque/mono type system traced to Stumptown, Fellow and Intelligentsia.",
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
        "took": "Ample negative space in the hero - room for the headline's left column to breathe."
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
        "took": "Surfaced the coffee cluster - Stumptown, Intelligentsia, Blue Bottle, Fellow."
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
    "tagline": "The runtime for production voice agents - write it in code, point it at a number, ship.",
    "prompt": "Build a product page for an AI voice-agents platform.",
    "stack": "pure-inspo",
    "mode": "dark",
    "scoreSelf": 8.7,
    "highlight": "Balanced split hero measured to fit 1280×800 exactly (CTAs at y532-578, ~160px of below-fold headroom); a warm amber-on-brown-black live-call console - animated waveform, transcript + live tool-call chip, latency meters - deliberately distinct from Conduit's blue dashboard.",
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
      tagline: "A durable background-job / workflow runtime - in the Inngest / Temporal / Trigger.dev space.",
      prompt: "Create a developer infrastructure product page.",
      stack: "pure-inspo",
      mode: "dark",
      scoreSelf: 8.6,
      highlight:
        "The hero's right-hand dashboard mock is a believable product UI - workspaces sidebar with counts, a live timeline that ticks every 1.2s, a runs list with status dots that actually mean something (ok / running / warn / DLQ / fail), one of them blinking. Not a hero illustration; the product itself.",
      references: [
        { slug: "railway-com", took: "Its real font stack (Inter Tight + JetBrains Mono + IBM Plex Serif), deep slate bg hsl(250 24% 9%), and the left-headline + right-dashboard composition - adopted outright." },
        { slug: "vercel-com", took: "Geist + Geist Mono; the one centered-hero outlier in the genre - studied, then deliberately avoided." },
        { slug: "supabase-com", took: "Confirmed the single --brand-default accent with everything else grayscale - the one-accent rule." },
        { slug: "bun-sh", took: "The italic-serif accent word inside a sans H1 ('Bun is a *fast* package manager') - adopted the device, not the words." },
        { slug: "neon-tech", took: "Dark ground + a single saturated accent." },
        { slug: "postman-com", took: "Genre anchor for the developer-platform aesthetic." },
      ],
      mcpCalls: [
        { tool: "search_screens", args: '{"query":"developer infrastructure platform API","limit":6}', took: "Six genre anchors - Apple dev, Postman, Insomnia, Supabase, Render, Linode. Dark, monochrome, single accent." },
        { tool: "search_screens", args: '{"query":"edge compute serverless platform deploy","limit":6}', took: "Vercel, Heroku, Railway, Travis - triangulated the hero composition split." },
        { tool: "find_similar", args: '{"slug":"railway-com","limit":4}', took: "Pulled Bun + Anthropic; Bun's italic-serif-in-sans headline device." },
        { tool: "get_design_system", args: '{"slug":"railway-com"}', took: "Real fonts Inter Tight + JetBrains Mono, bg hsl(250 24% 9%) - adopted the stack." },
        { tool: "get_design_system", args: '{"slug":"vercel-com"}', took: "Geist + Geist Mono; confirmed mono is part of the genre's lingua franca." },
      ],
      palette: [
        { token: "--accent", hex: "#F0A657", from: "Soft saffron - warm family, but deliberately none of Vercel-yellow / Supabase-green / Bun-pink / Railway-purple / Neon-turquoise" },
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
        "get_design_system on Heath Ceramics with live:true returned the brand's actual muted palette (#26211b / #f5f4ee / #dd5640) - far quieter than the loud yellow-gold hero crops. That live token pull set the whole paper/ink/clay system and kept the studio feeling earthy and hand-made.",
      references: [
        { slug: "artek-fi", took: "Warm-wood neutrals (#866b4b) + the tight near-lowercase wordmark influenced the brand mark." },
        { slug: "apartamentomagazine-com", took: "Editorial warm-paper magazine reference for the section rhythm." },
      ],
      mcpCalls: [
        { tool: "search_screens", args: '{"query":"ceramics studio handmade stoneware"}', took: "Found the craft-studio cluster." },
        { tool: "get_design_system", args: '{"slug":"heathceramics-com","live":true}', took: "Live muted palette + Benton Sans / Monaco - the data point the whole system hangs on." },
        { tool: "search_screens", args: '{"query":"editorial serif natural materials atelier studio","style":"editorial"}', took: "Studio Gang + Antinomy - warm-paper confirmation." },
        { tool: "search_screens", args: '{"query":"furniture wooden handmade workshop earth tones"}', took: "Artek's warm-wood neutrals informed the wordmark." },
      ],
      palette: [
        { token: "--paper", hex: "#F3EDE4", from: "Heath's live #f5f4ee, knocked slightly warmer" },
        { token: "--espresso", hex: "#1F1813", from: "Heath's #26211b near-black" },
        { token: "--terracotta", hex: "#A44A25", from: "Tighter reading of Heath #dd5640 / Alden #ad411a / Antinomy #b48944" },
        { token: "--moss", hex: "#3A4A32", from: "Single cool note - used only for the 'Garden series' badge" },
        { token: "--gold", hex: "#C98B3B", from: "Dark-section eyebrow accent" },
      ],
    }
];

export function getExample(slug: string): Example | undefined {
  return EXAMPLES.find((e) => e.slug === slug);
}
