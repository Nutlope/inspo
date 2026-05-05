import type { MetadataRoute } from "next";

const BASE = process.env.INSPO_BASE_URL ?? "http://localhost:3737";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/dashboard", "/extract"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
