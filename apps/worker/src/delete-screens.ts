/**
 * Delete individual CAPTURES (rows) from the catalogue, by `slug`.
 *
 * The sibling `delete-sites.ts` matches on `siteSlug` and removes a
 * whole site. That is the wrong tool for pruning one bad page out of a
 * good site, and worse, it fails *silently*: feed it a page slug like
 * `anchor-fm--pricing` and no row has that as its siteSlug, so it
 * reports success having deleted nothing. This script is the
 * page-level counterpart.
 *
 *   pnpm exec tsx src/delete-screens.ts --from-file=path.txt          dry-run
 *   pnpm exec tsx src/delete-screens.ts --from-file=path.txt --apply
 *
 * Every surface that can reference a slug is handled, because the last
 * pruning pass missed three of them and left dangling entries:
 *
 *   static-screens.json        the rows themselves
 *   embeddings-rows.idx/.bin   per-row vectors (find_similar)
 *   embeddings.idx/.bin        per-SITE vectors - only dropped for
 *                              sites that lose every one of their rows
 *   umap-2d.json               map layout, when present
 *   fixtures.ts                curated collection entries
 *   lib/examples.ts            example case-study references
 *
 * The last two are source files, so they are reported rather than
 * rewritten: a collection losing a screen may want a replacement
 * chosen by hand, not a silent hole.
 */

import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REPO = join(import.meta.dirname, "..", "..", "..");
const DB = join(REPO, "packages", "db", "src");
const SEED = join(DB, "static-screens.json");
const ROW_IDX = join(DB, "embeddings-rows.idx.json");
const ROW_BIN = join(DB, "embeddings-rows.bin");
const SITE_IDX = join(DB, "embeddings.idx.json");
const SITE_BIN = join(DB, "embeddings.bin");
const UMAP = join(DB, "umap-2d.json");
const FIXTURES = join(DB, "fixtures.ts");
const EXAMPLES = join(REPO, "apps", "web", "src", "lib", "examples.ts");

type Row = { slug: string; siteSlug: string; pageType?: string; [k: string]: unknown };
type Idx = { slugs: string[]; dims: number; count?: number };

const argv = process.argv.slice(2);
const fileArg = argv.find((a) => a.startsWith("--from-file="));
const slugsArg = argv.find((a) => a.startsWith("--slugs="));
const APPLY = argv.includes("--apply");

if (!fileArg && !slugsArg) {
  console.error("usage: delete-screens.ts --from-file=path [--apply] | --slugs=a,b [--apply]");
  process.exit(1);
}

const wanted = new Set(
  (fileArg
    ? readFileSync(fileArg.slice("--from-file=".length), "utf8")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"))
    : slugsArg!.slice("--slugs=".length).split(",").map((s) => s.trim())
  ).filter(Boolean),
);

const rows = JSON.parse(readFileSync(SEED, "utf8")) as Row[];
const present = new Set(rows.map((r) => r.slug));
const missing = [...wanted].filter((s) => !present.has(s));
const kept = rows.filter((r) => !wanted.has(r.slug));
const removed = rows.filter((r) => wanted.has(r.slug));

/* Which sites lose every row? Only those may drop their site-level
   vector; a site that keeps even one page still needs its entry. */
const pagesPerSite = new Map<string, number>();
for (const r of rows) pagesPerSite.set(r.siteSlug, (pagesPerSite.get(r.siteSlug) ?? 0) + 1);
const keptPerSite = new Map<string, number>();
for (const r of kept) keptPerSite.set(r.siteSlug, (keptPerSite.get(r.siteSlug) ?? 0) + 1);
const sitesGone = [...pagesPerSite.keys()].filter((s) => !keptPerSite.has(s));

/* Sites that keep pages but lose their landing. Not fatal - getAllSites
   falls back to the first remaining row for the tile - but the archive
   then represents that site with a sub-page, which is usually not what
   anyone intended. Always reported. */
const lostLanding: { site: string; keeps: number; nowHero: string }[] = [];
for (const [site, n] of keptPerSite) {
  const all = rows.filter((r) => r.siteSlug === site);
  const landing = all.find((r) => r.pageType === "landing");
  if (landing && wanted.has(landing.slug)) {
    lostLanding.push({
      site,
      keeps: n,
      nowHero: kept.find((r) => r.siteSlug === site)!.slug,
    });
  }
}

