/**
 * Encode AVIF + WebP variants of a captured PNG at three widths, plus
 * a tiny base64 LQIP (low-quality image placeholder).
 *
 * Why: the gallery ships raw 1440-wide PNGs to fill 300-wide tiles. A
 * single thumb is ~50 KB; the archive page sends ~47 MB worst-case.
 * A 384-wide AVIF q=55 of the same content is ~8 KB. Encoding once on
 * the capture worker — rather than per-request through Vercel's image
 * optimizer — means the CDN serves these as static blobs forever, and
 * the first hit is fast (no cold encode).
 *
 * Layout on disk (next to the source PNG):
 *
 *   captures/<slug>/
 *     desktop-hero-<hash>.png        ← source (unchanged)
 *     desktop-hero-<hash>.384.avif   ← 384px wide, AVIF q=55
 *     desktop-hero-<hash>.384.webp   ← 384px wide, WebP q=70
 *     desktop-hero-<hash>.768.avif
 *     desktop-hero-<hash>.768.webp
 *     desktop-hero-<hash>.1440.avif  ← native width, higher quality
 *     desktop-hero-<hash>.1440.webp
 *     desktop-hero-<hash>.lqip       ← raw base64 AVIF, 16×10, ~50 bytes
 *
 * The encoder is **idempotent**: if a target file already exists with
 * a non-zero size, we skip it. This is what makes the backfill script
 * cheap to re-run.
 *
 * Width policy:
 *
 *   - `hero` (1440×900): emit 384, 768, 1440
 *   - `full` (1440×N, tall): emit 768, 1440 (no 384 — it'd be a
 *      hair-thin strip)
 *   - `thumb` (we treat it as hero at 384 + LQIP): emit 384
 *
 * AVIF/WebP qualities were picked by encoding a sample of 20 captures
 * and eyeballing the result. Tile-size AVIF q=55 is indistinguishable
 * from the source at the on-screen render size; hero-plate AVIF q=70
 * holds up against a 1× retina display.
 */

