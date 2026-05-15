/**
 * Compact site index for the ⌘K palette. Returns the minimum a fuzzy
 * matcher needs to fill the list: slug, title, host, pageCount,
 * accent color. One JSON response, cacheable, ~50KB gzipped at 1000
 * sites.
 *
 * This is intentionally separate from /screens HTML payload — it loads
 * once on first palette open and stays cached for the rest of the
 * session, keeping ⌘K snappy regardless of which page you're on.
 */

import { NextResponse } from "next/server";
import { getAllSites } from "@inspo/db";

// Runtime-rendered, but with edge-cache via Cache-Control. Was static
// but Neon free-tier data transfer caps killed prerender of a 1k-row
// query at build time. Cache-Control below keeps the request count
// the same as a 1h static revalidate.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

type IndexEntry = {
  slug: string;
  title: string;
  host: string;
  pageCount: number;
  accent: string;
};

export async function GET() {
  const sites = await getAllSites();
  const entries: IndexEntry[] = sites.map((s) => {
    let host = "";
    try {
      host = new URL(s.sourceUrl).host.replace(/^www\./, "");
    } catch {
      /* keep "" */
    }
    return {
      slug: s.siteSlug,
      title: s.title,
      host,
      pageCount: s.pageCount,
      accent: s.palette[0] ?? "#888",
    };
  });
  return NextResponse.json(
    { count: entries.length, entries },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, max-age=300",
      },
    },
  );
}
