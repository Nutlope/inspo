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

export const dynamic = "force-static";
export const revalidate = 3600; // 1 hour

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
