/**
 * Single source of truth for tag allow-lists.
 *
 * Imported by the worker (LLM tagging prompt), the web filter rail,
 * and the MCP server. Hard allow-lists prevent taxonomy drift across
 * thousands of captures.
 *
 * Hallmark integration — STYLES, MACROSTRUCTURES, and HALLMARK_THEMES
 * mirror the canonical vocabulary from the Hallmark design skill
 * (github.com/Luffixos/hallmark) so a screenshot tagged here can be
 * referenced directly by an agent following Hallmark's design flow.
 */

export const STYLES = [
  "minimalism",
  "editorial",
  "brutalism",
  "neumorphism",
  "glassmorphism",
  "claymorphism",
  "bento",
  "swiss",
  "maximalism",
  "playful",
  "dark-mode",
  "monochrome",
  "vintage",
  "futurist",
] as const;

export const INDUSTRIES = [
  "agency",
  "saas",
  "portfolio",
  "ecommerce",
  "fintech",
  "ai",
  "developer-tools",
  "creator",
  "media",
  "education",
  "health",
  "real-estate",
  "hospitality",
  "non-profit",
] as const;

export const COMPONENTS = [
  "sticky-nav",
  "hero-with-cta",
  "hero-fullbleed",
  "logo-cloud",
  "bento-grid",
  "feature-trio",
  "feature-alternating",
  "testimonial-wall",
  "testimonial-quote",
  "pricing-3-col",
  "pricing-toggle",
  "faq-accordion",
  "footer-mega-menu",
  "footer-compact",
  "case-study-card",
  "stat-strip",
  "marquee-logos",
  "comparison-table",
  "newsletter-signup",
  "blog-grid",
] as const;

export const VIBES = [
  "calm",
  "loud",
  "playful",
  "serious",
  "luxe",
  "raw",
  "soft",
  "technical",
  "warm",
  "cold",
] as const;

export const COLOR_WORDS = [
  "warm",
  "cool",
  "monochrome",
  "neon",
  "earthy",
  "pastel",
  "saturated",
  "muted",
  "high-contrast",
] as const;

export const MODES = ["light", "dark"] as const;

export const VIEWPORTS = ["desktop", "tablet", "mobile"] as const;

/**
 * Hallmark macrostructures — the 21 named whole-page shapes from
 * `hallmark/skill/references/macrostructures.md`. The agent picks one
 * before writing code; Inspo lets it browse real exemplars per name.
 */
export const MACROSTRUCTURES = [
  "bento-grid",
  "long-document",
  "marquee-hero",
  "stat-led",
  "workbench",
  "conversational-faq",
  "manifesto",
  "photographic",
  "quote-led",
  "specimen",
  "catalogue",
  "letter",
  "index-first",
  "narrative-workflow",
  "split-studio",
  "feature-stack",
  "type-specimen",
  "portfolio-grid",
  "map-diagram",
  "ecosystem-index",
  "component-playground",
] as const;

/**
 * Hallmark themes — 12 themes across 4 categories.
 * Stored as `category:theme` for easy filtering on either axis.
 */
export const HALLMARK_THEMES = [
  "editorial:specimen",
  "editorial:newsprint",
  "editorial:atelier",
  "soft:garden",
  "soft:salon",
  "soft:linen",
  "technical:midnight",
  "technical:terminal",
  "technical:almanac",
  "bold:brutal",
  "bold:manifesto",
  "bold:sport",
] as const;

export type Style = (typeof STYLES)[number];
export type Industry = (typeof INDUSTRIES)[number];
export type Component = (typeof COMPONENTS)[number];
export type Vibe = (typeof VIBES)[number];
export type ColorWord = (typeof COLOR_WORDS)[number];
export type Mode = (typeof MODES)[number];
export type Viewport = (typeof VIEWPORTS)[number];
export type Macrostructure = (typeof MACROSTRUCTURES)[number];
export type HallmarkTheme = (typeof HALLMARK_THEMES)[number];

/** Allow-list validators — used to reject LLM tag output that drifts. */
export const isStyle = (v: string): v is Style =>
  (STYLES as readonly string[]).includes(v);
export const isIndustry = (v: string): v is Industry =>
  (INDUSTRIES as readonly string[]).includes(v);
export const isComponent = (v: string): v is Component =>
  (COMPONENTS as readonly string[]).includes(v);
export const isVibe = (v: string): v is Vibe =>
  (VIBES as readonly string[]).includes(v);
export const isMacrostructure = (v: string): v is Macrostructure =>
  (MACROSTRUCTURES as readonly string[]).includes(v);
export const isHallmarkTheme = (v: string): v is HallmarkTheme =>
  (HALLMARK_THEMES as readonly string[]).includes(v);

/** Human-readable labels for filter rails. */
export const MACROSTRUCTURE_LABELS: Record<Macrostructure, string> = {
  "bento-grid": "Bento Grid",
  "long-document": "Long Document",
  "marquee-hero": "Marquee Hero",
  "stat-led": "Stat-Led",
  workbench: "Workbench",
  "conversational-faq": "Conversational FAQ",
  manifesto: "Manifesto",
  photographic: "Photographic",
  "quote-led": "Quote-Led",
  specimen: "Specimen",
  catalogue: "Catalogue",
  letter: "Letter",
  "index-first": "Index-First",
  "narrative-workflow": "Narrative Workflow",
  "split-studio": "Split Studio",
  "feature-stack": "Feature Stack",
  "type-specimen": "Type Specimen",
  "portfolio-grid": "Portfolio Grid",
  "map-diagram": "Map / Diagram",
  "ecosystem-index": "Ecosystem Index",
  "component-playground": "Component Playground",
};
