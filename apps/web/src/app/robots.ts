import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/base-url";

const BASE = BASE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/extract"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
