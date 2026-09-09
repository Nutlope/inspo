/**
 * Public DESIGN.md mirror - `GET /d/<slug>/DESIGN.md`.
 *
 * Mirrors the internal `/api/design/<slug>` route at a curl-friendly
 * URL that any coding agent can pipe straight into a prompt:
 *
 *   curl https://inspomcp.dev/d/linear-app/DESIGN.md | claude code
 *
 * Same payload, same caching headers. We intentionally keep the
 * `/api/design/<slug>` route for in-app fetches (the CopyDesignMd +
 * ExportBlock components both call it) - this public route is for
 * external distribution.
 *
 * If the slug isn't in the catalogue we return a tiny markdown 404
 * rather than a plaintext one so the response stays valid as a piped
 * input. Saves the agent from "?? what just got piped in ??" failure
 * modes.
 */

import { findScreen, renderDesignMd } from "@inspo/db";
import type { NextRequest } from "next/server";
import { BASE_URL } from "@/lib/base-url";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const base = BASE_URL;
  const screen = await findScreen(slug);
  if (!screen) {
    const body =
      `# Not found\n\nNo site with slug \`${slug}\` is in the Inspo catalogue.\n\n` +
      `Browse the archive at ${base}/screens or search for a similar site.\n`;
    return new Response(body, {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  const md = renderDesignMd(screen);
  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // Public, longish cache - DESIGN.md only changes when the site
      // is re-captured + re-enriched, which is a deliberate event.
      "Cache-Control": "public, max-age=600, stale-while-revalidate=86400",
      "Content-Disposition": `inline; filename="DESIGN-${slug}.md"`,
    },
  });
}
