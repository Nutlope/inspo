/**
 * Step 1 — exact-hash sub-page dedupe.
 *
 * Many sub-page slugs (siteSlug--about, siteSlug--blog, …) were captured
 * without actually navigating to the sub-URL. Their PNGs are byte-identical
 * to the parent landing's PNGs. Capture filenames embed the sha256 of the
 * source PNG (see screenshot.ts → hashOf → first 16 hex), so identical
 * filename across two slug dirs ⇒ byte-identical capture.
 *
 * This script flags those rows. Default is dry-run (no writes). Pass
 * `--apply` to actually delete the rows from packages/db/src/static-screens.json
 * and write a snapshot of the previous file next to it.
 *
 * Strategy:
 *   1. Walk apps/worker/captures/<slug>/ for every slug in static-screens.json
 *   2. Pick the NEWEST desktop-hero-*.png + mobile-hero-*.png (by mtime) per slug
 *   3. Within each siteSlug group, compare each sub-page's two hashes to the parent's
 *   4. Require BOTH desktop-hero AND mobile-hero to match (two independent renders)
 *      — that's the strict criterion; we also report a "desktop-only" loose count
 *
 * Notes on conservatism:
 *   - We never touch capture dirs (cheap on disk, may be useful later).
 *   - Cross-site collisions are impossible in practice (sha256 truncated to 16 hex
 *     still has ~64 bits of entropy; we only compare within a single siteSlug).
 *   - If the parent row is missing from the seed, sub-pages are NOT dedupe'd
 *     against an inferred parent — those are reported separately as "orphans".
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface ScreenRow {
  id: string;
  slug: string;
  siteSlug: string;
  title?: string;
  sourceUrl?: string;
  [k: string]: unknown;
}

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..");
const SEED_PATH = join(REPO_ROOT, "packages", "db", "src", "static-screens.json");
const CAPTURES_DIR = join(REPO_ROOT, "apps", "worker", "captures");

const APPLY = process.argv.includes("--apply");

interface HeroHashes {
  desktopHero: string | null;
  mobileHero: string | null;
  desktopHeroMtime: number;
}

function newestHeroHashes(slug: string): HeroHashes {
  const dir = join(CAPTURES_DIR, slug);
  let files: string[];
  try {
    files = readdirSync(dir);
  } catch {
    return { desktopHero: null, mobileHero: null, desktopHeroMtime: 0 };
  }

  function pickNewest(prefix: string): { hash: string; mtime: number } | null {
    let best: { hash: string; mtime: number } | null = null;
    for (const f of files) {
      if (!f.startsWith(prefix) || !f.endsWith(".png")) continue;
      // filename shape: <viewport>-<role>-<sha-16hex>.png
      const m = f.match(/-([0-9a-f]{16})\.png$/);
      if (!m) continue;
      const hash = m[1]!;
      let mtime = 0;
      try {
        mtime = statSync(join(dir, f)).mtimeMs;
      } catch {
        continue;
      }
      if (!best || mtime > best.mtime) best = { hash, mtime };
    }
    return best;
  }

  const d = pickNewest("desktop-hero-");
  const m = pickNewest("mobile-hero-");
  return {
    desktopHero: d?.hash ?? null,
    mobileHero: m?.hash ?? null,
    desktopHeroMtime: d?.mtime ?? 0,
  };
}

function main() {
  const raw = readFileSync(SEED_PATH, "utf8");
  const rows: ScreenRow[] = JSON.parse(raw);

  console.log(`loaded ${rows.length} rows from ${SEED_PATH}`);

  // Group by siteSlug → list of rows
  const bySite = new Map<string, ScreenRow[]>();
  for (const r of rows) {
    const g = bySite.get(r.siteSlug) ?? [];
    g.push(r);
    bySite.set(r.siteSlug, g);
  }

  // Compute hero hashes for every slug we'll need
  const hashes = new Map<string, HeroHashes>();
  let scanned = 0;
  for (const r of rows) {
    if (hashes.has(r.slug)) continue;
    hashes.set(r.slug, newestHeroHashes(r.slug));
    scanned++;
    if (scanned % 500 === 0) process.stderr.write(`  hashed ${scanned}/${rows.length}\n`);
  }

  const missingCaptures: string[] = [];
  const noParentInSeed: Array<{ siteSlug: string; subSlugs: string[] }> = [];
  const strictDupes: Array<{ siteSlug: string; parentSlug: string; subSlug: string; desktopHash: string; mobileHash: string | null }> = [];
  const looseDupes: Array<{ siteSlug: string; parentSlug: string; subSlug: string; desktopHash: string }> = [];
  const desktopOnlyDupes: Array<{ siteSlug: string; parentSlug: string; subSlug: string }> = [];
  const distinctMobile: Array<{ siteSlug: string; parentSlug: string; subSlug: string }> = [];

  // For each site, find parent (slug === siteSlug) and check sub-pages
  for (const [siteSlug, group] of bySite.entries()) {
    const parent = group.find((r) => r.slug === siteSlug);
    const subs = group.filter((r) => r.slug !== siteSlug);
    if (subs.length === 0) continue;
    if (!parent) {
      noParentInSeed.push({ siteSlug, subSlugs: subs.map((s) => s.slug) });
      continue;
    }

    const pH = hashes.get(parent.slug)!;
    if (!pH.desktopHero) {
      missingCaptures.push(parent.slug);
      continue;
    }

    for (const sub of subs) {
      const sH = hashes.get(sub.slug)!;
      if (!sH.desktopHero) {
        missingCaptures.push(sub.slug);
        continue;
      }
      const desktopMatch = sH.desktopHero === pH.desktopHero;
      const mobileMatch =
        pH.mobileHero !== null && sH.mobileHero !== null && sH.mobileHero === pH.mobileHero;

      if (desktopMatch && mobileMatch) {
        strictDupes.push({
          siteSlug,
          parentSlug: parent.slug,
          subSlug: sub.slug,
          desktopHash: sH.desktopHero,
          mobileHash: sH.mobileHero,
        });
      } else if (desktopMatch) {
        looseDupes.push({
          siteSlug,
          parentSlug: parent.slug,
          subSlug: sub.slug,
          desktopHash: sH.desktopHero,
        });
        desktopOnlyDupes.push({ siteSlug, parentSlug: parent.slug, subSlug: sub.slug });
        if (pH.mobileHero && sH.mobileHero && pH.mobileHero !== sH.mobileHero) {
          distinctMobile.push({ siteSlug, parentSlug: parent.slug, subSlug: sub.slug });
        }
      }
    }
  }

  // Per-site strict-dupe distribution
  const dupesPerSite = new Map<string, number>();
  for (const d of strictDupes) {
    dupesPerSite.set(d.siteSlug, (dupesPerSite.get(d.siteSlug) ?? 0) + 1);
  }
  const topSites = [...dupesPerSite.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  console.log("\n=== STEP 1 EXACT-HASH DEDUPE — DRY RUN ===");
  console.log(`captures dir: ${CAPTURES_DIR}`);
  console.log(`seed rows total:                  ${rows.length}`);
  console.log(`sites (siteSlug groups):          ${bySite.size}`);
  console.log(`scanned dirs for hero hashes:     ${scanned}`);
  console.log(`captures missing on disk:         ${missingCaptures.length}`);
  console.log(`sub-pages w/o parent in seed:     ${noParentInSeed.reduce((n, x) => n + x.subSlugs.length, 0)} rows across ${noParentInSeed.length} sites`);
  console.log("");
  console.log(`STRICT dupes (desktop AND mobile hero match):  ${strictDupes.length} sub-page rows`);
  console.log(`LOOSE  dupes (desktop hero match only):        ${looseDupes.length} sub-page rows`);
  console.log(`  of which distinct on mobile hero:            ${distinctMobile.length}`);
  console.log("");
  console.log(`would-be-deleted rows under STRICT criterion:  ${strictDupes.length}`);
  console.log(`would-be-deleted rows under LOOSE  criterion:  ${looseDupes.length}`);
  console.log(`rows remaining (STRICT):                       ${rows.length - strictDupes.length}`);
  console.log(`rows remaining (LOOSE):                        ${rows.length - looseDupes.length}`);
  console.log("");
  console.log("top 15 sites by strict-dupe count:");
  for (const [s, n] of topSites) {
    const total = (bySite.get(s) ?? []).length;
    console.log(`  ${String(n).padStart(3)}/${String(total).padStart(2)}  ${s}`);
  }
  console.log("");
  console.log("sample of 10 strict dupes (sub-page → parent):");
  for (const d of strictDupes.slice(0, 10)) {
    console.log(`  ${d.subSlug}  →  ${d.parentSlug}  (desktop ${d.desktopHash} · mobile ${d.mobileHash})`);
  }
  console.log("");
  console.log("sample of 10 LOOSE-only (desktop match, mobile differs):");
  const looseOnly = looseDupes.filter(
    (l) => !strictDupes.some((s) => s.subSlug === l.subSlug),
  );
  for (const d of looseOnly.slice(0, 10)) {
    console.log(`  ${d.subSlug}  →  ${d.parentSlug}  (desktop ${d.desktopHash})`);
  }
  console.log("");
  if (noParentInSeed.length) {
    console.log("first 10 sites with sub-pages but NO parent row in seed:");
    for (const { siteSlug, subSlugs } of noParentInSeed.slice(0, 10)) {
      console.log(`  ${siteSlug}  (sub-pages: ${subSlugs.length})  e.g. ${subSlugs.slice(0, 3).join(", ")}`);
    }
    console.log("");
  }
  if (missingCaptures.length) {
    console.log(`first 10 slugs with missing capture dirs/hero PNGs:`);
    for (const s of missingCaptures.slice(0, 10)) console.log(`  ${s}`);
    console.log("");
  }

  if (!APPLY) {
    console.log("(dry run — pass --apply to actually delete strict dupes and snapshot the seed)");
    return;
  }

  // Apply: keep rows whose slug is NOT in the strict-dupe set.
  const dropSlugs = new Set(strictDupes.map((d) => d.subSlug));
  const kept = rows.filter((r) => !dropSlugs.has(r.slug));
  const snapshotPath = SEED_PATH.replace(/\.json$/, `.pre-dedupe-${Date.now()}.json`);
  writeFileSync(snapshotPath, raw);
  writeFileSync(SEED_PATH, `${JSON.stringify(kept, null, 2)}\n`);
  console.log(`APPLIED: ${rows.length} → ${kept.length} rows (${rows.length - kept.length} removed)`);
  console.log(`snapshot written: ${snapshotPath}`);
}

main();
