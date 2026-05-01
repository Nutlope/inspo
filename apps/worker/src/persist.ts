/**
 * Insert a CaptureResult into Postgres as a `pending` screen row.
 * No-op if DATABASE_URL is unset (smoke-testing without a DB is fine).
 */

import { hasDatabase, getDb, schema } from "@inspo/db";
import { eq } from "drizzle-orm";
import type { CaptureResult } from "./types";

export async function persistCapture(
  result: CaptureResult,
  opts: { status?: "pending" | "published" } = {},
): Promise<{ id: string } | null> {
  if (!hasDatabase()) {
    console.log("  ⨯ skipping DB persist (no DATABASE_URL)");
    return null;
  }
  const db = getDb();

  const heroAsset = result.assets.find(
    (a) => a.viewport === "desktop" && !a.fullPage,
  );
  const fullAsset = result.assets.find(
    (a) => a.viewport === "desktop" && a.fullPage,
  );
  const thumbAsset = result.assets.find(
    (a) => a.viewport === "tablet" && !a.fullPage,
  );

  const values = {
    slug: result.slug,
    title: result.tags?.description?.split(".")[0]?.slice(0, 80) ?? result.meta.pageTitle ?? result.slug,
    sourceUrl: result.sourceUrl,
    designerCredit: null,
    capturedAt: result.capturedAt,
    description: result.tags?.description ?? result.meta.pageDescription ?? "",
    altText: result.tags?.altText ?? "",
    searchKeywords: result.tags?.searchKeywords ?? [],
    palette: result.meta.palette,
    fonts: result.meta.fonts,
    tech: result.meta.tech,
    mode: result.meta.mode,
    macrostructure: result.tags?.macrostructure ?? null,
    hallmarkTheme: result.tags?.hallmarkTheme ?? null,
    heroImageKey: heroAsset?.url ?? null,
    fullImageKey: fullAsset?.url ?? null,
    thumbImageKey: thumbAsset?.url ?? null,
    embeddingImage: null,
    embeddingText: result.embeddings?.text ?? null,
    status: opts.status ?? ("pending" as const),
    // Image keys are written for traceability, but the gallery serves
    // images via /api/placeholder/<slug>/<variant> which prefers a real
    // disk PNG when present. So these file:// URLs are bookkeeping only.
  };

  const existing = await db
    .select({ id: schema.screens.id })
    .from(schema.screens)
    .where(eq(schema.screens.slug, result.slug))
    .limit(1);

  if (existing[0]) {
    await db
      .update(schema.screens)
      .set(values)
      .where(eq(schema.screens.id, existing[0].id));
    return { id: existing[0].id };
  }

  const inserted = await db
    .insert(schema.screens)
    .values(values)
    .returning({ id: schema.screens.id });
  return { id: inserted[0].id };
}
