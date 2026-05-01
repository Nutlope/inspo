import type { ScreenSummary, Collection, DesignSystem } from "@inspo/shared";

/**
 * Seed data for the catalogue. Single source of truth for dev:
 * - The gallery + MCP read from here when DATABASE_URL is unset.
 * - The seed script writes these same rows into Postgres when it is set.
 *
 * Every entry is shaped exactly like what the MCP server returns, so
 * building against this fixture means the wire format is real.
 *
 * Phase 2 — fixtures don't carry a real type ramp / spacing scale; they
 * default to empty. The detail page hides the Design system block when
 * there's nothing extracted (so dev mode stays clean). Real captures
 * fill these in via the worker.
 */

const placeholder = (slug: string, variant: "hero" | "full" | "thumb") =>
  `/api/placeholder/${slug}/${variant}`;

const EMPTY_DESIGN_SYSTEM: DesignSystem = {
  typeRamp: [],
  spacingScale: [],
  radiusScale: [],
  containerWidth: null,
  cssVariables: {},
  colorWords: [],
};

type RawFixture = Omit<ScreenSummary, "designSystem"> &
  Partial<Pick<ScreenSummary, "designSystem">>;

const _screens: RawFixture[] = [
  {
    id: "01",
    slug: "atelier-mira",
    title: "Atelier Mira",
    sourceUrl: "https://example.com/atelier-mira",
    designerCredit: "Studio Brut",
    capturedAt: "2026-04-22",
    imageUrl: placeholder("atelier-mira", "hero"),
    fullPageUrl: placeholder("atelier-mira", "full"),
    thumbUrl: placeholder("atelier-mira", "thumb"),
    description:
      "An architecture studio's portfolio set on warm paper with oversized serif headings and asymmetric column-breaks.",
    palette: ["#F1ECE2", "#1A1814", "#8C5A3A", "#C2B89E"],
    fonts: ["Fraunces", "Inter Tight"],
    tech: ["Next.js", "Tailwind", "Vercel"],
    mode: "light",
    tags: {
      style: ["editorial", "minimalism"],
      industry: ["agency", "portfolio"],
      components: ["sticky-nav", "hero-fullbleed", "case-study-card"],
      vibe: ["luxe", "calm"],
      macrostructure: "specimen",
      hallmarkTheme: "editorial:atelier",
    },
  },
  {
    id: "02",
    slug: "longbow-fintech",
    title: "Longbow",
    sourceUrl: "https://example.com/longbow",
    designerCredit: "North Studio",
    capturedAt: "2026-04-20",
    imageUrl: placeholder("longbow-fintech", "hero"),
    fullPageUrl: placeholder("longbow-fintech", "full"),
    thumbUrl: placeholder("longbow-fintech", "thumb"),
    description:
      "A treasury-management dashboard marketing site — slate dark mode, monospaced data, a stat-led hero.",
    palette: ["#0B0F12", "#E6EAF0", "#3FA67A", "#F5C24E"],
    fonts: ["Inter", "JetBrains Mono"],
    tech: ["Next.js", "Tailwind", "Cloudflare"],
    mode: "dark",
    tags: {
      style: ["dark-mode", "minimalism"],
      industry: ["fintech", "saas"],
      components: ["sticky-nav", "stat-strip", "feature-trio", "logo-cloud"],
      vibe: ["technical", "serious"],
      macrostructure: "stat-led",
      hallmarkTheme: "technical:midnight",
    },
  },
  {
    id: "03",
    slug: "field-notes-cms",
    title: "Field Notes",
    sourceUrl: "https://example.com/field-notes",
    designerCredit: "Daniel Aagentah",
    capturedAt: "2026-04-19",
    imageUrl: placeholder("field-notes-cms", "hero"),
    fullPageUrl: placeholder("field-notes-cms", "full"),
    thumbUrl: placeholder("field-notes-cms", "thumb"),
    description:
      "A long-form CMS landing built like a magazine — single column, drop caps, sidenotes in mono.",
    palette: ["#FAF6EE", "#161616", "#A03222", "#D5CCB6"],
    fonts: ["GT Sectra", "Inter Tight", "JetBrains Mono"],
    tech: ["Astro", "Tailwind"],
    mode: "light",
    tags: {
      style: ["editorial", "vintage"],
      industry: ["media", "saas"],
      components: ["hero-with-cta", "feature-alternating", "testimonial-quote"],
      vibe: ["calm", "warm"],
      macrostructure: "long-document",
      hallmarkTheme: "editorial:newsprint",
    },
  },
  {
    id: "04",
    slug: "compass-bento",
    title: "Compass AI",
    sourceUrl: "https://example.com/compass",
    designerCredit: "Vector House",
    capturedAt: "2026-04-18",
    imageUrl: placeholder("compass-bento", "hero"),
    fullPageUrl: placeholder("compass-bento", "full"),
    thumbUrl: placeholder("compass-bento", "thumb"),
    description:
      "Workflow-automation product page told entirely as a single, asymmetric bento grid of feature cards.",
    palette: ["#0E0E12", "#FFFFFF", "#FF7A1A", "#34C8FF"],
    fonts: ["Geist", "Geist Mono"],
    tech: ["Next.js", "Tailwind", "Vercel"],
    mode: "dark",
    tags: {
      style: ["bento", "futurist"],
      industry: ["ai", "saas", "developer-tools"],
      components: ["bento-grid", "sticky-nav", "feature-trio"],
      vibe: ["loud", "technical"],
      macrostructure: "bento-grid",
      hallmarkTheme: "technical:midnight",
    },
  },
  {
    id: "05",
    slug: "salon-east",
    title: "Salon East",
    sourceUrl: "https://example.com/salon-east",
    designerCredit: "Aiko Tanaka",
    capturedAt: "2026-04-16",
    imageUrl: placeholder("salon-east", "hero"),
    fullPageUrl: placeholder("salon-east", "full"),
    thumbUrl: placeholder("salon-east", "thumb"),
    description:
      "A boutique restaurant's site — cream backgrounds, hand-set italics, photography that breathes.",
    palette: ["#F4EFE3", "#2A2017", "#94755A", "#D6C2A3"],
    fonts: ["Editorial New", "Söhne"],
    tech: ["Webflow"],
    mode: "light",
    tags: {
      style: ["editorial", "minimalism"],
      industry: ["hospitality"],
      components: ["hero-fullbleed", "feature-alternating", "footer-compact"],
      vibe: ["luxe", "warm", "calm"],
      macrostructure: "photographic",
      hallmarkTheme: "soft:salon",
    },
  },
  {
    id: "06",
    slug: "rave-tools",
    title: "Rave Tools",
    sourceUrl: "https://example.com/rave-tools",
    designerCredit: "Static Studio",
    capturedAt: "2026-04-15",
    imageUrl: placeholder("rave-tools", "hero"),
    fullPageUrl: placeholder("rave-tools", "full"),
    thumbUrl: placeholder("rave-tools", "thumb"),
    description:
      "A keyboard-first dev tool. Pure terminal aesthetic — green-on-black, monospaced everything, ASCII dividers.",
    palette: ["#0A0A0A", "#A8FF60", "#C7C7C7", "#202020"],
    fonts: ["JetBrains Mono", "IBM Plex Mono"],
    tech: ["SvelteKit", "Tailwind"],
    mode: "dark",
    tags: {
      style: ["dark-mode", "brutalism", "monochrome"],
      industry: ["developer-tools"],
      components: ["sticky-nav", "hero-with-cta", "comparison-table"],
      vibe: ["technical", "raw"],
      macrostructure: "workbench",
      hallmarkTheme: "technical:terminal",
    },
  },
  {
    id: "07",
    slug: "fern-and-co",
    title: "Fern & Co.",
    sourceUrl: "https://example.com/fern",
    designerCredit: "Quiet Brands",
    capturedAt: "2026-04-14",
    imageUrl: placeholder("fern-and-co", "hero"),
    fullPageUrl: placeholder("fern-and-co", "full"),
    thumbUrl: placeholder("fern-and-co", "thumb"),
    description:
      "A houseplant subscription service — moss greens, soft drop-shadows, gentle scroll-led storytelling.",
    palette: ["#EDEFE4", "#2D3522", "#7B9166", "#C9D2B6"],
    fonts: ["Tiempos", "Inter Tight"],
    tech: ["Shopify", "Liquid"],
    mode: "light",
    tags: {
      style: ["minimalism", "vintage"],
      industry: ["ecommerce"],
      components: ["hero-with-cta", "feature-alternating", "newsletter-signup"],
      vibe: ["soft", "warm", "calm"],
      macrostructure: "feature-stack",
      hallmarkTheme: "soft:garden",
    },
  },
  {
    id: "08",
    slug: "post-office-wire",
    title: "Post Office Wire",
    sourceUrl: "https://example.com/post-office",
    designerCredit: "Common House",
    capturedAt: "2026-04-12",
    imageUrl: placeholder("post-office-wire", "hero"),
    fullPageUrl: placeholder("post-office-wire", "full"),
    thumbUrl: placeholder("post-office-wire", "thumb"),
    description:
      "An indie newsletter platform written like a manifesto — black ink, oversized serif, declarative copy.",
    palette: ["#FFFFFF", "#000000", "#D62D2D", "#EDEDED"],
    fonts: ["Times Now", "Söhne Mono"],
    tech: ["Eleventy"],
    mode: "light",
    tags: {
      style: ["brutalism", "editorial", "monochrome"],
      industry: ["media", "creator"],
      components: ["hero-fullbleed", "feature-alternating", "newsletter-signup"],
      vibe: ["loud", "serious"],
      macrostructure: "manifesto",
      hallmarkTheme: "bold:manifesto",
    },
  },
  {
    id: "09",
    slug: "klein-research",
    title: "Klein Research",
    sourceUrl: "https://example.com/klein",
    designerCredit: "B-Side",
    capturedAt: "2026-04-10",
    imageUrl: placeholder("klein-research", "hero"),
    fullPageUrl: placeholder("klein-research", "full"),
    thumbUrl: placeholder("klein-research", "thumb"),
    description:
      "An AI-research lab homepage. Data viz embedded in a quiet grid; footnotes in mono; almost no marketing voice.",
    palette: ["#F8F8F6", "#0F1115", "#2563EB", "#94A3B8"],
    fonts: ["Söhne", "JetBrains Mono"],
    tech: ["Next.js", "Tailwind"],
    mode: "light",
    tags: {
      style: ["minimalism", "swiss"],
      industry: ["ai", "education"],
      components: ["sticky-nav", "stat-strip", "feature-trio", "blog-grid"],
      vibe: ["technical", "serious", "calm"],
      macrostructure: "index-first",
      hallmarkTheme: "technical:almanac",
    },
  },
  {
    id: "10",
    slug: "courtside",
    title: "Courtside",
    sourceUrl: "https://example.com/courtside",
    designerCredit: "Halftime",
    capturedAt: "2026-04-08",
    imageUrl: placeholder("courtside", "hero"),
    fullPageUrl: placeholder("courtside", "full"),
    thumbUrl: placeholder("courtside", "thumb"),
    description:
      "A sports-betting product page. Saturated reds, condensed sans, oversized stats, full-bleed photography.",
    palette: ["#0E0E0E", "#F2F2F2", "#FF2D2D", "#FFD600"],
    fonts: ["Druk Wide", "Inter"],
    tech: ["Astro"],
    mode: "dark",
    tags: {
      style: ["maximalism", "dark-mode"],
      industry: ["media"],
      components: ["hero-fullbleed", "stat-strip", "marquee-logos"],
      vibe: ["loud", "raw"],
      macrostructure: "marquee-hero",
      hallmarkTheme: "bold:sport",
    },
  },
  {
    id: "11",
    slug: "linen-co",
    title: "Linen Co.",
    sourceUrl: "https://example.com/linen-co",
    designerCredit: "Pale Studio",
    capturedAt: "2026-04-06",
    imageUrl: placeholder("linen-co", "hero"),
    fullPageUrl: placeholder("linen-co", "full"),
    thumbUrl: placeholder("linen-co", "thumb"),
    description:
      "A linen-bedding D2C site that reads like a long letter — second-person copy, single column, soft photography.",
    palette: ["#F5EFE8", "#2A2622", "#B59F8C", "#E5D9CB"],
    fonts: ["Editorial New", "Inter Tight"],
    tech: ["Shopify"],
    mode: "light",
    tags: {
      style: ["minimalism", "vintage"],
      industry: ["ecommerce"],
      components: ["hero-with-cta", "feature-alternating", "testimonial-quote"],
      vibe: ["soft", "luxe"],
      macrostructure: "letter",
      hallmarkTheme: "soft:linen",
    },
  },
  {
    id: "12",
    slug: "pantograph",
    title: "Pantograph",
    sourceUrl: "https://example.com/pantograph",
    designerCredit: "Section Studio",
    capturedAt: "2026-04-04",
    imageUrl: placeholder("pantograph", "hero"),
    fullPageUrl: placeholder("pantograph", "full"),
    thumbUrl: placeholder("pantograph", "thumb"),
    description:
      "A design-system marketing page rendered as a live component playground — every section is a working demo.",
    palette: ["#FFFFFF", "#0E0E0E", "#5B5BD6", "#F0F0F0"],
    fonts: ["Inter", "Geist Mono"],
    tech: ["Next.js", "Tailwind"],
    mode: "light",
    tags: {
      style: ["swiss", "minimalism"],
      industry: ["developer-tools", "saas"],
      components: ["sticky-nav", "feature-trio", "comparison-table"],
      vibe: ["technical", "calm"],
      macrostructure: "component-playground",
      hallmarkTheme: "technical:almanac",
    },
  },
  {
    id: "13",
    slug: "ruby-archive",
    title: "Ruby Archive",
    sourceUrl: "https://example.com/ruby",
    designerCredit: "Felix Park",
    capturedAt: "2026-04-02",
    imageUrl: placeholder("ruby-archive", "hero"),
    fullPageUrl: placeholder("ruby-archive", "full"),
    thumbUrl: placeholder("ruby-archive", "thumb"),
    description:
      "A photographer's portfolio set as an Index-First archive — every project listed by name on the home, photo on hover.",
    palette: ["#FAFAFA", "#111111", "#9A1F1F", "#DCDCDC"],
    fonts: ["Garamond", "Inter Tight"],
    tech: ["Cargo"],
    mode: "light",
    tags: {
      style: ["minimalism", "editorial"],
      industry: ["portfolio", "creator"],
      components: ["sticky-nav", "blog-grid"],
      vibe: ["calm", "luxe"],
      macrostructure: "index-first",
      hallmarkTheme: "editorial:specimen",
    },
  },
  {
    id: "14",
    slug: "boulevard-bar",
    title: "Boulevard Bar",
    sourceUrl: "https://example.com/boulevard-bar",
    designerCredit: "Night Class",
    capturedAt: "2026-03-30",
    imageUrl: placeholder("boulevard-bar", "hero"),
    fullPageUrl: placeholder("boulevard-bar", "full"),
    thumbUrl: placeholder("boulevard-bar", "thumb"),
    description:
      "A cocktail bar's site — deep maroon, neon accent, italic display serif, full-bleed photography of glassware.",
    palette: ["#1A0F12", "#F2E2D4", "#E1342B", "#8C2A2F"],
    fonts: ["Reckless", "Söhne"],
    tech: ["Webflow"],
    mode: "dark",
    tags: {
      style: ["maximalism", "vintage", "dark-mode"],
      industry: ["hospitality"],
      components: ["hero-fullbleed", "feature-alternating", "footer-compact"],
      vibe: ["luxe", "warm"],
      macrostructure: "photographic",
      hallmarkTheme: "bold:brutal",
    },
  },
  {
    id: "15",
    slug: "stack-academy",
    title: "Stack Academy",
    sourceUrl: "https://example.com/stack-academy",
    designerCredit: "Carry Studio",
    capturedAt: "2026-03-28",
    imageUrl: placeholder("stack-academy", "hero"),
    fullPageUrl: placeholder("stack-academy", "full"),
    thumbUrl: placeholder("stack-academy", "thumb"),
    description:
      "Online developer education — bright accent, generous figure-and-caption layout, conversational FAQ at the bottom.",
    palette: ["#F4F1EC", "#101111", "#FF5436", "#94A3B8"],
    fonts: ["Inter", "Source Serif"],
    tech: ["Next.js", "Tailwind"],
    mode: "light",
    tags: {
      style: ["minimalism", "playful"],
      industry: ["education", "developer-tools"],
      components: ["hero-with-cta", "feature-alternating", "faq-accordion"],
      vibe: ["warm", "calm"],
      macrostructure: "conversational-faq",
      hallmarkTheme: "soft:linen",
    },
  },
  {
    id: "16",
    slug: "switchyard-os",
    title: "Switchyard OS",
    sourceUrl: "https://example.com/switchyard",
    designerCredit: "Module House",
    capturedAt: "2026-03-26",
    imageUrl: placeholder("switchyard-os", "hero"),
    fullPageUrl: placeholder("switchyard-os", "full"),
    thumbUrl: placeholder("switchyard-os", "thumb"),
    description:
      "Open-source developer platform marketing site. Every section is a different module; the page itself is an ecosystem index.",
    palette: ["#0F0F10", "#FFFFFF", "#5BFFB1", "#444"],
    fonts: ["Geist", "Geist Mono"],
    tech: ["Next.js", "Tailwind"],
    mode: "dark",
    tags: {
      style: ["dark-mode", "futurist", "swiss"],
      industry: ["developer-tools", "ai"],
      components: ["sticky-nav", "logo-cloud", "comparison-table", "footer-mega-menu"],
      vibe: ["technical", "loud"],
      macrostructure: "ecosystem-index",
      hallmarkTheme: "technical:terminal",
    },
  },
];

