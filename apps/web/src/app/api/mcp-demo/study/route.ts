/**
 * `/api/mcp-demo/study` — playground endpoint that mirrors the MCP
 * `study` tool. POST `{ url }`; get back the live-fetched palette /
 * fonts / tech / CSS variables the agent would see.
 *
 * Uses the shared study() function (moved from apps/mcp/src/study.ts
 * to packages/shared/src/study.ts for exactly this reason — so both
 * surfaces consume the same extractor).
 *
 * Rate-limited only by Node's fetch + the FETCH_TIMEOUT_MS inside
 * study(). Deliberately no caching here — the value of `study` is
 * that it shows the user's URL *right now*, not a 5-minute-old copy.
 */

import { study } from "@inspo/shared";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = (await req.json()) as { url?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const url = String(body.url ?? "").trim();
  if (!url) {
    return Response.json({ error: "url is required" }, { status: 400 });
  }
  // Light client-side validation — study() is forgiving but we want
  // to return a usable error for obvious gibberish.
  try {
    // eslint-disable-next-line no-new
    new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }
  const result = await study(url);
  return Response.json(result);
}