import { existsSync, statSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import sharp from "sharp";

export type VariantWidth = 384 | 768 | 1440;
export type VariantFormat = "avif" | "webp";

export type EncodeRole = "hero" | "full" | "thumb";

/** Pixel widths to emit per role. Order matters — narrowest first so
 *  the encoder produces a useful tile-sized image even if it's killed
 *  midway through. */
const WIDTHS_BY_ROLE: Record<EncodeRole, readonly VariantWidth[]> = {
  thumb: [384],
  hero: [384, 768, 1440],
  full: [768, 1440],
};

/** Per-format, per-width quality. Tile sizes go lower (denser pixels,
 *  smaller render target); 1440px stays sharper for retina hero plates. */
const QUALITY: Record<VariantFormat, Record<VariantWidth, number>> = {
  avif: { 384: 55, 768: 60, 1440: 70 },
  webp: { 384: 68, 768: 72, 1440: 80 },
};

export type EncodeResult = {
  written: string[];
  skipped: string[];
  lqip?: string;
};

export type EncodeOptions = {
  /** What role this PNG plays. Drives width set + LQIP emission. */
  role: EncodeRole;
  /** If true, re-encode even when the output exists. Default false. */
  force?: boolean;
  /** If false, don't emit `.lqip`. Default true for hero/thumb, false
   *  for full (a 16-px LQIP of a 4000-pixel-tall page is uninformative). */
  lqip?: boolean;
};

/**
 * Encode all variants for one source PNG. Returns the list of files
 * actually written + the inline LQIP string (if requested).
 */
export async function encodeVariants(
  pngPath: string,
  opts: EncodeOptions,
): Promise<EncodeResult> {
  const widths = WIDTHS_BY_ROLE[opts.role];
  const wantLqip =
    opts.lqip ?? (opts.role === "hero" || opts.role === "thumb");

  const dir = dirname(pngPath);
  const stem = basename(pngPath, ".png");

  const buf = await readFile(pngPath);
  // Read the source's metadata once. Sharp is single-threaded per
  // pipeline, so we build one pipeline per output rather than chaining
  // .pipe() — clearer code, no measurable cost on this fan-out.
  const meta = await sharp(buf).metadata();
  const srcW = meta.width ?? 1440;

  const written: string[] = [];
  const skipped: string[] = [];

  for (const w of widths) {
    // Don't upscale — if the source is already narrower than the
    // target width, write at the source width.
    const effective = Math.min(w, srcW);

    for (const format of ["avif", "webp"] as VariantFormat[]) {
      const out = join(dir, `${stem}.${w}.${format}`);
      if (!opts.force && existsSync(out) && statSync(out).size > 0) {
        skipped.push(out);
        continue;
      }
      const quality = QUALITY[format][w];
      const pipeline = sharp(buf).resize({
        width: effective,
        // Tiles ship at fixed aspect via CSS; preserving the source
        // ratio here keeps the encoder's job simple. CSS object-fit
        // does the cropping.
        withoutEnlargement: true,
        fit: "inside",
      });
      const data =
        format === "avif"
          ? await pipeline
              .avif({ quality, effort: 4, chromaSubsampling: "4:2:0" })
              .toBuffer()
          : await pipeline.webp({ quality, effort: 4 }).toBuffer();
      await writeFile(out, data);
      written.push(out);
    }
  }

  let lqip: string | undefined;
  if (wantLqip) {
    const lqipPath = join(dir, `${stem}.lqip`);
    if (!opts.force && existsSync(lqipPath) && statSync(lqipPath).size > 0) {
      // Reuse the on-disk LQIP — we want the same blur every call so
      // the seed is reproducible.
      lqip = (await readFile(lqipPath, "utf8")).trim();
      skipped.push(lqipPath);
    } else {
      // 16-wide AVIF, quality 20. Decodes to a colourful blur that the
      // browser can paint instantly. Stays under ~80 bytes base64.
      const tiny = await sharp(buf)
        .resize({ width: 16, fit: "inside" })
        .avif({ quality: 20, effort: 0 })
        .toBuffer();
      lqip = `data:image/avif;base64,${tiny.toString("base64")}`;
      await writeFile(lqipPath, lqip);
      written.push(lqipPath);
    }
  }

  return { written, skipped, lqip };
}

/**
 * Inspect a captures/<slug> directory and return which variants are
 * already present. Used by build-static-seed.ts to decide whether to
 * emit the new URL fields for a given row.
 *
 * We key off the **newest** source PNG per role — that matches what
 * `upload-to-blob.ts` uploads (newest wins). If the newest PNG has a
 * sibling `.384.avif`, etc., we know the encoder has run for it.
 */
export type RoleVariants = {
  /** Width → has-variant for each format. */
  avif: Partial<Record<VariantWidth, boolean>>;
  webp: Partial<Record<VariantWidth, boolean>>;
  lqip?: string;
};

export function inspectVariants(
  files: string[],
  role: "hero" | "full",
): RoleVariants {
  // The on-disk prefix differs from the upload role: `hero` ⇒
  // `desktop-hero-` (and the gallery uses `thumb` = tablet-hero). For
  // inspection we look at the desktop variants only, matching upload-
  // to-blob's hero/full keys.
  const prefix =
    role === "hero" ? "desktop-hero-" : "desktop-full-";
  const matching = files
    .filter((f) => f.startsWith(prefix) && f.endsWith(".png"));
  if (matching.length === 0) return { avif: {}, webp: {} };

  // The "newest" PNG (mtime-sorted by caller — we get a pre-sorted
  // list) determines the stem.
  const png = matching[0]!;
  const stem = png.slice(0, -".png".length);

  const avif: Partial<Record<VariantWidth, boolean>> = {};
  const webp: Partial<Record<VariantWidth, boolean>> = {};
  for (const w of [384, 768, 1440] as VariantWidth[]) {
    avif[w] = files.includes(`${stem}.${w}.avif`);
    webp[w] = files.includes(`${stem}.${w}.webp`);
  }
  return { avif, webp };
}
