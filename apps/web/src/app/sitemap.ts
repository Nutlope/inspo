import type { MetadataRoute } from "next";
import { getAllScreens, getAllCollections } from "@inspo/db";

const BASE = process.env.INSPO_BASE_URL ?? "http://localhost:3737";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [screens, collections] = await Promise.all([
    getAllScreens(),
    getAllCollections(),
  ]);

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
