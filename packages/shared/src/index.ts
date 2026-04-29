/**
 * Cross-app shared types — the wire format the MCP server returns,
 * the gallery consumes, and the worker writes.
 */

import type {
  Style,
  Industry,
  Component,
  Vibe,
  Mode,
  Macrostructure,
  HallmarkTheme,
} from "@inspo/taxonomy";

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
