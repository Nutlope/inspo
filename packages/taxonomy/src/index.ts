/**
 * Single source of truth for tag allow-lists.
 *
 * Imported by the worker (LLM tagging prompt), the web filter rail,
 * and the MCP server. Hard allow-lists prevent taxonomy drift across
 * thousands of captures.
 *
 * STYLES, MACROSTRUCTURES, and the three AXES vocabularies are Inspo's
 * canonical design vocabulary, so a screenshot tagged here can be
 * referenced directly by an agent picking a named whole-page shape or
 * constructing a design system from measured evidence.
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

/**
 * Roles in a type ramp. The worker's in-page extractor walks these
 * selectors in order and pulls computed-style tokens for each.
 */
export const TYPE_ROLES = [
  "h1",
  "h2",
  "h3",
  "body",
  "caption",
  "button",
] as const;

export const VIEWPORTS = ["desktop", "tablet", "mobile"] as const;

/** Devices a capture pair actually ships for (tablet is shot but not
 *  surfaced). Used by the `device` search filter. */
export const CAPTURE_DEVICES = ["desktop", "mobile"] as const;

/**
 * The 21 named macrostructures, Inspo's named whole-page shapes. The
 * agent picks one before writing code; Inspo lets it browse real
 * exemplars per name.
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
 * The three diversification axes.
 *
 * Replaces the old 12-name `HALLMARK_THEMES` enum, which named themes
 * from one specific version of one design skill and went stale the
 * moment that skill's catalogue changed. The axes are orthogonal,
 * derivable from data every row already carries (palette + fonts), and
 * version-independent: they describe the design, not somebody's name
 * for it.
 *
 * A design skill constructing a system from Inspo's evidence reads the
 * distribution of these three across the matched exemplars, then takes
 * a deliberate position with or against it. See `deriveAxes` in
 * @inspo/shared for how each is measured.
 */

/** Surface lightness band, from the OKLCH L of the dominant colour. */
export const PAPER_BANDS = ["dark", "mid", "light"] as const;

/** The display face's construction. Ordered loosest to most specific;
 *  `grotesk-sans` is the fallback because most web faces are neo-
 *  grotesques and a wrong-but-common guess beats a null. */
export const DISPLAY_CLASSES = [
  "grotesk-sans",
  "geometric-sans",
  "roman-serif",
  "italic-serif",
  "slab-serif",
  "mono",
  "display-condensed-bold",
  "display-heavy",
  "system-native",
  "handwritten",
] as const;

/** Accent temperature, from the highest-chroma palette entry. Anything
 *  chromatic outside the warm/cool arcs is `chromatic-other`; the exact
 *  hue angle rides alongside in `Axes.accentDeg`. */
export const ACCENT_HUE_BANDS = [
  "warm",
  "cool",
  "neutral",
  "chromatic-other",
] as const;

export type Style = (typeof STYLES)[number];
export type Industry = (typeof INDUSTRIES)[number];
export type Component = (typeof COMPONENTS)[number];
export type Vibe = (typeof VIBES)[number];
export type ColorWord = (typeof COLOR_WORDS)[number];
export type Mode = (typeof MODES)[number];
export type Viewport = (typeof VIEWPORTS)[number];
export type CaptureDevice = (typeof CAPTURE_DEVICES)[number];
export type Macrostructure = (typeof MACROSTRUCTURES)[number];
export type PaperBand = (typeof PAPER_BANDS)[number];
export type DisplayClass = (typeof DISPLAY_CLASSES)[number];
export type AccentHueBand = (typeof ACCENT_HUE_BANDS)[number];
export type TypeRole = (typeof TYPE_ROLES)[number];

/** Allow-list validators - used to reject LLM tag output that drifts. */
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
export const isPaperBand = (v: string): v is PaperBand =>
  (PAPER_BANDS as readonly string[]).includes(v);
export const isDisplayClass = (v: string): v is DisplayClass =>
  (DISPLAY_CLASSES as readonly string[]).includes(v);
export const isAccentHueBand = (v: string): v is AccentHueBand =>
  (ACCENT_HUE_BANDS as readonly string[]).includes(v);

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
