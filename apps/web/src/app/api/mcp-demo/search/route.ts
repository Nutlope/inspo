/**
 * `/api/mcp-demo/search` — playground endpoint that mirrors the MCP
 * `search_screens` tool. POST a JSON body `{ query, limit? }`; get
 * back the same hybrid lexical + cosine top-N the agent would see.
 *
 * Pure read path. No auth (the catalogue is public anyway). Cheap
 * cache: 30s, so demo refreshes feel snappy but stale agents see
 * fresh updates within half a minute.
 */

import { getAllScreens, searchScreens } from "@inspo/db";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { query?: string; limit?: number };
  try {
    body = (await req.json()) as { query?: string; limit?: number };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const query = String(body.query ?? "").trim();
  const limit = Math.max(
    1,
    Math.min(12, Math.floor(Number(body.limit ?? 6)) || 6),
  );
  if (!query) {
    return Response.json({ error: "query is required" }, { status: 400 });
  }
  const all = await getAllScreens();
  const results = await searchScreens(all, query, limit);
  // Trim the payload so the demo card doesn't ship 50 KB of unused
  // designSystem internals per result. Only fields the playground UI
  // actually renders inline.
  const slim = results.map((r) => ({
    slug: r.slug,
    siteSlug: r.siteSlug,
    title: r.title,
    sourceUrl: r.sourceUrl,
    thumbUrl: r.thumbUrl,
    thumbVariants: r.thumbVariants,
    palette: r.palette.slice(0, 5),
    description: r.description.slice(0, 240),
    tags: {
      style: r.tags.style.slice(0, 3),
      industry: r.tags.industry.slice(0, 2),
      macrostructure: r.tags.macrostructure,
    },
  }));
  return Response.json(
    { query, count: slim.length, results: slim },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=300" } },
  );
}
