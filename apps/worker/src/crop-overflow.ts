/**
 * Crop horizontal-overflow full-page captures back to the 1440 viewport
 * width, re-encode the `full` variants, and bump the seed's full-image
 * `?v` cache-buster so the CDN serves the cropped version.
 *
 * Some sites render wider than the 1440 desktop viewport (a horizontal
 * carousel / stray wide element pushes scrollWidth past it), so the
 * full-page screenshot baked in off-screen-right content. A real 1440
 * viewport only shows the left 1440 (the rest needs horizontal scroll),
 * so cropping to the left 1440 is the viewport-truthful full-page view —
 * matching what the new overflow-x clip in screenshot.ts now produces
 * for fresh captures.
 *
 *   pnpm --filter @inspo/worker exec tsx src/crop-overflow.ts            dry-run
 *   pnpm --filter @inspo/worker exec tsx src/crop-overflow.ts --go       crop + re-encode + bump seed
 *   ... --list=/tmp/overflow-slugs.txt   (default)
 *
 * Run `upload-to-blob --go --full-only --from-file=<list>` afterwards to
 * push the cropped full.png + variants to Blob.
 */

import "./env.js";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { encodeVariants } from "./encode-variants.js";

const CAP = resolve(process.env.INSPO_CAPTURES_DIR ?? join(process.cwd(), "captures"));
const SEED = resolve("..", "..", "packages", "db", "src", "static-screens.json");
const VIEWPORT_W = 1440;

function newestFull(dir: string): string | null {
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => /^desktop-full-.*\.png$/.test(f));
  } catch {
    return null;
  }
  if (!files.length) return null;
  files.sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs);
  return files[0]!;
}

async function main() {
  const go = process.argv.includes("--go");
  const list = process.argv.find((a) => a.startsWith("--list="))?.split("=")[1] ?? "/tmp/overflow-slugs.txt";
  const slugs = readFileSync(list, "utf8").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

  console.log(`\n  crop-overflow · ${slugs.length} candidates · go=${go}\n`);

  const newV: Record<string, number> = {};
  let cropped = 0;
  for (const slug of slugs) {
    const dir = join(CAP, slug);
    const f = newestFull(dir);
    if (!f) continue;
    const p = join(dir, f);
    const m = await sharp(p).metadata();
    if (!m.width || m.width <= VIEWPORT_W + 4) continue;
    if (!go) {
      console.log(`  would crop ${slug.padEnd(40)} ${m.width} → ${VIEWPORT_W}`);
      continue;
    }
    // Crop to the left viewport-width column, full height. Re-read into a
    // fresh buffer first (sharp can't read+write the same file in place).
    const buf = await sharp(p)
      .extract({ left: 0, top: 0, width: VIEWPORT_W, height: m.height ?? 1 })
      .png()
      .toBuffer();
    writeFileSync(p, buf);
    await encodeVariants(p, { role: "full", force: true });
    newV[slug] = Math.floor(statSync(p).mtimeMs / 1000);
    cropped += 1;
    if (cropped % 10 === 0) console.log(`  cropped ${cropped}…`);
  }
  console.log(`\n  cropped ${cropped} captures`);

  if (go && cropped > 0) {
    const rows = JSON.parse(readFileSync(SEED, "utf8")) as Array<Record<string, any>>;
    let bumped = 0;
    for (const r of rows) {
      const v = newV[String(r.slug)];
      if (!v) continue;
      if (typeof r.fullPageUrl === "string") r.fullPageUrl = r.fullPageUrl.replace(/\?v=\d+/, `?v=${v}`);
      const fv = r.fullVariants;
      if (fv) for (const fmt of ["avif", "webp"]) if (Array.isArray(fv[fmt])) for (const e of fv[fmt]) e.url = e.url.replace(/\?v=\d+/, `?v=${v}`);
      bumped += 1;
    }
    writeFileSync(SEED, JSON.stringify(rows));
    console.log(`  seed full ?v bumped for ${bumped} rows`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
