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
 */

import "./env.js";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
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

/** Pixel widths to upload per role. Must match the widths the encoder
 *  produces — see encode-variants.ts. */
const WIDTHS_PER_VARIANT: Record<Variant, readonly number[]> = {
  hero: [384, 768, 1440],
  full: [768, 1440],
  thumb: [384],
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

async function uploadOne(
  slug: string,
  variant: Variant,
  opts: { variants: boolean },
): Promise<UploadOutcome> {
  const dir = join(CAPTURES_DIR, slug);
  const src = newestPng(dir, PREFIX[variant]);
  if (!src) return { pngUrl: null, variantCount: 0 };

  const buf = readFileSync(src);
  const pngKey = `captures/${slug}/${variant}.png`;
  const png = await put(pngKey, buf, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/png",
    cacheControlMaxAge: 60 * 60 * 24 * 30,
    allowOverwrite: true,
  });

  if (!opts.variants) {
    return { pngUrl: png.url, variantCount: 0 };
  }

  // Ship the AVIF + WebP siblings that live next to the source PNG.
  // The encoder writes them as `<stem>.<width>.<format>`; we re-key
  // them under the simpler `<variant>.<width>.<format>` namespace in
  // Blob so the gallery doesn't need to know the source hash.
  const stem = src.slice(0, -".png".length);
  let variantCount = 0;
  for (const w of WIDTHS_PER_VARIANT[variant]) {
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
  return { pngUrl: png.url, variantCount };
}

async function main() {
  const argv = process.argv.slice(2);
  const go = argv.includes("--go");
  const pngsOnly = argv.includes("--pngs-only");
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
        for (const v of ["hero", "full", "thumb"] as Variant[]) {
          if (!go) {
            const src = newestPng(join(CAPTURES_DIR, slug), PREFIX[v]);
            if (src) {
              totalBytes += statSync(src).size;
              pngsThisSlug += 1;
            }
            continue;
          }
          const r = await uploadOne(slug, v, { variants: !pngsOnly });
          if (r.pngUrl) pngsThisSlug += 1;
          variantsThisSlug += r.variantCount;
        }
        if (!go) {
          if (pngsThisSlug > 0) okSlugs += 1;
          continue;
        }
        if (pngsThisSlug === 0) {
          missing += 1;
          if (missing < 10)
            console.log(`${tag} · ${slug.padEnd(45)} no pngs on disk — skip`);
          continue;
        }
        totalPngs += pngsThisSlug;
        totalVariants += variantsThisSlug;
        okSlugs += 1;
        if (okSlugs % 50 === 0) {
          console.log(
            `${tag} ✓ ${slug.padEnd(45)} (${pngsThisSlug}/3 pngs · ${variantsThisSlug} variants)`,
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
