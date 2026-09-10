/**
 * "Made with Inspo" - case-study manifest for the /examples pages.
 *
 * Every entry is a REAL page built using only the Inspo MCP - no design
 * skill, no template, no component library. The HTML is copied verbatim
 * into public/examples/<slug>/page.html and iframed.
 *
 * All thirty entries were generated on Claude Fable 5.1 at high effort
 * on 2026-09-09 and 2026-09-10: three batches of ten parallel agents,
 * each with the Inspo MCP as its only tool, each writing one page plus
 * a NOTES.md that this manifest is transcribed from. The earlier pages
 * (Opus and Fable 5 builds, 2026-07 to 2026-08) were retired on
 * 2026-09-10 when the Fable 5.1 set replaced them.
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
  /** Where the build came from. Every current entry is a gallery run. */
  origin: "gallery";
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
    slug: "shirakawa-kiln",
    brand: "Shirakawa Kiln",
    tagline: "Unglazed stoneware from a Kyoto studio, wood-fired twice a year and sold only at kiln openings.",
    prompt: "A Kyoto ceramics studio with seasonal kiln openings: quiet, tactile, unglazed clay, object-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "fermliving-com",
        took: "The whole object language: one vessel alone on a warm beige panel, name set above a plain price, nothing else competing. Its Canela display face pushed the page toward a roman serif against the genre's grotesk gravity.",
      },
      {
        slug: "walkerart-org",
        took: "The sand paper band and the dated exhibition treatment: a craft object shown large, date and category on a rule underneath, then a ruled index list with arrows. The kiln-openings rows and the journal list are built on that shape.",
      },
      {
        slug: "hay-com",
        took: "A single image plane under a quiet nav with the wordmark as the anchor. Taught the page to let the hero panel be one flat plane rather than a collage.",
      },
      {
        slug: "knoll-com",
        took: "Photo cards used as navigation with an arrow label beneath instead of an overlay; the object cards and their hover follow that restraint.",
      },
      {
        slug: "magnumphotos-com",
        took: "The centered italic serif pull quote as editorial gravity with no image at all; the studio section opens with exactly that move.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief: Kyoto ceramics studio, seasonal kiln openings, quiet, tactile, unglazed, object-led; detail full",
        took: "Picked split-studio, 24-site evidence packet (mid paper, 79% grotesk display, chromatic-other accents), five agency exemplars that did not fit the brief, the split-screen hero JSX, hero and spacing guidance.",
      },
      {
        tool: "search_screens",
        args: "query \"ceramics pottery studio handmade objects earthy minimal\", limit 8, full",
        took: "Mostly agency split-studios again; madmuseum-org (porcelain exhibition) and studio-design were the only object-adjacent hits.",
      },
      {
        tool: "search_screens",
        args: "query \"quiet object-led shop natural materials warm paper serif\", color earthy, paperBand light, limit 8, full",
        took: "The real seam: fermliving-com--products-muses-clio, walkerart-org, fellowproducts-com--pages-app, cuyana-com--collections-work-bags, craigmod-com--about.",
      },
      {
        tool: "search_screens",
        args: "query \"craft furniture homeware catalogue calm\", industry furniture, vibe calm, limit 8, full",
        took: "hay-com, knoll-com, artek-fi, parachutehome-com, branchfurniture-ca; confirmed warm beige paper and object-first heroes across the category.",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "name catalogue, limit 6, full",
        took: "Only one exemplar (emigre-com); the tip pointed to portfolio-grid as the better-covered neighbour, which is how the objects grid was framed.",
      },
      {
        tool: "get_screen",
        args: "slug fermliving-com--products-muses-clio",
        took: "Full record: #daccb8 beige ground, canela and teka, portfolio-grid, roman-serif display class on light paper.",
      },
      {
        tool: "get_screen",
        args: "slug walkerart-org",
        took: "Full record: sand palette #dcbb98 / #5b4328, specimen macrostructure, ruled index rows below the hero.",
      },
      {
        tool: "get_design_system",
        args: "slug fermliving-com--products-muses-clio, live false",
        took: "Type ramp (32/18/16/14), spacing 8-24-32-128, radius 0/4/50, and the source's own tokens (canvas #f7f5ef, parchment #ded1bc, coffee #655248) which seeded the palette.",
      },
      {
        tool: "compare",
        args: "slugs fermliving-com--products-muses-clio, walkerart-org, hay-com, knoll-com",
        took: "Shared minimalism plus editorial, all light register, five-step type scales on the two closest references, container 1440.",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "Seven footer archetypes; took the address card (Ft8) since a studio's footer is a business card, and skipped the sitemap on the reference's own advice.",
      },
      {
        tool: "find_reference_components",
        args: "type cta",
        took: "Seven CTA archetypes; used the form-led shape with a real success state for the kiln letters and the quiet typographic appeal for the openings rows.",
      },
      {
        tool: "search_screens",
        args: "query \"japanese craft studio handmade quiet serif gallery\", displayClass roman-serif, paperBand light, limit 8, full",
        took: "magnumphotos-com--about-magnum (centered pull quote), maggieappleton-com (arrow-suffixed links instead of buttons), mirazur-fr--en-reservation-html (biodynamic calendar copy as reservation framing).",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#ece4d6",
        from: "Page ground. A bisque between Ferm Living's #daccb8 and Walker's #dcbb98, lightened so body text sits at comfortable contrast and the deeper panels still read as clay.",
      },
      {
        token: "--paper-deep",
        hex: "#ded2bf",
        from: "The object panels, hero panel and map ground: the raw-clay tone every vessel is set against, pulled from Ferm Living's parchment token.",
      },
      {
        token: "--ink",
        hex: "#2a211c",
        from: "Text and the primary pill button. An iron-brown near-black instead of pure black so the type looks printed on the paper rather than pasted.",
      },
      {
        token: "--muted",
        hex: "#766758",
        from: "Meta labels, secondary copy, prices' context lines. Same family as Walker's #5b4328 brown, lifted for hierarchy.",
      },
      {
        token: "--rule",
        hex: "#cfc2af",
        from: "Every hairline: nav, band, openings, journal, visit list, footer. Low enough contrast to structure without drawing.",
      },
      {
        token: "--clay",
        hex: "#a9603b",
        from: "The one accent: fired unglazed terracotta. Used only on the countdown, hover states, the map's studio dot and the form focus, so it reads as the fire's mark rather than a brand colour.",
      },
      {
        token: "--kiln",
        hex: "#1f1714",
        from: "The single dark band for the kiln section, the inside of the chamber. Paper type on it, ash-tinted muted copy, so the page has one moment of heat between two stretches of bisque.",
      },
    ],
    highlight: "The standout move is that every object on the page is drawn, not photographed, and drawn the way the studio would describe it: six vessels and the hero jar are symmetric SVG paths filled with three shared clay gradients (Shigaraki, Kyoto red, iron-flecked) and passed through one feTurbulence grain filter so the surface has tooth, with a translucent ash-green wash on the side that faced the flame. That lets the catalogue be honest about what an unglazed kiln sells, a type rather than a piece, while still giving each card the single-object-on-warm-beige composition that Ferm Living's product page made the reference for. The same three clay bodies then reappear as CSS swatches in the clay section, so the palette is literally the material.",
  },
  {
    slug: "ferrite-terminal",
    brand: "Ferrite",
    tagline: "An open-source terminal emulator written in Rust that rasterizes every cell on the GPU.",
    prompt: "A GPU-accelerated open-source terminal emulator: monospace, dark, benchmark-led, for developers.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 7.5,
    references: [
      {
        slug: "tinybird-co",
        took: "The stat-led shape: near-black #0a0a0a paper, a single mint accent carried by mono-set CTAs and pill tags, and the \"oversized green metric inside a proof card\" move. Ferrite borrows the paper, the mono-set buttons and the idea that the number is the hero visual, swapping the accent to rust orange.",
      },
      {
        slug: "e2b-dev",
        took: "The one catalogue screen with a mono display class on dark paper, with executable code treated as the primary visual element and a warm orange accent on tab underlines. This is where the mono headline face, the orange-underlined install tabs and the copy buttons on every command come from.",
      },
      {
        slug: "warp-dev",
        took: "A real terminal product page: sentence-case headline, product screenshot below, paired filled and outlined pills. It confirmed the hero should show the terminal itself and set the filled-plus-ghost CTA pairing.",
      },
      {
        slug: "raycast-com",
        took: "The small mono version line under the download buttons (\"v1.104.15 | macOS 13+ | Install via homebrew\") became the mono eyebrow above the headline and the \"12 MB download, no telemetry\" note beside the CTAs.",
      },
      {
        slug: "linear-app",
        took: "Left-aligned headline in the top third with the product surface bleeding in below, sentence case throughout, a pale accent used only on tiny marks. Set the left-heavy hero grid and the discipline of letting the accent land on very few elements.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"A GPU-accelerated open-source terminal emulator...\", mode dark, detail full",
        took: "Picked feature-stack with marquee-hero and bento-grid as runners-up; evidence packet said the genre is 67% dark paper, 75% grotesk-sans display, 46% cool accent. Exemplars huly-io, featurebase-app, morgen-so, superlist-com, gitkraken-com plus the pricing table reference JSX and hero/spacing guidance.",
      },
      {
        tool: "search_screens",
        args: "query \"terminal emulator developer tool dark monospace benchmark\", industry developer-tools, paperBand dark, limit 8, detail full",
        took: "unkey-com, raycast-com, e2b-dev--docs, railway-com, gitkraken-com, trigger-dev, warp-dev, linear-app with fold-by-fold autopsies.",
      },
      {
        tool: "search_screens",
        args: "query \"dark developer tool with mono display type and stats\", displayClass mono, paperBand dark, limit 8, detail full",
        took: "e2b-dev--docs, bugatti-com, posterco-tv, jordan-delcros-com; only e2b was usable, which told me mono-display dark dev pages are rare in the catalogue and worth taking a position on.",
      },
      {
        tool: "search_screens",
        args: "query \"stat-led dark technical page with big numbers\", macrostructure stat-led, paperBand dark, limit 6, detail full",
        took: "reactsummit-com, digitalocean-com, tinybird-co; tinybird's proof-card-as-hero became the model for the benchmark section.",
      },
      {
        tool: "find_reference_components",
        args: "type stat",
        took: "annotated, bar-chart, before-after, grid, row, single-hero JSX. The annotated stat (superscript footnotes naming the method) and the pure-CSS bar chart are used almost directly.",
      },
      {
        tool: "find_reference_components",
        args: "type hero",
        took: "documentary, manifesto, marquee, question, split-screen, stat-led, word-as-art. Confirmed the mono dateline eyebrow and the \"one thought set big\" hero, not a stacked CTA pile.",
      },
      {
        tool: "get_screen",
        args: "slug warp-dev",
        took: "Full record and hero capture of a shipped terminal product page: centered headline over a screenshot, filled and outlined pills.",
      },
      {
        tool: "get_screen",
        args: "slug tinybird-co",
        took: "Full record: #0a0a0a paper, mono CTAs, stat strip, \"100x faster\" highlighted in accent inside a sentence.",
      },
      {
        tool: "get_design_system",
        args: "slug tinybird-co, live false",
        took: "Real tokens: --color-bg #0a0a0a, radius 4/8/16, type ramp 64px h1 at weight 400 with -1.28px tracking, a mono font token for code roles. Set the tight negative tracking on display type and the small radius scale.",
      },
      {
        tool: "find_components",
        args: "type footer, industry developer-tools, mode dark, limit 5",
        took: "astro-build, builder-io, bun-com, digitalocean-com, flow-org footer crops; bun-com's install block with copy button and a four-column link footer shaped the install section and footer.",
      },
      {
        tool: "find_reference_components",
        args: "type features",
        took: "alternating, bento, compare, icon-trio, long-form, numbered-triplet, workbench JSX. The bento (irregular spans, no icons), numbered-triplet (border-top ordinals) and compare (before / with, no competitor names) shapes are used for features, pipeline and comparison.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#0a0a0b",
        from: "Page ground. Tinybird and Linear both sit at #0a0a0a; a hair of blue keeps it from reading as pure black next to the orange.",
      },
      {
        token: "--paper-2",
        hex: "#131315",
        from: "Cards, terminal chrome, install blocks and the open-source band. One step up so panels read as surfaces without borders doing all the work.",
      },
      {
        token: "--ink",
        hex: "#ececea",
        from: "Headlines and primary text. Slightly warm off-white so the mono display face does not glare at 56px.",
      },
      {
        token: "--muted",
        hex: "#8d8d93",
        from: "Body copy, labels, footnotes, software-fallback legend. Roughly 4.9:1 on paper so the small mono meta text stays legible.",
      },
      {
        token: "--rule",
        hex: "#232327",
        from: "Hairlines between sections, stat cells, table rows, chart baselines. Low enough that the grid is felt, not seen.",
      },
      {
        token: "--accent",
        hex: "#ff6a3d",
        from: "Rust orange: the brand's only chromatic voice. Lands on the prompt glyph, benchmark bars, footnote numerals, active tab underline, primary pill and the word GPU in the headline. Chosen against the genre's 46% cool consensus and because the product is named after iron oxide.",
      },
      {
        token: "--ok",
        hex: "#62d49c",
        from: "Terminal success lines and the \"copied\" state only. A second hue reserved for output that went right, so it never competes with the accent in layout.",
      },
    ],
    highlight: "The page lets the product be its own hero visual and its own proof. The fold pairs a mono headline with a drawn terminal window whose contents are the actual benchmark table, and the benchmark section below repeats those same four numbers as annotated stats with method footnotes and a pure-CSS bar chart comparing the GPU path to Ferrite's own software fallback rather than a named competitor. The mono display face pushes against the catalogue's 75% grotesk gravity, the rust accent pushes against its cool-blue consensus, and both choices come straight from what the product is: a monospace surface named after rust.",
  },
  {
    slug: "ravensgate-opera",
    brand: "Ravensgate Opera House",
    tagline: "A London producing house announces five winter productions, forty-five nights, with prices set by the night.",
    prompt: "An opera house announcing its winter season: grand, dramatic, crimson and black, programme-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 7.5,
    references: [
      {
        slug: "lamborghini-com",
        took: "The headline physically crossing into the hero visual. Ravensgate's display line runs left to right and its last words (\"lit red.\") land on the CSS curtain panel, so text and visual share one composition instead of sitting in two columns.",
      },
      {
        slug: "metmuseum-org",
        took: "Crisp white serif floating directly on a dark, textured ground with no scrim, plus the \"Now on view / View all\" strip that turns the fold into a listing. The programme section head with a right-aligned meta line is that strip.",
      },
      {
        slug: "barbican-org-uk",
        took: "The one cultural site in the archive whose fold is a programme CTA (\"Discover our summer programme\") followed by a \"This week\" listing. It set the page order: hero, programme, then everything else in service of booking.",
      },
      {
        slug: "tana-inc",
        took: "Black void hero, elegant serif display, one pale pill as the only anchor. Confirmed that a dark opera page does not need photography to feel grand; type and one accent carry it.",
      },
      {
        slug: "redis-io",
        took: "Pure typographic lockup on a dark ground with the red CTA as the sole chromatic event. Taken as permission to keep crimson to the curtain, the CTA and the first-night markers rather than flooding the page.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"An opera house announcing its winter season...\", mode dark, detail full",
        took: "Picked Marquee Hero; evidence packet said 79% grotesk-sans display in the neighbourhood, 38% warm accent, mid/dark paper split 50/50. Exemplars standardvision-com, deathandcompany-com, generalcondition-com, phantom-land, lithic-com. Took the position against the sans gravity (serif display) and with the warm accent.",
      },
      {
        tool: "search_screens",
        args: "query \"theatre opera concert season programme listing dark dramatic red\", paperBand dark, limit 8, full",
        took: "redis-io, drams-framer-website, shure-com, lamborghini-com, huly-io, audius-co, finach-com, adcker-com. Lamborghini and Redis were the useful ones.",
      },
      {
        tool: "search_screens",
        args: "query \"cultural institution events calendar performances\", industry culture, limit 8, full",
        took: "getty-edu, moma-org, barbican-org-uk, centrepompidou-fr, frieze-com, cooperhewitt-org, lacma-org, louvre-fr. Barbican and Met-adjacent institutional patterns; the lacma-org \"single red word\" note reinforced the restrained accent.",
      },
      {
        tool: "find_by_color",
        args: "hex #b3121f, tolerance 0.2, limit 10, full",
        took: "bbc-com, platonphoto-com, stanford-edu, metmuseum-org, brightful-me, studio-design, radix-ui-com, wired-com, crackmagazine-net, basement-studio. Confirmed #B3121F sits in the BBC / Met / Stanford crimson family, so the accent reads institutional rather than neon.",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "name catalogue, limit 6, full",
        took: "Only emigre-com; coverage thin. Took its lesson (the product is the visual, no abstraction) for the programme rows and moved on.",
      },
      {
        tool: "find_reference_components",
        args: "type hero",
        took: "Seven archetypes; Marquee (mono dateline as anchor) and Split-screen (pure-CSS atmospheric panel, no image placeholder) shaped the fold: dateline above the headline, curtain drawn in CSS and SVG.",
      },
      {
        tool: "get_screen",
        args: "slug barbican-org-uk",
        took: "Full record; confirmed the programme-CTA-then-listing order and the 137px top spacing step.",
      },
      {
        tool: "get_screen",
        args: "slug metmuseum-org",
        took: "Full record; 5-step type scale, 93px section step, crimson nav band.",
      },
      {
        tool: "search_screens",
        args: "query \"luxurious serif display dark stage performance\", displayClass roman-serif, paperBand dark, limit 6, full",
        took: "tana-inc, railway-com, atomixnyc-com, moshimoshimusic-com, lucidmotors-com--compare, lafamigliamysteryunfolds-gucci-com. Tana and Lucid (roman plus italic in one headline) informed the display treatment.",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "Seven footers; Address card and Index shaped the four-column footer with a real box office address and a hand-set season list, no social icon row.",
      },
      {
        tool: "find_reference_components",
        args: "type pricing",
        took: "Seven pricing shapes; Per-use (line items read as a menu) became the ticket table and offers list, Comparison table gave the thin-rule, no-zebra table.",
      },
      {
        tool: "compare",
        args: "slugs metmuseum-org, lamborghini-com, tana-inc, barbican-org-uk",
        took: "All four sit on a 5-step type scale; section steps of 93 to 152px; shared style is minimalism. Set the seam rhythm at clamp(72px, 10vw, 140px).",
      },
    ],
    palette: [
      {
        token: "--ink",
        hex: "#0c0a0b",
        from: "Page ground. A warm near-black rather than pure black so the crimson curtain does not vibrate against it.",
      },
      {
        token: "--ink-2",
        hex: "#171316",
        from: "Raised surfaces: the marquee strip, the footer, the seating plan ground. One step up from the page so seams read without borders shouting.",
      },
      {
        token: "--crimson",
        hex: "#b3121f",
        from: "The house colour. Curtain folds, primary CTA, first-night markers, the season pass band, hover state on production titles. Sits in the Met / BBC crimson family per find_by_color.",
      },
      {
        token: "--crimson-deep",
        hex: "#6a0a12",
        from: "Curtain shadow folds, the upper circle on the seating plan, the spotlight visual's base gradient. Gives the red depth without a second hue.",
      },
      {
        token: "--cream",
        hex: "#f3eadb",
        from: "All text and the sun disc in the spotlight visual. Warm off-white so the serif reads as printed programme paper, not screen white.",
      },
      {
        token: "--muted",
        hex: "#a2969a",
        from: "Meta lines, secondary columns in programme rows, synopses. Desaturated with a hint of the crimson so it belongs to the same family.",
      },
      {
        token: "--rule",
        hex: "#f3eadb24",
        from: "Every hairline: row dividers, table rules, month grid, ghost buttons. Cream at low alpha so rules dim consistently over both black and crimson.",
      },
    ],
    highlight: "The fold is a stage. The right 44% of the hero is a house curtain drawn entirely in CSS (a five-stop repeating gradient for the velvet folds, a radial vignette for the footlight shadow, an SVG scalloped pelmet along the top and a cream stage lip along the bottom), and the headline runs across the seam so its last words, \"lit red.\", land on the velvet, the Lamborghini move of letting the visual serve as a typographic baseline. Below it the page stays programme-led the way the Barbican fold is: five production rows with number, title, composer, dates, category and lowest price, each opening to a synopsis and creative team, then a four-month calendar where first nights are the only solid crimson marks, then a price table that switches between first nights, standard nights and family matinees.",
  },
  {
    slug: "halyard-marine",
    brand: "Halyard",
    tagline: "Offshore marine weather that blends three models, live buoys and your destination's tide table into one live board.",
    prompt: "A marine weather service for offshore sailors: forecast dashboard, data-dense, tide and wind, live.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 7.5,
    references: [
      {
        slug: "digitalocean-com",
        took: "The register for the whole page: deep teal paper, stat cards sitting on the hero surface, a vertical scale gauge as a technical motif, and the Plus Jakarta Sans plus Inter pairing that became Plus Jakarta Sans plus JetBrains Mono here. Its measured type ramp (48 / 36 / 18 / 16) set the ratio for the five-step scale.",
      },
      {
        slug: "dovetail-com",
        took: "Navy-on-dark data visualisation with a single cool electric accent and a warm peach secondary inside charts. That two-hue chart logic became cyan for mean wind and pressure, amber for gusts and warnings.",
      },
      {
        slug: "tinybird-co",
        took: "The oversized mono metric embedded in a dark proof card, with tags in tight mono. The readout row on the board (24 kn, 1004.2 hPa, 2.8 m, 4.1 m) is set the same way: number in mono at display size, unit small and muted beside it.",
      },
      {
        slug: "diffusion-studio",
        took: "Fold composition: compact headline cluster upper-left, product surface filling the lower 55 percent of the viewport. The Halyard fold is that shape with the dashboard as the product surface, so the numbers are visible without scrolling.",
      },
      {
        slug: "unkey-com",
        took: "Studied for the map/diagram macrostructure; the network diagram bleeding behind text was not used directly, but its restraint (one lime accent on near-black, everything else grey) confirmed a single-accent rule for the board.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief: marine weather service for offshore sailors, forecast dashboard, data-dense, tide and wind, live; detail full",
        took: "Picked bento-grid with feature-stack and marquee-hero runners-up; evidence packet said the genre leans light paper, grotesk sans, chromatic-other accent; exemplars brightful-me, campaignmonitor-com, hypereffekt-com, canvasapp-com, novu-co; the Bento features JSX; hero and spacing guidance (96px median seam, padding-inline only on the container)",
      },
      {
        tool: "search_screens",
        args: "query dark data-dense dashboard with live numbers, charts and telemetry; paperBand dark; vibe technical; limit 8; detail full",
        took: "liveblocks-io, lithic-com, vimcal-com, portalone-studio, sourcegraph-com, novu-co, diffusion-studio, dovetail-com with fold autopsies; diffusion-studio and dovetail-com were the useful ones",
      },
      {
        tool: "search_screens",
        args: "query weather, ocean, sailing, marine, maps, forecast; limit 8; detail full",
        took: "explorajourneys-com, becomeautonomous-com, oysterhr-com, canvasapp-com, polar-sh, pusher-com, middle-finance, brightful-me; nothing marine in the archive, confirmed the build would have to borrow from dark data products instead",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "name stat-led; limit 6; detail full",
        took: "Four sites (thin coverage): digitalocean-com, reactsummit-com, tinybird-co, instituteofhealth-com; digitalocean-com and tinybird-co became primary references",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "name map-diagram; limit 6; detail full",
        took: "Two sites (thin coverage): moderntreasury-com, unkey-com; used for the single-accent discipline only",
      },
      {
        tool: "get_screen",
        args: "slug digitalocean-com",
        took: "Full record: palette #31bacd / #144c54 / #b4d4dc / #648c90 / #a3b5b5, Plus Jakarta Sans + Inter, stat-led, fold autopsy with stat cards over terrain and the vertical scale markers",
      },
      {
        tool: "get_screen",
        args: "slug dovetail-com",
        took: "Full record: palette #0444fb / #092667 / #f49c6c / #7f7f7f / #aeacab, Inter, chart bars in blue with peach secondary, 45/55 text-to-visual hero split",
      },
      {
        tool: "get_screen",
        args: "slug tinybird-co",
        took: "Full record: #24f494 on #0a0a0a, oversized green metric inside a dark proof card, mono tag row",
      },
      {
        tool: "get_design_system",
        args: "slug digitalocean-com; live false",
        took: "DESIGN.md: type ramp h1 48/800, h2 36/700, h3 18, body 16; spacing 16/32; radius 0/64; source CSS variables including --background-card #000f0f and --primary-teal-200 #00afce",
      },
      {
        tool: "find_reference_components",
        args: "type nav",
        took: "Seven nav archetypes with JSX; took the N1 Inline shape (wordmark left, links centre, tighter utility cluster right) for the top bar",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "Seven footer archetypes; used the Ft3 Sitemap warning as a prompt to keep the link map to three short columns plus a colophon-style statement and a status line instead of a four-column map",
      },
      {
        tool: "find_reference_components",
        args: "type stat",
        took: "Six stat archetypes; the 4-stat row with hairline rules and tabular-nums became the data-sources strip (6 min, 0.1 deg, 127, 14 days)",
      },
      {
        tool: "compare",
        args: "slugs digitalocean-com, dovetail-com, tinybird-co, diffusion-studio",
        took: "Shared register: minimalism, dark-mode, monochrome; all five-step type scales; spacing scales 24 to 128; confirmed the dark data register was consistent across the picks",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#071a22",
        from: "Page ground. Sits between DigitalOcean's #144c54 teal and Dovetail's #092667 navy, pushed darker so mono readouts at 52px stay crisp and the cyan traces have room.",
      },
      {
        token: "--panel",
        hex: "#0c2531",
        from: "Board, table, tide and pricing card surfaces. One step up from paper so the dashboard reads as a lifted instrument rather than a border on the ground.",
      },
      {
        token: "--rule",
        hex: "#b5d4dc24",
        from: "Every hairline: nav bottom, readout dividers, table rows, stat strip. Derived from DigitalOcean's pale cyan text #b4d4dc at low alpha so rules feel like the same light, not grey.",
      },
      {
        token: "--ink",
        hex: "#e7f1f4",
        from: "Primary text and the now markers on the charts. Slightly cyan-tinted white so it belongs to the teal ground.",
      },
      {
        token: "--muted",
        hex: "#8fb0ba",
        from: "Meta labels, units, axis ticks and the tide trace. Pulled from DigitalOcean's #648c90 / #a3b5b5 support tones, lightened for 12px mono legibility.",
      },
      {
        token: "--accent",
        hex: "#35c3d6",
        from: "Mean wind bars, pressure trace, tide fill, primary button, featured tier border. One cool accent, as in every reference studied.",
      },
      {
        token: "--warn",
        hex: "#f2a25c",
        from: "Gusts, falling pressure trends, gale tags and the gale chip. Dovetail's chart peach #f49c6c, used only where a number should make a skipper pause.",
      },
    ],
    highlight: "The fold is the product. Instead of a headline plus a screenshot, the headline cluster is compressed into the top 140px and the live board takes the rest of the viewport: four mono readouts (wind, pressure, wave, tide) each carrying three secondary figures, a 48 hour wind chart with gust envelope and direction arrows, and a 24 hour pressure and tide overlay, all drawn in SVG from real-looking arrays and stretched with preserveAspectRatio none so the plots fill whatever height the fold gives them. A ticking UTC clock and a countdown to the 12Z publication keep the board honest about being live without inventing changing measurements. Below, the same discipline continues in a seven-day table where wind and gust are drawn as inline bars beside the digits, and a Camaret departure-window track that turns the area forecast into sixteen three-hour blocks a skipper can act on.",
  },
  {
    slug: "halden-robotics",
    brand: "Halden Robotics",
    tagline: "Autonomous pallet and tote robots for warehouses that run three shifts, sold on the spec sheet.",
    prompt: "A warehouse robotics company: industrial, safety yellow, spec-sheet led, precise.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "teenageengineering-com",
        took: "The spec-sheet register: hardware as the only hero object, tiny dense mono labels printed on and around the machine, a product code set on the chassis. The hero's dimension callouts and the \"Drawing / Scale / Sheet\" plate come from this.",
      },
      {
        slug: "hardwareoperations-com",
        took: "Mechanical detail treated as a drawing in a gallery, with the nav reduced to mono metadata at the edges (status line, email). The green \"online\" status dot in the nav and the mono nav links are lifted from its edge treatment.",
      },
      {
        slug: "genelec-com",
        took: "The 40/60 split of left text block against a right product, and the tall vertical accent bar preceding the headline. That bar became the safety-yellow ruler beside the H1.",
      },
      {
        slug: "shure-com",
        took: "Model code as an eyebrow above the headline (its \"MVX2U Gen 2\" line), and one product at an angle on a flat field with no environment. Gave the \"HX-1400 · Pallet AMR · ISO 3691-4\" eyebrow.",
      },
      {
        slug: "arweave-org",
        took: "Numbered index hierarchy (01, 02, 03) and a single accent-coloured period as the only chromatic mark in the headline. Section indices, the footer index list and the yellow-deep periods in the H1 all come from here.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief: \"A warehouse robotics company: industrial, safety yellow, spec-sheet led, precise\", detail: full",
        took: "Picked Marquee Hero, but the exemplars were AI and agency sites (blackforestlabs-ai, mage-ai, 11x-com, phantom-land, analogue-co). Useful evidence packet: grotesk-sans at 75%, a #fbdb04 yellow anchor in the genre, plus the hero-fit and spacing guidance. I treated the pick as a runner-up and looked for hardware.",
      },
      {
        tool: "find_by_color",
        args: "hex #f5c400, tolerance 0.2, limit 10",
        took: "Sites carrying safety-adjacent yellow: interaction-hnine-com, logicmag-io, headspace-com, middle-finance, lottiefiles-com, juanmora-co, wesbos-com, daisyui-com, rust-lang-org, ghost-org. Confirmed that yellow reads best as a fill (rust-lang-org button, wesbos-com highlight bars) not as text on light paper, which set the --yellow / --yellow-deep split.",
      },
      {
        tool: "search_screens",
        args: "query \"industrial hardware robotics spec sheet technical product page precise engineering\", vibe technical, limit 10",
        took: "teenageengineering-com, kvs-services, hardwareoperations-com, arweave-org, price-pierce-co-uk, smartsheet-com, render-com, stately-ai, you-com, builder-io. The first three and arweave-org became core references.",
      },
      {
        tool: "search_screens",
        args: "query \"hardware device specifications table payload machine product\", industry consumer-tech, limit 8",
        took: "fellowproducts-com, whoop-com, teenageengineering-com, analogue-co, shure-com, apple-com, genelec-com, snap-com. Gave genelec-com and shure-com.",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "name feature-stack, limit 6",
        took: "algolia-com, alloy-com, amie-so, anytype-io, babbel-com, basecamp-com. Confirmed I did not want a feature-stack; the page below the fold is a numbered spec document instead.",
      },
      {
        tool: "get_screen",
        args: "slug teenageengineering-com",
        took: "Full autopsy: outlined logotype, labels left-justified on hardware edges, 8:1 scale jump. Basis for the callout-annotated hero drawing.",
      },
      {
        tool: "get_screen",
        args: "slug hardwareoperations-com",
        took: "Full autopsy: GT Pressura Extended plus Geist Mono, mono nav at 10px, render bleeding the frame. Basis for the extended grotesk plus mono pairing (Archivo wdth axis plus IBM Plex Mono).",
      },
      {
        tool: "get_screen",
        args: "slug genelec-com",
        took: "Full autopsy: 4px vertical rule beside the headline, 40/60 split, 5-step type scale, 1280 container. Basis for the hero split and the ruler bar.",
      },
      {
        tool: "find_reference_components",
        args: "type stat",
        took: "annotated, bar-chart, before-after, grid, row, single-hero. Took the 4-stat row with hairline rules and tabular figures for the strip under the hero, and the 6-stat grid shape for the safety figures.",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "address, colophon, list, long-copy, newsletter, sitemap, statement. Took the Ft1 Index (numbered, no underlines) and the Ft8 Address card, combined into one footer.",
      },
      {
        tool: "get_design_system",
        args: "slug teenageengineering-com, live false",
        took: "Thin tokens (no fonts captured), palette roles only; confirmed the monochrome-plus-one-accent structure.",
      },
      {
        tool: "compare",
        args: "slugs teenageengineering-com, hardwareoperations-com, genelec-com, shure-com",
        took: "Shared styles: minimalism, swiss, monochrome. genelec-com and shure-com both run 5 type steps; genelec-com spacing 64/80/132 informed the section rhythm.",
      },
      {
        tool: "get_screen",
        args: "slug arweave-org",
        took: "Full autopsy: numbered 01-04 tab bar, accent period, Roboto Mono plus Work Sans. Basis for the section indices and the H1 periods.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#ecebe6",
        from: "Page ground. A concrete-grey off-white rather than pure white, so the safety yellow reads as paint on a floor rather than a web accent.",
      },
      {
        token: "--paper-2",
        hex: "#e1e0da",
        from: "Drawing sheets, table headers, the stat strip. One step down from paper to make panels without borders doing all the work.",
      },
      {
        token: "--ink",
        hex: "#141413",
        from: "Text, chassis linework, the dark button state. Warm near-black to sit with the grey paper.",
      },
      {
        token: "--muted",
        hex: "#66655f",
        from: "Mono metadata, dimension lines, secondary copy. Chosen to pass contrast on both paper tones.",
      },
      {
        token: "--rule",
        hex: "#c6c5be",
        from: "Hairlines, table borders, the 40px blueprint grid behind the drawings.",
      },
      {
        token: "--yellow",
        hex: "#f5c400",
        from: "Safety yellow. Used only as a fill: the robot chassis, the primary button, the CTA band, protective fields in the safety diagram, the ruler bar. Never as text on paper.",
      },
      {
        token: "--yellow-deep",
        hex: "#b58f00",
        from: "The yellow's text-safe sibling for the H1 periods, section index numbers and timeline dates, so the accent can appear in type without failing contrast.",
      },
      {
        token: "--dark",
        hex: "#1c1c1a",
        from: "The safety section's ground, where yellow becomes the linework instead of the fill.",
      },
    ],
    highlight: "The hero is a dimensioned side elevation rather than a product photo: an SVG HX-1400 on a 40px blueprint grid with a title plate (\"Drawing HX-1400-SE, Scale 1:20, Sheet 1 of 4\"), extension lines and mono callouts for overall length, mast height, fork height, scanner spec, rated load and braking distance. The headline is a specification (\"Moves 1,400 kg at 2.0 m/s. Stops inside 480 mm.\") and every number in it is repeated in the drawing and again in the comparative spec table, which is rendered from a single data object so the metric/imperial toggle and the click-to-highlight column stay consistent with the hero. The same drawing language returns in the dark safety section as a plan view with the protective and warning fields dimensioned, so the page reads as one datasheet rather than a landing page with a table bolted on.",
  },
  {
    slug: "rook-lane",
    brand: "Rook Lane Recordings",
    tagline: "A reissue label cutting out-of-print sixties jazz pressings again from the original master tapes.",
    prompt: "A jazz label reissuing 1960s pressings: sleeve-led, monochrome, typographic, catalogue numbers.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.0,
    references: [
      {
        slug: "thrilljockey-com",
        took: "The sleeve grid with no hero imagery and bold titles set under each square, on plain white, is the whole catalogue section. Its pure monochrome (black text, white ground, no accent deployed) set the palette discipline.",
      },
      {
        slug: "xlrecordings-com",
        took: "The 40/60 split hero with a text block on the left and a square sleeve on the right, plus the small \"LP · catalogue number\" badge, gave the fold and the habit of putting the catalogue number on every surface. Its red bottom ticker became a black one.",
      },
      {
        slug: "ninjatune-net",
        took: "The dense release grid where \"the grid is the viewport\" and the tiny mono metadata under each cover shaped the card captions (catalogue number, year and format, title, artist, price, status).",
      },
      {
        slug: "emigre-com",
        took: "The only Catalogue-macrostructure exemplar in the archive: every tile is the product speaking for itself in its own face. That is why each sleeve is a distinct typographic composition rather than a placeholder.",
      },
      {
        slug: "lettersfromsweden-se",
        took: "The stacked specimen bars (name, slider, quick-buy on one hairline row) became the five-row pressing-notes ladder: step number, heading and copy, mono spec column, hairline between rows.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief + color monochrome, detail full",
        took: "Picked Marquee Hero over Photographic and Feature Stack; evidence packet said grotesk-sans display at 79% and mid paper; exemplars wallpaper-com, rivian-com, factmag-com, creativereview-co-uk, swisstypefaces-com; full HeroMarquee JSX; hero fold and spacing guidance",
      },
      {
        tool: "search_screens",
        args: "query \"record label vinyl catalogue monochrome typographic\", industry music, limit 8, detail full",
        took: "xlrecordings-com, thirdmanrecords-com, daptonerecords-com, teenageengineering-com, thrilljockey-com, shure-com, dragcity-com, splice-com with fold autopsies",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "catalogue, limit 6, detail full",
        took: "Thin coverage: only emigre-com, with Portfolio Grid and Type Specimen named as the better-covered neighbours",
      },
      {
        tool: "search_screens",
        args: "query \"monochrome black and white typographic index grid archive\", color monochrome, style monochrome, limit 8, detail full",
        took: "ohnotype-co, minimal-so, palaisdetokyo-com, buildkite-com, studiomuseum-org, tailwindcss-com, docs-astro-build, hopper-com",
      },
      {
        tool: "find_reference_components",
        args: "type nav",
        took: "Seven nav archetypes with JSX; took N1 Inline (wordmark left, links inline, tighter utility cluster right)",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "Seven footer archetypes; combined Ft8 Address and Ft7 Colophon, no social row, no four-column sitemap",
      },
      {
        tool: "get_screen",
        args: "thrilljockey-com",
        took: "Full record and autopsy: futura-pt, white ground, black text, no accent, 8-cover grid with bold titles",
      },
      {
        tool: "get_screen",
        args: "xlrecordings-com",
        took: "Full record and autopsy: Helvetica, split hero, LP badge with catalogue number, red bottom ticker",
      },
      {
        tool: "find_similar",
        args: "thrilljockey-com, limit 6, detail full",
        took: "works-studio, ninjatune-net, designstudio-com, emilkowal-ski, maxsiedentopf-com, julian-com; ninjatune-net and maxsiedentopf-com (single-underline filter row) were the useful ones",
      },
      {
        tool: "search_screens",
        args: "query \"typographic archive index numbered entries light paper editorial\", macrostructure type-specimen, paperBand light, limit 6, detail full",
        took: "displaay-net--about, thedesignersfoundry-com, velvetyne-fr, yuanchuan-dev, pampatype-com, lettersfromsweden-se",
      },
      {
        tool: "get_reference_jsx",
        args: "type cta, id marquee",
        took: "Marquee CTA source: whole strip clickable, three copies of the phrase, edge mask fade, pause on hover, reduced-motion fallback",
      },
      {
        tool: "compare",
        args: "thrilljockey-com, ninjatune-net, emigre-com, lettersfromsweden-se",
        took: "All four light register, minimalism + editorial shared, three to four type steps each, radius 0 everywhere, containers at 1440 or unconstrained",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f3f0ea",
        from: "Page ground. Warm off-white rather than pure white so the black sleeves read as objects sitting on board, not holes in the screen.",
      },
      {
        token: "--paper-2",
        hex: "#e6e2da",
        from: "The subscribe panel and the RL-012 sleeve ground; one step down so a section can change tone without a border.",
      },
      {
        token: "--sleeve-white",
        hex: "#fbfaf7",
        from: "The white sleeves. Slightly brighter than the page so a white sleeve still separates from the paper behind it.",
      },
      {
        token: "--ink",
        hex: "#141412",
        from: "Text, the black sleeves, the ticker, solid buttons. A warm near-black, not #000, to sit with the paper.",
      },
      {
        token: "--plate",
        hex: "#1c1b18",
        from: "The vinyl disc body and solid-button hover; a second black so the disc reads behind the sleeve instead of merging with it.",
      },
      {
        token: "--muted",
        hex: "#6b6862",
        from: "Secondary copy, mono metadata, the dot field on RL-015. The only grey in the type system.",
      },
      {
        token: "--rule",
        hex: "#cfcac0",
        from: "Every hairline: nav, section seams, ladder rows, specs table, index rows. Light enough to structure without drawing.",
      },
    ],
    highlight: "The sleeves are the design system. Six catalogue entries, RL-011 to RL-016, are each drawn as a 400 by 400 inline SVG using one variable grotesk pulled to different widths (condensed for the artist, expanded and forced to a fixed textLength for the title) and one monochrome device each: a cropped circle, vertical stripes, sixteen bars of uneven length, a dot field, a diagonal split, and the seven white rules of RL-014. Because they are vectors in the page's own type and palette, the same RL-014 sleeve is the hero object (with a grooved disc half out of it), a grid tile, and a reset back sleeve with the track listing, and the catalogue number travels with it onto the disc label, the ticker, the specs table and the artists index. Nothing on the page is uppercase, including the sleeves, which is the one deliberate departure from how a 1966 jacket would actually have been set.",
  },
  {
    slug: "chalkline-gym",
    brand: "Chalkline",
    tagline: "Three Bristol bouldering gyms, six colour circuits, one membership that works at all of them.",
    prompt: "A bouldering gym with three locations: energetic, chalk and colour-coded grades, membership-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 7.5,
    references: [
      {
        slug: "generalcondition-com",
        took: "The whole hero register: near-black ground with a faint 64px grid, one hot warm accent doing headline and buttons, loud display type left with a visual anchoring right. I swapped its doodle border for a chalk-dust radial glow and an SVG wall.",
      },
      {
        slug: "boldmonday-com",
        took: "Five saturated full-width bands stacked edge to edge as content, not decoration. That became the six grade bands (green to black), each band a single colour with its name set as a specimen word.",
      },
      {
        slug: "dropout-tv",
        took: "Dark pricing row where only the centre card pops: accent border, accent pill tag, filled CTA, flanking cards stay outline-only. Also its \"Select a plan\" framing and the rounded card language.",
      },
      {
        slug: "tempo-fit",
        took: "Solid warm-red athletic marquee with sentence-case headline and white pill CTA; it confirmed the energetic-but-sentence-case direction and the idea of a full-bleed accent block, which became the £15 taster section.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief verbatim, detail full",
        took: "Picked feature-stack over marquee-hero and photographic; evidence packet said grotesk-sans 75 percent, paper mostly mid, accent split warm/chromatic-other. Exemplars were SaaS-heavy (clay-com, puzzle-io, arrows-to, dia-com, sourcegraph-com) so I searched further. Also returned the pricing table reference JSX and hero/spacing guidance.",
      },
      {
        tool: "search_screens",
        args: "query \"energetic bold sports gym climbing membership loud colourful\", vibe loud, limit 8, detail full",
        took: "boldmonday-com, stinkstudios-com, dropout-tv, kelseydake-com, idyllic-co-nz, generalcondition-com, alternativeaesthetics-co-uk, laugh-mind-co-jp. Gave me the stacked-band and dark-loud-accent directions.",
      },
      {
        tool: "search_screens",
        args: "query \"playful saturated colour blocks physical space community membership pricing\", style playful, color saturated, limit 8, detail full",
        took: "dropout-tv--plans, bunny-net--pricing, kelseydake-com, basecamp-com, typearture-com, amazon-com, lego-com, gusto-com. The Dropout pricing autopsy was the useful one.",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "marquee-hero, limit 6, detail full",
        took: "anchor-fm, audius-co, azure-microsoft-com, belmond-com, bittersoutherner-com, blackforestlabs-ai. Confirmed text-left, visual-right balance and 35/65 splits for marquee heroes.",
      },
      {
        tool: "find_reference_components",
        args: "type pricing",
        took: "Seven pricing archetypes with JSX; I took the three-card shape (accent rule marks the recommended tier, no badge chrome) and the toggle's radio semantics for the monthly/annual switch, and the thin-rule table for the setting schedule.",
      },
      {
        tool: "find_reference_components",
        args: "type hero",
        took: "Seven hero archetypes; used the marquee note (one thought set big, given air) and the split-screen note (atmospheric CSS panel instead of stock imagery) to justify drawing the wall in SVG.",
      },
      {
        tool: "get_screen",
        args: "boldmonday-com",
        took: "Full record; confirmed bands are roughly 20 percent of viewport each and that the nav sits above them, which is how the grade section is stacked.",
      },
      {
        tool: "get_screen",
        args: "generalcondition-com",
        took: "Full record; palette #fb1c0c on #0a0a0a, faint grid, spacing scale 5 to 20, type scale 5 steps, radius 0 to 5. Used the grid and the single-accent rule.",
      },
      {
        tool: "find_components",
        args: "type footer, vibe loud, limit 6",
        took: "Zero results; footer composed from the gym cards and the Dropout nav instead.",
      },
      {
        tool: "search_screens",
        args: "query \"fitness gym studio locations opening hours membership\", industry health, limit 6, detail full",
        took: "peloton-com, frequencybreathwork-com, joindawn-com, modernhealth-com, fitbod-me, tempo-fit. Tempo was the only one in register; fitbod-me's stat strip under the fold informed the hero meta line.",
      },
      {
        tool: "compare",
        args: "generalcondition-com, boldmonday-com, dropout-tv--plans, tempo-fit",
        took: "Per-site type/spacing/radius scales: 4 to 6 type steps, Dropout radii 6 to 24, Tempo spacing 12 to 120. Settled on one 14px radius, a five-step scale plus display, and a clamp(72px, 9vw, 128px) seam.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#12110f",
        from: "Page ground. Warm near-black rather than pure black so chalk-white type reads as chalk on rubber, not white on void; sits between generalcondition's #0a0a0a and Dropout's #111.",
      },
      {
        token: "--paper-2",
        hex: "#1b1916",
        from: "Raised surfaces: ticker, gym cards, membership section. One step lighter so cards separate without borders doing all the work.",
      },
      {
        token: "--ink",
        hex: "#f4f0e6",
        from: "All body and display text. Slightly warm off-white, the colour of chalk, so it belongs with the orange instead of fighting it.",
      },
      {
        token: "--muted",
        hex: "#a69f91",
        from: "Ledes, hours labels, tags, small print. Warm grey derived from ink, keeps hierarchy without introducing a cool cast.",
      },
      {
        token: "--accent",
        hex: "#ff4d1f",
        from: "The one hot colour: hero phrase, primary buttons, eyebrows, the recommended plan, the taster section ground. Orange-red because it sits between the orange and red circuits and reads as energy, not danger.",
      },
      {
        token: "--g-green",
        hex: "#5fd36b",
        from: "The six circuit colours, used only where they mean a grade: the band section, the holds in the hero SVG, the ticker dots, the gym card stripes and the setting table. Chosen for legibility against both dark ground and each other.",
      },
      {
        token: "--g-yellow",
        hex: "#ffd23f",
        from: "The six circuit colours, used only where they mean a grade: the band section, the holds in the hero SVG, the ticker dots, the gym card stripes and the setting table. Chosen for legibility against both dark ground and each other.",
      },
      {
        token: "--g-orange",
        hex: "#ff7a1a",
        from: "The six circuit colours, used only where they mean a grade: the band section, the holds in the hero SVG, the ticker dots, the gym card stripes and the setting table. Chosen for legibility against both dark ground and each other.",
      },
      {
        token: "--g-red",
        hex: "#ef3b3b",
        from: "The six circuit colours, used only where they mean a grade: the band section, the holds in the hero SVG, the ticker dots, the gym card stripes and the setting table. Chosen for legibility against both dark ground and each other.",
      },
      {
        token: "--g-purple",
        hex: "#9b5de5",
        from: "The six circuit colours, used only where they mean a grade: the band section, the holds in the hero SVG, the ticker dots, the gym card stripes and the setting table. Chosen for legibility against both dark ground and each other.",
      },
      {
        token: "--g-black",
        hex: "#2b2a28",
        from: "The six circuit colours, used only where they mean a grade: the band section, the holds in the hero SVG, the ticker dots, the gym card stripes and the setting table. Chosen for legibility against both dark ground and each other.",
      },
      {
        token: "--rule",
        hex: "#f4f0e624",
        from: "Hairlines, the hero grid, card borders, table rules. Derived from ink at 14 percent so every rule is the same warmth.",
      },
    ],
    highlight: "The grade section takes boldmonday's stacked type-specimen bands and makes them do a job: six full-bleed colour bands, green to black, each one the actual circuit colour a climber follows on the wall, with the name set as display type, the V range beside it and one honest sentence about what that colour feels like. The same six colours then reappear only where they mean a grade (the SVG holds in the hero, the ticker dots, the stripe on each gym card, the dots in the setting table) so the colour system on the page is the colour system in the gym.",
  },
  {
    slug: "brenna-alpine",
    brand: "Brenna",
    tagline: "Eleven rooms of snow and larch at 1,842 metres in the Dolomites, booked directly at one flat rate per season.",
    prompt: "A boutique alpine hotel: snow and larch wood, room-led, slow, booking-first.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.0,
    references: [
      {
        slug: "explorajourneys-com",
        took: "The hero shape: a sentence-case serif headline with one italic phrase emphasised, and a booking module (dropdowns plus one wide filled button) sitting directly under it rather than a marketing CTA. Also the sage-and-olive restraint, one accent only on the button.",
      },
      {
        slug: "lyfehotels-com",
        took: "The booking bar as a functional white strip with labelled fields, breaking the hero, and the season-led rate framing; I kept its check-in / check-out / room / search field order and dropped its secondary nav.",
      },
      {
        slug: "belmond-com",
        took: "The destination eyebrow with a short rule before it (\"Valtura, Dolomites\") and the copy-beside-picture rhythm used in the house and getting-here sections; I rejected its wide-tracked uppercase.",
      },
      {
        slug: "audocph-com",
        took: "Tone reference for the ghosted serif caption on an image; became the two-line caption sitting inside the hero panel and the muted, monochrome-with-one-wood-accent palette.",
      },
      {
        slug: "louispoulsen-com",
        took: "The severe 50/50 split with warm off-white ground and a documentary image beside a small text block, reused for the larch house section (drawn in code instead of a photograph).",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"boutique alpine hotel: snow and larch wood, room-led, slow, booking-first\", detail full",
        took: "Picked marquee-hero with agency exemplars (standardvision-com, deathandcompany-com, generalcondition-com, bauhausclock-com, phantom-land), the marquee hero JSX, hero-fit and spacing guidance, and evidence that the genre leans grotesk-sans (a pull I chose to go against with a serif).",
      },
      {
        tool: "search_screens",
        args: "query \"boutique hotel mountain lodge rooms booking calm\", industry travel, limit 8, detail full",
        took: "lyfehotels-com, belmond-com, standardhotels-com, hopper-com, eurostar-com, explorajourneys-com, lyft-com, bird-co with fold autopsies; the two hotel screens became the primary references.",
      },
      {
        tool: "search_screens",
        args: "query \"luxury hospitality serif editorial photographic warm wood snow\", vibe luxe, paperBand light, limit 8, detail full",
        took: "loewe-com product page, mirazur-fr--en-reservation-html, gagosian-com, hypebeast-com article, detroit-paris, lyfehotels-com--about-us, belmond-com--hotels, louispoulsen-com--en-private-about-us-designers-poul-henningsen; confirmed light paper plus serif display for the luxe register.",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "name photographic, limit 6, detail full",
        took: "arts-ac-uk, audocph-com, basicagency-com, bbcearth-com, chloe-com, crackmagazine-net; audocph-com kept as a tone reference, the rest too image-dependent for a code-drawn page.",
      },
      {
        tool: "find_reference_components",
        args: "no filter",
        took: "Scan view of all 68 reference components; chose split-screen hero, per-use pricing, address footer and accordion faq to pull in full.",
      },
      {
        tool: "get_screen",
        args: "slug explorajourneys-com",
        took: "Full record: Shapiro italic display, sage nav, search bar composition, palette #8f936b / #c6c8b4.",
      },
      {
        tool: "get_screen",
        args: "slug lyfehotels-com",
        took: "Full record: booking strip signature, Branch serif display, gold accent on CTAs and dividers.",
      },
      {
        tool: "get_reference_jsx",
        args: "type hero, id split-screen",
        took: "Typography on one half, a pure-CSS atmospheric panel on the other, no image placeholder; the basis for the hero grid and the drawn snow-and-larch panel.",
      },
      {
        tool: "get_reference_jsx",
        args: "type pricing, id per-use",
        took: "Line-item pricing that reads as a menu; adapted into the season-by-room rate table with the explanatory column on the left.",
      },
      {
        tool: "get_reference_jsx",
        args: "type footer, id address",
        took: "Four-column business-card footer (find us, write, hours) with no social row; used almost as-is with a seasons column.",
      },
      {
        tool: "get_reference_jsx",
        args: "type faq, id accordion",
        took: "Native details/summary with typographic plus affordance and single-open behaviour; ported to vanilla JS.",
      },
      {
        tool: "compare",
        args: "slugs explorajourneys-com, lyfehotels-com, belmond-com--hotels, audocph-com",
        took: "Shared styles minimalism plus editorial, three to six type steps, spacing scales topping out at 76 to 175px, radius scales of 0 and 50; set the section rhythm and the pill buttons.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f4f3ef",
        from: "Page ground; a warm-leaning snow white so the larch does not look orange against a blue-white.",
      },
      {
        token: "--snow",
        hex: "#e6ebee",
        from: "Cool snow panel behind the hero drawing and the \"A day here\" band; the only cool surface, so the page reads snow against wood.",
      },
      {
        token: "--ink",
        hex: "#1f1d1a",
        from: "Headlines and body text; a brown-black rather than pure black, to sit with the timber.",
      },
      {
        token: "--muted",
        hex: "#6b655e",
        from: "Ledes, captions, table headers and metadata; warm grey that stays readable on both paper and white cards.",
      },
      {
        token: "--rule",
        hex: "#d9d4cc",
        from: "Every hairline: nav border, table rows, accordion rows, card borders; warm enough not to read as blue.",
      },
      {
        token: "--larch",
        hex: "#a9683c",
        from: "Larch wood mid tone; eyebrow rules, bullets, the dashed path on the map, hover state of the primary button and the wood pattern in the drawings.",
      },
      {
        token: "--larch-deep",
        hex: "#6e4024",
        from: "Deep end-grain brown; primary button fill, italic emphasis in headlines, room links and the window frames in the room cards, so every accent is literally wood.",
      },
    ],
    highlight: "The hero is the booking module. Following explorajourneys-com and lyfehotels-com, the form sits directly under a three-line serif headline instead of a marketing button, and it is live: choosing dates, a room and a guest count computes the stay from the same season table printed lower on the page, flags the festive five-night minimum and the closed thaw weeks, and refuses a third guest in a two-person room. The right half of the fold is a snow-and-larch scene drawn entirely in SVG (gradient sky, four ridge layers, a slatted larch house with lit windows) so the page ships with no photography yet still reads as a place, and the same drawing language repeats as the window in each room card and the larch house in the story section.",
  },
  {
    slug: "copo-torto",
    brand: "Copo Torto",
    tagline: "A natural wine bar in Graça, Lisbon, where tonight's list is chalked at six and erased as bottles run out.",
    prompt: "A natural wine bar in Lisbon: playful, hand-drawn, chalkboard, tonight's list.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 7.5,
    references: [
      {
        slug: "oliverjeffers-com",
        took: "The core move: a hand-lettered headline on a deep, dark ground with small chalk crosses scattered as stars. The hero art's twinkling crosses and the Caveat display face come straight from studying this fold.",
      },
      {
        slug: "netlify-com",
        took: "White line-art illustration sitting on a near-black ground next to a left-aligned headline and two pill CTAs. The bottle, glass and olives are drawn the same way: single chalk stroke, no fills except the wine.",
      },
      {
        slug: "drinkolipop-com",
        took: "Imperfect hand-drawn dots and a bouncy sentence-case display face; borrowed for the wobbly scribble underlines, the rotated pill hover and the tilted sticker-style price tags.",
      },
      {
        slug: "dinnerbyheston-com",
        took: "Dark typographic restaurant page with a thin rule and a ghost button; it set the register for the board frame, the dashed leader rules under each wine and the dashed ghost CTA.",
      },
      {
        slug: "benvenusa-com",
        took: "A wine importer that leads with a plain two-column list of regions. Its region-first thinking is why every row on the board names producer and region before anything else, and why the producers section is grouped by place.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief: \"A natural wine bar in Lisbon: playful, hand-drawn, chalkboard, tonight's list\", detail full",
        took: "Picked Feature Stack from SaaS pricing exemplars (llamaindex-ai, anytype-io--pricing, lookback-com--pricing, granola-ai--pricing, calendly-com--pricing); genre evidence said light paper, grotesk sans, which I decided to go against; the spacing guidance (96px median, padding-inline only) and the hero-fit rule were the useful part.",
      },
      {
        tool: "search_screens",
        args: "query \"wine bar restaurant playful hand-drawn menu\", industry food-beverage, limit 10, full",
        took: "chickfila-com, onyxcoffeelab-com, benvenusa-com, mirazur-fr, magicspoon-com, omsom-com, drinkolipop-com, oatly-com, deathandcompany-com, dinnerbyheston-com; gave the wine and restaurant register and two of the five references.",
      },
      {
        tool: "search_screens",
        args: "query \"handwritten playful illustrated brand\", displayClass handwritten, limit 8",
        took: "zero results; the archive has no handwritten display class rows.",
      },
      {
        tool: "search_screens",
        args: "query \"dark chalkboard playful illustrated\", style playful, paperBand dark, limit 8, full",
        took: "duolingo-com--plus, dropout-tv--about, stinkstudios-com, instrument-com, netlify-com, oliverjeffers-com--books-begin-again, basement-studio, copilot-money; surfaced the two strongest references (Jeffers and Netlify).",
      },
      {
        tool: "get_screen",
        args: "slug onyxcoffeelab-com",
        took: "Full record of the script-on-dark coffee page; confirmed the script headline on dark works but the photographic ground was not what I wanted.",
      },
      {
        tool: "find_similar",
        args: "slug oliverjeffers-com--books-begin-again, limit 8, full",
        took: "lotuscars-com--en-evija, etienne-studio--archive, hellomonday-com--product, gianlucagradogna-com, siena-film, vanschneider-com, contralabs-com, dinnerbyheston-com; mostly dark specimen pages, confirmed the Specimen-on-dark lineage and re-surfaced dinnerbyheston-com.",
      },
      {
        tool: "find_reference_components",
        args: "type hero",
        took: "Seven canonical hero shapes (documentary, manifesto, marquee, question, split-screen, stat-led, word-as-art); took the split-screen idea of typography on one half and a pure-CSS or SVG panel on the other.",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "Seven footer shapes; used the address-card archetype (postal, email, hours, no social icons) for the footer.",
      },
      {
        tool: "search_screens",
        args: "query \"menu list with prices, index of items, editorial list\", macrostructure catalogue, limit 6, full",
        took: "Only emigre-com; its each-card-sells-itself idea informed the producer cards but the grid was not right for a list.",
      },
      {
        tool: "find_components",
        args: "type nav, style playful, limit 6",
        took: "amazon-com, babbel-com, bird-co, bunny-net nav crops; confirmed the logo-left, links-right, single pill nav and nothing else.",
      },
      {
        tool: "compare",
        args: "slugs oliverjeffers-com--books-begin-again, netlify-com, drinkolipop-com, dinnerbyheston-com",
        took: "Type scale steps of 4 to 5, Netlify's 8 to 96 spacing scale and a radius scale that jumps from 0 to fully round; set the five-token scale and the pill radius.",
      },
      {
        tool: "get_design_system",
        args: "slug oliverjeffers-com--books-begin-again, live false",
        took: "Real tokens: a small tracked sans for labels against a large hand-drawn display, brand yellow #ff0 and pink; the lemon and rose accents on the board are a muted answer to those.",
      },
    ],
    palette: [
      {
        token: "--board",
        hex: "#1f2b25",
        from: "The chalkboard itself: a deep green-black rather than pure black so the chalk grain reads as slate and the rose accent stays warm against it.",
      },
      {
        token: "--board-2",
        hex: "#26342d",
        from: "Producer cards, the plates note and the map box; one step lighter so cards sit on the board like pinned paper.",
      },
      {
        token: "--chalk",
        hex: "#f2ebd9",
        from: "Headlines, wine names, the solid CTA fill and every line-art stroke; warm chalk rather than clinical white.",
      },
      {
        token: "--chalk-dim",
        hex: "#b6b0a0",
        from: "Producer and region lines, meta text, nav links at rest; reads as half-erased chalk and keeps hierarchy without a third face.",
      },
      {
        token: "--rose",
        hex: "#f0798f",
        from: "The wine in every glass, the scribble underlines, group headings and the CTA hover; the only saturated accent, and it is literally the product.",
      },
      {
        token: "--lemon",
        hex: "#f3d46b",
        from: "Glass prices, the sold-out tape and the map pin; a second chalk colour a bar would actually own, kept to numbers and stickers.",
      },
      {
        token: "--rule",
        hex: "#f2ebd947",
        from: "Dashed leader lines under each wine, the board frame and section rules; chalk at low opacity so rules feel drawn, not printed.",
      },
    ],
    highlight: "The board is the page. Instead of a hero followed by a features grid, the wine list is framed as an actual chalkboard: a double-bordered slate with tonight's date written in Caveat, five filter pills that tilt when pressed, dashed chalk leaders under every wine, and one red entry struck through with a lemon \"gone, sorry\" tape stuck over it at 21:40 yesterday. The hero's line-art bottle, glass and olives are drawn in a single chalk stroke with only the wine filled in rose, and the same stroke vocabulary carries into the house-rules icons and a sketched map of the Graça block, so the whole site reads as one hand holding one piece of chalk.",
  },
  {
    slug: "calder-frameworks",
    brand: "Calder Frameworks",
    tagline: "A Sheffield workshop building lugged, silver-brazed steel frames to the rider's own geometry chart.",
    prompt: "A steel bicycle frame builder: workshop, geometry-chart led, brazed lugs, made to measure.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 8.0,
    references: [
      {
        slug: "together-ai",
        took: "The hero drawing's annotation system: thin hairlines ending in tiny square markers that pin labels to specific regions of the form, treating the illustration as a technical diagram rather than decoration.",
      },
      {
        slug: "are-na",
        took: "The warm cream paper, quiet outlined cards, and the idea that the pricing area reads as a list with amounts right-aligned rather than a comparison of tiers.",
      },
      {
        slug: "anthropic-com",
        took: "Warm off-white ground, a single selective underline inside the headline instead of a colour change, and one dark charcoal card as the only tonal break on the page (used for the lead-time block).",
      },
      {
        slug: "teenageengineering-com",
        took: "The spec-sheet density: tiny technical labels, a title block in the corner of the drawing, values that read as data rather than marketing copy.",
      },
      {
        slug: "arweave-org",
        took: "Numbered, index-like hierarchy and the restraint of putting the accent on one active item only (carried into the size picker and the highlighted chart column).",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief: steel bicycle frame builder, workshop, geometry-chart led, brazed lugs, made to measure; detail full",
        took: "Picked Photographic with lucidmotors-com--company, tonal-com, isadeburgh-com, zora-co, ferrari-com as exemplars; evidence packet said the genre pulls to grotesk-sans display (75 percent), mid paper and warm accent; hero and spacing guidance.",
      },
      {
        tool: "search_screens",
        args: "query handmade workshop craft atelier made to measure, warm paper, technical drawing; paperBand light; limit 8; detail full",
        took: "nanorcollection-com, classcreator-io, zora-co, photoyoshi-com, platonphoto-com, together-ai, factory-ai, maxsiedentopf-com--about; together-ai's annotation lines were the find.",
      },
      {
        tool: "search_screens",
        args: "query specification table spec sheet technical product page engineering precision; macrostructure specimen; limit 6; detail full",
        took: "teenageengineering-com, kvs-services, fellowproducts-com, price-pierce-co-uk, arweave-org, render-com; spec-sheet density and the numbered index idea.",
      },
      {
        tool: "search_screens",
        args: "query bicycle cycling frame steel; limit 6; detail full",
        took: "rapha-cc, drams-framer-website, frame-com, frame-io, framer-com, freitag-ch; confirmed the cycling category leans on full-bleed photography, which this page deliberately replaces with a drawing.",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "name split-studio; limit 5; detail full",
        took: "anthropic-com, apple-com, are-na, area17-com, atomixnyc-com; settled the hero as a split with type left and a drawn panel right.",
      },
      {
        tool: "get_screen",
        args: "slug together-ai",
        took: "Full record with autopsy: square-marker annotation lines, accent kept out of the chrome and inside the illustration.",
      },
      {
        tool: "get_screen",
        args: "slug are-na",
        took: "Full record: cream #fcf4e4 paper, dark brown ink, outlined price cards with amounts flush right, no filled buttons.",
      },
      {
        tool: "compare",
        args: "slugs anthropic-com, are-na, teenageengineering-com, together-ai",
        took: "Shared register light and minimalism; anthropic-com five type steps and spacing scale up to 179; together-ai spacing steps 80 to 136, which set the section rhythm.",
      },
      {
        tool: "find_reference_components",
        args: "type pricing",
        took: "Seven archetypes; took the per-use line-item menu (name, note, amount) and the comparison table's thin rules with no zebra striping for the geometry chart.",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "Seven archetypes; took the address card (find us, write, hours, telephone) with a single colophon line beneath.",
      },
      {
        tool: "find_reference_components",
        args: "type hero; macro Split",
        took: "The split-screen hero: typography one half, a pure-CSS atmospheric panel the other, which became the drafting-grid panel holding the frame drawing.",
      },
      {
        tool: "find_components",
        args: "type faq; mode light; style editorial; limit 4",
        took: "buly1803-com, effectivealtruism-org, functionhealth-com, nike-com crops; used only to confirm a plain list of questions with a right-hand toggle glyph.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f3ede3",
        from: "Page ground; warm cream between anthropic-com's #f4ece4 and are-na's #fcf4e4 so the page reads as drawing paper rather than screen white.",
      },
      {
        token: "--paper-2",
        hex: "#e9e1d3",
        from: "The drafting panel, the lug figure and the map; one step darker so drawn elements sit in a tinted field.",
      },
      {
        token: "--ink",
        hex: "#1d1915",
        from: "Text, tube outlines, the dark lead-time card and the solid pill button; a warm near-black that keeps the brass and rust from clashing.",
      },
      {
        token: "--muted",
        hex: "#6f655a",
        from: "Meta lines, table headers, notes and annotation labels; the secondary voice of the spec sheet.",
      },
      {
        token: "--rule",
        hex: "#d5cbbc",
        from: "Every hairline, table rule and the 24 px drafting grid inside the hero panel.",
      },
      {
        token: "--accent",
        hex: "#b4471f",
        from: "Flux-rust used only where attention is earned: the head-angle value, the highlighted chart column, hover states and the workshop pin.",
      },
      {
        token: "--brass",
        hex: "#b57f49",
        from: "Lugs and shells in the drawings, the step numerals and the headline underline; the colour of the joint itself, lifted from anthropic-com's palette.",
      },
    ],
    highlight: "The hero is the geometry chart. The right half of the fold is a to-scale side drawing of the Ridgeway on a drafting grid, with wheelbase, head angle, seat tube, top tube, chainstay, drop and rake pinned by together-ai style hairline callouts, and a title block in the corner naming the sheet. Further down, the size picker above the six-column chart highlights a column and rewrites every value in the hero drawing at the same time, so the page's first image and its densest table are literally the same data; the copy sits between them and stays out of the way.",
  },
  {
    slug: "nordal-chair",
    brand: "Holmgren",
    tagline: "A Malmö workshop selling one solid oak dining chair that ships flat and bolts together in twelve minutes.",
    prompt: "A Scandinavian furniture maker's flat-pack oak chair: single-product page, exploded diagram, assembly steps.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "fermliving-com",
        took: "The only true single-product page in the furniture set: product name and price left, black full-width add-to-cart, accordion details, warm canvas ground (#f7f5ef in its own tokens). It gave the buy card its shape and the warm paper the page sits on.",
      },
      {
        slug: "artek-fi",
        took: "Scandinavian restraint: a lowercase wordmark, one chair as the whole hero, no shouting. It set the tone for the nav (wordmark, five plain links, one pill) and the decision to let a single drawing carry the fold.",
      },
      {
        slug: "teenageengineering-com",
        took: "Product floating in a void, tiny technical labels, \"reads like a specification sheet\". That register is why the hero is a measured side elevation rather than a lifestyle mood, and why dimensions get their own drawings with real ticks.",
      },
      {
        slug: "hermanmiller-com",
        took: "Sentence-case headline, ~3:1 display jump, black pill CTA, product-as-catalogue composition. Confirmed sentence case and pill buttons as the house convention for the category.",
      },
      {
        slug: "casper-com",
        took: "A furniture site that goes against the 63% grotesk gravity with a serif display over clean sans body. It licensed the Fraunces + IBM Plex Sans pairing.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief: Scandinavian flat-pack oak chair product page, detail full",
        took: "Feature Stack pick with SaaS exemplars (arrows-to, clay-com, puzzle-io, sourcegraph-com, dia-com); the useful part was the evidence packet: 63% grotesk display, mid/light paper, warm accent, plus the hero-fit and spacing guidance and the pricing table reference JSX.",
      },
      {
        tool: "search_screens",
        args: "query \"Scandinavian wooden furniture single product page chair oak\", industry furniture, limit 8, detail full",
        took: "artek-fi, branchfurniture-ca, hay-com, fermliving-com--products-muses-clio, casper-com, flos-com, gardinex-com, hermanmiller-com with fold autopsies and palettes.",
      },
      {
        tool: "search_screens",
        args: "query \"technical product page exploded diagram specifications dimensions\", macrostructure specimen, limit 6, detail full",
        took: "fellowproducts-com, kvs-services, price-pierce-co-uk, teenageengineering-com, render-com, arweave-org; Teenage Engineering was the one that fit.",
      },
      {
        tool: "find_components",
        args: "type hero, industry furniture, limit 8",
        took: "Hero crops for hermanmiller-com, branchfurniture-ca, floema-com, gardinex-com, parachutehome-com.",
      },
      {
        tool: "find_reference_components",
        args: "type hero, macro Split",
        took: "The split-screen hero JSX: typography one half, pure-CSS atmospheric panel the other, no image placeholder. The hero panel gradient is lifted from it.",
      },
      {
        tool: "get_screen",
        args: "slug fermliving-com--products-muses-clio",
        took: "Full record and hero capture: price under name, stepper, black add-to-cart, accordion, promo bar.",
      },
      {
        tool: "get_screen",
        args: "slug teenageengineering-com",
        took: "Full record: hardware centred in a gradient void, 8:1 scale jump, orange accent on a single dot.",
      },
      {
        tool: "get_screen",
        args: "slug artek-fi",
        took: "Full record: underscaled wordmark, chair-led photography, Futura-class geometric sans.",
      },
      {
        tool: "find_similar",
        args: "slug fermliving-com--products-muses-clio, limit 6",
        took: "snowpeak-com, marni-com--en-ca-new-in, cuyana-com--pages-about-us, maxsiedentopf-com, artek-fi--en-company-about, heatherwick-com--studio-about; confirmed the serif-display-over-sans-body pattern in warm ecommerce.",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "Seven footer archetypes; took the Address card (Ft8) and its \"no social icons\" note, plus the colophon-style bottom line.",
      },
      {
        tool: "compare",
        args: "artek-fi, fermliving-com--products-muses-clio, hermanmiller-com, teenageengineering-com",
        took: "Shared minimalism + swiss, radius scales of 0 / 4-5 / 50 (square panels, pill buttons), Ferm's 8 / 24 / 32 / 128 spacing scale, five-step type ramps.",
      },
      {
        tool: "get_design_system",
        args: "slug fermliving-com--products-muses-clio, live false",
        took: "Ferm's real CSS tokens: canvas #f7f5ef, cream #fffefa, light beige #dcd3cb, cognac #61451d, orange #ca8a55; type ramp 32 / 18 / 16 / 14.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f5f1e9",
        from: "Page ground, tuned a touch warmer than Ferm Living's #f7f5ef canvas so untreated oak still reads as the warmest thing on the page.",
      },
      {
        token: "--paper-deep",
        hex: "#ebe4d6",
        from: "Base of the hero panel gradient and the section-card contrast, one step down from paper like Ferm's light beige.",
      },
      {
        token: "--ink",
        hex: "#1f1a14",
        from: "Text, chair outlines, the primary pill; a brown-black rather than pure black so strokes on the drawings sit with the oak.",
      },
      {
        token: "--muted",
        hex: "#6b6259",
        from: "Meta labels, dimension lines, table headers; from the same brown family as ink at roughly 46 contrast.",
      },
      {
        token: "--rule",
        hex: "#d7cdbd",
        from: "Every hairline: nav, table rows, cards, the stat list; lifted from Ferm's parchment and light beige tokens.",
      },
      {
        token: "--accent",
        hex: "#b5482c",
        from: "One rust for the buy button, nav dot, callout bolts in the step figures and the \"new part\" highlight; sits between Artek's #b84450 and Ferm's #ca8a55 and is deployed nowhere else.",
      },
      {
        token: "--oak-base",
        hex: "#d6b384",
        from: "The timber itself, driving every SVG fill through --oak; swapped by data attributes to #8c6646 smoked oak and #e7dbc0 ash, then mixed by finish with color-mix.",
      },
    ],
    highlight: "The whole page is drawn from one set of SVG part definitions, a side elevation of the chair at one unit per millimetre. The hero shows it assembled and a single button pulls it apart with CSS transforms; the exploded section is the same parts translated and numbered; the dimension drawing reuses them with ticks and labels; the six assembly steps reuse them again with done / new / pending classes; and the timber and finish radios set data attributes on the body so every one of those drawings recolours at once and the price follows into the nav and buy card. It is a product page where the product is the diagram, which is the honest version of a flat-pack chair.",
  },
  {
    slug: "fieldsat",
    brand: "Overpass",
    tagline: "Satellite passes over your farm become a crop health map, a season timeline and an alert on your phone.",
    prompt: "A satellite imagery service for farmers: dark, field-map led, crop health index, seasonal timeline.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 7.5,
    references: [
      {
        slug: "unkey-com",
        took: "The dark, map-diagram exemplar: near-black ground with one lime accent and a diagram that bleeds behind the type. Gave the accent temperature (vegetation lime on charcoal) and the idea of the visual carrying the fold.",
      },
      {
        slug: "digitalocean-com",
        took: "Wireframe terrain with floating data points and a scale gauge along the edge, plus stat cards riding the bottom edge of the hero. Gave the readout overlays, the scale bar and the four-up proof strip directly under the fold.",
      },
      {
        slug: "dovetail-com",
        took: "45/55 copy-to-product split with the product panel vertically centred and sentence-case headline at ~72px. Gave the hero grid ratio and the left-anchored copy stack.",
      },
      {
        slug: "tinybird-co",
        took: "Data-proof card with a client name and one oversized green metric embedded in flowing copy. Gave the grower quote block with a three-up farm stats row underneath.",
      },
      {
        slug: "featurebase-app",
        took: "Dashboard mockup filling the lower half of a dark fold, two pills (white and dark). Confirmed the two-CTA pairing and the framed product card treatment.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief + mode dark, detail full",
        took: "Feature Stack pick, evidence packet (67% dark paper, 71% grotesk display, cool/other accent), five exemplars, pricing table JSX, hero and spacing guidance",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "map-diagram, limit 6, full",
        took: "Only two sites embody it (moderntreasury-com, unkey-com); unkey-com autopsy became the main dark reference",
      },
      {
        tool: "search_screens",
        args: "\"satellite earth observation data platform dark map dashboard technical\", paperBand dark, limit 8, full",
        took: "mage-ai, unkey-com, featurebase-app, diffusion-studio, digitalocean-com, dovetail-com, turso-tech, tinybird-co with autopsies",
      },
      {
        tool: "find_reference_components",
        args: "type hero",
        took: "Seven canonical hero shapes; split-screen (type one half, atmospheric panel the other) informed the copy-plus-map split",
      },
      {
        tool: "get_screen",
        args: "digitalocean-com",
        took: "Full record: terrain-as-hero signature, scale markers, stat cards overlapping the visual",
      },
      {
        tool: "get_screen",
        args: "unkey-com",
        took: "Full record: lime accent placement (hub nodes, primary pill), radius scale 0/2/6, spacing scale up to 200px",
      },
      {
        tool: "find_components",
        args: "type pricing, mode dark, limit 5",
        took: "artek-fi, astro-build, audius-co, audocph-com crops; none were true plan grids so I leaned on the reference JSX instead",
      },
      {
        tool: "search_screens",
        args: "\"agriculture farm land earth green data timeline\", accentHue chromatic-other, paperBand dark, limit 5",
        took: "mage-ai, modal-com, thoughtbot-com, turso-tech, resend-com; confirmed green-on-charcoal is a well-worn register and that the archive has no agriculture site, so the field map had to be invented",
      },
      {
        tool: "compare",
        args: "unkey-com, digitalocean-com, dovetail-com, tinybird-co",
        took: "Shared dark-mode minimalism, 5 to 6 type steps, section seams around 64 to 96px, radius 0 to 8px; used for the type scale count and the seam rhythm",
      },
      {
        tool: "get_reference_jsx",
        args: "pricing, three-card",
        took: "The plan trio with the featured tier raised by a thin accent rule instead of a badge; copied the structure and the middle-dot bullets",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#0b0e0b",
        from: "Page ground; near-black with a green cast so the map card does not read as a foreign object on a neutral black",
      },
      {
        token: "--panel",
        hex: "#121712",
        from: "Cards, timeline, plans and pipelines; one step up from paper so borders can stay faint",
      },
      {
        token: "--ink",
        hex: "#ecefe8",
        from: "Headlines and body; warm off-white rather than pure white to sit with the vegetation greens",
      },
      {
        token: "--muted",
        hex: "#98a295",
        from: "Secondary copy, mono readout keys, axis labels; green-grey so it belongs to the same family as the accent",
      },
      {
        token: "--accent",
        hex: "#b6f04a",
        from: "Vegetation lime: selected field outline, clear passes, the primary pill, the index value in the readout; it is the colour of a healthy canopy in the ramp",
      },
      {
        token: "--stress",
        hex: "#e6a23c",
        from: "Amber for the stress patch, alert passes and dropped fields; the one warm puncture, reserved for things that need walking",
      },
      {
        token: "--soil",
        hex: "#8a5a3c",
        from: "Bare-soil end of the vegetation ramp and the first index band swatch",
      },
    ],
    highlight: "The fold is a working field map rather than a picture of one. The selected field is drawn pixel by pixel in JavaScript from a smooth index surface with a headland drag along the road and a Gaussian stress patch in the south-east corner, clipped to the field polygon, so hovering any 10 m cell reads its NDVI into the readout card and flips the value amber when it falls under 0.45. The same colour ramp drives the legend, the index band cards and the season timeline, where fifty-four passes are plotted with cloudy ones hollow, last year dashed underneath and the June stress alert called out, so the story told in the fold is the same story told in the timeline and the pricing calculator further down.",
  },
  {
    slug: "storybook-game",
    brand: "Pennyfold",
    tagline: "A hand-painted puzzle game where you fold, turn and stitch a storybook town back into order.",
    prompt: "An indie studio's hand-painted puzzle game: storybook, whimsical, release date, wishlist-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "fly-io",
        took: "Gave the hero its shape: a painted band sweeping across the upper viewport with the headline nesting in the calm gap beneath it, a soft serif display with one italic word, and the type ramp ratio (120 / 48 / 19 / 16) that became the five tokens.",
      },
      {
        slug: "pi-ai",
        took: "Warm cream paper instead of white, the filled-plus-outline pill pairing for the two calls to action, and a row of rounded cards that bleeds off both edges, which became the chapters rail.",
      },
      {
        slug: "lookback-com",
        took: "The hand-drawn accent swoosh under the emphasised headline word and the small scattered stars around the headline, both redrawn in SVG.",
      },
      {
        slug: "ponpon-mania-com",
        took: "Permission to let a full-bleed painted scene carry the fold with a single centred pill; the lamplighter and lantern glow motif sit in that spirit.",
      },
      {
        slug: "kelseydake-com",
        took: "Dashed stitch borders framing tiles into a quilt; reused as the dashed outlines on the mechanic cards, the page card and the footer rule to echo the game's stitch verb.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief: hand-painted indie puzzle game, storybook, wishlist-led; detail full",
        took: "Picked Bento Grid with SaaS-heavy exemplars (brightful-me, hex-tech, ponpon-mania-com, canvasapp-com, cofounder-co), evidence packet (mid paper, warm accent at 33%), a bento features JSX and the hero and spacing guidance.",
      },
      {
        tool: "search_screens",
        args: "query indie game landing wishlist release date; industry gaming; limit 10; detail full",
        took: "itch-io, xbox-com, gog-com, epicgames-com, brightful-me, analogue-co, store-steampowered-com, twitch-tv, discord-com. Mostly dark storefronts; confirmed the genre gravity to push against and gave the warm beige of itch-io as a counterpoint.",
      },
      {
        tool: "search_screens",
        args: "query hand-drawn illustrated storybook whimsical painterly; style playful; limit 10; detail full",
        took: "kelseydake-com, duolingo-com, fly-io, oliverjeffers-com, buttondown-email, lookback-com, ethereum-org, doodles-app, lottiefiles-com, basecamp-com. This is where the build's composition came from.",
      },
      {
        tool: "get_screen",
        args: "slug ponpon-mania-com",
        took: "Full record and autopsy: full-bleed cartoon hero, no headline block, centred lowercase pill CTA, palette #fbac15 / #7c7cfb.",
      },
      {
        tool: "find_reference_components",
        args: "type hero",
        took: "Seven canonical hero JSX shapes (documentary, manifesto, marquee, question, split-screen, stat-led, word-as-art); took the italic-emphasis and marginalia habits, not a shape.",
      },
      {
        tool: "get_design_system",
        args: "slug fly-io; live false",
        took: "Type ramp (Mackinac 120px h1 at 0.95 line-height, 48px h2, 16px body), spacing scale 32 / 64 / 80 / 96, radius set up to 20px, palette roles.",
      },
      {
        tool: "find_components",
        args: "type cta; style playful; limit 6",
        took: "brilliant-org and bunny-net crops; the filled green pill beside an outlined pill confirmed the two-button pairing.",
      },
      {
        tool: "find_components",
        args: "type footer; vibe playful; limit 6",
        took: "Returned zero components, so the footer was composed from the page's own system.",
      },
      {
        tool: "find_similar",
        args: "slug fly-io; limit 6",
        took: "amazon-com, canva-com, pi-ai, ethereum-org, capacities-io, bird-co--about. pi-ai was the useful neighbour: cream paper and the edge-bleeding card row.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f3ecdf",
        from: "Page ground. Warm cream after pi-ai and itch-io rather than white, so the gouache shapes look painted on paper; a fractal-noise grain overlay sits on top at 16% multiply.",
      },
      {
        token: "--paper-2",
        hex: "#eae0cf",
        from: "Tile and card surfaces, the alternating mechanics section; one step deeper than the paper so cards read as cut sheets without borders.",
      },
      {
        token: "--ink",
        hex: "#2e2440",
        from: "Text, strokes, the lead bento tile. A plum-ink rather than black, following fly-io's #36265f, so type sits inside the painted world.",
      },
      {
        token: "--accent",
        hex: "#d9642b",
        from: "The one loud colour: wishlist buttons, the swoosh, the mechanic step numbers, apples in the orchard. Warm accent matches the genre evidence (33% warm) and reads as marmalade against the cream.",
      },
      {
        token: "--moss",
        hex: "#6f8f5a",
        from: "Hills in every scene and the green stroke motifs on the mechanic glyphs; the painted world's dominant pigment.",
      },
      {
        token: "--dusk",
        hex: "#b9a6cf",
        from: "Far hills and the muted meta text on the dark band; lavender air borrowed from fly-io's paper.",
      },
      {
        token: "--gold",
        hex: "#e9c46a",
        from: "Lantern light, the moon, hero stars, the folded page of hill; the storybook's light source and the only warm highlight allowed on the night band.",
      },
    ],
    highlight: "The standout move is treating the game's three verbs as the page's visual grammar. The hero art is a painted hillscape with one segment of hill literally folded over as a paper corner, dashed crease line and all, sitting in the band that fly-io taught me to sweep across the upper fold. The same dashed crease becomes the stitch border on the mechanic cards and the page card, the swoosh under \"Mend\" is the same hand-drawn stroke lookback uses, and every scene in the chapters rail, the story card and the studio avatars is drawn from a single tin of eleven pigments declared as tokens, so a page built with no screenshots still looks like one painter made it.",
  },
  {
    slug: "city-library",
    brand: "Larkspur Branch Library",
    tagline: "Halden's first new library in twenty-two years opens 3 October, and stays open until nine.",
    prompt: "A city library's new branch opening: civic, welcoming, events calendar, open late.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.0,
    references: [
      {
        slug: "thebroad-org",
        took: "The status line sitting beside the logo in the nav (\"Open Today at 11 am\") became the live opening countdown chip; the split hero with a solid colour panel on one side and the \"Plan your visit\" three-column info block shaped the fold and the getting-here section.",
      },
      {
        slug: "lacma-org",
        took: "One coral word (\"TICKETS\") as the only chromatic event in a monochrome page; that discipline is why the accent lands on a single phrase in each headline, the primary button and the lit windows, and nowhere else. Its top-ruled card rows became the opening-day timeline slots.",
      },
      {
        slug: "walkerart-org",
        took: "The arrowed index rows (Exhibitions, Performances, Screenings) and the \"closed today\" strip; the rooms list is that index shape with a number, a name, a sub-line and the floor, and the hours table borrows its row-per-item rhythm.",
      },
      {
        slug: "stedelijk-nl",
        took: "The dense what's-on list where every row is a full-width rule with a label, a title and a thumbnail; the October events calendar is that structure with the date as the big glyph instead of the title.",
      },
      {
        slug: "harvard-edu",
        took: "The asymmetric split with a big headline left and a short body block right over one shared ground; every section head on the page uses that two-column pairing.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"A city library's new branch opening: civic, welcoming, events calendar, open late\", mode light, detail full",
        took: "Picked Marquee Hero with feature-stack and specimen as runners-up; evidence over 24 sites: paper band mid 63%, grotesk-sans display 50%, warm accent 50%; exemplars wallpaper-com, newmuseum-org--about, openai-com, doodles-app, harvard-edu--about; the marquee hero JSX; hero-fit and 80-160px section rhythm guidance.",
      },
      {
        tool: "search_screens",
        args: "query \"public library civic institution events calendar opening hours welcoming\", industry culture, paperBand light, limit 8, detail full",
        took: "guggenheim-org--about-us, lacma-org, cooperhewitt-org--blog, louvre-fr--credits, stedelijk-nl, thebroad-org, walkerart-org, madmuseum-org--about with full autopsies; the nav status line, single-accent-word and index-row patterns came from here.",
      },
      {
        tool: "search_screens",
        args: "query \"community non-profit welcoming warm editorial with events programme and visiting information\", industry non-profit, mode light, limit 8, detail full",
        took: "propublica-org, ecologi-com, frontierclimate-com, effectivealtruism-org, dropdeadgenerous-org, ghost-org, signal-org; confirmed the warm off-white paper plus one coral element as the civic register.",
      },
      {
        tool: "get_screen",
        args: "slug harvard-edu--about",
        took: "Full autopsy: massive left headline balanced by a right body block over one background, crimson used only as a small marker; the section-head pairing on this page.",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "Seven footer archetypes with JSX; the Ft8 Address card (find us, write, hours, no social row) is the footer shape used, with a fourth column for the other branches.",
      },
      {
        tool: "compare",
        args: "thebroad-org, lacma-org, walkerart-org, stedelijk-nl",
        took: "Shared minimalism plus editorial in the light register; spacing scales of 15-100px and 12-48px, container widths 1170-1688px, radii 0-5px; set the 1180px container, 6px radius and the clamp(72px, 9vw, 128px) rhythm.",
      },
      {
        tool: "find_reference_components",
        args: "type hero",
        took: "Seven hero archetypes; the split-screen note (typography on one half, a pure CSS atmospheric panel on the other, no stock photo) is why the right half of the fold is a drawn SVG facade rather than a photo placeholder.",
      },
      {
        tool: "get_design_system",
        args: "slug thebroad-org, live false",
        took: "Type ramp (36px display at 0.83 leading, 14px body), spacing 15/20/40/65/80/100, container 1170px, radius 0/5/50; used as a sanity check for the four-step spacing and squared buttons.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f5f1e8",
        from: "Page ground; the warm off-white that propublica-org and effectivealtruism-org measured in the light band, warmer than white so the dusk panel reads as night rather than as a dark-mode block.",
      },
      {
        token: "--ink",
        hex: "#1b1915",
        from: "All body and display text, rules under the events list and the room index, hover fill on the outline button; a warm near-black rather than pure black to sit on the cream.",
      },
      {
        token: "--muted",
        hex: "#6a6459",
        from: "Secondary copy, meta labels, map street names; one step of contrast down so descriptions read as captions under the display names.",
      },
      {
        token: "--rule",
        hex: "#d9d2c4",
        from: "Every hairline: nav border, event rows, membership steps, footer; chosen to be visible on paper without becoming a grid.",
      },
      {
        token: "--card",
        hex: "#ece6d9",
        from: "The rooms and services section ground and the map panel; a half-step darker paper so those sections change register without a colour change.",
      },
      {
        token: "--accent",
        hex: "#cf3a1e",
        from: "The one chromatic word in each headline, the primary button, the rooftop sign, the library block on the map and the brand mark; a civic vermilion in the warm band the evidence measured, applied the way lacma-org applies its single coral word.",
      },
      {
        token: "--dusk",
        hex: "#1e2b45",
        from: "The hero panel sky, the hours section ground and the tram line on the map; the \"open late\" idea made into a surface, with --glow #F2C14E for the lit windows and the late-night hours so the two sections rhyme.",
      },
    ],
    highlight: "The fold and the hours section are the same argument told twice. The right half of the hero is a drawn SVG of the branch at 8:40 pm, every ground-floor bay lit in the glow colour with shelves and readers visible, under a small caption that says the lights stay on; the nav beside it carries a live chip that counts down to 3 October and, once the building is open, switches to \"Open now until 9 pm\" from the real hours table. Then the hours section repeats the dusk ground, sets the four late nights in the same glow, and marks today's row from the same script. The page never has to say \"we are the late library\" in a slogan; the colour system says it first, and the copy just confirms the times.",
  },
  {
    slug: "ramen-shop",
    brand: "Ichiwan",
    tagline: "A twelve-seat Sangenjaya ramen counter that has made one bowl of tantanmen, all day, since 2019.",
    prompt: "A Tokyo ramen shop with one dish: bold, red and cream, steam, one-page menu, queue times.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.0,
    references: [
      {
        slug: "outfit-hellohello-is",
        took: "Pure red type on a warm beige field with nothing else in the fold; gave the paper colour (#F3EADB is a warmer cousin of its #ece3db), the red-on-cream wordmark and the confidence to let the headline carry the hero.",
      },
      {
        slug: "chickfila-com",
        took: "Giant red italic serif headline on a bright ground with the food floating in open space, no container or shadow; the hero headline in Fraunces italic red and the bowl sitting on its own with no card come from here.",
      },
      {
        slug: "wagamama-com",
        took: "Lowercase sentence-case headline with terminal periods and one solid red pill as the only CTA; the \"One bowl. All day. Nothing else.\" cadence and the single red pill are lifted from its restraint.",
      },
      {
        slug: "tempo-fit",
        took: "A figure floating on a solid deep-red field; became the red disc behind the SVG bowl, which is what lets cream steam read against the cream page.",
      },
      {
        slug: "thebroad-org",
        took: "Crimson panel splitting the viewport against a pale ground; the full-bleed red add-ons panel between two cream sections is that move turned horizontal.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"A Tokyo ramen shop with one dish: bold, red and cream, steam, one-page menu, queue times\", detail full",
        took: "Picked Marquee Hero, exemplars bauhausclock-com, museumofmoney-com, mistral-ai, columbia-com, ritual-com; evidence said the genre sits on light paper (67%) with grotesk display; hero-fit and spacing guidance (96px median seam, padding-inline only on containers).",
      },
      {
        tool: "search_screens",
        args: "query \"restaurant single dish bold red menu food\", industry food-beverage, limit 8, detail full",
        took: "chickfila-com, grassrootscoop-com, wagamama-com, chipotle-com, mirazur-fr, oatly-com, dinnerbyheston-com, goodeggs-com with fold autopsies; wagamama and chickfila were the two worth keeping.",
      },
      {
        tool: "get_screen",
        args: "wagamama-com",
        took: "Full record: #e12e26 red accent on the CTA only, lowercase headline with periods, 5-step type scale, 24/32/48/64 spacing.",
      },
      {
        tool: "get_screen",
        args: "chickfila-com",
        took: "Full record: #d40c24 red headline and buttons on white, italic serif display, food floating on a void.",
      },
      {
        tool: "find_by_color",
        args: "hex #c8102e, limit 10, detail full",
        took: "tempo-fit, raycast-com, qdrant-tech, together-ai, alinapapazova-framer-ai, crackmagazine-net, thedesignersfoundry-com, chickfila-com, thebroad-org, metmuseum-org; confirmed the red family and gave tempo-fit's red field and thebroad-org's crimson panel.",
      },
      {
        tool: "find_reference_components",
        args: "type hero",
        took: "Seven archetypes (documentary, manifesto, marquee, question, split-screen, stat-led, word-as-art); took the marquee's \"one thought set big\" and the split-screen's type-on-one-half, visual-on-the-other.",
      },
      {
        tool: "find_reference_components",
        args: "type pricing",
        took: "per-use line items (grid of name, note, price with hairline rules) became the toppings and add-on lists; single-plan reinforced \"the page is the menu\".",
      },
      {
        tool: "find_reference_components",
        args: "type stat",
        took: "bar-chart reference (pure CSS bars, figure as a typographic label, no chart library) became the queue-by-hour chart.",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "address card (hours, postal, no social row) shaped the hours and address section; statement footer (one big sentence, quiet sign-off) shaped the footer.",
      },
      {
        tool: "search_screens",
        args: "query \"bold red and cream typographic specimen single product\", macrostructure specimen, accentHue warm, limit 8, detail full",
        took: "brandappart-com, fellowproducts-com, idyllic-co-nz, houseindustries-com, ecal-ch, parsons-edu, outfit-hellohello-is, jhey-dev; outfit-hellohello-is was the find.",
      },
      {
        tool: "compare",
        args: "wagamama-com, chickfila-com, outfit-hellohello-is, tempo-fit",
        took: "Shared only minimalism; three of four use a 5-step type scale and radius 0 or full pill, which settled the five-token scale and the pill-only radius language.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f3eadb",
        from: "Page ground. Warmer than outfit-hellohello-is's #ece3db so the sesame broth and the cream bowl still read as a step lighter than the page.",
      },
      {
        token: "--cream",
        hex: "#fbf6ec",
        from: "Bowl ceramic, steam, button text on red, the map card. The second half of \"red and cream\".",
      },
      {
        token: "--ink",
        hex: "#1a1412",
        from: "Body text, chart bars, the toggle. A warm near-black so hairlines and bars do not go cold against the paper.",
      },
      {
        token: "--muted",
        hex: "#6e625a",
        from: "Eyebrows, notes under menu lines, chart labels. Brown-grey rather than neutral grey to stay in the same warm family.",
      },
      {
        token: "--red",
        hex: "#d4211f",
        from: "The one accent: wordmark, headline, disc behind the bowl, chili oil, CTA pill, add-ons panel, the \"now\" bar. Sits between wagamama's #e12e26 and chickfila's #d40c24.",
      },
      {
        token: "--red-deep",
        hex: "#8e0f14",
        from: "Bowl foot, disc edge, panel gradient end, CTA hover. Taken from tempo-fit's #890416 so the red has depth instead of one flat value.",
      },
    ],
    highlight: "The bowl is the design. It is drawn entirely in SVG (cream ceramic with a red band, sesame broth, chili-oil crescent, mince, bok choy, egg, chopsticks) and sits on a deep-red disc borrowed from tempo-fit's red field, which solves the brief's steam problem: cream steam would vanish on a cream page, but over the red disc three blurred, gradient-faded strokes rise and fade on a staggered loop and read as steam from across the room. The same six ingredient colours then reappear as swatches beside each line of the menu, so the menu reads as a key to the drawing, and the queue chart's red \"now\" bar is fed by the same live clock that writes the wait time into the nav pill.",
  },
  {
    slug: "payroll-saas",
    brand: "Backhouse",
    tagline: "Restaurant payroll that pulls in shifts and tips, applies state wage rules, and pays on Friday.",
    prompt: "A payroll platform for restaurants: clean SaaS, product-UI led, calm, trustworthy.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "amie-so",
        took: "The product screen carries the fold: a real, dense app interface (sidebar, header, table) as the hero visual rather than an illustration. Backhouse's pay run screen follows that density and its blue-pill primary button sits next to a white secondary the same way.",
      },
      {
        slug: "coinbase-com",
        took: "The phone nested inside an oversized rounded color field, two concentric radii, device bleeding out of its own tinted panel. The pay run screen sits inside a soft green field with 28px inset and bleeds off the panel's right and bottom edges.",
      },
      {
        slug: "todoist-com",
        took: "Left text column at roughly 40% with the product UI vertically centered on the right, plus the soft radial vignette behind the screenshot instead of a hard drop shadow. The hero grid split and the radial tint in the screen field come from here.",
      },
      {
        slug: "moderntreasury-com",
        took: "Warm off-white paper, near-black text, muted teal accent used sparingly on tags, sentence case throughout, calm authority. Set the paper, accent temperature and the restraint of the type ramp.",
      },
      {
        slug: "cleanshot-com",
        took: "Dual-action hero CTA where the filled accent pill and the white bordered pill share a row without equal weight; also the single-accent discipline where only primary actions and one badge carry the brand color.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"A payroll platform for restaurants: clean SaaS, product-UI led, calm, trustworthy\", mode light, vibe calm",
        took: "Feature Stack pick (6 of top hits), evidence: 92% light paper, 83% grotesk sans, accent hue leaning green/teal; exemplars mailchimp-com, cleanshot-com, supabase-com, arrows-to, everlaw-com; comparison-table pricing JSX; hero and spacing guidance",
      },
      {
        tool: "search_screens",
        args: "query \"payroll HR fintech product dashboard hero screenshot calm trustworthy\", industry fintech, paperBand light, limit 8, detail full",
        took: "public-com, forestadmin-com, polar-sh, moderntreasury-com, coinbase-com, rainbow-me, n26-com--de-de-blog-alle, gusto-com with fold autopsies; coinbase's nested device and moderntreasury's warm paper were the takeaways",
      },
      {
        tool: "find_components",
        args: "type pricing, industry saas, mode light, vibe calm, limit 6",
        took: "pricing crops from amie-so, bear-app, frame-com; surfaced amie-so as a product-UI-led hero worth pulling in full",
      },
      {
        tool: "find_reference_components",
        args: "type hero",
        took: "seven canonical hero shapes (documentary, manifesto, marquee, question, split-screen, stat-led, word-as-art); read for the split-screen tinted-panel idea, none copied directly",
      },
      {
        tool: "get_screen",
        args: "slug amie-so",
        took: "full record and autopsy: headline in upper quarter, app screenshot dominating the lower two thirds, Inter, single blue accent on pills",
      },
      {
        tool: "search_screens",
        args: "query \"SaaS landing with product dashboard screenshot as hero, table UI, clean sans, trustworthy\", industry saas, paperBand light, macrostructure feature-stack, limit 8, detail full",
        took: "cleanshot-com, trello-com, hey-com, dovetail-com--product-development-wireframing, todoist-com, basecamp-com, ghost-org--about, clay-com; todoist's 40/55 split and vignette confirmed the hero grid",
      },
      {
        tool: "get_reference_jsx",
        args: "type pricing, id three-card",
        took: "the three-card tier layout with one plan raised by a thin accent top rule and no \"most popular\" badge; used for the Full service tier",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "seven footer archetypes; note that the four-column sitemap is the most templated shape, so the footer here keeps a brand statement column plus three short lists and a single sign-off bar",
      },
      {
        tool: "compare",
        args: "slugs amie-so, cleanshot-com, todoist-com, moderntreasury-com",
        took: "shared minimalism and light register; five-step type scales on three of four; radius scales topping out at 12 to 16px on the product-led sites, which set the 16px card radius",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f6f5f1",
        from: "Page ground. Warm off-white rather than pure white, following moderntreasury-com and mailchimp-com, so the white product screen and cards lift off the page without shadows doing all the work",
      },
      {
        token: "--ink",
        hex: "#16201b",
        from: "All headings and body text; a green-black rather than neutral black so it sits with the accent",
      },
      {
        token: "--muted",
        hex: "#5c6862",
        from: "Supporting copy, table headers, captions and footer links; one step lighter than ink so hierarchy comes from tone, not size",
      },
      {
        token: "--rule",
        hex: "#e2e0d9",
        from: "Every hairline: card borders, table rows, section seams, footer bar; warm gray so rules do not read as blue on the warm paper",
      },
      {
        token: "--accent",
        hex: "#1b6b52",
        from: "Deep green for primary buttons, eyebrows, the active sidebar item, check marks, the pricing tier rule and the CTA band; green because the category evidence leans green/teal and it reads as money and calm rather than alarm",
      },
      {
        token: "--accent-soft",
        hex: "#e3efe8",
        from: "Tinted surfaces: the hero screen field, the total-to-fund card, active states and paid tags; lets the accent appear as a surface without adding a second hue",
      },
      {
        token: "--tip",
        hex: "#b8791f",
        from: "Amber reserved for tip amounts in the pay run and the bartender share of the tip pool; the one warm note, so tips are visually separable from wages everywhere they appear",
      },
    ],
    highlight: "The standout move is treating the pay run itself as the hero, drawn in HTML with numbers that add up. Five real staff, hours that sum to 335.0, overtime flagged in amber, tips totalling $4,304.95 and a total-to-fund card that equals gross plus employer taxes, all inside a white screen nested in a soft green field that it bleeds out of on two sides, the way coinbase-com nests its phone. The same amber tip color, green check marks and paid tags then reappear in the three feature demos below, so the page reads as one product rather than a landing page with a screenshot pasted in.",
  },
  {
    slug: "tattoo-studio",
    brand: "Sable Tattoo",
    tagline: "A black ink only tattoo studio in Bristol with four chairs, a flash wall and booking by artist.",
    prompt: "A tattoo studio with four artists: black ink, flash-sheet led, booking by artist.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 7.5,
    references: [
      {
        slug: "nbstudio-co-uk",
        took: "The hero composition: text floating high-left on a black void, with imagery bleeding edge to edge along the bottom of the fold like a shelf. Sable's shelf is a row of line-art flash with prices, the wall the studio is built around.",
      },
      {
        slug: "ohnotype-co",
        took: "White line art on a near-black panel, bare arrow-style links instead of chrome, and radius zero throughout. This is the flash sheet: eight tiles of 1.7px white strokes on #0b0b0b, borders as hairlines, no rounding anywhere.",
      },
      {
        slug: "furoweb-eu",
        took: "A single italic serif word in warm red interrupting an otherwise grey-on-black page. Sable does this twice: \"Walk in\" in the headline and \"So does a good tattoo.\" in the footer statement, and nowhere else in the copy.",
      },
      {
        slug: "xlrecordings-com",
        took: "The red ticker pinned under the hero. Here it carries the studio's house rules (walk-in days, deposit terms, black ink only, bring identification) as a moving strip in sentence case.",
      },
      {
        slug: "emigre-com",
        took: "The catalogue idea that the product is the visual: each flash tile is only the drawing, its name, its size and its price, with the artist's first name as the sole label.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"A tattoo studio with four artists: black ink, flash-sheet led, booking by artist.\", detail full",
        took: "Split Studio pick with the split-screen hero JSX; evidence packet: 54% dark paper band, 58% grotesk-sans display, warm accents on a third of the set. Exemplars animaapp-com, furoweb-eu, gallery-it, drams-framer-website, dropout-tv--about. Took the dark band and the furoweb italic-accent move, took a position against the grotesk consensus with a serif display.",
      },
      {
        tool: "search_screens",
        args: "query \"tattoo studio artists black ink flash sheet\", limit 8",
        took: "nbstudio-co-uk (black void plus bottom shelf), stinkstudios-com, inkfishnyc-com, furoweb-eu, hodinkee-com, archigreendesigns-com, generalcondition-com, designstudio-com. nbstudio gave the fold.",
      },
      {
        tool: "search_screens",
        args: "query \"monochrome studio roster of people, index list with availability, raw editorial\", macrostructure index-first, limit 6",
        took: "adcker-com, perplexity-ai, minimal-so, humaan-com. adcker's typographic index with small flanking labels informed the roster rows (number, name, style, availability, link).",
      },
      {
        tool: "search_screens",
        args: "query \"catalogue grid of line drawings with prices, sparse black and white, print-like\", macrostructure catalogue, limit 6",
        took: "emigre-com only. Product-as-visual tiles for the flash sheet.",
      },
      {
        tool: "search_screens",
        args: "query \"raw brutalist black and white studio with heavy rules and mono details\", vibe raw, color monochrome, limit 6",
        took: "davidzwirner-com, beauxartsparis-fr, maharishistore-com, norrona-com, xlrecordings-com, ohnotype-co. ohnotype gave the flash sheet treatment; xlrecordings gave the ticker; davidzwirner's framed-object hairlines informed the tile borders.",
      },
      {
        tool: "get_screen",
        args: "slug ohnotype-co",
        took: "Full record: palette #424242 / #bcbcbc / #7f7f7f, Covik Sans plus Vulf Mono, portfolio-grid, radius 0, spacing scale 8/16/32/64/128. Confirmed the hairline-and-black-panel language.",
      },
      {
        tool: "get_screen",
        args: "slug nbstudio-co-uk",
        took: "Full record: #000000 field, white type, accent only inside the imagery, scale jump only 1.5:1 display to body. Confirmed the restrained hero with the shelf carrying the visual weight.",
      },
      {
        tool: "compare",
        args: "slugs furoweb-eu, ohnotype-co, nbstudio-co-uk, emigre-com",
        took: "Shared style: minimalism only; radius scales all start at 0; furoweb has 5 type steps and a 1440 container; ohnotype 1248 container. Settled on radius 0, a 1240px container and a five-token type scale.",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "Seven archetypes. Used the Address card (find us, write, hours) merged with the Statement (one big sentence, one quiet sign-off) and a colophon line.",
      },
      {
        tool: "find_reference_components",
        args: "type faq",
        took: "Seven archetypes. Used Two-column open (question left, answer right, all visible) for aftercare, since the answers are the meat, and the Numbered list shape for the four booking steps.",
      },
      {
        tool: "find_reference_components",
        args: "type pricing",
        took: "Seven archetypes. Used Per-use line items for the deposits and rates: a menu of six rows with a rate on the right, not tiered cards.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#101010",
        from: "Page ground. Near-black rather than pure black so the #0b0b0b flash tiles and the map read as darker objects sitting on it, the nbstudio void without the crushed feel.",
      },
      {
        token: "--panel",
        hex: "#171716",
        from: "Booking form ground and the roster row hover. One step up from paper, warm-leaning so it does not read blue.",
      },
      {
        token: "--ink",
        hex: "#ebe8e0",
        from: "Type, stroke colour of every flash drawing, the solid button fill. Warm off-white, the tone of paper flash sheets, taken from furoweb's #d4ccd4 direction but lifted for contrast.",
      },
      {
        token: "--muted",
        hex: "#8c8a82",
        from: "Meta labels, supporting copy, aftercare answers, shelf price labels. Warm grey so hierarchy comes from value, not hue.",
      },
      {
        token: "--rule",
        hex: "#2b2a27",
        from: "Every hairline: nav, section seams, roster rows, tile grid gaps, hours table, form borders. Low enough to structure without striping.",
      },
      {
        token: "--accent",
        hex: "#c9361f",
        from: "The only colour. Italic headline word, footer statement, ticker background, walk-in availability dot, the \"today\" row in hours, the map marker, hover state on tiles and buttons, form focus ring. A warm red in the furoweb #b42e04 family, chosen because it reads as tattoo red against black ink.",
      },
      {
        token: "--accent-ink",
        hex: "#ffffff",
        from: "Text on the red ticker and the solid button hover, where off-white would look dirty on saturated red.",
      },
    ],
    highlight: "The fold is built like a shop: type high-left on the black void, and along the bottom edge a shelf of the actual flash, eight line drawings with prices bleeding across the full width, so a visitor sees the product before they scroll. The same eight SVG symbols are defined once and reused in the sheet below, where the filter buttons narrow them by artist and the \"Book this piece\" overlay pre-fills the booking form with the artist, the design name and its size, then the form's live line quotes that artist's next opening and deposit. Booking by artist is not a claim in the copy; it is what every link on the page actually does.",
  },
  {
    slug: "riso-studio",
    brand: "Blotter Press",
    tagline: "A two-colour risograph studio in Glasgow with a flat price list you can read across.",
    prompt: "A risograph print studio: grainy two-colour overprint, playful, price-list led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "emigre-com",
        took: "The catalogue of solid-colour tiles, each block carrying its own name in its own face, became the ink shelf: twelve flat swatches with grain on top, the product speaking for itself.",
      },
      {
        slug: "gumroad-com",
        took: "Typographic centre with playful objects framing the edges; I kept the type as the anchor and let the overprint shapes and doodle sit in a tilted poster beside it instead of scattering them.",
      },
      {
        slug: "generalcondition-com",
        took: "Loud single-hue display plus thick-outline doodle creatures; gave the page its nerve, the hand-drawn face on the hero poster, and the hard 2px ink rules that box every section.",
      },
      {
        slug: "brilliant-org",
        took: "Heavy display type with decorative fragments threaded through it; the misregistered pink shadow on the headline is the riso version of that \"the graphic lives in the same space as the type\" move.",
      },
      {
        slug: "oliverjeffers-com",
        took: "Warm aged paper texture and the raw ink-on-paper feel with no accent colour deployed in the hero; the uncoated paper tone and grain overlay come from this.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"A risograph print studio: grainy two-colour overprint, playful, price-list led\", detail full",
        took: "Picked Marquee Hero, exemplars generalcondition-com, fromanother-love, wallpaper-com, doodles-app, columbia-com; evidence said grotesk-sans 67% consensus, mid paper band; marquee hero JSX; hero and spacing guidance",
      },
      {
        tool: "search_screens",
        args: "query \"playful print studio, bold flat colour, grainy, two-colour poster feel\", style playful, paperBand light, limit 8, detail full",
        took: "oliverjeffers-com--art, gusto-com, kentcdodds-com, brilliant-org, gumroad-com, buttondown-email, chickfila-com, columbia-com--p-mens-redmond-shoe-1553631-html with fold autopsies",
      },
      {
        tool: "find_components",
        args: "type pricing, style playful, limit 8",
        took: "Pricing crops from babbel-com, fal-ai, fly-io, headspace-com, kentcdodds-com, lego-com, netlify-com; none were price-list shaped, which pushed me toward the reference JSX instead",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "name catalogue, limit 6, detail full",
        took: "Only emigre-com in the archive (thin coverage), but its colour-tile grid was exactly the swatch shelf I needed",
      },
      {
        tool: "find_reference_components",
        args: "type pricing",
        took: "Seven canonical JSX shapes; the per-use \"line items\" and the comparison table (thin rules, no zebra striping, hover lift) shaped the size-by-quantity table",
      },
      {
        tool: "get_screen",
        args: "slug emigre-com",
        took: "Full record: white ground, black nav, solid tiles in orange, plum, pink, olive; confirmed the tile-with-name pattern and the 2px rule language",
      },
      {
        tool: "get_screen",
        args: "slug gumroad-com",
        took: "Full record: warm off-white paper #e4c6c8, pink #fb93eb on objects only, black pill buttons; borrowed the black pill CTAs and the paper-plus-one-hot-colour balance",
      },
      {
        tool: "search_screens",
        args: "query \"poster print shop, screen print, flat ink colours, editorial price list\", vibe raw, limit 6, detail full",
        took: "stinkstudios-com, inkfishnyc-com, posterco-tv, maharishistore-com, inkandswitch-com, norrona-com; mostly dark agency sites, only stinkstudios' cut-paper collage energy was useful",
      },
      {
        tool: "compare",
        args: "slugs emigre-com, gumroad-com, generalcondition-com, brilliant-org",
        took: "Four different macrostructures, no shared register; confirmed a 5-step type scale is normal for these sites and that radius is either 0 or full pill, nothing in between",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f3eee2",
        from: "Page ground; a warm uncoated Munken-style stock rather than white, so flat inks read as printed not rendered",
      },
      {
        token: "--ink",
        hex: "#1f1b1a",
        from: "Text, 2px rules, pill fills, the turnaround band; a warm near-black because riso black ink is never truly neutral",
      },
      {
        token: "--blue",
        hex: "#0078bf",
        from: "First house drum: kickers, price highlights, the \"good at\" header, the big hero circle; the classic riso blue",
      },
      {
        token: "--pink",
        hex: "#ff48b0",
        from: "Second house drum: misregistered headline shadow, rush lane, poster slab, kicker dash; fluorescent pink is the colour people come to riso for",
      },
      {
        token: "--yellow",
        hex: "#ffe800",
        from: "Third drum used sparingly: outline-button hover, \"bad at\" header, timeline dots; keeps the page from being a two-colour cliche without adding a fourth hue",
      },
      {
        token: "--muted",
        hex: "#6d645f",
        from: "Secondary copy and mono metadata; a brown-grey so it looks like a 40% tint of the ink, not a screen grey",
      },
      {
        token: "--rule",
        hex: "#cfc6b4",
        from: "Hairline table and list rules; a tint of the paper so the 2px ink rules stay the loud ones",
      },
    ],
    highlight: "The overprint is real, not illustrated. Every coloured surface is a flat CSS fill with an SVG feTurbulence grain multiplied over it, the hero headline carries a pink copy of itself printed four pixels off register through mix-blend-mode: multiply, and the ink section has a working mixer: pick any two of the twelve swatches and two grained circles overlap with multiply blending while a small script computes the actual overprint hex, so the page teaches the one thing riso customers never understand (two drums make three colours) by doing it in front of them.",
  },
  {
    slug: "mountain-rescue",
    brand: "Harrowdale Mountain Rescue Team",
    tagline: "Thirty-eight unpaid volunteers covering 420 square kilometres of fell, funded entirely by donations.",
    prompt: "A mountain rescue volunteer team: serious, high-visibility orange, callout log, donation-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "instituteofhealth-com",
        took: "The hero's stat sidebar is lifted from here: big numerals on the right, each with a hairline rule, sitting beside a flush-left sentence-case headline. Also the model for tabular numerals and a single grotesk family doing display and body.",
      },
      {
        slug: "propublica-org",
        took: "The one-coral-element rule. Orange lands on exactly one nav element (Donate) against a monochrome warm-grey page, and the newsletter bar idea became the full-bleed donate band lower down.",
      },
      {
        slug: "cloudflare-com",
        took: "Evidence that a saturated orange field can carry a whole section with white type and a white pill on top. The donate section is a Cloudflare band: orange paper, white text, paper-coloured button.",
      },
      {
        slug: "mux-com",
        took: "Warm grey paper (#d5d0c0 there, lightened here) with near-black ink and one vivid orange, plus mono for utility text only. Set the paper and the mono-for-metadata discipline for the nav, log and footnotes.",
      },
      {
        slug: "arweave-org",
        took: "Orange used purely as an index marker on numbered items; the numbered steps in \"how to call for help\", the footnote superscripts and the module numbers follow that pattern, with everything else in ink.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"A mountain rescue volunteer team: serious, high-visibility orange, callout log, donation-led.\", detail full",
        took: "Picked Marquee Hero; exemplars cloudflare-com, 11x-com, gatesnotes-com, ritual-com, fromanother-love; evidence of grotesk-sans display at 75%, mid/light paper split, warm accent as a live option; hero-in-fold and 96px seam guidance.",
      },
      {
        tool: "search_screens",
        args: "query \"non-profit donation charity serious stat-led figures\", industry non-profit, limit 8, detail full",
        took: "effectivealtruism-org, participantinc-org, ghost-org, siena-film, propublica-org, frontierclimate-com, dropdeadgenerous-org, signal-org; propublica-org's single Donate puncture was the takeaway.",
      },
      {
        tool: "search_screens",
        args: "query \"high-visibility orange accent serious technical log table dark\", macrostructure stat-led, limit 8, detail full",
        took: "digitalocean-com--blog, reactsummit-com, tinybird-co, instituteofhealth-com; instituteofhealth-com's numeral sidebar became the hero's right column.",
      },
      {
        tool: "find_by_color",
        args: "hex #ff5a00, limit 8, detail full",
        took: "brex-com, drams-framer-website, cloudflare-com, substack-com, typotheque-com, mux-com, arweave-org, brightful-me; confirmed warm-grey paper plus #fc5c04-ish orange as a working family and gave mux-com and arweave-org.",
      },
      {
        tool: "find_reference_components",
        args: "type stat",
        took: "annotated, bar-chart, before-after, grid, row, single-hero; the year-to-date section is the annotated 3x2 grid with footnotes plus the pure-CSS bar chart, and the 999 block is the single-hero stat idea.",
      },
      {
        tool: "get_screen",
        args: "slug instituteofhealth-com",
        took: "Full autopsy of the stat sidebar with rules between numerals and the sentence-case headline in the lower left.",
      },
      {
        tool: "get_screen",
        args: "slug propublica-org",
        took: "Autopsy confirming accent on the Donate pill only, warm off-white paper, rigid left gutter.",
      },
      {
        tool: "get_screen",
        args: "slug mux-com",
        took: "Autopsy of the warm grey paper, orange primary pill, mono reserved for utility text.",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "address, colophon, list, long-copy, newsletter, sitemap, statement; the footer is the Ft8 address card (base, write, team, money) with no social row.",
      },
      {
        tool: "find_reference_components",
        args: "type nav",
        took: "breadcrumb, floating-pill, inline, marginal, mega, off-canvas, search-first; the nav is N1 inline minimal with a mono link row and a tighter utility cluster on the right.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#e9e5dc",
        from: "Page ground. Warm stone grey between mux-com's #d5d0c0 and propublica-org's off-white, light enough for body text at 16px.",
      },
      {
        token: "--ink",
        hex: "#16150f",
        from: "Headlines, body, rules that need weight, the intake box and the road on the map. Warm near-black so it does not go blue against the paper.",
      },
      {
        token: "--muted",
        hex: "#6a665c",
        from: "Mono metadata, supporting paragraphs, footnotes and map labels. Contrast stays above 4.5:1 on the paper.",
      },
      {
        token: "--rule",
        hex: "#c6c0b1",
        from: "Hairlines in the stat grids, table rows, legend boxes and the map grid. Visible but never competing with ink.",
      },
      {
        token: "--orange",
        hex: "#ff5a00",
        from: "The high-visibility orange. Nav Donate pill, hero eyebrow tick, callout dots and patch boundary on the map, and the full donate band. Deliberately rationed so the band lands hard.",
      },
      {
        token: "--orange-deep",
        hex: "#b83c00",
        from: "Orange for text on light paper (footnote numbers, step numbers, hover states) where #FF5A00 would fail contrast.",
      },
      {
        token: "--night",
        hex: "#1c1b18",
        from: "The callout log band. A warm black so the log reads as an operations board rather than a dark-mode switch.",
      },
    ],
    highlight: "The callout log is the page's centre of gravity: a warm-black band directly under the fold where eight real incidents sit in a table with mono dates, durations and team counts, orange only on the callout number and on the \"air\" tag for helicopter lifts. It is the thing a mountain rescue team actually has that nobody else does, and the donate section that follows converts it, with eight fixed amounts each naming the exact piece of kit it buys and a live panel that rewrites itself as you pick, including a monthly mode that multiplies the figure out to what the team can plan around.",
  },
  {
    slug: "house-listing",
    brand: "Sedge & Hollis",
    tagline: "A single-property listing for Larch House, an architect-designed timber house for sale in Wivenhoe.",
    prompt: "An architect-designed house for sale: listing-led, floorplan, quiet, one property.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "snohetta-com",
        took: "The fold shape: a left-aligned sentence-case headline with the visual as a captioned strip beneath it, not a background. The strip here is a drawn south elevation with the caption pair below, exactly where Snøhetta puts \"Aura / Viabizzuno\".",
      },
      {
        slug: "big-dk",
        took: "Text-left, image-right rows in a quiet 12-column grid, small type, no hero shouting. Section 01 (facts list beside the section drawing) and section 05 (copy beside the map) follow that split.",
      },
      {
        slug: "heatherwick-com",
        took: "The serif-for-captions warmth and the pale muted green in its palette. Newsreader for display and room labels comes from that Plantin caption feeling; the sage plan and water fill is its #d6db9d cooled down.",
      },
      {
        slug: "kkaa-co-jp",
        took: "Vast whitespace with small scattered text and a map as the only visual anchor. The location section repeats that: an address block and a distance list on the left, a sketch map anchoring the right.",
      },
      {
        slug: "floema-com",
        took: "The warm off-white paper (#f5f2ed) with a terracotta accent used sparingly on one word and one ring. The paper token and the restraint on the accent come from here.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"An architect-designed house for sale: listing-led, floorplan, quiet, one property\", detail full",
        took: "picked bento-grid with houseofhoney-com, hypereffekt-com, milanote-com, vimcal-com, eduardbodak-com; evidence packet said light paper 46%, grotesk display 58%; the pick did not fit a one-property listing so I searched instead",
      },
      {
        tool: "search_screens",
        args: "query \"architecture studio house residential quiet editorial\", industry architecture, paperBand light, limit 8, detail full",
        took: "kkaa-co-jp--about, normarchitects-com--about, big-dk, snohetta-com, herzogdemeuron-com, archdaily-com, heatherwick-com--projects, floema-com with fold autopsies",
      },
      {
        tool: "search_screens",
        args: "query \"property listing real estate house for sale floorplan\", limit 8, detail full",
        took: "arrows-to, abyssale-com, detroit-paris, gardinex-com, magicspoon-com, houseofhoney-com, polar-sh, brandappart-com; mostly off-genre, confirmed the archive has no true listing page so the architecture set was the right anchor",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "specimen, limit 5, detail full",
        took: "apartamentomagazine-com, aristidebenoist-com, arweave-org, astro-build, barbican-org-uk; arweave-org's text-only spec page reinforced the schedule-table approach",
      },
      {
        tool: "get_screen",
        args: "snohetta-com",
        took: "full record and autopsy: headline then image strip, caption beneath, disciplines list below the fold",
      },
      {
        tool: "get_screen",
        args: "big-dk",
        took: "full record: stacked project rows, text cluster left, picture right, all on a pale ground",
      },
      {
        tool: "get_design_system",
        args: "heatherwick-com--projects, live false",
        took: "type ramp (Relative for meta, Plantin Light for headings and body), 10px spacing base, zero radius, palette roles",
      },
      {
        tool: "find_reference_components",
        args: "type hero",
        took: "seven canonical heroes; used the Documentary shape (headline left, credit aside right) for the hero grid",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "seven footers; used the Address card shape, four columns of real contact detail and no social row",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f5f2ec",
        from: "Page ground. Warm off-white from the floema-com and heatherwick range so the ink drawings read like a printed set, not a screen",
      },
      {
        token: "--paper-2",
        hex: "#ebe6dc",
        from: "Plan sheets, the map panel and the viewings block. One step darker so the drawings sit on a sheet inside the page",
      },
      {
        token: "--ink",
        hex: "#1f1c18",
        from: "Text, walls, roof lines and the primary pill. Warm near-black, never pure black, so it matches the paper",
      },
      {
        token: "--muted",
        hex: "#6e675d",
        from: "Meta labels, dimensions, captions and secondary copy. Carries the small architectural annotations",
      },
      {
        token: "--rule",
        hex: "#d8d1c4",
        from: "Hairlines between sections, table rows and the facts list. Quiet enough to structure without boxing",
      },
      {
        token: "--accent",
        hex: "#a45c1e",
        from: "Burnt orange taken from snohetta-com's extracted palette. Used only on one italic phrase per heading, the house marker on the map, the energy band bar and pill hover",
      },
      {
        token: "--sage",
        hex: "#cfd6c2",
        from: "Glazing on the plans and elevation, trees, hedge, estuary water. A cooled version of heatherwick's pale green so every drawn opening reads as glass",
      },
    ],
    highlight: "The page is drawn rather than photographed, and the drawings do the selling: a scaled south elevation with a person and a heat pump for scale sits under the headline as the hero strip, then a cross section through the double-height living room, two floor plans with wall thicknesses, door swings, glazing bands and every room dimensioned, and a sketch map with a north arrow and scale bar. Because the plans carry real numbers, the room schedule totals to the 214 sq m in the hero, the energy section quotes meter readings instead of marketing adjectives, and a small metric to imperial toggle lets a buyer read the facts list in the units they think in.",
  },
  {
    slug: "pg-extension-docs",
    brand: "pg_strata",
    tagline: "An open-source Postgres extension that ages cold rows onto object storage and keeps them queryable as one table.",
    prompt: "The documentation home for an open-source Postgres extension: docs-led, sidebar, code-first.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.0,
    references: [
      {
        slug: "render-com",
        took: "The shell: a fixed left sidebar with collapsible groups, a top bar with wordmark, search in the middle and a version pill, and a left-aligned page title with a short subhead. The docs home reads as page one of the manual, not a marketing hero.",
      },
      {
        slug: "e2b-dev",
        took: "Code as the only imagery. Tabbed install blocks with an accent underline on the active tab and a copy button, placed directly under the intro so the first viewport ends on runnable text.",
      },
      {
        slug: "circleci-com",
        took: "A dark navy code panel dropped into an otherwise light page, syntax coloured, sitting inside the prose flow. That contrast became the page's one strong visual move.",
      },
      {
        slug: "cleanshot-com",
        took: "Inline code chips with a light fill and hairline border set straight into body copy, and a strict sentence-case, text-dominant column with no hero picture.",
      },
      {
        slug: "raycast-com",
        took: "The version badge as marginalia: a filled pill and a date in a narrow left column, with the release title and bullets to its right. Reused as the changelog entry layout.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief plus pageType docs",
        took: "Picked feature-stack; evidence over 24 docs sites: light paper 92%, grotesk sans 63%, accent mostly green or teal; exemplars cleanshot-com--docs-api, netlify-com--docs, posthog-com--docs, github-com--docs, bun-com--reference; a pricing-table reference JSX and hero and spacing guidance.",
      },
      {
        tool: "search_screens",
        args: "query \"developer documentation home with sidebar and code blocks, open source database\", pageType docs, limit 8",
        took: "ollama-com--docs, lucide-dev--guide-vue, e2b-dev--docs, liveblocks-io--docs, github-com--docs, circleci-com--docs-guides-execution-managed-using-macos, netlify-com--docs, render-com--docs with fold autopsies.",
      },
      {
        tool: "get_screen",
        args: "render-com--docs",
        took: "Full autopsy: fixed sidebar, top bar with search and version, black primary and outlined secondary buttons, purple accent kept to icons and pills.",
      },
      {
        tool: "get_screen",
        args: "e2b-dev--docs",
        took: "Full autopsy: dual-language tabbed code blocks with an orange active underline and copy button as the primary visual, sticky right rail with \"On this page\".",
      },
      {
        tool: "find_reference_components",
        args: "type nav",
        took: "Seven nav archetypes; the inline and search-first shapes informed the top bar (wordmark left, search input, quiet links and a mono utility right).",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "Seven footer archetypes; the sitemap note (reserve the four-column map for genuine docs roots) and the colophon shape were combined into the footer.",
      },
      {
        tool: "search_screens",
        args: "query \"changelog release notes developer tool version list\", pageType changelog, limit 4",
        took: "gitbutler-com--changelog, circleci-com--changelog, raycast-com--changelog, cursor-com--changelog; Raycast's version badge marginalia was taken.",
      },
      {
        tool: "compare",
        args: "render-com--docs, e2b-dev--docs, cleanshot-com--docs-api, circleci-com--docs-guides-execution-managed-using-macos",
        took: "All four sit at five type-scale steps, three of four on light paper, minimalism the only shared style; confirmed the five-token scale and the light mode choice.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#fbfbf9",
        from: "Page background. Measured paper lightness in the docs genre sits at 96 to 98, so this is a hair off white rather than pure white.",
      },
      {
        token: "--ink",
        hex: "#15201d",
        from: "Headings, body, primary button fill. A green-black instead of neutral black so it belongs to the accent family.",
      },
      {
        token: "--muted",
        hex: "#5f6b67",
        from: "Supporting copy, sidebar links, table descriptions, footer text. Same hue as ink, lifted for a two-level text hierarchy.",
      },
      {
        token: "--rule",
        hex: "#e3e6e2",
        from: "Every hairline: sidebar border, table rows, section heads, cards, code chip borders.",
      },
      {
        token: "--accent",
        hex: "#0f7b6c",
        from: "Active sidebar item, active tab underline, latest version badge, notes, section-tracking rail. One accent, a deep teal-green in the genre's chromatic-other band, never used for large fills.",
      },
      {
        token: "--accent-soft",
        hex: "#e3f1ed",
        from: "Active sidebar background, tip callout fill, text selection. The accent at tint strength.",
      },
      {
        token: "--code-bg",
        hex: "#101b18",
        from: "Dark code windows on the light page, the CircleCI move. Green-black so the panels read as part of the same palette rather than a pasted terminal.",
      },
    ],
    highlight: "The first viewport is the docs shell itself, not a landing hero: sidebar, breadcrumb, a two-line title, a lede, a meta row with versions and licence, two buttons, and then a tabbed install window that is the only picture on the page. Every section below keeps that promise, with syntax-coloured SQL doing the work that screenshots usually do, output tables typed as they would appear in psql, and a changelog whose version pills sit in the margin like a printed manual's revision marks.",
  },
  {
    slug: "tasting-menu",
    brand: "Vesper",
    tagline: "A fourteen-seat tasting menu in a Clerkenwell bookbinder's workshop, one seating at half past seven.",
    prompt: "A tasting-menu restaurant with one seating a night: hushed, ivory and black, reservation-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "mirazur-fr",
        took: "The only true fine-dining reservation page in the archive: light roman serif on warm paper, sentence-case body under a large serif, a bookings-led nav with the reserve action as the one button, and a four-step type scale with 60 to 90px spacing steps. It set the ivory paper, the serif-plus-quiet-sans pairing, and the \"the page is the booking\" attitude.",
      },
      {
        slug: "atomixnyc-com",
        took: "A tasting-menu page that is nothing but a centred list of courses, with a single terracotta asterisk as the only colour on an otherwise monochrome page. The course list, its generous line-height, and the brass asterisk marking market-dependent dishes are taken straight from it.",
      },
      {
        slug: "dinnerbyheston-com",
        took: "Dark specimen hero: centred light serif, a bracketed italic label, one hairline rule, a ghost button, no image. It supplied the black menu and visit sections, the hairline rules between courses, and the restraint of no true white on the dark ground (ivory-soft text instead).",
      },
      {
        slug: "deathandcompany-com",
        took: "Surfaced by recommend as a food-and-beverage marquee hero. Studied and rejected as composition: a full-bleed photo with a script wordmark is the opposite of hushed. It confirmed the decision to go typographic and to draw the hero panel in SVG rather than fake a photograph.",
      },
      {
        slug: "lithic-com",
        took: "The recommend pick's lead exemplar. Its hairline concentric orbit rings on black, creating depth without fill, became the hero panel: five hairline ellipses on ink with fourteen ivory dots (the seats) around one brass point (the pass).",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief: \"A tasting-menu restaurant with one seating a night: hushed, ivory and black, reservation-led.\", detail full",
        took: "Picked Marquee Hero, inferred dark mode, evidence of 83% grotesk-sans display across 24 sites (which I took a position against, choosing a roman serif), exemplars lithic-com, deathandcompany-com, standardvision-com, generalcondition-com, raycast-com, the marquee hero JSX, hero fit and spacing guidance",
      },
      {
        tool: "search_screens",
        args: "query \"fine dining tasting menu restaurant reservation hushed ivory black\", industry food-beverage, paperBand light, limit 8, detail full",
        took: "Seven light food-and-beverage screens; only mirazur-fr--en-reservation-html fit the brief, the rest (chickfila-com, fellowproducts-com--pages-app, eater-com, cooking-nytimes-com--about-us, goodeggs-com, ritual-com) were retail or media",
      },
      {
        tool: "get_screen",
        args: "slug mirazur-fr--en-reservation-html",
        took: "Full record: Goudy Old Style plus Saans, paperL 88, roman-serif display, warm accent, split-studio macrostructure, hero screenshot",
      },
      {
        tool: "search_screens",
        args: "query \"hushed luxury editorial serif ivory black restaurant hotel atelier reservation\", displayClass roman-serif, paperBand light, vibe luxe, limit 8, detail full",
        took: "Only mirazur again; confirmed the light roman-serif luxe corner of the archive is thin",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "name letter, limit 5, detail full",
        took: "formafantasma-com, louvre-fr, 375-studio, juanmora-co, olhalazarieva-com; coverage flagged thin. Formafantasma's preface-and-contents text block informed the long-form \"the evening\" notes; the rest did not fit",
      },
      {
        tool: "find_similar",
        args: "slug mirazur-fr--en-reservation-html, limit 6, detail full",
        took: "atomixnyc-com--current-menu (the key find), italic-com, synapserstudio-com, lyfehotels-com--about-us, guggenheim-org--design-it, madmuseum-org",
      },
      {
        tool: "find_reference_components",
        args: "no filter",
        took: "Scan of all 68 reference components; chose split-screen hero, long-form features, single-plan pricing, address footer",
      },
      {
        tool: "get_screen",
        args: "slug atomixnyc-com--current-menu",
        took: "Full autopsy: centred course list, asterisks as sole accent, ambroise-std serif, 86px spacing step",
      },
      {
        tool: "search_screens",
        args: "query \"tasting menu omakase counter chef one seating nightly courses\", industry food-beverage, limit 8, detail concise",
        took: "omsom-com, mirazur-fr, deathandcompany-com, chickfila-com, onyxcoffeelab-com, ritual-com, wagamama-com, dinnerbyheston-com; Dinner by Heston was the useful one",
      },
      {
        tool: "get_reference_jsx",
        args: "type pricing, id single-plan",
        took: "One-plan brochure shape: headline, what is included, one action. Became the £195 price block and the reservations steps",
      },
      {
        tool: "get_reference_jsx",
        args: "type footer, id address",
        took: "Four-column business-card footer (find us, write, hours, calendar) with a rule and a one-line sign-off; used almost as-is with telephone and reservations columns",
      },
      {
        tool: "get_reference_jsx",
        args: "type hero, id split-screen",
        took: "Type on one half, pure-CSS atmospheric panel on the other, panel slides under the type on mobile; the fold follows this exactly",
      },
      {
        tool: "get_reference_jsx",
        args: "type features, id long-form",
        took: "Marginal-heading essay rows in a 4/8 grid; became the three \"the evening\" notes",
      },
      {
        tool: "get_screen",
        args: "slug dinnerbyheston-com",
        took: "Full autopsy: dictionary-entry hero, #424241 ground, #bdbdbc text, no true white, hairline rule, ghost button",
      },
      {
        tool: "compare",
        args: "slugs mirazur-fr--en-reservation-html, atomixnyc-com--current-menu, dinnerbyheston-com",
        took: "Shared minimalism and editorial tags, calm and luxe vibes, radius 0, 1440 container; type scales of three to four steps; spacing 60 to 90px",
      },
      {
        tool: "get_design_system",
        args: "slug mirazur-fr--en-reservation-html, live false",
        took: "Type ramp (45px serif h2 at weight 400, 18px body at weight 300 with 0.9px tracking, mono button at 3.2px tracking), spacing 60/70/90, radius 0, real CSS variables including clamp-based wrapper padding and a 1300px wrapper max-width",
      },
    ],
    palette: [
      {
        token: "--ivory",
        hex: "#f3efe6",
        from: "Page paper. Warmer than Mirazur's #f9f9f9 and Dinner by Heston's greys, so the page reads as linen rather than screen white",
      },
      {
        token: "--bone",
        hex: "#e9e3d6",
        from: "Reservations band, floor-plan and map panels, wine aside. One step down from ivory so panels sit on the paper without a border",
      },
      {
        token: "--ink",
        hex: "#111110",
        from: "Text, the primary button, the hero panel, and the two dark sections (menu, visit). A hair off pure black, following Dinner by Heston's refusal of absolute values",
      },
      {
        token: "--smoke",
        hex: "#6b675f",
        from: "Meta labels, descriptions, nav links at rest. Warm grey so muted text stays in the same family as the paper",
      },
      {
        token: "--rule",
        hex: "#d6cfc1",
        from: "Every hairline: nav underline, course dividers, note and step rules, footer. Light enough to structure without drawing the eye",
      },
      {
        token: "--brass",
        hex: "#9a7b4f",
        from: "The single accent, used only for the menu asterisks, step numerals, the pass on the hero panel, the map pin and focus rings. Atomix's one-colour-asterisk idea in a colour that belongs to candlelight, not terracotta",
      },
      {
        token: "--ivory-soft",
        hex: "#cfc9bc",
        from: "Muted text on the dark sections, so the black sections never carry pure white and stay hushed",
      },
    ],
    highlight: "The fold is a split studio with no photograph: type on ivory to the left, and to the right a black panel drawn in SVG, five hairline ellipses receding like Lithic's orbit rings, with fourteen ivory dots seated around them and one brass point at the centre for the pass. It is the room as a diagram, and the same fourteen dots reappear as the floor plan further down, so the abstraction pays off as fact. The dateline above the headline is live: a few lines of script work out the next Wednesday-to-Saturday service outside the winter closure and print it (\"Tonight, Thursday 10 September\" or \"Next seating, ...\"), and the reservation card pre-fills that date and refuses any evening the room is dark.",
  },
  {
    slug: "island-ferry",
    brand: "Havlinje",
    tagline: "Electric ferries between five Nordic islands, run to a fixed timetable with live berths and departures.",
    prompt: "An electric ferry operator between Nordic islands: timetable-led, sea, calm, live departures.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "hopper-com",
        took: "The tool-as-hero idea: a white floating panel over a sea gradient instead of marketing copy alone. Became the \"Next sailing\" card sitting beside the headline, and its cool palette (#4c9cd4, #223152, #b9d4ee) set the sea, ink and tint tokens.",
      },
      {
        slug: "eurostar-com",
        took: "A transport page where the booking bar and a \"train status and timetables\" pill are the real content. Informed the departure board with berth tags and status colours, and the persistent \"Buy a ticket\" pill in the nav.",
      },
      {
        slug: "moderntreasury-com",
        took: "The only calm map-diagram exemplar in the archive: hub node with floating rounded tags on connecting lines, on a faint grid. Directly shaped the SVG route map, with Sølvøy as the hub, crossing-time tags on each route and a grid pattern under the sea.",
      },
      {
        slug: "watershed-com",
        took: "Mono eyebrow above a left-aligned sentence-case headline, muted periwinkle rules, body kept small against a large display. Set the eyebrow-plus-rule pattern used on every section head and the 5-step type ramp.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"electric ferry operator between Nordic islands\", vibe calm, detail full",
        took: "Bento Grid pick with grocery and games exemplars that did not fit; useful evidence packet (grotesk-sans 71%, cool accent) and the bento features JSX",
      },
      {
        tool: "search_screens",
        args: "query \"ferry boat travel timetable departures sea calm Nordic\", industry travel, limit 8, full",
        took: "hopper-com, eurostar-com, belmond-com, explorajourneys-com and others with fold autopsies",
      },
      {
        tool: "search_screens",
        args: "query \"calm coastal minimal light page with cool blue accent, schedule table, transport\", accentHue cool, vibe calm, paperBand light, limit 8",
        took: "watershed-com, calendly-com, atlassian-design and other light cool pages",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "map-diagram, limit 6, full",
        took: "only two sites: moderntreasury-com and unkey-com, with the thin-coverage note",
      },
      {
        tool: "find_reference_components",
        args: "type hero",
        took: "seven editorial hero archetypes (marquee, split-screen, stat-led, documentary and others)",
      },
      {
        tool: "get_screen",
        args: "hopper-com",
        took: "full record with palette and fold autopsy",
      },
      {
        tool: "get_screen",
        args: "moderntreasury-com",
        took: "full record with the hub-node diagram autopsy",
      },
      {
        tool: "get_screen",
        args: "eurostar-com",
        took: "full record with booking bar and status pill autopsy",
      },
      {
        tool: "compare",
        args: "hopper-com, moderntreasury-com, eurostar-com, watershed-com",
        took: "shared minimalism and swiss styles, 4 to 5 type steps, container widths 1124 to 1440",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "seven footer archetypes; the address card shape was used",
      },
      {
        tool: "find_reference_components",
        args: "type pricing",
        took: "seven pricing archetypes; the per-use line-item list shape was used for fares",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f3f6f8",
        from: "Page ground, a cool off-white so the white cards still read as cards, sits between Hopper's light band and Watershed's paper",
      },
      {
        token: "--ink",
        hex: "#142a3f",
        from: "All text and the solid pill, a navy rather than black so the page stays maritime, close to Hopper's #223152",
      },
      {
        token: "--sea",
        hex: "#2f7fb8",
        from: "Route lines, the italic headline phrase, boarding status, eyebrows and the charge bars; a deeper cut of Hopper's #4c9cd4 for contrast on paper",
      },
      {
        token: "--sea-tint",
        hex: "#cfe2ee",
        from: "Hero gradient foot, map water, berth tags and the empty part of charge bars; the calm water surface",
      },
      {
        token: "--muted",
        hex: "#5d7285",
        from: "Secondary copy, mono meta labels and table headers",
      },
      {
        token: "--rule",
        hex: "#d5dee5",
        from: "Every hairline: table rows, fare list, cards, footer, map tags",
      },
      {
        token: "--signal",
        hex: "#2e8b57",
        from: "The live pulse, \"On time\" status and the weather verdict; the one green so status reads at a glance",
      },
    ],
    highlight: "The route map is the standout: five islands drawn as SVG land shapes on a gradient sea with faint depth contours, Sølvøy as the hub carrying a shore-power bolt, crossing times as rounded tags on each route the way Modern Treasury labels its payment rails, and three dark dots that actually move along the route paths with SMIL animateMotion so the map reads as live rather than decorative. It hands off directly to the departure board below, which is generated from a real timetable in JavaScript against the visitor's clock, so the hero \"Next sailing\" card, the board and the map all agree on what is leaving and when.",
  },
  {
    slug: "teen-savings",
    brand: "Tenner",
    tagline: "A savings app and contactless card for 13 to 17 year olds, set up and supervised by a parent.",
    prompt: "A savings app for teenagers: bright, playful, card-led, parent-approved.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "rainbow-me",
        took: "Gave the fold its whole posture: a saturated sky-blue ground with white cloud shapes and a lime sun, a heavy rounded display face, and an iPhone mockup parked in the right third with the headline anchored left against it.",
      },
      {
        slug: "owo-app",
        took: "The warm cream paper below the fold, the wide radius scale (16 to 40), and the idea of feature copy living inside saturated colour blocks; the goals bento is a direct descendant of its headline-as-colour-tiles move.",
      },
      {
        slug: "wise-com",
        took: "The hero visual is a working screen rather than an illustration: real balances, two goals with progress bars, three recent payments. Its lime pill CTA and near-black green ink became the lime button and the deep teal ink token.",
      },
      {
        slug: "family-co",
        took: "The black pill plus white pill CTA pair, the sentence-case bold headline over a two-line supporting sentence, and the dark card sitting next to a light one, which became the dark parents section between two light ones.",
      },
      {
        slug: "middle-finance",
        took: "The single headline word reversed out inside a filled, fully rounded pill; here \"grows.\" sits in a pink pill tilted two degrees.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"A savings app for teenagers: bright, playful, card-led, parent-approved.\", mode light, detail full",
        took: "Picked feature-stack, measured the genre as 71% light paper and grotesk-sans display, returned glideapps-com, dia-com, mailchimp-com, forestadmin-com, arrows-to plus the pricing comparison-table reference JSX; the exemplars were generic SaaS, the evidence packet and the table were what I kept",
      },
      {
        tool: "search_screens",
        args: "query \"playful fintech card debit card teens family money app bright colours\", industry fintech, mode light, limit 10, detail full",
        took: "owo-app, family-co, rainbow-me, wise-com, gusto-com, razorpay-com, deel-com, becomeautonomous-com, middle-finance, public-com with fold autopsies; the first four plus middle-finance set the direction",
      },
      {
        tool: "search_screens",
        args: "query \"playful consumer app bright bold colours rounded cards phone mockup hero\", style playful, mode light, limit 10, detail full",
        took: "buttondown-email, owo-app, fal-ai, columbia-com, francouvertes-com, rainbow-me, lottiefiles-com, boldmonday-com, chickfila-com, museumofmoney-com; confirmed the rounded-heavy display plus flat colour blocks pattern, and buttondown-email's angled sticker gave me the tilted pill",
      },
      {
        tool: "find_components",
        args: "type hero, industry fintech, vibe playful, limit 10",
        took: "Only gusto-com came back; noted its centred black-pill plus white-pill CTA pair and moved on",
      },
      {
        tool: "find_reference_components",
        args: "type hero",
        took: "Seven editorial hero shapes (documentary, manifesto, marquee, question, split-screen, stat-led, word-as-art); the split-screen \"atmospheric panel, no image placeholder\" note reinforced drawing the card and phone in CSS rather than faking a photo",
      },
      {
        tool: "get_screen",
        args: "slug rainbow-me",
        took: "Full record: SF Pro Rounded Black display, #84e4fb sky ground, #1d4244 ink, phone right third; used to size the phone against the headline",
      },
      {
        tool: "get_screen",
        args: "slug family-co",
        took: "Full record: radius scale 0/8/12/32, 3-step type scale, Inter body; confirmed the CTA pair and the 72px headline over two-line body",
      },
      {
        tool: "compare",
        args: "slugs owo-app, family-co, rainbow-me, wise-com",
        took: "Shared light register, radius scales 16 to 40 across the set, spacing steps clustering at 96 to 120, wise at 5 type steps; set --gap at clamp(72px, 9vw, 120px) and the five-token type scale",
      },
      {
        tool: "find_components",
        args: "type faq, style playful, limit 6",
        took: "netlify-com and nanorcollection-com crops, neither close to the brief; the FAQ was built from the details/summary pattern instead",
      },
      {
        tool: "find_components",
        args: "type footer, vibe playful, limit 6",
        took: "Zero results; footer built as a plain four-column dark block",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#fff7e8",
        from: "Page ground below the fold and the phone screen; a lighter cousin of owo-app's cream so the saturated tiles have something warm to sit on",
      },
      {
        token: "--ink",
        hex: "#1b2a30",
        from: "Text, borders, the dark parents section, the footer and the phone bezel; a teal-leaning near-black from rainbow-me and wise-com rather than pure black, which read too corporate against the cream",
      },
      {
        token: "--sky",
        hex: "#7ed8f6",
        from: "Hero ground and the closing CTA band; rainbow-me's sky, pulled a touch toward cyan so the lime and tangerine stay legible on it",
      },
      {
        token: "--lime",
        hex: "#cdf25a",
        from: "Primary action colour (the lime pill, stat numerals, the approve button) borrowed from wise-com's CTA and used sparingly so it reads as \"go\"",
      },
      {
        token: "--tangerine",
        hex: "#ff7a3d",
        from: "The card gradient start, the £0 numeral, one bento tile and one step badge; owo-app's orange, softened slightly for a warmer teen register",
      },
      {
        token: "--grape",
        hex: "#7b5cd6",
        from: "The second card, the chores tile and the identity icon; a cooler counterweight so the page is not only warm",
      },
      {
        token: "--pink",
        hex: "#ffa6d9",
        from: "The headline highlight pill, the round-ups tile and the card gradient end; a soft magenta that ties the card to the headline",
      },
    ],
    highlight: "The standout move is the fold's device stack: a CSS-drawn phone running a real-looking Tenner screen (balance, two goals with animated progress bars, three recent payments) flanked by two CSS-drawn cards at opposing tilts, one tangerine-to-pink, one grape-to-sky. It takes wise-com's idea that the product UI is the hero image and rainbow-me's toy-object composition, and answers the brief's \"card-led\" without a single raster asset. The same phone chassis reappears in the dark parents section as the parent view, with an approve request and live toggles, so the two apps the page keeps talking about are both literally on the page.",
  },
  {
    slug: "weather-station",
    brand: "Anemo",
    tagline: "A Bergen-built home weather station with nine sensors, an ultrasonic wind head and no subscription.",
    prompt: "A home weather station maker: product-led, spec numbers, dark, one device.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 7.5,
    references: [
      {
        slug: "analogue-co",
        took: "The single device centred on a near-black field with a small model-name eyebrow above a sentence-case headline. The S2 hero takes the \"one object, dark ground, no environment\" stance and the tight-tracked medium-weight display from here.",
      },
      {
        slug: "shure-com",
        took: "Left text block at roughly a third of the width, one oversized product dominating the right, a model-name eyebrow over the headline and exactly one accent-filled CTA. That is the hero grid of this page, with the accent held to buttons, the status light and the eyebrow.",
      },
      {
        slug: "digitalocean-com",
        took: "The three stat cards (big figure, bold label, one explanatory paragraph) became the four-figure stat strip under the fold, and the vertical scale markers along the right edge of its terrain became the 0 to 2 m gauge ticks beside the device drawing.",
      },
      {
        slug: "lithic-com",
        took: "Hairline concentric rings creating depth with no fill. Three faint rings sit behind the station in the hero and range arcs reuse the same idea in the power and range panel.",
      },
      {
        slug: "scale-com",
        took: "Light display weight on a #04040c ground with a cool text grey, plus the measured spacing scale (64, 96, 128, 160) that set the section rhythm at clamp(72px, 9vw, 120px).",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"A home weather station maker: product-led, spec numbers, dark, one device\", mode dark, pageType landing",
        took: "Picked Marquee Hero; evidence over 24 sites: 83 percent dark paper, 71 percent grotesk display, accent hue split (chromatic-other 42, cool 29, warm 17); exemplars scale-com, lithic-com, deathandcompany-com, analogue-co, raycast-com; marquee hero JSX; hero and spacing guidance",
      },
      {
        tool: "search_screens",
        args: "query \"dark hardware product page with one device and spec numbers\", paperBand dark, industry consumer-tech, limit 8",
        took: "dolby-com, analogue-co, shure-com with fold autopsies; shure gave the left-text right-device grid",
      },
      {
        tool: "find_reference_components",
        args: "type hero",
        took: "Seven canonical hero shapes (documentary, manifesto, marquee, question, split-screen, stat-led, word-as-art); the stat-led note about tabular-nums on figures carried into every numeric column",
      },
      {
        tool: "get_screen",
        args: "slug analogue-co",
        took: "Full autopsy: #1a1a1a ground, 4:1 scale jump, accent only on the product itself, device at 60 percent of viewport height",
      },
      {
        tool: "get_screen",
        args: "slug shure-com",
        took: "Full autopsy: 5-step type scale, spacing 8/20/24/90, radius 0 to 8, accent lime on the CTA only, product breaking the text column",
      },
      {
        tool: "search_screens",
        args: "query \"technical spec numbers sensors accuracy dark product page stat-led\", paperBand dark, macrostructure stat-led, limit 6",
        took: "reactsummit-com, digitalocean-com, tinybird-co; digitalocean stat cards and gauge markers, tinybird accent-on-figures",
      },
      {
        tool: "find_components",
        args: "type stat, mode dark, vibe technical, limit 6",
        took: "Stat crops from lusion-co and reactsummit-com; confirmed the figure-then-micro-label stack",
      },
      {
        tool: "find_reference_components",
        args: "type pricing",
        took: "Comparison table (thin rules, no zebra, row hover) used for both the accuracy table and the S1 vs S2 table; single-plan JSX used for the price block",
      },
      {
        tool: "compare",
        args: "slugs analogue-co, shure-com, scale-com, digitalocean-com",
        took: "Shared register: minimalism plus dark-mode; type scales of 4 to 6 steps; scale-com spacing scale 16 to 160; container widths 1440",
      },
      {
        tool: "get_design_system",
        args: "slug analogue-co, live false",
        took: "Type ramp (53px h1 at weight 500, -2.6px tracking, 16px body at 1.5), radius 0 and 18, confirms tight negative tracking on the display",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#0b0e12",
        from: "Page ground. Cooler and slightly bluer than analogue-co's #1a1a1a so the amber accent has something to sit against; sits in the 83 percent dark band the evidence measured",
      },
      {
        token: "--surface",
        hex: "#12161c",
        from: "Panels, phone chrome, hovered cells; one step up from paper so raised things read as raised without a shadow",
      },
      {
        token: "--ink",
        hex: "#edf0f3",
        from: "Headlines, figures, table values; off-white rather than pure white to keep the tabular numerals from glaring on the dark ground",
      },
      {
        token: "--muted",
        hex: "#8b95a3",
        from: "Body copy, labels, S1 column, callout second lines; the cool grey text of scale-com's #bab9c1 pulled a little darker for hierarchy",
      },
      {
        token: "--rule",
        hex: "#242b34",
        from: "Every hairline: table rows, grid lines, depth rings, section seams; low enough contrast to structure without drawing",
      },
      {
        token: "--accent",
        hex: "#f0a93a",
        from: "Eyebrows, the primary button, the status light, battery bars, sparkline; a warm instrument amber that reads as a needle or lamp, taking a position against the category's chromatic-other consensus",
      },
      {
        token: "--accent-ink",
        hex: "#1a1204",
        from: "Text on amber buttons, so the CTA stays legible without a white label",
      },
    ],
    highlight: "The hero is a technical drawing rather than a product photo: the S2 is built in SVG from its actual parts (two-plate ultrasonic wind head, rain funnel, solar collar, seven louvred shield plates, electronics bay with a glowing status light, pole clamp) and annotated with six hairline callouts in mono, each naming the part and one figure. The gauge ticks from 0.0 m to 2.0 m on the right edge and the three depth rings behind it turn the device into an instrument on a bench, and the live readout under the CTA drifts every three seconds so the fold behaves like the thing it sells.",
  },
  {
    slug: "city-marathon",
    brand: "Calder Bay Marathon",
    tagline: "A closed-road city marathon on 18 April 2027, with a live countdown, a drawn route and open entries.",
    prompt: "A city marathon: route map, registration, countdown, energetic.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "stonesthrow-com",
        took: "The raw orange-on-monochrome energy and the \"accent lands on one thing\" discipline: its red monolith and orange rectangles became my hot orange on the route line, the primary pill and one colour-broken word in each headline, nothing else.",
      },
      {
        slug: "savvycal-com",
        took: "Condensed heavy display type set in an acid tint on a deep ground, with a radial glow behind it and no photography. That is the countdown card: lime digits on navy with a soft radial highlight, and the same cool-to-warm handoff into a paper section below.",
      },
      {
        slug: "unkey-com",
        took: "A diagram that is the hero visual, bleeding behind and through the copy layer, with the headline anchored lower-left. It convinced me the SVG route map could carry a whole section as the image rather than sit as a small illustration.",
      },
      {
        slug: "moderntreasury-com",
        took: "A literal infrastructure map as content: hub, labelled nodes, floating tags on the lines. My kilometre markers, cheer-zone squares and start/finish tags follow that labelled-node language on a faint grid.",
      },
      {
        slug: "deel-com",
        took: "One word of the headline broken out in a second colour, and small stat overlays (\"480+ hrs\") with a label beneath. The \"closed\" and \"your city\" breaks and the stat tiles under the map come from here.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"A city marathon: route map, registration, countdown, energetic\", detail full",
        took: "Feature Stack pick with alloy-com, dub-co--about, instrument-com--about, synthesia-io, everlaw-com; evidence packet (71 percent grotesk display, warm accent consensus), the pricing table reference JSX, hero and spacing guidance including the padding-inline rule.",
      },
      {
        tool: "search_screens",
        args: "query \"energetic sports event race registration bold countdown\", vibe loud, limit 8",
        took: "boldmonday-com, dropout-tv, stinkstudios-com, kelseydake-com, stonesthrow-com, idyllic-co-nz, generalcondition-com, leonardo-ai; stonesthrow-com was the keeper for warm accent on a mono ground.",
      },
      {
        tool: "search_screens",
        args: "query \"map diagram route with markers\", macrostructure map-diagram, limit 6",
        took: "unkey-com and moderntreasury-com, the two map/diagram exemplars, both with fold autopsies describing how a diagram carries a section.",
      },
      {
        tool: "search_screens",
        args: "query \"big numbers stats condensed bold display warm accent\", displayClass display-condensed-bold, limit 6",
        took: "dia-com, graza-co, savvycal-com, idyllic-co-nz, flipboard-com, deel-com; confirmed condensed heavy display plus a neutral sans as the type pairing.",
      },
      {
        tool: "find_reference_components",
        args: "type hero",
        took: "Seven canonical hero shapes (documentary, manifesto, marquee, question, split-screen, stat-led, word-as-art); stat-led informed the records band and the countdown as a number-first block.",
      },
      {
        tool: "get_screen",
        args: "slug stonesthrow-com",
        took: "Full record: palette #f88b07 / #bb2c24, General Sans, spacing scale 30 to 180, the accent-on-one-element rule.",
      },
      {
        tool: "get_screen",
        args: "slug savvycal-com",
        took: "Full record: #0c542c ground with #bcfc7b headline, GT Alpina Condensed plus Inter, the radial-ring background behind type.",
      },
      {
        tool: "find_components",
        args: "type stat, limit 5",
        took: "alloy-com, aristidebenoist-com, calendly-com stat crops; alloy-com's stat strip under the hero reinforced the tile-with-label pattern.",
      },
      {
        tool: "compare",
        args: "stonesthrow-com, savvycal-com, unkey-com, deel-com",
        took: "Type scale steps of 5 to 6 across all four, spacing seams of 80 to 128, radius scales that pair 0 with a full pill; used to set my five-token scale, the 72 to 128 section rhythm and the pill buttons.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f5f0e6",
        from: "Page ground and the map card's neighbour tone; warm off-white so the hot orange reads as heat rather than alarm.",
      },
      {
        token: "--ink",
        hex: "#12110f",
        from: "Body text, the waves section ground, the footer and the ticker; a warm near-black that does not fight the paper.",
      },
      {
        token: "--accent",
        hex: "#ff4b1f",
        from: "The route line, kilometre marker rings, primary pills, the colour-broken headline word and the full records band; taken from the stonesthrow-com orange and pushed hotter.",
      },
      {
        token: "--navy",
        hex: "#0f1f3d",
        from: "The countdown card and the road closures panel; the deep cool ground that makes the lime digits glow, following savvycal-com's deep-ground-plus-acid pairing.",
      },
      {
        token: "--lime",
        hex: "#d9f34f",
        from: "Countdown digits, wave start times, closure times and cheer-zone numerals; the acid tint from savvycal-com and unkey-com, used only for time and number.",
      },
      {
        token: "--muted",
        hex: "#6f6a60",
        from: "Lead copy, table labels and captions; warm grey so secondary text stays on the paper's temperature.",
      },
      {
        token: "--rule",
        hex: "#d9d2c2",
        from: "Hairlines, card borders and the map grid; a warm rule that disappears until you look for it.",
      },
    ],
    highlight: "The route map is the page's image and its data at once. It is a single inline SVG on a faint street grid: a bay and river in pale water blue, the park in green, the 42.195 km loop in one hot orange stroke with direction arrows, nine numbered kilometre rings placed by measuring the path length and dividing by 44.55 units per kilometre, five ink cheer-zone squares that match the spectator list, and start and finish tags. The list beside it repeats the same numbers as a split table with elevation notes, so a runner reads the course two ways without a photograph anywhere on the page. Above it, the countdown card is a real clock to 07:00 on 18 April 2027, and the entry tiers mark themselves open or closed from their closing dates, so the page changes as race day approaches.",
  },
  {
    slug: "type-newsletter",
    brand: "Counterpunch",
    tagline: "A fortnightly letter about typefaces, the people who draw them, and the pages they end up on.",
    prompt: "A newsletter about typography: editorial, specimen-led, archive, subscribe.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "pampatype-com",
        took: "The specimen-as-headline move: oversized single glyphs standing in for a hero image. Counterpunch's hero card is two live Fraunces letters (\"ag\") at optical size 144 with the wonk axis on, labelled in the corners like a foundry card.",
      },
      {
        slug: "commercialtype-com",
        took: "Full-width colour-blocked bands with one massive typeface name per band. Gave the page its two-band specimen world: a deep plum hero card and a lavender specimen section, with the paper staying warm around them.",
      },
      {
        slug: "pudding-cool",
        took: "Outlined issue-number badges (\"#217\", \"#216\") sitting above each card, which is what turns a list into a serial archive. The back-issue index borrows the badge (\"No. 46\") and the date-right rhythm.",
      },
      {
        slug: "logicmag-io",
        took: "The \"Issue 23\" label above a one-line headline, long body copy, and a cover on the right. Set the hero's grammar: issue label, headline, lead, two actions, and a specimen object where the cover would be.",
      },
      {
        slug: "thedesignersfoundry-com",
        took: "The red card with Weight and Slanted sliders next to a giant \"Gg\". Became the axis lab: weight and softness sliders plus a wonk switch that rewrite font-variation-settings on live text.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"A newsletter about typography: editorial, specimen-led, archive of past issues, subscribe form\", detail full",
        took: "Picked feature-stack, evidence over 24 sites (paper light 75%, display grotesk-sans 88%, accent warm 46%), exemplars ghost-org--about, functionhealth-com--about, character-ai--about, mailchimp-com, posthog-com--about, the pricing table JSX, hero and spacing guidance. The 88% grotesk pull is what I took a position against with a serif display.",
      },
      {
        tool: "search_screens",
        args: "query \"type foundry specimen editorial serif newsletter\", macrostructure type-specimen, limit 8, detail full",
        took: "pampatype-com, thedesignersfoundry-com, sharptype-co, commercialtype-com, displaay-net, newglyph-com, velvetyne-fr, boldmonday-com with full autopsies; the specimen vocabulary for the page.",
      },
      {
        tool: "search_screens",
        args: "query \"editorial newsletter archive of past issues, subscribe form, serif magazine\", style editorial, paperBand light, limit 8, detail full",
        took: "apartamentomagazine-com, quantamagazine-org, eyemagazine-com, fermliving-com--products-showroom-visit, logicmag-io, aerotime-com, pudding-cool, hypebeast-com--2026-3-balmuda-the-clock-release-info; the magazine and archive references.",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "name specimen, limit 6, detail full",
        took: "apartamentomagazine-com, aristidebenoist-com, arweave-org, astro-build, barbican-org-uk, bluebottlecoffee-com; confirmed the issue-plus-object hero and the arweave text-only alternative I did not take.",
      },
      {
        tool: "find_reference_components",
        args: "type cta",
        took: "Seven archetypes; form-led (single email field, inline submit, real success state, cadence note underneath) shaped the subscribe section, quiet and banded were read and passed over.",
      },
      {
        tool: "get_screen",
        args: "slug pudding-cool",
        took: "Full record; signature line on the outlined issue badges and the serial archive rhythm.",
      },
      {
        tool: "get_screen",
        args: "slug commercialtype-com",
        took: "Full record; the stacked band composition and the fact that the type is the visual.",
      },
      {
        tool: "get_screen",
        args: "slug logicmag-io",
        took: "Full record; the issue label, headline, long lead and cover split, with outlined buttons and no accent on the CTA.",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "Seven archetypes; colophon (typefaces, contact, owner in caption type, three columns) became the footer, newsletter and index were read for the form and the back-issue list.",
      },
      {
        tool: "compare",
        args: "slugs pampatype-com, commercialtype-com, pudding-cool, logicmag-io",
        took: "Shared minimalism plus editorial in the light register, type scales of 3 to 5 steps, containers 1280 to 1440; settled a 1200px column and a six-token scale.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f4f0e8",
        from: "Page ground. Warm off-white so the page reads as stock rather than screen, following the light paper band the evidence measured and the warm accent share.",
      },
      {
        token: "--ink",
        hex: "#1c1a16",
        from: "Body text, wordmark, the primary pill and the subscribe section's ground. Warm near-black so it sits on the paper without a blue cast.",
      },
      {
        token: "--muted",
        hex: "#6e685d",
        from: "Meta lines, captions, summaries in the archive. Two steps down from ink so the hierarchy is carried by colour, not size.",
      },
      {
        token: "--rule",
        hex: "#d8d1c4",
        from: "Every hairline: nav, stats strip, waterfall, archive index, footer. Slightly darker than paper so rules read but never box.",
      },
      {
        token: "--accent",
        hex: "#c2411f",
        from: "Vermilion for the italic phrase in the headline, the second half of the wordmark, hover states, the writer's ampersand disc and the numerals. The single warm brand colour, used sparingly so it always lands.",
      },
      {
        token: "--band",
        hex: "#e6ddf1",
        from: "Lavender ground of the specimen section, lifted from Commercial Type's Canela band. Cool against the warm paper so the specimen reads as a separate object, a plate tipped into the letter.",
      },
      {
        token: "--band-deep",
        hex: "#2e1b4e",
        from: "Deep plum for the hero specimen card and for all text on the lavender band. Same hue family as the band so the two specimen surfaces read as one world.",
      },
    ],
    highlight: "The specimen is live text all the way down, and the page proves it. The hero card is two Fraunces glyphs at optical size 144 with the wonk axis on; the lavender section runs a four-row waterfall across weight and optical size; and the axis lab lets the reader drag weight and softness and flip the wonk switch while the readout rewrites itself in plain words. It turns the newsletter's premise (one typeface, one argument, a specimen you can select) into the page's own behaviour rather than a claim about it.",
  },
  {
    slug: "camera-repair",
    brand: "Ostrander Camera Works",
    tagline: "A two-bench Portland workshop that strips, cleans and times mechanical cameras at fixed, published prices.",
    prompt: "A vintage camera repair workshop: mechanical, brass, service-list led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "contralabs-com",
        took: "Gave the paper and ink pairing: warm stone ground with deep burgundy-brown text and a light-weight transitional serif, plus the corner-bracket marks around the hero image, which became the brackets around the exploded shutter plate.",
      },
      {
        slug: "emigre-com",
        took: "The cream-on-brown ledger feel and the dotted typographic rule as a section ornament; also confirmed a warm burnt accent reads as vintage without going sepia, so the oxblood accent stays rare.",
      },
      {
        slug: "minimal-so",
        took: "The date first, then version, then category rhythm of a changelog is the whole structure of the repair log: date and job number in a mono column, camera as the anchor, fault and work beneath.",
      },
      {
        slug: "maggieappleton-com",
        took: "Arrow-suffixed links instead of buttons wherever an action is secondary (the \"Add yours to the log\" link, the nav pill), and the serif-display-over-plain-body split.",
      },
      {
        slug: "clay-com",
        took: "Studied as the recommend pick and rejected on composition: its centred, geometric-sans feature stack is the genre gravity this brief needed to push against, so the page went left-aligned, serif and ledger-led instead.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief: vintage camera repair workshop, service-list led; detail full",
        took: "Picked feature-stack (6 hits), evidence packet said 75% grotesk-sans and light paper, returned clay-com, superlist-com, dia-com, puzzle-io, anytype-io plus the pricing \"table\" reference JSX (thin rules, no zebra, hover lift) and hero and spacing guidance.",
      },
      {
        tool: "search_screens",
        args: "query vintage workshop craft brass serif; style vintage; limit 8",
        took: "bauhausclock-com, contralabs-com, dragcity-com, chloe-com, siena-film, analogue-co, getty-edu, idyllic-co-nz; contralabs-com was the find with its stone paper, burgundy ink and bracketed hero image.",
      },
      {
        tool: "search_screens",
        args: "query price list service list table; macrostructure catalogue; paperBand light; limit 8",
        took: "One hit, emigre-com--essays-magazine-legible, the cream ledger page with the dotted rule.",
      },
      {
        tool: "search_screens",
        args: "query warm earthy craftsman workshop serif; color earthy; displayClass roman-serif; limit 8",
        took: "casper-com, fermliving-com--products-muses-clio, snowpeak-com, dragcity-com, atomixnyc-com, mirazur-fr, maggieappleton-com; took the arrow links and the serif over sans body split from maggieappleton-com.",
      },
      {
        tool: "search_screens",
        args: "query index-first list of items with rules, log of entries; macrostructure index-first; limit 8",
        took: "perplexity-ai, minimal-so--changelog, humaan-com, adcker-com; minimal-so--changelog became the repair log model.",
      },
      {
        tool: "get_screen",
        args: "slug contralabs-com",
        took: "Full palette (#d2cbb3 paper, #652c21 ink, #bc6c4c terracotta, #98845f olive-tan), Source Serif 4 Variable as the display face, and the autopsy of the left-aligned four-line serif headline with two pill CTAs.",
      },
      {
        tool: "get_screen",
        args: "slug emigre-com--essays-magazine-legible",
        took: "Palette (#e2d8c1 cream, #420404 brown, #f46425 orange) and the signature dotted rule divider.",
      },
      {
        tool: "find_reference_components",
        args: "type nav",
        took: "Seven nav archetypes; took the N1 inline shape (wordmark left, mono links, one utility action right) and kept the links mono and muted.",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "Seven footer archetypes; built the footer on Ft8 Address card (find us, write, call, no social row) with a colophon line from Ft7 underneath.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#e8e1cf",
        from: "Page ground, a lighter cut of contralabs-com's #d2cbb3 so the ledger stays readable at 17px body while keeping the stone warmth.",
      },
      {
        token: "--paper-deep",
        hex: "#d9cfb6",
        from: "The shipping ticket, footer band and the fill of shutter blades and lens elements in the drawings, so the illustrations sit in the same material as the page.",
      },
      {
        token: "--ink",
        hex: "#3b2016",
        from: "All text, rules under section heads and the solid buttons; a burgundy-brown between contralabs-com's #652c21 and emigre's #420404 so it reads as ink, not black.",
      },
      {
        token: "--muted",
        hex: "#7b6853",
        from: "Mono meta, faults in the log, secondary copy and table turnaround column; a tan-brown pulled from contralabs-com's olive-tan.",
      },
      {
        token: "--rule",
        hex: "#bfb296",
        from: "Every hairline in the tables, lists and the dotted optical axis in the drawings.",
      },
      {
        token: "--brass",
        hex: "#a87b2c",
        from: "The brief's brass: step numbers, the retaining ring and threads in the shutter drawing, the helicoid lines, the delivered dot in the log and the warranty seal. Never on text blocks.",
      },
      {
        token: "--oxblood",
        hex: "#8a3826",
        from: "One italic phrase in the headline, hover colour, the on-the-bench status and the ray lines in the lens section. Kept rare so it lands.",
      },
    ],
    highlight: "The exploded Synchro-Compur in the hero is drawn as six parts stacked on a dashed optical axis, each one a top-down drawing inside a group scaled to 0.3 on the y axis so the perspective is automatic and the brass ring, iris blades, five shutter petals, toothed speed cam, mainspring and gear train all read as one lathe-turned object. Mono labels sit to the right on leader lines and hovering any label dims the rest of the stack so the part lifts out; the plate is wrapped in the same corner brackets contralabs-com puts around its hero image and captioned like a figure in a service manual. It puts the workshop's whole argument, that a camera is a mechanism you can take apart and time, above the fold before the price list makes it concrete.",
  },
  {
    slug: "dairy-coop",
    brand: "Coldharbour Dairy Co-operative",
    tagline: "Six Mendip farms, one limestone cave at eleven degrees, cheese sold by the kilo and delivered twice a week.",
    prompt: "A cheese-making dairy cooperative: pastoral, cave-aged, shop-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "warbyparker-com",
        took: "The fold shape: sentence-case serif headline in the left 40 percent, two pill CTAs stacked beside each other, a trust line of four promises directly under them, then a \"new arrivals\" product row below the fold. Its warm cream paper (#e4d4cc) and a 55px serif h1 at weight 400 set the paper and the display weight.",
      },
      {
        slug: "ritual-com",
        took: "The split hero with an off-white text panel and a visual on the other half, the single italic word as the only flourish in the headline, and the \"Shop bestsellers / Shop all\" head-with-link pattern reused for every section head.",
      },
      {
        slug: "snowpeak-com",
        took: "A single product object as the whole hero visual, sharp against a soft warm field, headline anchored low-left. The hero panel here is the same idea with one drawn wheel instead of a photograph, plus the green band of promises translated into the proof strip.",
      },
      {
        slug: "fermliving-com",
        took: "Product-page economy: name, price, one black action button, warm beige ground (#daccb8) and a small display-to-body scale jump. The cheese cards and the \"add 250 g\" buttons follow it.",
      },
      {
        slug: "goodeggs-com",
        took: "Category card grid with bottom labels and the terracotta and honey accents (#a54324, #df8c0c) that pushed the accent toward a rind orange rather than a red.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"A cheese-making dairy cooperative: pastoral, cave-aged, shop-led\", detail full",
        took: "Picked Marquee Hero from mostly tech exemplars (ritual-com, headroom-com, mage-ai, analogue-co, generalcondition-com); the evidence packet said the genre gravity is 75 percent grotesk sans on light paper, which I decided to go against with a roman serif. Also carried the spacing and hero-fit guidance.",
      },
      {
        tool: "search_screens",
        args: "query \"artisan food producer farm shop warm editorial serif\", industry food-beverage, paperBand light, limit 8, detail full",
        took: "fellowproducts-com--pages-app, goodeggs-com, eater-com, mirazur-fr--en-reservation-html, ritual-com, cooking-nytimes-com--about-us, chickfila-com; goodeggs and ritual were the useful ones.",
      },
      {
        tool: "search_screens",
        args: "query \"craft product catalogue with prices, rustic heritage brand, serif display\", displayClass roman-serif, paperBand light, limit 8, detail full",
        took: "craft-do, casper-com, fermliving-com--products-muses-clio, classcreator-io, claude-ai, cluely-com--blog, zed-dev, svelte-dev; fermliving was the one that fit.",
      },
      {
        tool: "find_reference_components",
        args: "type hero",
        took: "Seven canonical hero JSX shapes; the split-screen one (typography on one half, pure-CSS atmospheric panel on the other) is the skeleton of this fold.",
      },
      {
        tool: "find_components",
        args: "type footer, color earthy, mode light, limit 6",
        took: "Only arcteryx-com came back, a product page crop; not used.",
      },
      {
        tool: "find_examples_for_macrostructure",
        args: "name catalogue, limit 6, detail full",
        took: "Thin coverage, only emigre-com; confirmed a product-grid landing should borrow from portfolio-grid sites instead.",
      },
      {
        tool: "get_screen",
        args: "slug fermliving-com--products-muses-clio",
        took: "Full record and autopsy: warm beige ground, black rectangular add-to-cart, small scale jump.",
      },
      {
        tool: "find_components",
        args: "type pricing, color warm, mode light, limit 6",
        took: "Zero results.",
      },
      {
        tool: "search_screens",
        args: "query \"farm, countryside, terroir, wine estate, heritage producer\", vibe warm, color earthy, limit 8, detail full",
        took: "museum-wales, cornellbotanicgardens-org, snowpeak-com, daptonerecords-com, everlane-com, fermliving-com--products-muses-clio, warbyparker-com, lyft-com; snowpeak and warbyparker became primary references.",
      },
      {
        tool: "get_design_system",
        args: "slug warbyparker-com, live false",
        took: "Type ramp (55px serif h1 at 400, 16px body, 13px caption), radius scale up to 50px pills, colour roles.",
      },
      {
        tool: "get_screen",
        args: "slug snowpeak-com",
        took: "Full autopsy: one object hero, low-left headline, promise band below the fold.",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "Seven footer archetypes; the Address card (Ft8) is the footer here, with no social row and no link map.",
      },
      {
        tool: "find_reference_components",
        args: "type stat",
        took: "Six stat shapes; the 4-stat row became the proof strip, the 6-stat grid became the farms grid, the single hero stat became the 11 degrees in the cave section.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f1ebe0",
        from: "Page ground. A cream between warbyparker's #e4d4cc and fermliving's #daccb8, lightened so the long product sections stay airy.",
      },
      {
        token: "--curd",
        hex: "#faf6ec",
        from: "Card and panel surface for cheeses, steps, hours and the map; one step lighter than paper so cards lift without borders.",
      },
      {
        token: "--ink",
        hex: "#1f1a14",
        from: "All text, the solid pill buttons and the basket outline; a warm near-black rather than pure black so it sits on cream.",
      },
      {
        token: "--muted",
        hex: "#6e6256",
        from: "Secondary copy, eyebrows, prices' units and footer notes.",
      },
      {
        token: "--rule",
        hex: "#d9cfbf",
        from: "Every hairline: nav border, proof strip, farm grid gutters, season rows and hours tables.",
      },
      {
        token: "--rind",
        hex: "#b8641f",
        from: "The single accent, a washed rind orange pulled from goodeggs' honey and fermliving's #cd7f31. Lands on italic headline words, the eyebrow dash, the tour button and the current-season marker.",
      },
      {
        token: "--cave",
        hex: "#2b2622",
        from: "The one dark band, the cave section, so eleven degrees reads as somewhere else on the page.",
      },
    ],
    highlight: "The hero panel is a pure CSS and SVG composition instead of a photograph: a warm radial-gradient field with a faint scan-line multiply layer, a drawn cheese wheel with a wedge cut out so the paste shows, a stamped year on the rind, an \"11°C\" reading pinned top right and a card at the bottom that names a real wheel number and price. It takes snowpeak's one-object hero and ritual's split panel but draws the object, which lets the page ship self-contained and gives the cave temperature a place on the fold before the reader ever scrolls to the cave section, where the same number returns at nine rem.",
  },
  {
    slug: "startup-law",
    brand: "Calder & Rowe",
    tagline: "A three-partner London law firm for startups where every matter is quoted as a fixed fee in writing.",
    prompt: "A law firm for startups: serious, editorial serif, fixed fees, calm.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 7.5,
    references: [
      {
        slug: "contralabs-com",
        took: "Warm stone paper with deep burgundy-brown serif text and a light-weight Source Serif 4 display face; the page's paper, ink and accent tokens come from this palette, and the headline weight (300) follows its lead.",
      },
      {
        slug: "magnumphotos-com",
        took: "A centred italic serif pull quote at display scale, with the attribution tucked beneath in muted grey; became the statement section between the fee list and the partners.",
      },
      {
        slug: "maggieappleton-com",
        took: "Warm off-white ground, a muted plum accent that lands only on links, and every link terminating in an arrow rather than a button; the hero's secondary \"See the fee list\" link and the restraint on buttons come from here. Its DESIGN.md gave the serif-display, sans-meta split and a 132px top step for the section rhythm.",
      },
      {
        slug: "harvard-edu",
        took: "Asymmetric split of a large left-aligned headline against a smaller block of body text on the same grid, no containing box; used for every section head (meta label in columns 1 to 2, heading in columns 3 to 9).",
      },
      {
        slug: "daniel-do",
        took: "Italic serif for one emphasised phrase inside an otherwise upright headline; the italic accent word in the hero and closing headline follows this.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "brief \"A law firm for startups: serious, editorial serif, fixed fees, calm\", mode light, vibe serious",
        took: "Picked Marquee Hero, returned wallpaper-com, harvard-edu--about, factmag-com, rivian-com, hbo-com--about, the Marquee hero JSX (mono dateline in a 2-column margin, headline in the remaining 10) and the spacing guidance (96px median seam, padding-inline only on containers).",
      },
      {
        tool: "search_screens",
        args: "query \"law firm professional services editorial serif calm fixed fees\", displayClass roman-serif, paperBand light, limit 8",
        took: "eyemagazine-com, daniel-do, maggieappleton-com, fermliving-com--products-muses-clio, magnumphotos-com--about-magnum, handhold-io, contralabs-com, bbc-com; the serif-on-light-paper set the build leans on.",
      },
      {
        tool: "search_screens",
        args: "query \"quiet editorial serif landing page, long document, serious, calm\", style editorial, vibe calm, mode light, limit 8",
        took: "psyche-co, effectivealtruism-org, craigmod-com, lookback-com, flomoapp-com, daniel-do, newmuseum-org--about, bluebottlecoffee-com; confirmed the warm off-white paper band and that calm pages keep one accent off the headline.",
      },
      {
        tool: "find_components",
        args: "type pricing, style editorial, mode light, limit 8",
        took: "Crops from amie-so, area17-com, babbel-com, barbican-org-uk, beauxartsparis-fr; none were fixed-fee menus, which pushed the build towards the reference JSX instead.",
      },
      {
        tool: "find_reference_components",
        args: "type pricing",
        took: "Seven archetypes; the per-use \"line items\" component (label plus note on the left, price on the right, hairline rows, hover colour shift) is the skeleton of the fee list.",
      },
      {
        tool: "get_screen",
        args: "slug contralabs-com",
        took: "Full record and autopsy: #d2cbb3 stone, #652c21 burgundy-brown, Source Serif 4 light, dark pill plus outlined pill; palette and display weight.",
      },
      {
        tool: "get_screen",
        args: "slug magnumphotos-com--about-magnum",
        took: "Full record and autopsy: centred italic pull quote as hero, #424242 and #7f7f7f monochrome text, hairline nav rule; the statement section.",
      },
      {
        tool: "get_design_system",
        args: "slug maggieappleton-com, live false",
        took: "Type ramp (82px serif h1 at weight 400, sans meta), spacing scale up to 132px, cream tokens #f6f5f1 and #fcfbf7, crimson #5f023e.",
      },
      {
        tool: "find_reference_components",
        args: "type footer",
        took: "Seven archetypes; the Address card (find us, write, hours, plus a rule and a one-line colophon, no social row) is the footer here, with the regulator paragraph added.",
      },
      {
        tool: "find_reference_components",
        args: "type nav",
        took: "Seven archetypes; Inline minimal (wordmark left, links inline, a tighter utility cluster right) is the nav.",
      },
      {
        tool: "search_screens",
        args: "query \"team partners profiles about page serif institutional\", pageType about, mode light, limit 5",
        took: "harvard-edu--about, gallery-com--about, render-com--about, maggieappleton-com--about, ghost-org--about; the Harvard split and Maggie Appleton's name, role, italic subline stack shaped the partner cards.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f3efe7",
        from: "Page ground. Warmer than Maggie Appleton's #f6f5f1 and lighter than Contra Labs' #d2cbb3 stone, so the serif reads as ink on paper without the page going beige.",
      },
      {
        token: "--paper-deep",
        hex: "#eae4d8",
        from: "Alternating band behind the fee list, the partners, the not-covered section and the footer; one step down from paper so sections separate without a hard colour change.",
      },
      {
        token: "--ink",
        hex: "#1e1a16",
        from: "All headings and body. Near-black with a warm cast so it sits on the paper rather than on top of it.",
      },
      {
        token: "--muted",
        hex: "#6f665c",
        from: "Meta labels, ledes, descriptions and attributions; the Magnum #7f7f7f role, warmed to match the paper.",
      },
      {
        token: "--rule",
        hex: "#d6cec0",
        from: "Every hairline: nav, section seams, the practice grid, fee rows, footer. Low contrast on purpose so structure is felt, not seen.",
      },
      {
        token: "--accent",
        hex: "#6b2a21",
        from: "Burgundy-brown from Contra Labs. Lands only on the ampersand in the wordmark, one italic word per headline, the practice numbers, checked fee rows, arrows and the step numerals. Never on a whole heading.",
      },
      {
        token: "--accent-ink",
        hex: "#f7f1e8",
        from: "Text on the accent fill when the solid button hovers.",
      },
    ],
    highlight: "The fee list is the page. Instead of tiers, it is a menu of eight matters set as hairline rows with the price on the right, taken from Inspo's per-use pricing reference, and each row carries a small round checkbox: tick the matters you need and a quiet card on the left totals them in the same light serif as the headline, with the VAT and filing-fee caveat underneath. It turns \"fixed fees\" from a claim into something you can add up before you have spoken to anyone, which is the whole premise of the firm, and it does so without a calculator widget, a slider or a colour change louder than the burgundy dot.",
  },
];

export function getExample(slug: string): Example | undefined {
  return EXAMPLES.find((e) => e.slug === slug);
}