export const screens: ScreenSummary[] = _screens.map((s) => ({
  ...s,
  designSystem: s.designSystem ?? EMPTY_DESIGN_SYSTEM,
}));

export const collections: Collection[] = [
  {
    id: "c01",
    slug: "editorial-layouts",
    title: "Editorial Layouts",
    number: "01",
    date: "04 — 2026",
    editorBlurb:
      "Six sites that read like printed objects. Drop caps, single columns, footnotes set in mono. The screen, finally, behaving like a page.",
    coverScreenSlug: "atelier-mira",
    screens: [
      {
        slug: "atelier-mira",
        editorNote:
          "The opening — a foundry-grade specimen page that knows when to stop talking.",
        span: 3,
      },
      {
        slug: "field-notes-cms",
        editorNote:
          "The CMS, written like a manifesto. Drop caps and a sidenote rail.",
        span: 2,
      },
      { slug: "ruby-archive", span: 1 },
      {
        slug: "post-office-wire",
        editorNote: "Black on white, set in serif, set on fire.",
        span: 2,
      },
      { slug: "linen-co", span: 1 },
    ],
  },
  {
    id: "c02",
    slug: "dark-product-pages",
    title: "Dark Product Pages",
    number: "02",
    date: "04 — 2026",
    editorBlurb:
      "Five product pages that earn their dark mode — not by inverting a light theme, but by composing for it from the start.",
    coverScreenSlug: "compass-bento",
    screens: [
      {
        slug: "compass-bento",
        editorNote:
          "An asymmetric bento — every card a different size, all in service of a single hierarchy.",
        span: 3,
      },
      {
        slug: "longbow-fintech",
        editorNote: "Treasury for grown-ups. The data is the marketing.",
        span: 2,
      },
      { slug: "switchyard-os", span: 1 },
      { slug: "rave-tools", span: 1 },
      { slug: "boulevard-bar", span: 2 },
    ],
  },
  {
    id: "c03",
    slug: "soft-commerce",
    title: "Soft Commerce",
    number: "03",
    date: "04 — 2026",
    editorBlurb:
      "Five commerce sites that don't shout. Slow scroll, single columns, cream and clay, the merchandise allowed to be the loudest thing on the page.",
    coverScreenSlug: "salon-east",
    screens: [
      { slug: "salon-east", span: 3 },
      { slug: "linen-co", span: 2 },
      { slug: "fern-and-co", span: 1 },
      { slug: "boulevard-bar", span: 2 },
      { slug: "stack-academy", span: 1 },
    ],
  },
];

export const findScreen = (slug: string) =>
  screens.find((s) => s.slug === slug);

export const findCollection = (slug: string) =>
  collections.find((c) => c.slug === slug);

export const screensInCollection = (slug: string) => {
  const c = findCollection(slug);
  if (!c) return [];
  return c.screens
    .map((entry) => {
      const screen = findScreen(entry.slug);
      return screen ? { ...entry, screen } : null;
    })
    .filter(<T>(v: T | null): v is T => v !== null);
};
