/**
 * Augment the EXISTING static-seed with mobile image fields — in place.
 *
 * Unlike `build-static-seed.ts` (which regenerates every row from the
 * captures/ dir and would resurrect deleted/curated-out sites), this
 * script reads the current `packages/db/src/static-screens.json`, and
 * for each row that still has a capture dir with a mobile-hero PNG,
 * adds:
 *
 *   mobileImageUrl      captures/<slug>/mobile.png?v=<mtime>
 *   mobileFullUrl       captures/<slug>/mobile-full.png?v=<mtime>
 *   mobileVariants      { avif:[{w,url}], webp:[...] }  (384, 768)
 *   mobileFullVariants  { avif:[{w,url}], webp:[...] }  (768)
 *
 * Variant blocks are emitted only for widths actually encoded on disk
 * (so run AFTER encode-existing.ts), so the gallery's <picture> drops
 * back to PNG cleanly until the backfill catches up. Idempotent: re-runs
 * overwrite the mobile fields; rows with no mobile capture have any
 * stale mobile fields stripped.
 *
 *   pnpm --filter @inspo/worker exec tsx src/add-mobile-to-seed.ts          dry-run
 *   pnpm --filter @inspo/worker exec tsx src/add-mobile-to-seed.ts --write  write the seed
 */

import "./env.js";
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? join(process.cwd(), "captures"),
);
const BLOB_BASE =
  process.env.INSPO_BLOB_BASE_URL ??
  "https://0nme3pk5am3urwa9.public.blob.vercel-storage.com/captures";
const SEED = resolve("..", "..", "packages", "db", "src", "static-screens.json");

const WIDTHS = { mobile: [384, 768], "mobile-full": [768] } as const;

type Variant = { w: number; url: string };
type RoleVariants = { avif: Variant[]; webp: Variant[] };

function newestPng(files: string[], dir: string, prefix: string) {
  const matching = files
    .filter((f) => f.startsWith(prefix) && f.endsWith(".png"))
    .map((f) => ({ f, m: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  return matching[0] ?? null;
}

function variantBlock(
  files: string[],
  stem: string,
  slug: string,
  key: "mobile" | "mobile-full",
  v: number,
): RoleVariants | undefined {
  const avif: Variant[] = [];
  const webp: Variant[] = [];
  for (const w of WIDTHS[key]) {
    if (files.includes(`${stem}.${w}.avif`))
      avif.push({ w, url: `${BLOB_BASE}/${slug}/${key}.${w}.avif?v=${v}` });
    if (files.includes(`${stem}.${w}.webp`))
      webp.push({ w, url: `${BLOB_BASE}/${slug}/${key}.${w}.webp?v=${v}` });
  }
  if (avif.length === 0 && webp.length === 0) return undefined;
  return { avif, webp };
}

type MobileFields = {
  mobileImageUrl?: string;
  mobileFullUrl?: string;
  mobileVariants?: RoleVariants;
  mobileFullVariants?: RoleVariants;
};

function inspectMobile(slug: string): MobileFields | null {
  const dir = join(CAPTURES_DIR, slug);
  let files: string[];
  try {
    files = readdirSync(dir);
  } catch {
    return null;
  }
  const hero = newestPng(files, dir, "mobile-hero-");
  if (!hero) return null;
  const v = Math.floor(hero.m / 1000);
  const out: MobileFields = {
    mobileImageUrl: `${BLOB_BASE}/${slug}/mobile.png?v=${v}`,
  };
  const heroVar = variantBlock(files, hero.f.slice(0, -4), slug, "mobile", v);
  if (heroVar) out.mobileVariants = heroVar;

  const full = newestPng(files, dir, "mobile-full-");
  if (full) {
    out.mobileFullUrl = `${BLOB_BASE}/${slug}/mobile-full.png?v=${v}`;
    const fullVar = variantBlock(files, full.f.slice(0, -4), slug, "mobile-full", v);
    if (fullVar) out.mobileFullVariants = fullVar;
  }
  return out;
}

function main() {
  const write = process.argv.includes("--write");
  // --only=<slug> augments just that one row (testing / incremental
  // updates), leaving every other row untouched.
  const only = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
  const rows = JSON.parse(readFileSync(SEED, "utf8")) as Array<
    Record<string, unknown>
  >;

  let withMobile = 0;
  let withVariants = 0;
  let without = 0;
  for (const row of rows) {
    const slug = String(row.slug);
    if (only && slug !== only) continue;
    // Strip any prior mobile fields first (idempotent).
    delete row.mobileImageUrl;
    delete row.mobileFullUrl;
    delete row.mobileVariants;
    delete row.mobileFullVariants;

    const m = inspectMobile(slug);
    if (!m) {
      without += 1;
      continue;
    }
    Object.assign(row, m);
    withMobile += 1;
    if (m.mobileVariants) withVariants += 1;
  }

  console.log(`\n  rows:           ${rows.length}`);
  console.log(`  with mobile:    ${withMobile}`);
  console.log(`  with variants:  ${withVariants}`);
  console.log(`  no mobile cap:  ${without}`);

  if (write) {
    writeFileSync(SEED, JSON.stringify(rows));
    console.log(`\n  wrote ${SEED}\n`);
  } else {
    console.log(`\n  dry-run. re-run with --write to update the seed.\n`);
  }
}

main();
