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
  description: string;
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
