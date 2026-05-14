import type { Style, Industry, Component, Vibe, ColorWord, Macrostructure, Mode, HallmarkTheme } from "@inspo/taxonomy";
import type { TypeRampEntry } from "@inspo/shared";
import type { ComponentRegion } from "@inspo/db/schema";

export type Viewport = "desktop" | "tablet" | "mobile";

export const VIEWPORT_SIZES: Record<Viewport, { width: number; height: number; deviceScaleFactor: number }> = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 2 },
  mobile: { width: 375, height: 812, deviceScaleFactor: 2 },
};

export type CapturedAsset = {
  viewport: Viewport;
  fullPage: boolean;
  filePath: string;
  url: string; // public URL when stored on R2; file:// otherwise
  width: number;
  height: number;
  contentHash: string;
};

export type ExtractedDesignSystem = {
  typeRamp: TypeRampEntry[];
  spacingScale: number[];
  radiusScale: number[];
  containerWidth: number | null;
  cssVariables: Record<string, string>;
};

export type ExtractedMetadata = {
  palette: string[]; // hex strings
  fonts: string[];
  tech: string[];
  mode: Mode;
  pageTitle: string;
  pageDescription: string;
  designSystem: ExtractedDesignSystem;
  /** Phase 8 — page-absolute regions for hero / nav / pricing / footer / etc.
   *  Crops served by sharp later. */
  components: ComponentRegion[];
};

export type AITags = {
  style: Style[];
  industry: Industry[];
  components: Component[];
  vibe: Vibe[];
  colorWords: ColorWord[];
  macrostructure?: Macrostructure;
  hallmarkTheme?: HallmarkTheme;
  description: string;
  altText: string;
  searchKeywords: string[];
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

export type CaptureResult = {
  sourceUrl: string;
  slug: string;
  capturedAt: Date;
  assets: CapturedAsset[];
  meta: ExtractedMetadata;
  tags?: AITags;
  embeddings?: { text: number[] };
  /** Multi-page grouping. Defaults to the screen's own slug when capturing
   *  a single homepage (which makes the screen its own site of one). */
  siteSlug?: string;
  /** Per-page classification (landing / pricing / auth / ...). Defaults
   *  to 'landing' when capturing a standalone homepage. */
  pageType?: PageType;
};
