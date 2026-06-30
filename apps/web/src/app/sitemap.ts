import type { MetadataRoute } from "next";
import { getAllScreens, getAllCollections } from "@inspo/db";
import { BASE_URL } from "@/lib/base-url";

const BASE = BASE_URL;

// Runtime, not build-time - sitemap iterates 1k+ screens which would
// otherwise burn Neon's data-transfer quota every deploy.
export const dynamic = "force-dynamic";
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // If the DB is unreachable (e.g. Neon quota hit), ship a minimal
  // sitemap of static routes only - the deploy still works.
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

  const staticRoutes: MetadataRoute.Sitemap = [
    "/",
    "/screens",
    "/collections",
    "/mcp",
    "/mcp/use-cases",
    "/about",
    "/extract",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1.0 : 0.8,
  }));

  const screenRoutes: MetadataRoute.Sitemap = screens.map((s) => ({
    url: `${BASE}/screens/${s.slug}`,
    lastModified: new Date(s.capturedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const collectionRoutes: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${BASE}/collections/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...collectionRoutes, ...screenRoutes];
}
