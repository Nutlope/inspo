/**
 * Augment the EXISTING static seed with DESKTOP variant fields, in
 * place - the desktop twin of add-mobile-to-seed.ts. For each row whose
 * capture dir has encoded AVIF/WebP variants on disk, writes:
 *
 *   heroVariants   { avif:[{w,url}], webp:[...] }   (384, 768, 1440)
 *   fullVariants   { ... }                          (768, 1440)
 *   thumbVariants  { ... }                          (384; tablet-hero source)
 *   lqip           data:image/avif;base64,... (tablet-hero, ~50 bytes)
 *
 * Only widths whose files exist AND that don't upsample the source are
 * emitted, so <picture> falls back to PNG cleanly. Run AFTER
 * encode-existing.ts and BEFORE upload-to-blob (which ships the same
 * files to the same keys). Scoped runs via --from-file never touch
 * rows outside the list; unscoped runs only ADD/refresh fields for
 * rows with local dirs and leave the rest alone (unlike mobile, there
 * is no strip pass - desktop variants never go stale-dangerous, the
 * PNG fallback always exists).
 *
 *   tsx src/add-desktop-variants-to-seed.ts                 dry-run
 *   tsx src/add-desktop-variants-to-seed.ts --write
 *   tsx src/add-desktop-variants-to-seed.ts --write --from-file=slugs.txt
 *   tsx src/add-desktop-variants-to-seed.ts --write --roles=thumb,hero
 *
 * --roles / --max-width MUST match how upload-to-blob was run: the seed
 * stores Blob URLs, so a variant that exists on disk but was never
 * uploaded becomes a 404 in the published catalogue.
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

/** role -> [disk prefix, blob key stem, widths] (must match
 *  encode-variants.ts + upload-to-blob.ts). */
const ROLES = [
  { field: "heroVariants", prefix: "desktop-hero-", key: "hero", widths: [384, 768, 1440] },
  { field: "fullVariants", prefix: "desktop-full-", key: "full", widths: [768, 1440] },
  { field: "thumbVariants", prefix: "tablet-hero-", key: "thumb", widths: [384] },
] as const;

type Variant = { w: number; url: string };
type RoleVariants = { avif: Variant[]; webp: Variant[] };

function newestPng(files: string[], dir: string, prefix: string) {
  const matching = files
    .filter((f) => f.startsWith(prefix) && f.endsWith(".png"))
    .map((f) => ({ f, m: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  return matching[0] ?? null;
}

function pngWidth(path: string): number | null {
  try {
    const buf = readFileSync(path);
    if (buf.length < 24) return null;
    return buf.readUInt32BE(16);
  } catch {
    return null;
  }
}

function main() {
  const write = process.argv.includes("--write");
  // Keep these in lockstep with upload-to-blob: the seed records Blob
  // URLs, so emitting a variant that was never uploaded writes a 404
  // into the catalogue. Local file existence is NOT sufficient proof.
  const rolesArg = process.argv
    .find((a) => a.startsWith("--roles="))
    ?.split("=")[1];
  const rolesFilter = rolesArg
    ? new Set(rolesArg.split(",").map((r) => r.trim()).filter(Boolean))
    : null;
  const maxWidth = Number(
    process.argv.find((a) => a.startsWith("--max-width="))?.split("=")[1] ??
      Infinity,
  );
  const fromFile = process.argv
    .find((a) => a.startsWith("--from-file="))
    ?.split("=")[1];
  const scoped: Set<string> | null = fromFile
    ? new Set(
        readFileSync(fromFile, "utf8")
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("#")),
      )
    : null;

  const rows = JSON.parse(readFileSync(SEED, "utf8")) as Array<
    Record<string, unknown>
  >;

  let touched = 0;
  let withHero = 0;
  let withThumb = 0;
  let withLqip = 0;
  for (const row of rows) {
    const slug = String(row.slug);
    if (scoped && !scoped.has(slug)) continue;
    const dir = join(CAPTURES_DIR, slug);
    let files: string[];
    try {
      files = readdirSync(dir);
    } catch {
      continue;
    }

    let any = false;
    for (const role of ROLES) {
      if (rolesFilter && !rolesFilter.has(role.key)) continue;
      const src = newestPng(files, dir, role.prefix);
      if (!src) continue;
      const v = Math.floor(src.m / 1000);
      const stem = src.f.slice(0, -4);
      const srcW = pngWidth(join(dir, src.f));
      const widths = role.widths.filter(
        (w) => w <= maxWidth && (srcW == null || w <= srcW * 1.1),
      );
      const avif: Variant[] = [];
      const webp: Variant[] = [];
      for (const w of widths) {
        if (files.includes(`${stem}.${w}.avif`))
          avif.push({ w, url: `${BLOB_BASE}/${slug}/${role.key}.${w}.avif?v=${v}` });
        if (files.includes(`${stem}.${w}.webp`))
          webp.push({ w, url: `${BLOB_BASE}/${slug}/${role.key}.${w}.webp?v=${v}` });
      }
      if (avif.length + webp.length > 0) {
        row[role.field] = { avif, webp } satisfies RoleVariants;
        any = true;
        if (role.field === "heroVariants") withHero++;
        if (role.field === "thumbVariants") withThumb++;
      }
    }

    // LQIP from the thumb (tablet-hero) source - tiny inline data URI.
    const thumbSrc = newestPng(files, dir, "tablet-hero-");
    if (thumbSrc) {
      const lqipPath = join(dir, `${thumbSrc.f.slice(0, -4)}.lqip`);
      try {
        const data = readFileSync(lqipPath, "utf8").trim();
        if (data.startsWith("data:image/")) {
          row.lqip = data;
          withLqip++;
          any = true;
        }
      } catch {
        /* no lqip encoded */
      }
    }
    if (any) touched++;
  }

  console.log(`\n  rows:        ${rows.length}`);
  console.log(`  touched:     ${touched}`);
  console.log(`  heroVariants ${withHero} · thumbVariants ${withThumb} · lqip ${withLqip}`);

  if (write) {
    writeFileSync(SEED, JSON.stringify(rows));
    console.log(`\n  wrote ${SEED}\n`);
  } else {
    console.log(`\n  dry-run. re-run with --write to update the seed.\n`);
  }
}

main();
