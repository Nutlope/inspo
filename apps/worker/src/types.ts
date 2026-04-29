import type { Style, Industry, Component, Vibe, Macrostructure, Mode, HallmarkTheme } from "@inspo/taxonomy";

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

export type ExtractedMetadata = {
  palette: string[]; // hex strings
  fonts: string[];
  tech: string[];
  mode: Mode;
  pageTitle: string;
  pageDescription: string;
};

export type AITags = {
  style: Style[];
  industry: Industry[];
  components: Component[];
  vibe: Vibe[];
  macrostructure?: Macrostructure;
  hallmarkTheme?: HallmarkTheme;
  description: string;
  altText: string;
  searchKeywords: string[];
};

export type CaptureResult = {
  sourceUrl: string;
  slug: string;
  capturedAt: Date;
  assets: CapturedAsset[];
  meta: ExtractedMetadata;
  tags?: AITags;
  embeddings?: { image: number[]; text: number[] };
};
