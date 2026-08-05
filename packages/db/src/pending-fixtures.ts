import type { DesignSystem, ScreenSummary } from "@inspo/shared";

const EMPTY_DESIGN_SYSTEM: DesignSystem = {
  typeRamp: [],
  spacingScale: [],
  radiusScale: [],
  containerWidth: null,
  cssVariables: {},
  colorWords: [],
};

type RawPending = Omit<ScreenSummary, "designSystem" | "siteSlug" | "pageType" | "components"> &
  Partial<Pick<ScreenSummary, "designSystem" | "siteSlug" | "pageType" | "components">>;

/**
 * Demo "pending" screens — surfaced only by `getPendingScreens()` in
 * fixtures-fallback mode so the curator dashboard has something to
 * show before the worker runs against a real database.
 */

const placeholder = (slug: string, variant: "hero" | "full" | "thumb") =>
  `/api/placeholder/${slug}/${variant}`;

const _pending: RawPending[] = [
  {
    id: "pending-01",
    slug: "linear-app-pending",
    title: "Linear",
    sourceUrl: "https://linear.app",
    designerCredit: "Linear",
    capturedAt: new Date().toISOString().slice(0, 10),
    imageUrl: placeholder("linear-app-pending", "hero"),
    fullPageUrl: placeholder("linear-app-pending", "full"),
    thumbUrl: placeholder("linear-app-pending", "thumb"),
    description:
      "Product-development system marketing site, dark mode, oversized typography, embedded UI demos.",
    palette: ["#0B0F12", "#FCEEB5", "#C49E04", "#8C9099"],
    fonts: ["Inter Variable"],
    tech: ["Next.js"],
    mode: "dark",
    tags: {
      style: ["dark-mode", "minimalism"],
      industry: ["saas", "developer-tools"],
      components: ["sticky-nav", "hero-with-cta", "feature-trio"],
      vibe: ["technical", "loud"],
      macrostructure: "marquee-hero",
    },
  },
  {
    id: "pending-02",
    slug: "vercel-com-pending",
    title: "Vercel",
    sourceUrl: "https://vercel.com",
    designerCredit: "Vercel Brand",
    capturedAt: new Date().toISOString().slice(0, 10),
    imageUrl: placeholder("vercel-com-pending", "hero"),
    fullPageUrl: placeholder("vercel-com-pending", "full"),
    thumbUrl: placeholder("vercel-com-pending", "thumb"),
    description:
      "Frontend cloud marketing page — pure black, geometry-driven hero, monumentally large display sans.",
    palette: ["#000000", "#FFFFFF", "#0070F3", "#9999A8"],
    fonts: ["Geist", "Geist Mono"],
    tech: ["Next.js", "Vercel"],
    mode: "dark",
    tags: {
      style: ["dark-mode", "swiss"],
      industry: ["developer-tools", "saas"],
      components: ["sticky-nav", "hero-with-cta", "logo-cloud"],
      vibe: ["technical", "serious"],
      macrostructure: "stat-led",
    },
  },
  {
    id: "pending-03",
    slug: "are-na-pending",
    title: "Are.na",
    sourceUrl: "https://are.na",
    designerCredit: "Are.na Studio",
    capturedAt: new Date().toISOString().slice(0, 10),
    imageUrl: placeholder("are-na-pending", "hero"),
    fullPageUrl: placeholder("are-na-pending", "full"),
    thumbUrl: placeholder("are-na-pending", "thumb"),
    description:
      "Research / collection tool — restrained editorial home, single column of copy, gridded blocks below.",
    palette: ["#FCFCF8", "#1F1F1F", "#000000", "#7B7B70"],
    fonts: ["GT Sectra", "Söhne"],
    tech: ["Next.js"],
    mode: "light",
    tags: {
      style: ["editorial", "minimalism", "swiss"],
      industry: ["creator", "media"],
      components: ["hero-with-cta", "blog-grid", "footer-compact"],
      vibe: ["calm", "soft"],
      macrostructure: "long-document",
    },
  },
];

export const pendingScreens: ScreenSummary[] = _pending.map((s) => ({
  ...s,
  designSystem: s.designSystem ?? EMPTY_DESIGN_SYSTEM,
  siteSlug: s.siteSlug ?? s.slug,
  pageType: s.pageType ?? "landing",
  components: s.components ?? [],
}));