console.log(`removal list: ${wanted.size} slugs`);
if (missing.length) {
  console.log(`  NOT IN CATALOGUE (${missing.length}): ${missing.slice(0, 8).join(", ")}`);
}
console.log(`  rows: ${rows.length} → ${kept.length}  (-${removed.length})`);
console.log(`  sites: ${pagesPerSite.size} → ${keptPerSite.size}  (-${sitesGone.length} fully removed)`);

if (lostLanding.length) {
  console.log(`\n  sites keeping pages but losing their landing (${lostLanding.length}):`);
  for (const l of lostLanding) {
    console.log(`    ${l.site.padEnd(26)} keeps ${l.keeps}, tile becomes ${l.nowHero}`);
  }
}

/** Rewrite a sidecar pair, eliding the vectors of dropped slugs. */
function pruneVectors(idxPath: string, binPath: string, drop: Set<string>, label: string) {
  if (!existsSync(idxPath) || !existsSync(binPath)) {
    console.log(`  ${label}: absent, skipped`);
    return;
  }
  const idx = JSON.parse(readFileSync(idxPath, "utf8")) as Idx;
  const bin = readFileSync(binPath);
  const dims = idx.dims;
  const keepIdx: number[] = [];
  const keepSlugs: string[] = [];
  idx.slugs.forEach((s, i) => {
    if (!drop.has(s)) {
      keepIdx.push(i);
      keepSlugs.push(s);
    }
  });
  const hit = idx.slugs.length - keepSlugs.length;
  console.log(`  ${label}: ${idx.slugs.length} → ${keepSlugs.length}  (-${hit})`);
  if (!APPLY || hit === 0) return;

  const bytesPerVec = dims * 4;
  const out = Buffer.alloc(keepIdx.length * bytesPerVec);
  keepIdx.forEach((src, dst) => {
    bin.copy(out, dst * bytesPerVec, src * bytesPerVec, (src + 1) * bytesPerVec);
  });
  copyFileSync(idxPath, `${idxPath}.pre-prune-${Date.now()}.bak`);
  copyFileSync(binPath, `${binPath}.pre-prune-${Date.now()}.bak`);
  writeFileSync(idxPath, JSON.stringify({ ...idx, slugs: keepSlugs, count: keepSlugs.length }));
  writeFileSync(binPath, out);
}

console.log("\nsidecars:");
pruneVectors(ROW_IDX, ROW_BIN, wanted, "embeddings-rows (per row)");
pruneVectors(SITE_IDX, SITE_BIN, new Set(sitesGone), "embeddings (per site)");

/* UMAP layout, when it exists and carries slugs. */
if (existsSync(UMAP)) {
  const raw = JSON.parse(readFileSync(UMAP, "utf8"));
  const arr = Array.isArray(raw) ? raw : (raw.points ?? raw.nodes ?? null);
  if (Array.isArray(arr)) {
    const keptPts = arr.filter((p: { slug?: string }) => !p.slug || !wanted.has(p.slug));
    console.log(`  umap-2d: ${arr.length} → ${keptPts.length}  (-${arr.length - keptPts.length})`);
    if (APPLY && keptPts.length !== arr.length) {
      copyFileSync(UMAP, `${UMAP}.pre-prune-${Date.now()}.bak`);
      writeFileSync(UMAP, JSON.stringify(Array.isArray(raw) ? keptPts : { ...raw, points: keptPts }));
    }
  } else {
    console.log("  umap-2d: no slug-keyed points, skipped");
  }
}

/* Source-file references. Reported, never rewritten - a curated
   collection with a hole in it is a judgement call. */
console.log("\nsource references to fix by hand:");
let anyRef = false;
for (const [path, label] of [
  [FIXTURES, "packages/db/src/fixtures.ts (collections)"],
  [EXAMPLES, "apps/web/src/lib/examples.ts (case studies)"],
] as const) {
  if (!existsSync(path)) continue;
  const src = readFileSync(path, "utf8");
  const refs = [...wanted].filter((s) => src.includes(`"${s}"`) || src.includes(`'${s}'`));
  if (refs.length) {
    anyRef = true;
    console.log(`  ${label}: ${refs.join(", ")}`);
  }
}
if (!anyRef) console.log("  none");

if (!APPLY) {
  console.log("\ndry run - nothing written. Re-run with --apply.");
} else {
  copyFileSync(SEED, `${SEED}.pre-prune-${Date.now()}.bak`);
  writeFileSync(SEED, JSON.stringify(kept));
  console.log(`\nwrote ${SEED}`);
}
