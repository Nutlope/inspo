/**
 * Cross-app shared types — the wire format the MCP server returns,
 * the gallery consumes, and the worker writes.
 */

import type {
  Style,
  Industry,
  Component,
  Vibe,
  ColorWord,
  Mode,
  Macrostructure,
  HallmarkTheme,
  TypeRole,
} from "@inspo/taxonomy";

/** Phase 2 — one row of a captured type ramp. */
export type TypeRampEntry = {
  role: TypeRole;
  family: string;
  sizePx: number;
  weight: number;
  lineHeight: number;
  letterSpacing: string;
};

/** Phase 2 — the design-system block extracted per capture. */
export type DesignSystem = {
  typeRamp: TypeRampEntry[];
  spacingScale: number[];
  radiusScale: number[];
  containerWidth: number | null;
  cssVariables: Record<string, string>;
  colorWords: ColorWord[];
};

/** Phase 8 — one detected component region on a captured page.
 *  Coords are page-absolute (top accounts for scroll). */
export type ComponentType =
  | "nav"
  | "hero"
  | "pricing"
  | "features"
  | "cta"
  | "testimonial"
  | "logo-cloud"
  | "footer"
  | "faq"
  | "stat";

export type ComponentRegion = {
  type: ComponentType;
  top: number;
  left: number;
  width: number;
  height: number;
  label?: string;
};

export type PageType =
  | "landing"
  | "pricing"
  | "features"
  | "auth"
  | "about"
  | "blog"
  | "changelog"
  | "docs"
  | "other";

/** One width-keyed entry inside a modern-format `<source srcset>`.
 *  Produced by the worker's `encode-variants.ts`. */
export type ImageVariant = {
  /** Pixel width the variant was encoded at (e.g. 384, 768, 1440). */
  w: number;
  /** Public URL — already cache-busted with `?v=<unixSeconds>`. */
  url: string;
};

/** AVIF + WebP variants for one role (hero / full / thumb). Paired so
 *  `<ScreenTile>` can build a `<picture>` element with AVIF first,
 *  WebP second, PNG fallback. Arrays may be empty if only one format
 *  encoded successfully. */
export type RoleVariants = {
  avif: ImageVariant[];
  webp: ImageVariant[];
};

export type ScreenSummary = {
  id: string;
  slug: string;
  title: string;
  sourceUrl: string;
  designerCredit?: string;
  capturedAt: string;
  imageUrl: string;
  fullPageUrl: string;
  thumbUrl: string;
  /** Hero (above-the-fold) variants at 384/768/1440. Present once the
   *  worker's encoder has run for this row; absent on legacy rows. */
  heroVariants?: RoleVariants;
  /** Full-page scroll variants at 768/1440. Used on /screens/[slug]. */
  fullVariants?: RoleVariants;
  /** Tile-sized variants (384-wide). Used in every grid. */
  thumbVariants?: RoleVariants;
  /** Mobile (375px-wide) capture — present once the mobile backfill has
   *  encoded + uploaded for this row. `mobileImageUrl` is the above-the-
   *  fold phone hero; `mobileFullUrl` the full phone scroll. Powers the
   *  desktop↔mobile responsive pair on /screens/[slug] + the MCP payload
   *  (the responsiveness signal no competitor pairs). Absent on rows not
   *  yet backfilled — the UI shows desktop-only then. */
  mobileImageUrl?: string;
  mobileFullUrl?: string;
  mobileVariants?: RoleVariants;
  mobileFullVariants?: RoleVariants;
  /** 16-wide AVIF base64 data URL, ~50–80 bytes after compression.
   *  Painted as a CSS background-image for instant first paint
   *  before the real tile decodes. */
  lqip?: string;
  description: string;
  /** One-line evocative "design soul" tagline (8–14 words). Generated
   *  per site by the worker's generate-northstars pass; absent on rows
   *  that haven't been through it. Surfaced on the detail hero +
   *  recommend() output. */
  northstar?: string;
  /** Structured text breakdown of the first-viewport composition
   *  (FOLD / TYPE / COLOR / SIGNATURE, ~100-150 words). Generated per
   *  row by the worker's generate-autopsies pass from the hero capture.
   *  This is how text-only models (and harnesses that drop MCP image
   *  blocks) "see" the screenshot: dense enough to rebuild the layout
   *  without pixels. Absent on rows not yet through the pass. */
  autopsy?: string;
  palette: string[];
  fonts: string[];
  tech: string[];
  mode: Mode;
  tags: {
    style: Style[];
    industry: Industry[];
    components: Component[];
    vibe: Vibe[];
    macrostructure?: Macrostructure;
    hallmarkTheme?: HallmarkTheme;
  };
  /** Phase 2 — present when extracted; empty defaults otherwise. */
  designSystem: DesignSystem;
  /** Phase 7 — multi-page grouping. siteSlug = parent site; pageType =
   *  this page's classification. For legacy single-page rows siteSlug
   *  equals slug and pageType = 'landing'. */
  siteSlug: string;
  pageType: PageType;
  /** Phase 8 — detected component regions (page-absolute coords).
   *  Empty array on legacy rows until extract:components runs. */
  components: ComponentRegion[];
};

export type SearchResult = ScreenSummary & {
  whyThisMatches?: string;
};

export type SearchFilters = Partial<{
  industry: Industry;
  style: Style;
  mode: Mode;
  components: Component[];
  macrostructure: Macrostructure;
  hallmarkTheme: HallmarkTheme;
  vibe: Vibe;
  colorWord: ColorWord;
  query: string;
}>;

// Extensionless paths to match the project's convention (cf.
// packages/db/src/index.ts). Turbopack's resolver in Next 16 doesn't
// fall back to .ts when a `.js` re-export specifier is unresolved.
export * from "./color";
export * from "./study";

export type Collection = {
  id: string;
  slug: string;
  title: string;
  number: string;
  date: string;
  editorBlurb: string;
  coverScreenSlug: string;
  screens: { slug: string; editorNote?: string; span?: 1 | 2 | 3 }[];
};

/** One Hallmark-stamped reference component. Generated from
 *  apps/web/src/components/reference by
 *  `pnpm --filter @inspo/web build:reference-manifest`. Surfaced
 *  over the MCP via `find_reference_components` + `get_reference_jsx`. */
export type ReferenceComponent = {
  id: string;
  type: ComponentType;
  label: string;
  /** Sub-macro / archetype label from the component's Hallmark stamp.
   *  Free-form descriptive — not strictly the same enum as
   *  ScreenSummary.macrostructure (e.g. "Ft7 Colophon"). */
  macro: string;
  /** One-sentence editorial note on what this component is and when
   *  to reach for it. */
  note: string;
  /** Full .tsx source as a string — Hallmark stamp + JSDoc + export. */
  source: string;
};
