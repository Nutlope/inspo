/**
 * Upload every captured PNG **and its AVIF/WebP variants** to Vercel
 * Blob, using deterministic keys so re-runs overwrite instead of
 * duplicating.
 *
 * Layout in Blob:
 *   captures/<slug>/hero.png             desktop above-the-fold (legacy)
 *   captures/<slug>/hero.{384,768,1440}.{avif,webp}
 *   captures/<slug>/full.png             desktop full scroll
 *   captures/<slug>/full.{768,1440}.{avif,webp}
 *   captures/<slug>/thumb.png            tablet hero (legacy)
 *   captures/<slug>/thumb.384.{avif,webp}
 *
 * The PNGs stay shipped for `<img>` fallbacks; the AVIF/WebP variants
 * are what `<picture>` actually serves once the gallery is updated.
 *
 *   pnpm capture:upload-to-blob               dry-run, lists what'd happen
 *   pnpm capture:upload-to-blob --go          actually upload
 *   pnpm capture:upload-to-blob --go --slug=linear-app
 *   pnpm capture:upload-to-blob --go --concurrency=8
 *   pnpm capture:upload-to-blob --go --pngs-only    skip variants (legacy mode)
 *
 * Surgical backfills - push only the small variants the MCP inlines
 * and the gallery serves, without re-pushing PNGs already on Blob:
 *
 *   ... --go --variants-only --roles=thumb,hero --max-width=768
 */

import "./env.js";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { put } from "@vercel/blob";

const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? join(process.cwd(), "captures"),
);

type Variant = "hero" | "full" | "thumb" | "mobile" | "mobile-full";

/** Map our Variant → the on-disk filename prefix. thumb reuses tablet-hero
 *  so the browser scales a smaller asset (~30KB) into the 600×400 tile.
 *  mobile/mobile-full ship the 375-wide capture for the responsive pair. */
const PREFIX: Record<Variant, string> = {
  hero: "desktop-hero-",
  full: "desktop-full-",
  thumb: "tablet-hero-",
  mobile: "mobile-hero-",
  "mobile-full": "mobile-full-",
};

/** Pixel widths to upload per role. Must match the widths the encoder
 *  produces — see encode-variants.ts. */
const WIDTHS_PER_VARIANT: Record<Variant, readonly number[]> = {
  hero: [384, 768, 1440],
  full: [768, 1440],
  thumb: [384],
  mobile: [384, 768],
  "mobile-full": [768],
};

function newestPng(dir: string, prefix: string): string | null {
  let files: string[];
  try {
    files = readdirSync(dir).filter(
      (f) => f.startsWith(prefix) && f.endsWith(".png"),
    );
  } catch {
    return null;
  }
  if (files.length === 0) return null;
  files.sort((a, b) => {
    const ma = statSync(join(dir, a)).mtimeMs;
    const mb = statSync(join(dir, b)).mtimeMs;
    return mb - ma;
  });
  return join(dir, files[0]!);
}

type UploadOutcome = {
  pngUrl: string | null;
  variantCount: number;
};

type UploadOpts = { variants: boolean; pngs: boolean; maxWidth: number };

/** Bytes a dry run would push for one slug+role, so `--variants-only
 *  --roles=... --max-width=...` can be sized before committing to it. */
function dryRunBytes(slug: string, variant: Variant, opts: UploadOpts): number {
  const src = newestPng(join(CAPTURES_DIR, slug), PREFIX[variant]);
  if (!src) return 0;
  let bytes = opts.pngs ? statSync(src).size : 0;
  if (!opts.variants) return bytes;
  const stem = src.slice(0, -".png".length);
  for (const w of WIDTHS_PER_VARIANT[variant]) {
    if (w > opts.maxWidth) continue;
    for (const format of ["avif", "webp"] as const) {
      const path = `${stem}.${w}.${format}`;
      if (existsSync(path)) bytes += statSync(path).size;
    }
  }
  return bytes;
}

