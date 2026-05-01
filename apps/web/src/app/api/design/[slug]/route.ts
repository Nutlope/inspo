/**
 * GET /api/design/<slug>  →  text/markdown DESIGN.md for one screen.
 *
 * Same string the MCP `get_design_system` tool returns. Pure templating
 * via `renderDesignMd()` in @inspo/db — no LLM call, cheap on every hit.
 */

import { findScreen, renderDesignMd } from "@inspo/db";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const screen = await findScreen(slug);
  if (!screen) return new Response("Not found", { status: 404 });

  const md = renderDesignMd(screen);
  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "Content-Disposition": `inline; filename="DESIGN-${slug}.md"`,
    },
  });
}
