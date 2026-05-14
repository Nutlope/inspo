/**
 * Crop a single component region from a captured full-page PNG.
 *
 *   /api/component/<slug>/<idx>
 *
 * `idx` is the position in the screen's `components` array — saved at
 * extract time, page-absolute coords. Sharp does the crop on demand;
 * we cache aggressively so the same crop is only computed once.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";
import type { NextRequest } from "next/server";
import { findScreen } from "@inspo/db";

const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ??
    join(process.cwd(), "..", "worker", "captures"),
);

function findFullPagePng(slug: string): string | null {
  const dir = join(CAPTURES_DIR, slug);
  if (!existsSync(dir)) return null;
  let candidates: string[];
  try {
    candidates = readdirSync(dir).filter(
      (f) => f.startsWith("desktop-full-") && f.endsWith(".png"),
    );
  } catch {
    return null;
  }
  return candidates.length > 0 ? join(dir, candidates[0]!) : null;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string; idx: string }> },
) {
  const { slug, idx } = await ctx.params;
  const i = Number(idx);
  if (!Number.isFinite(i) || i < 0) return new Response("bad idx", { status: 400 });

  const screen = await findScreen(slug);
  if (!screen) return new Response("not found", { status: 404 });
  const components = (screen as unknown as { components?: Array<{ top: number; left: number; width: number; height: number }> })
    .components ?? [];
  const region = components[i];
  if (!region) return new Response("region not found", { status: 404 });

  const pngPath = findFullPagePng(slug);
  if (!pngPath) return new Response("source png missing", { status: 404 });

  try {
    const buf = readFileSync(pngPath);
    const meta = await sharp(buf).metadata();
    const w = meta.width ?? 1440;
    const h = meta.height ?? 0;

    // Clamp the region to the image bounds so a stale rect doesn't crash sharp.
    const left = Math.max(0, Math.min(region.left, w - 1));
    const top = Math.max(0, Math.min(region.top, h - 1));
    const width = Math.max(1, Math.min(region.width, w - left));
    const height = Math.max(1, Math.min(region.height, h - top));

    const cropped = await sharp(buf)
      .extract({ left, top, width, height })
      .png()
      .toBuffer();

    return new Response(new Uint8Array(cropped), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    return new Response(
      `crop failed: ${err instanceof Error ? err.message : String(err)}`,
      { status: 500 },
    );
  }
}
