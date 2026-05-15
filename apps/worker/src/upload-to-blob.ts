/**
 * Upload every captured PNG to Vercel Blob, then write the public URLs
 * back into screens.hero_image_key / full_image_key / thumb_image_key.
 *
 * Layout in Blob:
 *   captures/<slug>/hero.png   (desktop above-the-fold)
 *   captures/<slug>/full.png   (desktop full scroll)
 *   captures/<slug>/thumb.png  (tablet hero — browser scales it)
 *
 * Picks the NEWEST PNG per (slug, viewport, variant) when multiple
 * recaptures live in the directory. addRandomSuffix:false keeps the
 * key deterministic so re-runs overwrite instead of duplicating.
 *
 *   pnpm capture:upload-to-blob               dry-run, lists what'd happen
 *   pnpm capture:upload-to-blob --go          actually upload + write DB
 *   pnpm capture:upload-to-blob --go --slug=linear-app
 *   pnpm capture:upload-to-blob --go --concurrency=8
 */

import "./env.js";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { put } from "@vercel/blob";

const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? join(process.cwd(), "captures"),
);

type Variant = "hero" | "full" | "thumb";

/** Map our Variant → the on-disk filename prefix. thumb reuses tablet-hero
 *  so the browser scales a smaller asset (~30KB) into the 600×400 tile. */
const PREFIX: Record<Variant, string> = {
  hero: "desktop-hero-",
  full: "desktop-full-",
  thumb: "tablet-hero-",
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

async function uploadOne(slug: string, variant: Variant): Promise<string | null> {
  const dir = join(CAPTURES_DIR, slug);
  const src = newestPng(dir, PREFIX[variant]);
  if (!src) return null;
  const buf = readFileSync(src);
  const key = `captures/${slug}/${variant}.png`;
  const res = await put(key, buf, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/png",
    cacheControlMaxAge: 60 * 60 * 24 * 30, // 30 days
    allowOverwrite: true,
  });
  return res.url;
}

async function main() {
  const argv = process.argv.slice(2);
  const go = argv.includes("--go");
  const slugFilter = argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
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
  const rows = (slugFilter ? allSlugs.filter((s) => s === slugFilter) : allSlugs)
    .map((slug) => ({ slug }));

  console.log(`\n  upload-to-blob · ${rows.length} rows · go=${go}\n`);

  const startedAt = Date.now();
  let cursor = 0;
  let okSlugs = 0;
  let totalBytes = 0;
  let totalVariants = 0;
  let missing = 0;
  let errors = 0;

  async function worker() {
    while (cursor < rows.length) {
      const idx = cursor++;
      const slug = rows[idx]!.slug;
      const tag = `[${String(idx + 1).padStart(4, " ")}/${rows.length}]`;
      try {
        const urls: Partial<Record<Variant, string>> = {};
        for (const v of ["hero", "full", "thumb"] as Variant[]) {
          if (!go) {
            const src = newestPng(join(CAPTURES_DIR, slug), PREFIX[v]);
            if (src) {
              totalBytes += statSync(src).size;
              totalVariants += 1;
            }
            continue;
          }
          const url = await uploadOne(slug, v);
          if (url) {
            urls[v] = url;
            totalVariants += 1;
          }
        }
        if (!go) {
          okSlugs += 1;
          continue;
        }
        const variantsUploaded = Object.keys(urls).length;
        if (variantsUploaded === 0) {
          missing += 1;
          if (missing < 10)
            console.log(`${tag} · ${slug.padEnd(45)} no pngs on disk — skip`);
          continue;
        }
        // No DB writes — blob URLs are deterministic, resolved at read
        // time by /api/placeholder using INSPO_BLOB_BASE_URL + slug.
        okSlugs += 1;
        if (okSlugs % 50 === 0) {
          console.log(
            `${tag} ✓ ${slug.padEnd(45)} (${variantsUploaded}/3 variants)`,
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
