/**
 * Delete a list of siteSlugs from the catalogue.
 *
 * For each siteSlug:
 *   - removes the parent row + all sub-page rows from
 *     packages/db/src/static-screens.json
 *   - removes the entry from packages/db/src/embeddings.idx.json
 *   - rewrites embeddings.bin with the matching Float32 vector elided
 *
 * Capture dirs on disk are left in place (cheap, may be useful later).
 *
 *   pnpm tsx src/delete-sites.ts --slugs=foo,bar,baz          dry-run
 *   pnpm tsx src/delete-sites.ts --slugs=foo,bar,baz --apply  apply
 *   pnpm tsx src/delete-sites.ts --from-file=path.txt --apply (one slug per line)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..");
const SEED_PATH = join(REPO_ROOT, "packages", "db", "src", "static-screens.json");
const IDX_PATH = join(REPO_ROOT, "packages", "db", "src", "embeddings.idx.json");
const BIN_PATH = join(REPO_ROOT, "packages", "db", "src", "embeddings.bin");

interface Row {
  slug: string;
  siteSlug: string;
  [k: string]: unknown;
}
interface Idx {
  slugs: string[];
  dims: number;
  count: number;
}

function parseSlugs(): string[] {
  const argv = process.argv.slice(2);
  const slugsArg = argv.find((a) => a.startsWith("--slugs="));
  const fileArg = argv.find((a) => a.startsWith("--from-file="));
  if (slugsArg) {
    return slugsArg.slice("--slugs=".length).split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (fileArg) {
    const p = fileArg.slice("--from-file=".length);
    return readFileSync(p, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
  }
  console.error("usage: delete-sites.ts --slugs=foo,bar [--apply]  |  --from-file=path [--apply]");
  process.exit(1);
}

function main() {
  const slugs = new Set(parseSlugs());
  const apply = process.argv.includes("--apply");

  const rawSeed = readFileSync(SEED_PATH, "utf8");
  const rows: Row[] = JSON.parse(rawSeed);
  const keptRows = rows.filter((r) => !slugs.has(r.siteSlug));
  const droppedRows = rows.length - keptRows.length;

  const rawIdx = readFileSync(IDX_PATH, "utf8");
  const idx: Idx = JSON.parse(rawIdx);
  const keptSlugs: string[] = [];
  const droppedIndices: number[] = [];
  for (let i = 0; i < idx.slugs.length; i++) {
    if (slugs.has(idx.slugs[i]!)) droppedIndices.push(i);
    else keptSlugs.push(idx.slugs[i]!);
  }

  console.log("\n=== DELETE-SITES ===");
  console.log(`slugs requested:                 ${slugs.size}`);
  console.log(`rows in seed:                    ${rows.length} → ${keptRows.length}   (drop ${droppedRows})`);
  console.log(`siteSlugs in sidecar:            ${idx.slugs.length} → ${keptSlugs.length}   (drop ${droppedIndices.length})`);

  // Sanity: every requested slug should be a known siteSlug
  const knownSiteSlugs = new Set(rows.map((r) => r.siteSlug));
  const unknown = [...slugs].filter((s) => !knownSiteSlugs.has(s));
  if (unknown.length) {
    console.log(`\nWARN — ${unknown.length} requested slug(s) not present in seed:`);
    for (const u of unknown.slice(0, 20)) console.log(`  ${u}`);
  }
  const inSidecarNotInSeed = [...slugs].filter((s) => idx.slugs.includes(s) && !knownSiteSlugs.has(s));
  if (inSidecarNotInSeed.length) {
    console.log(`(${inSidecarNotInSeed.length} of those are in sidecar though — will still be removed)`);
  }

  if (!apply) {
    console.log("\n(dry run — pass --apply to write files)");
    return;
  }

  // Snapshot before mutating
  const ts = Date.now();
  writeFileSync(SEED_PATH.replace(/\.json$/, `.pre-delete-${ts}.json`), rawSeed);
  writeFileSync(IDX_PATH.replace(/\.json$/, `.pre-delete-${ts}.json`), rawIdx);

  // Rebuild embeddings.bin: vectors are laid out [dims × float32] per
  // entry, in the order of idx.slugs. Keep only the indices we want.
  const binBuf = readFileSync(BIN_PATH);
  const dims = idx.dims;
  const bytesPerVec = dims * 4;
  if (binBuf.byteLength !== idx.slugs.length * bytesPerVec) {
    throw new Error(
      `bin size mismatch: ${binBuf.byteLength} != ${idx.slugs.length} × ${bytesPerVec}`,
    );
  }
  const out = Buffer.alloc(keptSlugs.length * bytesPerVec);
  let writeOffset = 0;
  for (let i = 0; i < idx.slugs.length; i++) {
    if (slugs.has(idx.slugs[i]!)) continue;
    binBuf.copy(out, writeOffset, i * bytesPerVec, (i + 1) * bytesPerVec);
    writeOffset += bytesPerVec;
  }
  // Snapshot bin (cheap, 4MB)
  writeFileSync(BIN_PATH.replace(/\.bin$/, `.pre-delete-${ts}.bin`), binBuf);

  // Write everything. Keep the seed MINIFIED to match how the seed
  // builder / add-mobile-to-seed write it (pretty-printing would 3x the
  // file + blow up the diff).
  writeFileSync(SEED_PATH, JSON.stringify(keptRows));
  const newIdx: Idx = { slugs: keptSlugs, dims, count: keptSlugs.length };
  writeFileSync(IDX_PATH, JSON.stringify(newIdx));
  writeFileSync(BIN_PATH, out);

  console.log(`\nAPPLIED.`);
  console.log(`  seed:  ${rows.length} → ${keptRows.length}`);
  console.log(`  idx:   ${idx.slugs.length} → ${keptSlugs.length}`);
  console.log(`  bin:   ${binBuf.byteLength} → ${out.byteLength} bytes`);
  console.log(`  snapshots written next to each file (suffix .pre-delete-${ts}.{json,bin})`);
}

main();
