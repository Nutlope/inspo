import type { MetadataRoute } from "next";
import { getAllScreens, getAllCollections } from "@inspo/db";
import { BASE_URL } from "@/lib/base-url";

const BASE = BASE_URL;

// ISR daily: the archive changes on capture intakes, not per request.
// (Reads come from the bundled static seed, so this is cheap either way.)
export const revalidate = 86400;

const COMPONENT_TYPES = [
  "hero",
  "pricing",
  "features",
  "cta",
  "nav",
  "footer",
  "testimonial",
  "logo-cloud",
  "faq",
  "stat",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // If the catalogue is unreadable, ship a minimal sitemap of static
  // routes only - the deploy still works.
  let screens: Awaited<ReturnType<typeof getAllScreens>> = [];
  let collections: Awaited<ReturnType<typeof getAllCollections>> = [];
  try {
    [screens, collections] = await Promise.all([
      getAllScreens(),
      getAllCollections(),
    ]);
  } catch {
    /* skip dynamic routes */
  }

  // Honest lastModified: omit for static routes (we don't track their
  // edits), use capture dates for archive content.
  const staticRoutes: MetadataRoute.Sitemap = [
    "/",
    "/screens",
    "/collections",
    "/components",
    "/examples",
    "/mcp",
    "/mcp/use-cases",
    "/about",
    "/dmca",
  ].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1.0 : 0.8,
  }));

  const componentRoutes: MetadataRoute.Sitemap = COMPONENT_TYPES.map((t) => ({
    url: `${BASE}/components/${t}`,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const screenRoutes: MetadataRoute.Sitemap = screens.map((s) => ({
    url: `${BASE}/screens/${s.slug}`,
    lastModified: new Date(s.capturedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // One entry per site (the canonical multi-page entity the grid links
  // to), stamped with the newest capture across its pages.
  const newestBySite = new Map<string, string>();
  for (const s of screens) {
    const prev = newestBySite.get(s.siteSlug);
    if (!prev || s.capturedAt > prev) newestBySite.set(s.siteSlug, s.capturedAt);
  }
  const siteRoutes: MetadataRoute.Sitemap = [...newestBySite.entries()].map(
    ([siteSlug, capturedAt]) => ({
      url: `${BASE}/sites/${siteSlug}`,
      lastModified: new Date(capturedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }),
  );

  const collectionRoutes: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${BASE}/collections/${c.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...componentRoutes,
    ...collectionRoutes,
    ...siteRoutes,
    ...screenRoutes,
  ];
}
