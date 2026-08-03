/**
 * "Made with Inspo" - case-study manifest for the /examples pages.
 *
 * Every entry is a REAL page built using only the Inspo MCP - no design
 * skill, no template, no component library. The HTML is copied verbatim
 * into public/examples/<slug>/index.html and iframed.
 *
 * Two provenances, both recorded honestly:
 *   - Five come from the standing A/B benchmark (apps/mcp/bench), the
 *     with-Inspo arm of the 2026-07-31 run. Their briefs are the frozen
 *     corpus in bench/briefs.json.
 *   - Five were built later against the same rules, chosen to widen the
 *     range of register the gallery shows.
 *
 * Two of the benchmark pages shipped without a `<meta charset>` and
 * rendered as mojibake from disk; that one line was added and nothing
 * else was touched. It is the deliverable-hygiene slip the benchmark
 * itself caught, and the MCP now instructs agents to avoid it.
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
  /** Where the build came from: the standing benchmark, or a later run. */
  origin: "benchmark" | "gallery";
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
    slug: "driftmail",
    brand: "Driftmail",
    tagline: "Email automation for indie developers, expressed as four lines of TypeScript.",
    prompt: "Build a landing page for Driftmail, an email automation tool for indie developers.",
    stack: "pure-inspo",
    origin: "benchmark",
    mode: "dark",
    scoreSelf: 8.6,
    references: [
      {
        slug: "novu-co",
        took: "The closest peer in the returned set: a developer-notification product on a near-black ground with one bright accent. Set the green-on-charcoal register and the code-block-as-hero move.",
      },
      {
        slug: "brevo-com",
        took: "Email-platform exemplar. Contributed the plain-language feature framing and the 'free up to N' pricing line under the CTA rather than a pricing table.",
      },
      {
        slug: "campaignmonitor-com",
        took: "Second email reference. Reinforced the logo-strip-as-proof convention that became the muted 'trusted by solo builders' row under the fold line.",
      },
      {
        slug: "milanote-com",
        took: "Bento exemplar from the macrostructure pick. Informed the balance of copy column against a single product surface rather than a grid of small tiles.",
      },
      {
        slug: "abyssale-com",
        took: "Returned alongside the bento cohort; reinforced keeping one product artefact large instead of scattering several.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "Driftmail, an email automation tool for indie developers",
        took: "The only call the agent needed. Returned a Bento Grid pick, five exemplars with inline thumbnails, and a palette suggestion, and the agent went straight to code from there.",
      },
    ],
    palette: [
      {
        token: "--bg",
        hex: "#0b1210",
        from: "Near-black with a green cast, so the accent reads as part of the same family rather than a sticker on neutral charcoal.",
      },
      {
        token: "--accent",
        hex: "#3ee08a",
        from: "Signal green on the CTA, the code keywords and the status pill. One bright colour on dark, the discipline the Novu reference demonstrated.",
      },
      {
        token: "--bg-card",
        hex: "#0e1714",
        from: "Raised surface for the code window and the feature cards, one step off the page ground.",
      },
      {
        token: "--fg",
        hex: "#e9f2ee",
        from: "Off-white body and headline ink, warmed slightly green to sit inside the same palette.",
      },
      {
        token: "--muted",
        hex: "#8fa39b",
        from: "Muted sage for supporting copy, comments in the code sample, and the logo strip.",
      },
      {
        token: "--line",
        hex: "#1e2c27",
        from: "Hairline borders on the nav, the code window chrome and the section rules.",
      },
    ],
    highlight: "The hero puts the product's entire pitch inside the headline: 'Email automation is just drift.send() away', with the function call set as a real code chip in the middle of the sentence. Beside it a syntax-highlighted onboarding sequence runs in a windowed editor, and a delivered email slides in over the corner of it, so the API and its output are legible in one glance.",
  },
  {
    slug: "meridian-review",
    brand: "Meridian",
    tagline: "Architecture, criticism, and the built world, published weekly.",
    prompt: "Design the homepage for Meridian, an online architecture magazine.",
    stack: "pure-inspo",
    origin: "benchmark",
    mode: "light",
    scoreSelf: 8.4,
    references: [
      {
        slug: "dezeen-com",
        took: "The nearest real peer in the returned set. Supplied the dense editorial index convention: a cover story given a full panel, then a tight grid of everything else with section labels above each headline.",
      },
      {
        slug: "archdaily-com",
        took: "Second architecture-press reference. Confirmed the masthead-plus-section-bar navigation and the practice of running the issue number and date as a thin rule above the masthead.",
      },
      {
        slug: "designmuseum-org",
        took: "Institutional reference. Informed the restraint of the palette: warm paper, one earth accent, and photography carrying all of the colour.",
      },
      {
        slug: "bbc-com",
        took: "News-index exemplar. Contributed the ticker of breaking items under the cover story and the byline-plus-read-time convention.",
      },
      {
        slug: "flipboard-com",
        took: "Returned in the same pass; reinforced the mixed-density grid where one story is given three times the area of its neighbours.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "Homepage for Meridian, an online architecture magazine",
        took: "Opened the build. Returned a Bento Grid pick plus editorial exemplars, which the agent read as a magazine index rather than a product bento.",
      },
      {
        tool: "search_screens",
        args: "editorial architecture magazine index",
        took: "Widened the pool to the real architecture press (Dezeen, ArchDaily, Design Museum), which is where the masthead, section bar and cover-story proportions came from.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f2efe8",
        from: "Warm newsprint ground, the shared base of every editorial reference in the returned set.",
      },
      {
        token: "--ink",
        hex: "#181512",
        from: "Near-black warm ink for the masthead and headlines, never pure black.",
      },
      {
        token: "--accent",
        hex: "#a63d1e",
        from: "Burnt sienna for the masthead full stop, the italic headline phrase, section labels and the ticker bullets. The one colour that is not photography.",
      },
      {
        token: "--muted",
        hex: "#6f675c",
        from: "Warm grey for datelines, bylines and read-times, the layer of micro-type an index page runs on.",
      },
      {
        token: "--card",
        hex: "#eae6dc",
        from: "A half-step deeper paper for image wells, so illustrations sit in a frame without a border.",
      },
      {
        token: "--rule",
        hex: "#d8d2c6",
        from: "Hairline rules that carry the whole grid; there is not a single box shadow on the page.",
      },
    ],
    highlight: "Every image is generative: flat-colour SVG buildings, drawn in the page's own palette, standing in for the photography a real magazine would run. The cover story gets an illustrated civic hall with a caption rule beneath it, the latest grid gets smaller variations, and the result reads as a designed publication rather than a layout waiting for assets.",
  },
  {
    slug: "wavecast",
    brand: "Wavecast",
    tagline: "Podcast analytics for people who actually read the numbers.",
    prompt: "Create the analytics dashboard for Wavecast, a podcast hosting platform, with realistic placeholder data.",
    stack: "pure-inspo",
    origin: "benchmark",
    mode: "dark",
    scoreSelf: 8.7,
    references: [
      {
        slug: "hex-tech",
        took: "The primary dashboard reference. Set the shape of the whole application: a persistent left rail with grouped navigation, a dense header strip carrying the range switcher, and panels that hold charts rather than marketing copy.",
      },
      {
        slug: "mintlify-com",
        took: "Dark product-surface reference. Informed the panel treatment - a one-step-raised fill, a hairline border, and no shadow at all.",
      },
      {
        slug: "sardine-ai",
        took: "Fintech-dashboard exemplar. Contributed the KPI convention of an oversized figure with a small signed delta beside it, and the comparison line in muted type below.",
      },
      {
        slug: "flatfile-io",
        took: "Returned in the analytics search. Reinforced the practice of colour-coding a single series and leaving every other line neutral.",
      },
      {
        slug: "tigerbeetle-com",
        took: "Dark technical reference with a warm accent, sitting close to Wavecast's orange. Confirmed the single-accent-on-near-black discipline.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "Analytics dashboard for Wavecast, a podcast hosting platform",
        took: "Opened the build and returned the dark product-surface cohort plus a macrostructure pick, orienting the page as an application rather than a marketing site.",
      },
      {
        tool: "search_screens",
        args: "product analytics dashboard app UI dark charts",
        took: "Pulled the real dashboard set (Hex, Mintlify, Flatfile) that defined the rail, the header strip and the panel grid.",
      },
      {
        tool: "search_screens",
        args: "analytics dashboard dark data charts SaaS",
        took: "Second pass for chart treatments specifically; produced the muted-comparison-series convention and the sparkline-inside-a-KPI pattern.",
      },
    ],
    palette: [
      {
        token: "--bg",
        hex: "#0a0a0d",
        from: "Near-black application ground, the base every dashboard reference in the set converged on.",
      },
      {
        token: "--panel",
        hex: "#111116",
        from: "Panel fill, exactly one step off the ground. Depth comes from the border, not from a shadow.",
      },
      {
        token: "--accent",
        hex: "#f0703a",
        from: "Signal orange: the live series, the headline emphasis, the share button and the release marker. Everything else stays neutral so this reads as data.",
      },
      {
        token: "--green",
        hex: "#7fd6a0",
        from: "Positive delta colour on the KPI rows, used only where a number moved up.",
      },
      {
        token: "--danger",
        hex: "#e0566a",
        from: "Negative delta and the retention dip marker at the mid-roll break.",
      },
      {
        token: "--muted",
        hex: "#8d8d9b",
        from: "Axis labels, table meta and the rail's section headings, the type layer that must recede.",
      },
    ],
    highlight: "The charts are real drawings, not screenshots: an SVG download curve with a dotted episode-release marker and a shaded comparison series behind it, a retention curve that visibly dips at 24:00 with a callout explaining the mid-roll drop, and a listening-apps breakdown as proportional bars. The dashboard argues a point - 'a record month' - instead of just displaying figures.",
  },
  {
    slug: "studio-volta",
    brand: "Studio Volta",
    tagline: "A motion design practice in Berlin: title sequences, brand films, kinetic identity.",
    prompt: "Make the portfolio site for Studio Volta, a Berlin motion design studio.",
    stack: "pure-inspo",
    origin: "benchmark",
    mode: "dark",
    scoreSelf: 8.5,
    references: [
      {
        slug: "exoape-com",
        took: "The primary reference in the returned Split Studio set. Supplied the studio-portfolio grammar: an enormous wordmark treatment up top, the practice statement held small and right-aligned against it, and a live location-and-time line at the foot of the fold.",
      },
      {
        slug: "geex-arts-com",
        took: "Motion-studio peer. Confirmed the dark ground with a single hot accent and the convention of setting the manifesto line in an italic serif against an otherwise grotesque page.",
      },
      {
        slug: "furoweb-eu",
        took: "Top hit on the same pass. Informed the asymmetric fold: display type occupying the left two-thirds and everything else pushed to the right margin.",
      },
      {
        slug: "nbstudio-co-uk--about",
        took: "Design-studio about page. Contributed the restrained meta row - established year, district, timezone - as the only chrome at the bottom of the fold.",
      },
      {
        slug: "animaapp-com",
        took: "Returned in the same set; reinforced keeping the first screen almost empty and letting one typographic gesture carry it.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "Portfolio site for Studio Volta, a Berlin motion design studio",
        took: "One call, and it was enough. Returned the Split Studio pick with real studio-portfolio exemplars and a palette suggestion; the agent wrote the page directly from the thumbnails.",
      },
    ],
    palette: [
      {
        token: "--bg",
        hex: "#0c0b0a",
        from: "Warm near-black, the ground every studio reference in the set used. Warm rather than blue so the orange accent belongs to it.",
      },
      {
        token: "--accent",
        hex: "#e8420a",
        from: "Signal orange on the wordmark's second half, the italic serif word in the headline, the live location dot and the underlined link. Used four times and no more.",
      },
      {
        token: "--ink",
        hex: "#d8d2c8",
        from: "Warm off-white for display type, held slightly below pure white so the accent stays the brightest thing on the page.",
      },
      {
        token: "--ink-dim",
        hex: "#8d867a",
        from: "Muted warm grey for the practice statement and the meta row.",
      },
      {
        token: "--accent-soft",
        hex: "#fc9b7d",
        from: "Lighter tint used only in the halftone dot field, so the ghosted wordmark reads as texture rather than as a second headline.",
      },
      {
        token: "--bg-2",
        hex: "#12100e",
        from: "A single raised tone for the work tiles further down the page.",
      },
    ],
    highlight: "The fold is carried by a giant VOLTA rendered entirely as an SVG halftone dot field - a ghosted wordmark that reads as texture rather than as a heading - with the actual headline set beneath it in a grotesque broken by one italic serif word. It is the rare agent-built hero that leaves most of the screen empty on purpose.",
  },
  {
    slug: "vaultline-pricing",
    brand: "Vaultline",
    tagline: "Zero-knowledge password management, priced per seat and not per fear.",
    prompt: "Build the pricing page for Vaultline, a team password manager.",
    stack: "pure-inspo",
    origin: "benchmark",
    mode: "light",
    scoreSelf: 8.5,
    references: [
      {
        slug: "amie-so--pricing",
        took: "The lead reference: a real pricing page with numbered tiers, a monthly/yearly toggle carrying an explicit saving, and the middle plan inverted rather than merely outlined.",
      },
      {
        slug: "cleanshot-com--pricing",
        took: "Second pricing exemplar. Contributed the per-seat framing and the practice of putting the plan's one-line rationale directly under its name.",
      },
      {
        slug: "everlaw-com--pricing",
        took: "Enterprise-tier reference. Informed the 'Custom / annual' treatment and the compliance-flavoured feature language in the third column.",
      },
      {
        slug: "factory-ai--pricing",
        took: "Returned in the same pass; reinforced the 'everything in the previous tier, plus' convention that keeps a three-column table readable.",
      },
      {
        slug: "functionhealth-com--pricing",
        took: "Fifth pricing capture. Confirmed the mono eyebrow above the headline and the trial line that sits under the lede rather than inside a badge.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "Pricing page for Vaultline, a team password manager",
        took: "A single orchestrator call. Because the brief named a page type, recommend returned five real pricing captures and a canonical comparison-table component, which is the entire structure of the finished page.",
      },
    ],
    palette: [
      {
        token: "--bg",
        hex: "#f4f4f1",
        from: "Warm off-white ground. Pricing pages in the returned set were almost all light; the trust argument is easier to make on paper.",
      },
      {
        token: "--accent",
        hex: "#1f7a4d",
        from: "Vault green on the eyebrow dot, the feature checks, the toggle and the popular badge. Restricted to affirmatives, so the eye reads it as 'included'.",
      },
      {
        token: "--card-deep",
        hex: "#101312",
        from: "Near-black fill for the middle tier. Inverting the recommended plan is what the Amie reference does instead of drawing a heavier border.",
      },
      {
        token: "--ink",
        hex: "#131614",
        from: "Primary text, warm near-black rather than pure.",
      },
      {
        token: "--ink-muted",
        hex: "#5c615d",
        from: "Plan rationales, feature descriptions and the fine print under the table.",
      },
      {
        token: "--rule",
        hex: "#d6d6d0",
        from: "Hairline borders and the dashed dividers inside each plan card.",
      },
    ],
    highlight: "The page refuses the usual pricing-table hedge: the same zero-knowledge vault ships in every tier, and the copy says so in the lede. Tiers are numbered like a spec sheet, the middle one inverts to near-black instead of wearing a heavier border, and the yearly toggle states its saving as a number rather than a vague 'save more'.",
  },
  {
    slug: "ember-and-ash",
    brand: "Ember & Ash",
    tagline: "Small-batch hot sauce: six chilies, ninety days in oak, four hundred bottles at a time.",
    prompt: "A small-batch hot sauce brand: loud, saturated, playful, bold packaging-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 8.5,
    references: [
      {
        slug: "liquiddeath-com",
        took: "The deep study. Its whole strategy is one saturated field with a single acid accent and heavy sans at a 1.0 line-height, which is exactly what a packaging-led beverage brand needs. Ember & Ash inherits the move and swaps lime-on-charcoal for acid-on-chili.",
      },
      {
        slug: "drinkolipop-com",
        took: "The second beverage reference. Contributed the playful, appetite-warm register and the rounded, generous product cards that keep a loud page from reading as aggressive.",
      },
      {
        slug: "alinapapazova-framer-ai",
        took: "Top exemplar for the saturated brief: an entire page committed to one flat crimson field. Confirmed that the ground itself could be the brand colour rather than a white page with red accents.",
      },
      {
        slug: "erikjohanssonphoto-com",
        took: "Lead exemplar from the Photographic pick. Its centred-object-on-a-field composition shaped the hero's staging of a single bottle against a radial glow.",
      },
      {
        slug: "audocph-com",
        took: "Returned in the same set as the muted counterweight; used in reverse, as the thing to avoid, which is how the page ended up committing fully to saturation.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "a small-batch hot sauce brand: loud, saturated, playful, bold packaging-led",
        took: "Opened the build. Returned a Photographic pick and, more usefully, the two beverage brands (Liquid Death, Olipop) that define how this category actually looks.",
      },
      {
        tool: "get_design_system",
        args: "liquiddeath-com",
        took: "Pulled the real tokens: Acumin Pro at 60px/700 with a 1.0 line-height, a 4px spacing base, and a 0/5/50px radius set. The heavy uppercase display and the pill CTAs come from this.",
      },
    ],
    palette: [
      {
        token: "--chili",
        hex: "#d92b16",
        from: "The page ground. Committing the whole field to the brand colour is the Liquid Death move; the product then has nowhere to hide.",
      },
      {
        token: "--acid",
        hex: "#c8f24a",
        from: "Acid lime on the CTA, the bottle cap, the heat meter and the ticker bullets. The complementary jolt that keeps a red page from reading as a warning.",
      },
      {
        token: "--cream",
        hex: "#fdf3e3",
        from: "Warm off-white for display type and the product cards, which flips the page to light where the range needs to be read.",
      },
      {
        token: "--char",
        hex: "#16100d",
        from: "Near-black for the process band and the footer, giving the page a third register after chili and cream.",
      },
      {
        token: "--chili-deep",
        hex: "#9c1a0a",
        from: "Deeper red behind the marquee strip so the ticker separates from the hero without a border.",
      },
      {
        token: "--rule",
        hex: "rgba(253,243,227,.22)",
        from: "Cream at low opacity for every hairline, so rules belong to the type rather than to the background.",
      },
    ],
    highlight: "The bottle is an SVG built from scratch - layered glass gradient, cream label, mono batch line - floating on a six-second loop against a lime radial glow, with two hairline callouts annotating it like a spec drawing. The five-segment heat meter under the CTA states the actual Scoville figure, so the loudest element on the page is also the most factual.",
  },
  {
    slug: "sable-patisserie",
    brand: "Sablé",
    tagline: "A pâtisserie of eleven things, made each morning behind the counter in the 11e.",
    prompt: "A Paris patisserie: warm, appetite-led, generous photography, seasonal menu.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 8.4,
    references: [
      {
        slug: "buly1803-com",
        took: "The apothecary-shop anchor. Donated the heritage-retail voice that the carte runs on: numbered items, a price set flush right on a hairline rule, and French used as the shop actually speaks rather than as decoration.",
      },
      {
        slug: "audocph-com",
        took: "Muted-earth studio reference. Its ochre-and-taupe near-monochrome is where the warm parchment ground and the restrained rose accent came from.",
      },
      {
        slug: "standardvision-com",
        took: "Exemplar from the Marquee Hero pick. Contributed the split fold: a display line held to the left half with a single object given the right, and a caption under the object instead of a headline over it.",
      },
      {
        slug: "dropdeadgenerous-org",
        took: "Top exemplar returned for the brief. Reinforced generous line-height and a fold that is mostly air, which is what let the tart carry its half of the screen.",
      },
      {
        slug: "factmag-com",
        took: "Returned in the same pass; informed the two-column list rhythm used for the carte, where each row is a hairline apart rather than a card.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "a Paris patisserie: warm, appetite-led, generous photography, seasonal menu",
        took: "Returned the Marquee Hero pick, the canonical marquee component, and warm-toned exemplars, which set the split fold and the display-serif direction.",
      },
      {
        tool: "search_screens",
        args: "luxury fragrance perfume beauty minimal editorial product (vibe: luxe)",
        took: "Run for a sibling build, but it surfaced Buly 1803, which turned out to be the real anchor here: an actual French shop with a numbered, priced, hairline-ruled product list.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f7f1e6",
        from: "Warm parchment ground, the appetite-warm base the Audo and Buly references share.",
      },
      {
        token: "--ink",
        hex: "#2b2019",
        from: "Near-black warm brown for the display serif; pure black would go cold against the parchment.",
      },
      {
        token: "--rose",
        hex: "#b8674f",
        from: "Clay rose on the italic headline phrase, the sold-out marker and the CTA hover. The single accent, used sparingly.",
      },
      {
        token: "--gold",
        hex: "#9c7a3c",
        from: "Aged gold for the carte's item numbers, lifted from the Buly reference's numbered preparations.",
      },
      {
        token: "--muted",
        hex: "#8a7a68",
        from: "Warm taupe for the eyebrow, item descriptions and the hours block.",
      },
      {
        token: "--paper-2",
        hex: "#efe6d6",
        from: "A half-step deeper parchment for the maison band, so the page changes register without changing colour.",
      },
    ],
    highlight: "The hero's tart is hand-built SVG - a glazed ceramic plate, a pastry rim under a vanilla crème, five apricot halves with specular highlights, and a wisp of steam - and the carte beneath it is a real menu: eleven items, priced, with the Paris-Brest marked épuisé because it is only made on Fridays. The scarcity is the brand argument, so the page states it as fact.",
  },
  {
    slug: "nocturne-festival",
    brand: "Nocturne",
    tagline: "Eleven nights of independent film in Glasgow, screened on real projectors.",
    prompt: "An independent film festival: raw, brutalist, high contrast, programme-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 8.7,
    references: [
      {
        slug: "siena-film",
        took: "The deep study, and the closest peer: a film foundation running condensed display at 90px with a 0.77 line-height and -2.7px tracking on near-black. Its exposed tokens (--white #faf7ef, --red #ff0f00, a vertical stripe field) are the spine of this page.",
      },
      {
        slug: "mikkisindhunata-com",
        took: "Monochrome brutalism with one hot red. Confirmed the discipline of a single saturated colour against warm white on black, and the all-caps mono micro-labels above every section.",
      },
      {
        slug: "posterco-tv",
        took: "Returned in the same dark search. Contributed the dense bottom-of-fold index treatment that became the programme table's column rhythm.",
      },
      {
        slug: "fontwerk-com",
        took: "From the brutalism pass. Its industrial grey-and-orange specimen reinforced setting section numbers as mono labels rather than headings.",
      },
      {
        slug: "orpetron-com",
        took: "From the same pass; reinforced the stark geometric register and the practice of numbering sections 01 / 02 / 03 in the margin.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "an independent film festival: raw, brutalist, high contrast, programme-led",
        took: "Returned a Marquee Hero pick and the canonical marquee component, whose note - 'the type is the design' - the page takes literally.",
      },
      {
        tool: "search_screens",
        args: "brutalist high contrast poster type festival programme raw (style: brutalism)",
        took: "Pulled the brutalist cohort (Fontwerk, Orpetron, Flow) that set the mono-label and section-numbering conventions.",
      },
      {
        tool: "search_screens",
        args: "cinema film festival screening programme dark editorial poster (mode: dark)",
        took: "Found Siena Film - an actual film organisation - plus Poster and Mikki Sindhunata, which is where the palette and the fold composition came from.",
      },
    ],
    palette: [
      {
        token: "--black",
        hex: "#0a0a0a",
        from: "The page ground, taken from the Siena reference's --black. Everything else is one of two colours on top of it.",
      },
      {
        token: "--white",
        hex: "#faf7ef",
        from: "Warm off-white, Siena's exact --white value. Warm rather than pure so the red does not vibrate against it.",
      },
      {
        token: "--red",
        hex: "#ff2d16",
        from: "The one saturated colour, adapted from Siena's #ff0f00. It marks the middle of the wordmark, the closing date, premieres and the section numbers, and appears nowhere else.",
      },
      {
        token: "--grey",
        hex: "#7d7d76",
        from: "Warm grey for directors, venues and running times - the programme's supporting layer.",
      },
      {
        token: "--raise",
        hex: "#131313",
        from: "A single raised tone for row hovers and the strands band.",
      },
      {
        token: "--rule",
        hex: "rgba(250,247,239,.16)",
        from: "Off-white at low opacity for every rule in the programme table.",
      },
    ],
    highlight: "NOCTURNE is set at 15.5vw with the middle three letters in red, standing on a faint vertical stripe field borrowed from the Siena reference - a poster, not a heading. Below it the programme is a real table: seven films with directors, countries, running times, venues and premiere tags, dense enough that the festival looks like it exists.",
  },
  {
    slug: "halcyon-optics",
    brand: "Halcyon Optics",
    tagline: "Hand-figured apochromatic refractors, tested one at a time against an artificial star.",
    prompt: "A telescope and optics maker for amateur astronomers: technical, precise, night sky.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 8.6,
    references: [
      {
        slug: "superlist-com",
        took: "The exemplar returned for the dark technical brief. Set the deep near-black-blue ground with a single luminous radial bloom, and the convention of a product surface framed in a bordered panel beside the copy column rather than bleeding off the edge.",
      },
      {
        slug: "tigerbeetle-com",
        took: "Dark technical page with a warm accent close to Halcyon's amber, recovered from an earlier pass. Confirmed that a warm accent on a cold ground reads as instrumentation rather than as a warning.",
      },
      {
        slug: "typesense-org",
        took: "From the brutalism pass. Contributed the mono all-caps labelling used throughout the optical diagram and the specification table's column heads.",
      },
      {
        slug: "flow-org",
        took: "Returned in the same pass; reinforced the hard-edged technical register and the practice of stating a version or figure in the header strip.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "a telescope and optics maker for amateur astronomers: technical, precise, night sky (mode: dark)",
        took: "Returned a Feature Stack pick and the canonical comparison-table component, which became the specification table verbatim in structure if not in content.",
      },
      {
        tool: "search_screens",
        args: "brutalist high contrast poster type festival programme raw (style: brutalism)",
        took: "Run for the festival build, but its mono-label conventions carried over directly into this page's diagram callouts and table heads.",
      },
    ],
    palette: [
      {
        token: "--bg",
        hex: "#070a12",
        from: "Near-black with a blue cast - a night-sky ground rather than a neutral dark-mode grey.",
      },
      {
        token: "--amber",
        hex: "#f2a53c",
        from: "Amber accent throughout. Astronomers use red-amber light at the eyepiece because it preserves dark adaptation, so the accent is a fact about the domain, not a style choice.",
      },
      {
        token: "--raise",
        hex: "#0d1220",
        from: "Panel fill for the optical diagram and the section bands, one step off the ground.",
      },
      {
        token: "--ink",
        hex: "#e9edf7",
        from: "Cool off-white for headlines and body copy.",
      },
      {
        token: "--muted",
        hex: "#79839c",
        from: "Slate grey for diagram labels, table values and supporting copy.",
      },
      {
        token: "--rule",
        hex: "rgba(233,237,247,.11)",
        from: "Hairline borders on every panel, card and table row.",
      },
    ],
    highlight: "The hero's right half is a working optical diagram: incoming plane wavefronts, a three-element oil-spaced objective drawn as overlapping ellipses, the converging beam as a gradient wedge, and a marked focal plane at 714 mm, with mono callouts on leader lines that leave the tube before they set. The specification table below quotes measured wavefront figures and says outright that they are medians over the last forty units, not a marketing ceiling.",
  },
  {
    slug: "aureole-parfum",
    brand: "Auréole",
    tagline: "An independent perfumer in Paris and Grasse: four compositions in eleven years.",
    prompt: "An independent perfumer releasing a new fragrance: luxe, restrained, minimal, object-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 8.6,
    references: [
      {
        slug: "tomford-com",
        took: "The luxury-fragrance anchor. Its cool, shadowed, near-monochrome treatment - the bottle lit as a single object against restrained slender type - is the entire composition strategy of the fold.",
      },
      {
        slug: "buly1803-com",
        took: "The French apothecary reference. Contributed the aged-gold accent and the practice of naming a house's compositions by number, which became Nº 01 through Nº 04.",
      },
      {
        slug: "detroit-paris",
        took: "Returned at the top of the luxe search. Confirmed the very high contrast of tiny widely-tracked labels against large restrained display type.",
      },
      {
        slug: "quantamagazine-org",
        took: "Exemplar from the Specimen pick. Its spacious, contemplative editorial rhythm shaped the three-column note pyramid, where each movement gets a column and a list rather than a diagram.",
      },
      {
        slug: "idyllic-co-nz",
        took: "The other Specimen exemplar, and the opposite of this brief. Read as a counterweight: it is what happens when a specimen page shouts, which pushed this one further toward silence.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "an independent perfumer releasing a new fragrance: luxe, restrained, minimal, object-led",
        took: "Returned a Specimen pick - the right macrostructure for a single object presented as the whole argument - with two exemplars bracketing the register.",
      },
      {
        tool: "search_screens",
        args: "luxury fragrance perfume beauty minimal editorial product (vibe: luxe)",
        took: "Surfaced Tom Ford, Buly 1803 and Detroit Paris, which supplied the object-lit-on-neutral composition, the numbered-house convention and the brass accent.",
      },
    ],
    palette: [
      {
        token: "--bone",
        hex: "#f1efea",
        from: "Cool bone ground - deliberately not the warm cream of the pâtisserie build. The restraint is the brand.",
      },
      {
        token: "--ink",
        hex: "#191817",
        from: "Near-black for the display serif and the note values.",
      },
      {
        token: "--brass",
        hex: "#9a7b4f",
        from: "Brass on the italic half of the fragrance name, the stopper, the juice and the Nº 04 marker. The only warm note on the page.",
      },
      {
        token: "--smoke",
        hex: "#8b877e",
        from: "Warm grey for the widely-tracked micro-labels that carry all of the metadata.",
      },
      {
        token: "--bone-2",
        hex: "#e6e2da",
        from: "A half-step deeper bone for the maison band.",
      },
      {
        token: "--rule",
        hex: "#d6d1c7",
        from: "Hairlines under every note row, list item and fact - the page's only structure.",
      },
    ],
    highlight: "The fold is a three-column balance almost nobody attempts: the name right-aligned on the left, the flacon centred, and the note breakdown left-aligned on the right, so the bottle is literally the axis of the composition. The flacon is SVG with a five-stop glass gradient, a brass stopper, a fill line at the juice level and engraved lettering, and the whole page carries one accent colour used five times.",
  },
  {
    slug: "alder-money",
    brand: "Alder",
    tagline: "A shared account for the bills you both pay, and separate ones for everything else.",
    prompt: "A joint-finances app for couples: soft, warm, playful, reassuring, bento grid.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 8.5,
    references: [
      {
        slug: "owo-app",
        took: "The closest peer: a money product that reads as warm rather than institutional. Its playful-hues-on-a-soft-canvas approach is where the sage-and-clay palette came from, and it proved a finance page does not have to be blue.",
      },
      {
        slug: "brightful-me",
        took: "Lead exemplar for the brief. Contributed the pastel-on-generous-white register and the rounded, roomy card treatment that keeps a dashboard mock feeling friendly instead of clinical.",
      },
      {
        slug: "matveyan-com",
        took: "A fintech designer's own bento. Informed the discipline of the tile contents: one figure per tile, a short label above it, and no chart where a number will do.",
      },
      {
        slug: "cdbaby-com",
        took: "Returned in the same bento set. Reinforced the irregular-span grid where one tile carries the lead idea at four times the area of its neighbours.",
      },
      {
        slug: "basement-studio",
        took: "The dark counterweight in the returned set. Read as the register to avoid here, which is what pushed the page toward warm paper and away from charcoal.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "a joint-finances app for couples: soft, warm, playful, reassuring, bento grid",
        took: "Returned a Bento Grid pick with all six exemplars agreeing on it, plus the canonical bento component whose note - irregular spans defeat the 3x2 sameness - is the rule the hero grid follows.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#fbf7f2",
        from: "Warm off-white ground. The reassurance argument fails on a cold page, and every warm exemplar in the set started here.",
      },
      {
        token: "--sage",
        hex: "#5f7a5c",
        from: "Muted sage for the primary button, the brand mark and positive figures. Green without being a bank's green.",
      },
      {
        token: "--clay",
        hex: "#d97a55",
        from: "Warm clay as the second party's colour. The two people in the page each get a hue, which is the whole visual argument.",
      },
      {
        token: "--sage-soft",
        hex: "#e4ecdf",
        from: "Tinted fill for Priya's share, the status pill and the mid-page band.",
      },
      {
        token: "--clay-soft",
        hex: "#fbe6dc",
        from: "The matching tint for Sam's share, so the split reads before you read the percentages.",
      },
      {
        token: "--muted",
        hex: "#7a726a",
        from: "Warm grey for labels and secondary copy, holding the hierarchy without going cold.",
      },
    ],
    highlight: "The hero grid is a real joint account rather than a decorative mock: a shared pot with the actual split shown as two tinted panels, three bills as proportional bars, and, on its own full-width row, a separate personal account labelled 'yours alone, Priya never sees it'. The product's hardest promise is the one the layout spends the most space on.",
  },
  {
    slug: "fieldnote-db",
    brand: "Fieldnote",
    tagline: "An embedded time-series database: one dependency, one file, no server.",
    prompt: "An open-source embedded time-series database: quiet, technical, reference-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 8.5,
    references: [
      {
        slug: "daisyui-com--docs-install-lit",
        took: "The closest structural peer: a documentation page that leads with the install line and puts a code block immediately beside the pitch. The install strip and the copy button come straight from this pattern.",
      },
      {
        slug: "huggingface-co--docs",
        took: "Ecosystem-index reference. Contributed the two-column reference list where each entry is a signature, a one-line description and a version, rather than a card with an icon.",
      },
      {
        slug: "designbetter-co--docs",
        took: "The third docs capture. Reinforced the quiet grey-on-near-white register and the practice of letting rules, not boxes, do the dividing.",
      },
    ],
    mcpCalls: [
      {
        tool: "search_screens",
        args: "open source documentation reference index quiet technical (pageType: docs)",
        took: "Filtered straight to real captured documentation pages. All three returned an Ecosystem Index macrostructure, which settled the page shape before any code was written: install, why, reference, benchmarks.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#fcfcfa",
        from: "Near-white with a hint of warmth. Documentation is read for a long time, so the ground stays quiet.",
      },
      {
        token: "--moss",
        hex: "#3f6b4a",
        from: "Muted green on the primary button, the function signatures and the winning benchmark figures. One accent, used only where it means something.",
      },
      {
        token: "--code",
        hex: "#1a1c1a",
        from: "The code window's ground, dark enough to separate from the page without becoming a second theme.",
      },
      {
        token: "--rust",
        hex: "#a8552c",
        from: "A second accent held back almost entirely - it appears in the mark and nowhere else.",
      },
      {
        token: "--muted",
        hex: "#6d716b",
        from: "Grey for descriptions, table values and the version chips.",
      },
      {
        token: "--rule",
        hex: "#e2e2dc",
        from: "Hairlines. The whole page is organised by rules; there is not a single drop shadow.",
      },
    ],
    highlight: "The benchmark table includes the row where Fieldnote loses, and says why: 'fan-out across 6 nodes - not supported', because it is a library and not a cluster. The closing line is 'if you need a cluster, use a cluster'. It is the rare generated page that argues its scope honestly instead of claiming to win everywhere.",
  },
  {
    slug: "tidepool-trust",
    brand: "Tidepool Trust",
    tagline: "Kelp forest restoration on the Atlantic shelf, with the survey data published either way.",
    prompt: "A marine conservation nonprofit: deep ocean, quiet, evidence-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 8.6,
    references: [
      {
        slug: "lafamigliamysteryunfolds-gucci-com",
        took: "The strongest compositional reference returned: a very dark page lit by a single warm glow, with restrained serif display type floating over it. Adapted from amber-on-night to teal-on-deep-water.",
      },
      {
        slug: "archigreendesigns-com",
        took: "Lead exemplar for the brief. Contributed the calm, spacious environmental register and the practice of letting one large image well carry the fold beside a quiet text column.",
      },
      {
        slug: "mikkisindhunata-com",
        took: "The dark high-contrast counterweight in the set. Its discipline of one saturated accent against a near-monochrome ground is what kept the palette to kelp-green plus a single amber.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "a marine conservation nonprofit: deep ocean, quiet, evidence-led (mode: dark)",
        took: "Returned a Photographic pick and three dark exemplars. None were marine, so the useful output was compositional rather than thematic: how a dark page holds one lit object beside a restrained column.",
      },
    ],
    palette: [
      {
        token: "--abyss",
        hex: "#050f16",
        from: "The page ground: dark with a blue-green cast, so it reads as water rather than as generic dark mode.",
      },
      {
        token: "--kelp",
        hex: "#5fbf9c",
        from: "Kelp green on the primary button, the figures and the recovering sites in the evidence table. The colour of the thing being restored.",
      },
      {
        token: "--amber",
        hex: "#e8a44c",
        from: "The single warm note, on the mark and on the two sites that are not recovering. Warmth used as a warning rather than as decoration.",
      },
      {
        token: "--foam",
        hex: "#e8f1f0",
        from: "Cool off-white for the serif display and body copy.",
      },
      {
        token: "--muted",
        hex: "#7fa0a8",
        from: "Muted blue-grey for labels, captions and table values.",
      },
      {
        token: "--panel",
        hex: "#0e2330",
        from: "Raised fill for cards and the giving breakdown, one step up from the abyss.",
      },
    ],
    highlight: "The hero is a hand-drawn SVG cross-section of a restored kelp forest - light shafts, five fronds with blades, three fish, holdfasts anchored into the seabed - and the evidence table below it lists two sites that are failing, in amber, with a note explaining they sit downstream of salmon farms. The page makes its credibility argument by publishing its own bad results.",
  },
  {
    slug: "rill-radio",
    brand: "Rill",
    tagline: "Community radio from a shed in Peckham: forty-one shows a week, none of them paid.",
    prompt: "A community radio station: warm, playful, schedule-led, human.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 8.5,
    references: [
      {
        slug: "doodles-app",
        took: "Lead exemplar. Its dreamy pastel-on-dark treatment is where the peach, lilac and mint trio came from, and it showed that a dark page can be warm rather than severe.",
      },
      {
        slug: "laugh-mind-co-jp",
        took: "Violet-and-teal whimsy on a dark canvas. Reinforced the multi-hue accent approach, which is unusual on dark and is exactly right for a station with forty-one different shows.",
      },
      {
        slug: "francouvertes-com",
        took: "A music-festival page with high-energy type on a layered canvas. Informed the schedule's density and the coloured chips that mark each show's kind.",
      },
      {
        slug: "generalcondition-com",
        took: "Returned in the same pass. Contributed the retro-playful register and the confidence to let the now-playing panel be the loudest object in the fold.",
      },
      {
        slug: "clayboan-com",
        took: "The restrained counterweight; kept the display type from tipping into novelty.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "a community radio station: warm, playful, schedule-led, human (mode: dark)",
        took: "Returned a Marquee Hero pick and the playful-dark cohort. The canonical marquee component's rule - one thought set big - shaped a headline that states the whole premise in eight words.",
      },
    ],
    palette: [
      {
        token: "--night",
        hex: "#151119",
        from: "A dark ground with a purple cast rather than a neutral charcoal, so the three accents feel like they belong to it.",
      },
      {
        token: "--peach",
        hex: "#f2915e",
        from: "The live colour: the on-air dot, the primary button, the currently-broadcasting row in the schedule.",
      },
      {
        token: "--lilac",
        hex: "#a98cf0",
        from: "The second accent, on talk shows and half the equaliser bars.",
      },
      {
        token: "--mint",
        hex: "#63d0a8",
        from: "The third, on repeats and the members figure. Three accents is unusual restraint-breaking, and it is the point: this station is many different people.",
      },
      {
        token: "--cream",
        hex: "#f6efe6",
        from: "Warm off-white for headlines and show titles.",
      },
      {
        token: "--muted",
        hex: "#9b8ea3",
        from: "Muted mauve for hosts, times and secondary copy.",
      },
    ],
    highlight: "The now-playing panel is a working radio widget: a gradient cover card, an eighteen-bar equaliser animating on staggered delays, and three rows naming the host, the record currently playing and what follows at six. Below it the schedule is a real day of programming, including a 22:00 slot marked 'unhosted - assembled by whoever locks up'.",
  },
  {
    slug: "long-table-essay",
    brand: "The Long Table",
    tagline: "A reader-funded magazine: one long reported piece a fortnight, dataset included.",
    prompt: "A long-form reported essay on food systems: editorial, data-led, reader-funded magazine.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 8.7,
    references: [
      {
        slug: "dazeddigital-com",
        took: "Lead exemplar. A real magazine's fold: masthead, kicker, an enormous headline and almost nothing else. Confirmed that an essay opening should look nothing like a product hero.",
      },
      {
        slug: "on-com",
        took: "The Swiss-precision counterweight in the returned set. Contributed the restraint of the supporting layer - small, quiet labels around a large calm object - which is how the figure and its caption are set.",
      },
      {
        slug: "dezeen-com",
        took: "Recovered from the editorial work on a sibling build. Informed the kicker-plus-read-time convention and the three-up further-reading row at the foot.",
      },
      {
        slug: "quantamagazine-org",
        took: "Science-editorial reference. Its spacious, contemplative measure is the model for the single 64-character column the essay body runs in.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "a long-form reported essay on food systems: editorial, data-led, reader-funded magazine",
        took: "Returned a Photographic pick with Dazed at the top - a real magazine, which settled the fold as masthead plus kicker plus one very large headline, rather than a headline plus a call to action.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f6f3ec",
        from: "Warm newsprint. The piece is long, and a cold white ground makes a long read feel longer.",
      },
      {
        token: "--ink",
        hex: "#1f1c17",
        from: "Warm near-black for the serif display and the body column.",
      },
      {
        token: "--ochre",
        hex: "#a06a24",
        from: "The single accent: the kicker, the drop cap, the pull-quote rule and the shortest bar in the chart. It marks the argument, not the decoration.",
      },
      {
        token: "--muted",
        hex: "#77705f",
        from: "Warm grey for bylines, captions, the methodology note and the chart's axis labels.",
      },
      {
        token: "--paper-2",
        hex: "#ece7dc",
        from: "A half-step deeper paper for the figure well and the data band.",
      },
      {
        token: "--rule",
        hex: "#ddd6c6",
        from: "Hairlines throughout, including the four-cell fact strip which is drawn entirely with borders.",
      },
    ],
    highlight: "The fold gives half its width to a chart, and the chart is the argument: five bars showing where a city's vegetables actually come from, with the shortest one - 3.1% grown within fifty kilometres - in the accent colour. A note in the corner admits that 27.2% could not be classified at all, and the essay's second half is about exactly that missing quarter.",
  },
];

export function getExample(slug: string): Example | undefined {
  return EXAMPLES.find((e) => e.slug === slug);
}