async function uploadOne(
  slug: string,
  variant: Variant,
  opts: UploadOpts,
): Promise<UploadOutcome> {
  const dir = join(CAPTURES_DIR, slug);
  const src = newestPng(dir, PREFIX[variant]);
  if (!src) return { pngUrl: null, variantCount: 0 };

  // --variants-only skips the PNG: deterministic keys mean it is
  // already on Blob from an earlier run, and the PNGs are by far the
  // heaviest thing here (a desktop-full PNG runs several MB).
  let pngUrl: string | null = null;
  if (opts.pngs) {
    const buf = readFileSync(src);
    const pngKey = `captures/${slug}/${variant}.png`;
    const png = await put(pngKey, buf, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/png",
      cacheControlMaxAge: 60 * 60 * 24 * 30,
      allowOverwrite: true,
    });
    pngUrl = png.url;
  }

  if (!opts.variants) {
    return { pngUrl, variantCount: 0 };
  }

  // Ship the AVIF + WebP siblings that live next to the source PNG.
  // The encoder writes them as `<stem>.<width>.<format>`; we re-key
  // them under the simpler `<variant>.<width>.<format>` namespace in
  // Blob so the gallery doesn't need to know the source hash.
  const stem = src.slice(0, -".png".length);
  let variantCount = 0;
  for (const w of WIDTHS_PER_VARIANT[variant]) {
    if (w > opts.maxWidth) continue;
    for (const format of ["avif", "webp"] as const) {
      const path = `${stem}.${w}.${format}`;
      if (!existsSync(path)) continue;
      const data = readFileSync(path);
      await put(`captures/${slug}/${variant}.${w}.${format}`, data, {
        access: "public",
        addRandomSuffix: false,
        contentType: format === "avif" ? "image/avif" : "image/webp",
        cacheControlMaxAge: 60 * 60 * 24 * 30,
        allowOverwrite: true,
      });
      variantCount += 1;
    }
  }
  return { pngUrl, variantCount };
}

