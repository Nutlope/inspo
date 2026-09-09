/**
 * "Made with Inspo" - case-study manifest for the /examples pages.
 *
 * Every entry is a REAL page built using only the Inspo MCP - no design
 * skill, no template, no component library. The HTML is copied verbatim
 * into public/examples/<slug>/page.html and iframed.
 *
 * Two provenances, both recorded honestly:
 *   - Five come from the standing A/B benchmark (apps/mcp/bench), the
 *     with-Inspo arm of the 2026-07-31 run. Their briefs are the frozen
 *     corpus in bench/briefs.json.
 *   - The rest were built later against the same rules, chosen to widen
 *     the range of register the gallery shows. The last twenty (Shirakawa
 *     Kiln through Sedge & Hollis) were generated on Claude Fable 5.1 at
 *     high effort on 2026-09-09, two batches of ten parallel agents with
 *     the Inspo MCP as their only tool; each made 8 to 13 calls, against
 *     the one or two the earlier pages needed.
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
  {
    slug: "nightjar-sleeper",
    brand: "Nightjar",
    tagline: "The night train from Paris to Venice: fall asleep at Gare de Lyon, wake up on the lagoon.",
    prompt: "An overnight sleeper train service: romantic, art deco, navy and gold, route-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 8.8,
    references: [
      {
        slug: "getty-edu",
        took: "The decisive reference in the returned pair: warm antique serif floating on a dark, hushed ground. Its register - elegant, institutional, unhurried - became the DM Serif Display on deep navy, with gold doing the work its ochre does.",
      },
      {
        slug: "brandappart-com",
        took: "The other returned exemplar. Its stark restraint on an near-empty field argued against decorating the fold; the page keeps one headline, one route board, and air.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "an overnight sleeper train service: romantic, art deco, navy and gold, route-led",
        took: "Returned a Specimen pick with two exemplars bracketing the register: Getty's warm serif-on-dark and Brand Appart's restraint. The route board as the hero's single specimen object follows directly from that pick.",
      },
    ],
    palette: [
      {
        token: "--navy",
        hex: "#0b1626",
        from: "Night-sky navy ground; dark with blue depth rather than neutral black, so the gold reads as lamplight.",
      },
      {
        token: "--gold",
        hex: "#c9a35c",
        from: "Brass gold on the CTA, the route line and the deco double border around the departure board. The one metallic note, used the way Getty uses ochre.",
      },
      {
        token: "--gold-2",
        hex: "#e3c98f",
        from: "Lit gold for the italic headline phrase, times on the board and hover states; the same metal catching light.",
      },
      {
        token: "--cream",
        hex: "#f0e9db",
        from: "Warm cream for the serif display and body, never pure white against the navy.",
      },
      {
        token: "--muted",
        hex: "#8fa0b8",
        from: "Blue-grey for stop notes, captions and the punctuality table's second column.",
      },
      {
        token: "--panel",
        hex: "#152741",
        from: "Raised navy for the cabin cards, one step off the ground.",
      },
    ],
    highlight: "The hero's right half is a working departure board framed in a thin gold deco border: six stops from Paris to Venezia Santa Lucia with real times down a gold route line, and notes that admit what a timetable never would ('04:47 Brig - you will be asleep'). Below, the punctuality section publishes the worst night of the season, storm at Brig included.",
  },
  {
    slug: "spark-hall",
    brand: "Spark Hall",
    tagline: "A children's science museum with 214 things that have buttons and zero glass cases.",
    prompt: "A children's science museum: playful, bright, hands-on, exhibits-led, for families.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 8.6,
    references: [
      {
        slug: "museumofmoney-com",
        took: "The anchor, and a real interactive museum: bright citrus on a clean open canvas with Archivo Black display over Manrope body. Spark Hall adopts that exact type recipe and the approachable-bold register wholesale.",
      },
      {
        slug: "bauhausclock-com",
        took: "The counterweight in the returned set: precise geometry on stark white. It kept the playfulness disciplined - big rounded shapes, but on a strict grid with consistent 2px rules.",
      },
      {
        slug: "headroom-com",
        took: "Returned in the same Marquee Hero cohort; its airy single-accent fold argued for one enormous statement headline over a busy collage, which became 'Please touch everything.'",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "a children's science museum: playful, bright, hands-on, exhibits-led, for families",
        took: "Inferred light mode from the brief, picked Marquee Hero, and surfaced a real interactive museum (Museum of Money) whose Archivo Black + Manrope pairing and citrus-on-clean palette the page is built on.",
      },
    ],
    palette: [
      {
        token: "--milk",
        hex: "#fffdf6",
        from: "Warm near-white ground, so the bright shapes pop without the page reading as a toy box.",
      },
      {
        token: "--sun",
        hex: "#ffc93d",
        from: "Sunshine yellow: the brand bolt, the big gear, the ticket highlight and Hall 1. The lead colour of four.",
      },
      {
        token: "--coral",
        hex: "#ff6b4a",
        from: "Coral for the comet, Take It Apart hall and the warm half of the shape system.",
      },
      {
        token: "--teal",
        hex: "#0fa3a0",
        from: "Teal for the flask, Water Works and the open-today pill.",
      },
      {
        token: "--violet",
        hex: "#7a63e8",
        from: "Violet for the small gear and the planetarium hall; four accents because a museum floor is many rooms, each colour-coded like its wayfinding.",
      },
      {
        token: "--ink",
        hex: "#1d1a2e",
        from: "Ink with a violet cast for the Archivo Black display, softer than pure black next to the brights.",
      },
    ],
    highlight: "The hero's contraption is an animated SVG machine: two gears meshing at different speeds (spinning on their own centres via transform-box), a bubbling flask, a comet and a ball run, drawn entirely in the museum's four wayfinding colours. The pricing says the quiet part out loud: grown-ups 12 euros, 'admitted only with a child - house rule.'",
  },
  {
    slug: "loom-audio",
    brand: "Loom Audio",
    tagline: "The Loom One: an eight-voice analog synthesizer with one knob per job.",
    prompt: "An analog synthesizer maker: warm retro-tech, tactile, cream and orange, panel-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 8.7,
    references: [
      {
        slug: "teenageengineering-com",
        took: "The obvious anchor and the top hit: hardware presented as a specimen on a calm field, mono micro-labels, and a single orange accent doing all the branding. The Loom One's panel staging, jack-label typography and orange-on-cream palette descend directly from it.",
      },
      {
        slug: "hardwareoperations-com",
        took: "Product-visualisation studio in the same result set. Its GT Pressura + Geist Mono pairing informed the Space Grotesk + JetBrains Mono system, and its warm-grey staging shaped the drop-shadowed instrument render.",
      },
    ],
    mcpCalls: [
      {
        tool: "search_screens",
        args: "synthesizer hardware audio equipment retro tactile knobs",
        took: "Went straight to search because the reference obviously existed: Teenage Engineering came back first, with Hardware Operations beside it. Between them they settled the entire visual system before a line was written.",
      },
    ],
    palette: [
      {
        token: "--shell",
        hex: "#efe9dc",
        from: "Warm cream ground, the colour of a seventies instrument case rather than a white web page.",
      },
      {
        token: "--orange",
        hex: "#e0742c",
        from: "Signal orange on the cutoff and drive knobs, the order button and the filter block in the signal path. The Teenage Engineering move: one hot accent on calm hardware.",
      },
      {
        token: "--ink",
        hex: "#26221b",
        from: "Warm near-black for type, the dark knobs and the keybed.",
      },
      {
        token: "--panel",
        hex: "#f7f3ea",
        from: "The instrument's faceplate tone, one step lighter than the page so the render reads as an object on a desk.",
      },
      {
        token: "--muted",
        hex: "#82796a",
        from: "Warm grey for the mono panel labels (cutoff, resonance, drift, drive) and spec-table values.",
      },
      {
        token: "--olive",
        hex: "#6d6f4e",
        from: "Reserved tone that ended up used only in the patch display's phosphor text; restraint left it almost unspent.",
      },
    ],
    highlight: "The hero is a full SVG render of the instrument: walnut cheeks, a cream steel panel, four large and four small knobs each with its own indicator angle, three sliders, six CV jacks, a green patch display and a 37-key keybed - every label set in the mono style Teenage Engineering uses. The spec table quotes tuning drift as plus or minus four cents an hour and calls it a feature, and the order box admits batch five sold out in nine days.",
  },
  {
    slug: "atelier-grau",
    brand: "Atelier Grau",
    tagline: "A Basel architecture practice that lists its lost competitions in the portfolio.",
    prompt: "An architecture practice: swiss grid, austere, restrained, project-index led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 8.5,
    references: [
      {
        slug: "atlassian-design",
        took: "Returned as an Ecosystem Index exemplar. A platform rather than a practice, so the useful signal was structural: an index page organised by a strict grid with one accent colour, which maps onto the swiss register the brief named.",
      },
      {
        slug: "behance-net",
        took: "The other returned exemplar, likewise a platform. Confirmed the crisp white gallery ground and the discipline of letting the work list carry the page; the practice-specific conventions (elevations, competition results, cost per square metre) came from the domain, not the references.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "an architecture practice: swiss grid, austere, restrained, project-index led",
        took: "Picked Ecosystem Index, which settled the page shape: the index is the portfolio. The returned exemplars were platforms rather than practices - recorded here honestly - so the macrostructure pick was the valuable output and the register came from the brief.",
      },
    ],
    palette: [
      {
        token: "--white",
        hex: "#fbfbfa",
        from: "Near-white ground; swiss austerity starts with refusing a tint.",
      },
      {
        token: "--ink",
        hex: "#151514",
        from: "Near-black for type and the elevation drawing's existing structure. The nav and index borders use it at full strength - 1px of ink, not grey.",
      },
      {
        token: "--red",
        hex: "#d63a26",
        from: "The single swiss red: the headline full stop, the new timber storey in the elevation, and on-site status in the index. It marks what is new or alive, nothing else.",
      },
      {
        token: "--grey",
        hex: "#f1f1ee",
        from: "A half-step grey for the practice band and row hovers.",
      },
      {
        token: "--muted",
        hex: "#7c7c76",
        from: "Mid grey for years, locations, dimension strings and the crane-track relic in the drawing.",
      },
      {
        token: "--rule",
        hex: "#e3e3de",
        from: "Hairlines inside the index; the heavier structural lines are drawn in ink.",
      },
    ],
    highlight: "The hero's drawing is a 1:200 north elevation in real architectural convention: the existing hall in ink, the proposed timber storey hatched in red, a dashed crane-track relic, scale figures, trees, and dimension lines reading 42.0 by 15.4 metres. The project index below lists the second-prize competition and the chapel whose client withdrew, because a practice that only shows victories is editing, not building.",
  },
  {
    slug: "attract-mode",
    brand: "Attract Mode",
    tagline: "A volunteer workshop that restores dying arcade cabinets and puts them back on free play.",
    prompt: "An arcade game preservation workshop: retro CRT, pixel, catalogue-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 8.6,
    references: [
      {
        slug: "emigre-com",
        took: "The structurally useful hit: a dense Catalogue macrostructure where every entry is a specimen in its own style. That is exactly what an arcade floor is, and it shaped the honestly-labelled inventory table that anchors the page.",
      },
      {
        slug: "daptonerecords-com",
        took: "A real preservation-minded label with vintage warmth. Its refusal to modernise its own aesthetic validated leading with period texture (scanlines, phosphor, a pixel display face) rather than a contemporary gloss over old subject matter.",
      },
      {
        slug: "epicgames-com",
        took: "The counterexample in the set: modern games commerce, glossy and dense. Read as what this page must not be, which pushed it toward workshop honesty - statuses, repair logs, a parts machine labelled as such.",
      },
    ],
    mcpCalls: [
      {
        tool: "search_screens",
        args: "retro arcade pixel game vintage crt archive",
        took: "Surfaced Emigre's catalogue structure, Daptone's vintage conviction and Epic's modern counterexample - between them, the shape (a specimen table), the texture (committed retro) and the tone (not a store) were all settled.",
      },
    ],
    palette: [
      {
        token: "--crt",
        hex: "#0a0d0b",
        from: "Near-black with a green cast: the tube when the game is between lives. A fixed scanline overlay sits on the whole page at 3px pitch.",
      },
      {
        token: "--phosphor",
        hex: "#52e07a",
        from: "P1 phosphor green: the pixel headline's hot words, playable statuses, the screen sprites and the free-play button.",
      },
      {
        token: "--amber",
        hex: "#f5b83d",
        from: "Marquee amber for the insert-coin line, the cabinet's marquee and bench statuses. The two-phosphor palette is the whole grammar of the era.",
      },
      {
        token: "--paper",
        hex: "#e9efe4",
        from: "Off-white with a green tint for body copy, so even the reading text sits inside the tube.",
      },
      {
        token: "--muted",
        hex: "#7d8a78",
        from: "Sage grey for table values, the parts machine and supporting copy.",
      },
      {
        token: "--panel",
        hex: "#141b12",
        from: "Raised panel for the restoration cards and the band sections.",
      },
    ],
    highlight: "The whole page sits behind a CRT scanline overlay, and the hero cabinet is drawn in crisp-edged pixel rectangles: amber marquee, a screen of phosphor sprites mid-game, joystick, two buttons and a coin door with two working-looking slots. The display face is Pixelify Sans - a pixel font with a true lowercase, so the retro voice keeps the site's no-all-caps rule - and the floor table labels one Asteroids unit 'parts machine, says so on the label.'",
  },
  {
    slug: "setwidth-foundry",
    brand: "Setwidth",
    tagline: "A one-person type foundry in Gothenburg releasing Marlin Grotesk.",
    prompt: "An independent type foundry releasing a variable grotesk: specimen-led, austere, one accent.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 8.7,
    references: [
      {
        slug: "klim-co-nz",
        took: "The deepest study of the three. A real foundry running near-monochrome geometry in boundless negative space with a single hot accent doing all the branding. Setwidth's restraint, its hairline-ruled weight ramp and its refusal to decorate the fold all come from here.",
      },
      {
        slug: "camelot-typefaces-com",
        took: "Where the acid yellow came from. Camelot uses #faf20a as a flood fill rather than as text colour, which is exactly how this page uses it: behind the baseline in the glyph study, inside the axis sliders, and on nav hover. Never on type, because it would fail contrast.",
      },
      {
        slug: "fontshare-com--changelog",
        took: "A real font-catalogue index. Contributed the weight-ramp convention: one specimen line per weight, the weight name held small at the left margin, and a hairline between each row instead of a card.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "an independent type foundry releasing a variable grotesk: specimen-led, austere, one accent (macrostructure: type-specimen)",
        took: "Passed the macrostructure explicitly rather than letting it be inferred, which skipped the pick step and returned three genuine foundries: Klim, Camelot and Fontshare. Between them they settled the palette, the ramp and the level of restraint before a line was written.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f4f3f0",
        from: "Warm near-white. A specimen page is read for a long time at large sizes, so the ground stays quiet and slightly off-white.",
      },
      {
        token: "--ink",
        hex: "#111110",
        from: "Near-black for the grotesk itself. The whole page is one typeface at nine weights; the colour has to stay out of the way.",
      },
      {
        token: "--acid",
        hex: "#e4e400",
        from: "Acid yellow, used only as a fill: the baseline band behind the glyph, the axis slider tracks, and nav hover. Lifted from Camelot, which uses its yellow the same way and never as text.",
      },
      {
        token: "--muted",
        hex: "#78766f",
        from: "Warm grey for metric labels, weight names and the licence table's second column.",
      },
      {
        token: "--paper-2",
        hex: "#eae8e3",
        from: "A half-step deeper paper for the character-set band and the slider troughs.",
      },
      {
        token: "--rule",
        hex: "#d8d5cd",
        from: "Hairlines between ramp rows and table rows. The heavier structural borders are drawn in ink at 1.5px.",
      },
    ],
    highlight: "The fold gives half its width to a single lowercase g at 250px, sitting on real metric lines with the baseline flooded acid yellow and dashed sidebearings either side, captioned with its weight and optical size. Underneath, two live axis sliders read 620 and 18 pt, so the hero is a working specimen rather than a picture of one. The licence table prices a student licence at free and says to just ask.",
  },
  {
    slug: "northline-transit",
    brand: "Northline",
    tagline: "A city transit authority: four lines, sixty-one stations, one flat fare.",
    prompt: "A city transit authority: network map, wayfinding, live service status.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 8.6,
    references: [
      {
        slug: "matveyan-com",
        took: "The more useful of the two returned exemplars: a designer's own dark page built around coolly precise data visualisation. Its discipline of letting one diagram carry the fold, on a neutral charcoal so the data colours read cleanly, is the composition this page uses.",
      },
      {
        slug: "campaignmonitor-com",
        took: "The other returned exemplar. A cool geometric dark SaaS page; contributed the raised-panel treatment for the map frame and the live-status row rhythm, but nothing about transit.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "a city transit authority: network map, wayfinding, live service status (mode: dark)",
        took: "Returned a Bento Grid pick and two SaaS exemplars. Recorded honestly: the archive has no transit authority in it, so the useful output was compositional (one diagram carrying a dark fold, raised panels, status rows) and the map convention itself came from the domain rather than from a reference.",
      },
    ],
    palette: [
      {
        token: "--slate",
        hex: "#14161a",
        from: "Neutral charcoal, chosen deliberately over the navy and green darks elsewhere in this gallery: four line colours have to read as data, and a tinted ground would bias them.",
      },
      {
        token: "--red",
        hex: "#e4483d",
        from: "The spine line, and the bar through the roundel.",
      },
      {
        token: "--blue",
        hex: "#3a86d6",
        from: "The north-south line through Cathedral and Old Foundry.",
      },
      {
        token: "--green",
        hex: "#3fae6e",
        from: "The second vertical, and the live-status pulse dot.",
      },
      {
        token: "--yellow",
        hex: "#e8b93c",
        from: "The southern link, and the one colour also used for a warning: minor delays on that line show in the same yellow.",
      },
      {
        token: "--chalk",
        hex: "#eef1f5",
        from: "Off-white for station ticks, interchange rings and headline type.",
      },
    ],
    highlight: "The map obeys one rule that most generated diagrams break: lines only ever meet at a marked interchange, so no colour is drawn on top of another. Two horizontals, two verticals and a single dogleg produce four ringed interchanges, eight named termini with proper cap bars, and tick marks for intermediate stops. The fares section says zones were removed in 2023, that it cost revenue, and that it paid for itself in eleven months.",
  },
  {
    slug: "coire-dubh",
    brand: "Coire Dubh",
    tagline: "A single malt distillery on the Sound of Sleat, distilling since 1884.",
    prompt: "A single malt whisky distillery: heritage, oak and copper, cask register.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "dark",
    scoreSelf: 8.5,
    references: [
      {
        slug: "puzzle-io",
        took: "The only exemplar the brief returned, and a fintech one. What carried over was structural rather than thematic: a dark page whose credibility rests on a data table sitting below a calm fold, which is exactly the shape a cask register needs.",
      },
    ],
    mcpCalls: [
      {
        tool: "recommend",
        args: "a single malt whisky distillery: heritage, oak and copper, cask register (mode: dark)",
        took: "Returned a Feature Stack pick and, more usefully, the canonical comparison-table component whose note reads 'thin rules, no zebra striping, hover lift to track across rows'. The cask register follows that specification exactly. The archive holds no distillery, and the manifest says so rather than inventing a lineage.",
      },
    ],
    palette: [
      {
        token: "--oak",
        hex: "#14100c",
        from: "Warm near-black, the inside of a dunnage warehouse. Deliberately browner than the navy sleeper page elsewhere in this gallery so the two heritage darks do not read as the same page twice.",
      },
      {
        token: "--copper",
        hex: "#b87333",
        from: "Literal copper, on the still, the primary button and the section labels. The material the product is made in.",
      },
      {
        token: "--amber",
        hex: "#dda94e",
        from: "Cask-strength amber for the italic headline phrase, the figures and the sight glass in the still.",
      },
      {
        token: "--cream",
        hex: "#efe6d6",
        from: "Warm off-white for the Playfair display and body copy.",
      },
      {
        token: "--muted",
        hex: "#9a8d7c",
        from: "Warm grey for cask notes, table values and the tour details.",
      },
      {
        token: "--panel",
        hex: "#241d16",
        from: "Raised oak-brown for the process cards and the visit box.",
      },
    ],
    highlight: "The hero still is drawn in section with a five-stop copper gradient across its belly, a swan neck, a lyne arm running to a ribbed condenser, hoop bands and a lit sight glass. The cask register below lists six casks with their wood and strength, including cask 087 which fell below 46% and by the distillery's own rule will not be bottled, and cask 155 which split a stave in the 2019 gales and is recorded anyway.",
  },
  {
    slug: "coldframe-seedbank",
    brand: "Coldframe",
    tagline: "A charitable seed bank for landrace crops, free to any grower who asks.",
    prompt: "A seed bank for open-pollinated landrace crops: herbarium register, botanical, evidence-led.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 8.7,
    references: [
      {
        slug: "cornellbotanicgardens-org",
        took: "A real botanic institution, and the closest peer returned. Its earthy ochre against muted sage is the exact two-accent split this page uses: moss green for the living material, ochre for the archival metadata.",
      },
      {
        slug: "archigreendesigns-com",
        took: "Contributed the calm, spacious environmental register and the practice of giving one large framed image the right half of the fold while the text column stays narrow and quiet.",
      },
      {
        slug: "greenhouse-io",
        took: "Returned in the same search. Its serif-with-italic-emphasis headline over a soft ground informed the Newsreader display with the italic clause in moss.",
      },
    ],
    mcpCalls: [
      {
        tool: "search_screens",
        args: "botanical garden herbarium plants seeds catalogue green",
        took: "Went straight to search rather than recommend, because the register shape was already known and what was needed was palette evidence. Cornell Botanic Gardens came back first and settled the ochre-and-sage split; the other two shaped the fold composition and the type.",
      },
    ],
    palette: [
      {
        token: "--paper",
        hex: "#f4f4ef",
        from: "Herbarium-sheet off-white, cooler and greyer than the warm papers elsewhere in this gallery.",
      },
      {
        token: "--moss",
        hex: "#41603a",
        from: "Living material: the botanical line drawing, the italic headline clause, the request button and the viability figures.",
      },
      {
        token: "--ochre",
        hex: "#a8863c",
        from: "Archival metadata: accession numbers, the grain detail study, and the section labels. Two accents that divide the page by what is alive and what is a record.",
      },
      {
        token: "--ink",
        hex: "#1b1f1a",
        from: "Near-black with a green cast for the Newsreader display and the register's species names.",
      },
      {
        token: "--muted",
        hex: "#767b6e",
        from: "Sage grey for common names, collection dates and the specimen label keys.",
      },
      {
        token: "--paper-2",
        hex: "#e9eae1",
        from: "A half-step deeper sheet for the how-it-works band and the mounting tape in the drawing.",
      },
    ],
    highlight: "The fold's right half is a pressed herbarium sheet: a rye specimen in botanical line art with awns, spikelets and leaves, two strips of mounting tape holding it down, a loose-grain detail study with a 10 mm scale bar, and a real determination label underneath giving accession, species, provenance and last grow-out. The register lists two lines below the 50% viability threshold and states they go into next season's grow-out ahead of everything else.",
  },
  {
    slug: "saltgate-lido",
    brand: "Saltgate Lido",
    tagline: "An unheated 1936 lido kept open all year by a trust and four hundred members.",
    prompt: "A municipal outdoor swimming pool: civic, tiled blue, timetable-led, open all year.",
    stack: "pure-inspo",
    origin: "gallery",
    mode: "light",
    scoreSelf: 8.6,
    references: [
      {
        slug: "bluebottlecoffee-com",
        took: "The palette anchor: soft muted teal against warm beige, with generous spacing. That pairing is exactly a tiled pool against a sun deck, and it is where the tile blue and sand tones came from.",
      },
      {
        slug: "centrepompidou-fr",
        took: "A real civic cultural institution. Contributed the quietly authoritative grid and the practice of putting a live practical fact (opening hours, today's status) above the headline rather than in a footer.",
      },
      {
        slug: "maggieappleton-com",
        took: "Returned in the same search. Its calm sage-and-teal register with a friendly display face informed the decision to use a soft grotesque rather than an institutional sans, so the page reads as a community pool and not a council leaflet.",
      },
    ],
    mcpCalls: [
      {
        tool: "search_screens",
        args: "swimming pool leisure centre municipal civic timetable blue",
        took: "No lido exists in the archive, so the search was run for palette and civic register rather than for a peer. Blue Bottle supplied the teal-and-sand pairing, Pompidou the civic grid, and Maggie Appleton the warmth; the pool diagram and timetable came from the domain.",
      },
    ],
    palette: [
      {
        token: "--sky",
        hex: "#eef5f7",
        from: "Pale chlorine-blue ground, the colour of the changing-room tile above the water line.",
      },
      {
        token: "--tile",
        hex: "#2b7fa8",
        from: "Pool blue: the water, the primary button, the temperature figure and the highlighted headline clause.",
      },
      {
        token: "--sand",
        hex: "#e6d9c2",
        from: "The sun deck. Everything outside the pool rectangle in the drawing is this warm stone, which is what stops a blue page going cold.",
      },
      {
        token: "--ink",
        hex: "#12222a",
        from: "Deep blue-black for the Bricolage display and body copy.",
      },
      {
        token: "--muted",
        hex: "#6d8290",
        from: "Slate blue for session details, lane allocations and the price small print.",
      },
      {
        token: "--tile-deep",
        hex: "#175d80",
        from: "The deep end. Used as the lower stop of the water gradient and for text on pale chips.",
      },
    ],
    highlight: "The hero is the pool seen from above: eight lanes on a sand-coloured deck, seven lane ropes drawn float by float with the fast lanes roped in red and yellow, lane numbers stencilled on the deck, a diving board, sun loungers and a lifebuoy. The prices section admits the trust runs a deficit on entry and covers it with membership, and the third price tier is zero, for a hardship pass that is not means-tested and that the person on the desk will not make into a conversation.",
  },
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
];

export function getExample(slug: string): Example | undefined {
  return EXAMPLES.find((e) => e.slug === slug);
}
