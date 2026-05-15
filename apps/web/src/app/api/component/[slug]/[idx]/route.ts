/**
 * Crop a single component region from a captured full-page PNG.
 *
 *   /api/component/<slug>/<idx>
 *
 * `idx` is the position in the screen's `components` array — saved at
 * extract time, page-absolute coords.
 *
 * Source PNG resolution, in order:
 *   1. screens.fullImageKey if it's an https URL (Vercel Blob in prod)
 *   2. apps/worker/captures/<slug>/desktop-full-*.png on disk (dev only)
 *   3. SVG palette-gradient placeholder
 *
 * Sharp crops once and we cache aggressively.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";
import type { NextRequest } from "next/server";
import { findScreen } from "@inspo/db";

const CAPTURES_DIR =
  process.env.INSPO_CAPTURES_DIR ??
  resolve(join(process.cwd(), "..", "worker", "captures"));

const DISK_ENABLED = process.env.NODE_ENV !== "production";

function findFullPagePng(slug: string): string | null {
  if (!DISK_ENABLED) return null;
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

async function loadFullPagePng(
  fullImageKey: string | undefined,
  slug: string,
): Promise<Buffer | null> {
  // 1. Stored http(s) URL on the row wins.
  if (fullImageKey && /^https?:\/\//i.test(fullImageKey)) {
    try {
      const res = await fetch(fullImageKey, { cache: "force-cache" });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {
      /* fall through */
    }
  }
  // 2. INSPO_BLOB_BASE_URL deterministic key.
  const base = process.env.INSPO_BLOB_BASE_URL;
  if (base) {
    const url = `${base.replace(/\/$/, "")}/${slug}/full.png`;
    try {
      const res = await fetch(url, { cache: "force-cache" });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {
      /* fall through */
    }
  }
  // 3. Dev fallback: local disk.
  const onDisk = findFullPagePng(slug);
  if (onDisk) {
    try {
      return readFileSync(onDisk);
    } catch {
      return null;
    }
  }
  return null;
}

function placeholderSvg(palette: string[], w: number, h: number): string {
  const c0 = palette[0] ?? "#eee";
  const c2 = palette[2] ?? palette[1] ?? "#ddd";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c0}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`;
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
  const components =
    (screen as unknown as {
      components?: Array<{ top: number; left: number; width: number; height: number }>;
    }).components ?? [];
  const region = components[i];
  if (!region) return new Response("region not found", { status: 404 });

  const fullKey = (screen as unknown as { fullPageUrl?: string }).fullPageUrl;
  const buf = await loadFullPagePng(fullKey, slug);

  if (!buf) {
    const palette = (screen as unknown as { palette?: string[] }).palette ?? [];
    return new Response(placeholderSvg(palette, region.width, region.height), {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  }

  try {
    const meta = await sharp(buf).metadata();
    const w = meta.width ?? 1440;
    const h = meta.height ?? 0;
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