async function main() {
  const argv = process.argv.slice(2);
  const go = argv.includes("--go");
  const pngsOnly = argv.includes("--pngs-only");
  // --mobile-only: ship just the mobile + mobile-full variants (the
  // desktop hero/full/thumb are already on Blob), so the backfill
  // upload doesn't redundantly re-push thousands of existing files.
  const mobileOnly = argv.includes("--mobile-only");
  // --full-only: ship just the desktop full-page png+variants (e.g. after
  // re-cropping an overflow capture), without re-pushing hero/thumb/mobile.
  const fullOnly = argv.includes("--full-only");
  // --variants-only: skip the PNGs (already on Blob under the same
  // deterministic keys) and push only the AVIF/WebP siblings. Pairs
  // with --roles / --max-width to backfill just the small variants the
  // MCP inlines, without re-pushing gigabytes of full-page PNGs.
  const variantsOnly = argv.includes("--variants-only");
  // --roles=thumb,hero : which of hero|full|thumb|mobile|mobile-full.
  const rolesArg = argv.find((a) => a.startsWith("--roles="))?.split("=")[1];
  const rolesFilter = rolesArg
    ? new Set(rolesArg.split(",").map((r) => r.trim()).filter(Boolean))
    : null;
  // --max-width=768 : skip variants wider than this. The 1440s are
  // 10-20x the bytes of the 384s and nothing inlines them.
  const maxWidth = Number(
    argv.find((a) => a.startsWith("--max-width="))?.split("=")[1] ?? Infinity,
  );
  const slugFilter = argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
  // --from-file=path : upload only the slugs listed (one per line).
  // Lets us push just the newly-captured set instead of re-uploading
  // the whole archive (deterministic keys make re-uploads safe but slow).
  const fromFile = argv.find((a) => a.startsWith("--from-file="))?.split("=")[1];
  const fromFileSet = fromFile
    ? new Set(
        readFileSync(fromFile, "utf8")
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("#")),
      )
    : null;
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 6,
  );

  if (!process.env.BLOB_READ_WRITE_TOKEN)
    throw new Error("BLOB_READ_WRITE_TOKEN required (vercel env pull)");

  // Read the slug list from the captures dir directly — no DB hit
  // needed (Neon data-transfer quota was the original blocker).
  let allSlugs: string[];
  try {
    allSlugs = readdirSync(CAPTURES_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
      .map((d) => d.name);
  } catch (err) {
    throw new Error(
      `cannot read captures dir at ${CAPTURES_DIR}: ${err instanceof Error ? err.message : err}`,
    );
  }
  let selected = allSlugs;
  if (slugFilter) selected = selected.filter((s) => s === slugFilter);
  if (fromFileSet) selected = selected.filter((s) => fromFileSet.has(s));
  const rows = selected.map((slug) => ({ slug }));

  console.log(
    `\n  upload-to-blob · ${rows.length} rows · go=${go} · variants=${!pngsOnly}\n`,
  );

  const startedAt = Date.now();
  let cursor = 0;
  let okSlugs = 0;
  let totalBytes = 0;
  let totalPngs = 0;
  let totalVariants = 0;
  let missing = 0;
  let errors = 0;

  async function worker() {
    while (cursor < rows.length) {
      const idx = cursor++;
      const slug = rows[idx]!.slug;
      const tag = `[${String(idx + 1).padStart(4, " ")}/${rows.length}]`;
      try {
        let pngsThisSlug = 0;
        let variantsThisSlug = 0;
        let variants = (
          mobileOnly
            ? ["mobile", "mobile-full"]
            : fullOnly
              ? ["full"]
              : ["hero", "full", "thumb", "mobile", "mobile-full"]
        ) as Variant[];
        if (rolesFilter) variants = variants.filter((v) => rolesFilter.has(v));
        for (const v of variants) {
          if (!go) {
            const src = newestPng(join(CAPTURES_DIR, slug), PREFIX[v]);
            if (src) {
              totalBytes += dryRunBytes(slug, v, {
                variants: !pngsOnly,
                pngs: !variantsOnly,
                maxWidth,
              });
              pngsThisSlug += 1;
            }
            continue;
          }
          const r = await uploadOne(slug, v, {
            variants: !pngsOnly,
            pngs: !variantsOnly,
            maxWidth,
          });
          if (r.pngUrl) pngsThisSlug += 1;
          variantsThisSlug += r.variantCount;
        }
        if (!go) {
          if (pngsThisSlug > 0) okSlugs += 1;
          continue;
        }
        // Under --variants-only there are no PNG uploads to count, so
        // "nothing on disk" is the absence of both.
        if (pngsThisSlug === 0 && variantsThisSlug === 0) {
          missing += 1;
          if (missing < 10)
            console.log(`${tag} · ${slug.padEnd(45)} nothing on disk — skip`);
          continue;
        }
        totalPngs += pngsThisSlug;
        totalVariants += variantsThisSlug;
        okSlugs += 1;
        if (okSlugs % 50 === 0) {
          console.log(
            `${tag} ✓ ${slug.padEnd(45)} (${pngsThisSlug}/5 pngs · ${variantsThisSlug} variants)`,
          );
        }
      } catch (err) {
        errors += 1;
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`${tag} ✗ ${slug.padEnd(45)} ${msg.slice(0, 200)}`);
        if (errors === 1) {
          // First error gets full stack trace for debugging.
          console.error(err);
        }
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const min = ((Date.now() - startedAt) / 1000 / 60).toFixed(1);
  console.log(`\n  rows:      ${rows.length}`);
  console.log(`  ok:        ${okSlugs}`);
  console.log(`  missing:   ${missing}`);
  console.log(`  errors:    ${errors}`);
  console.log(`  pngs:      ${totalPngs}`);
  console.log(`  variants:  ${totalVariants}`);
  if (!go) {
    console.log(`  dry-run total bytes: ${(totalBytes / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`\n  dry-run. re-run with --go to actually upload.\n`);
  } else {
    console.log(`  wall time: ${min} min`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
