/**
 * Disk-only add-sites: capture a list of brand-new URLs without touching
 * Neon. Mirrors `add-sites.ts` but writes a `meta.json` sidecar per
 * capture dir (with tags, embeddings, palette, design metadata) so the
 * companion `merge-disk-captures-to-seed.ts` can merge them into
 * static-screens.json + embeddings.bin later, no DB needed.
 *
 *   pnpm tsx src/add-sites-disk.ts urls.txt --concurrency=2
 *   pnpm tsx src/add-sites-disk.ts urls.txt --concurrency=4 --skip-enrich  (cheaper smoke)
 *
 * Idempotent: skips slugs whose capture dir already has a `meta.json`
 * (lets you resume after Ctrl-C or crash).
 */

import "./env.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { capture } from "./capture.js";

const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? join(process.cwd(), "captures"),
);

function slugifyHost(url: string): string {
  try {
    const u = new URL(url);
    return u.host
      .replace(/^www\./, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase()
      .replace(/^-+|-+$/g, "");
  } catch {
    return url.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("usage: add-sites-disk.ts <urls-file> [--concurrency=2] [--skip-enrich]");
    process.exit(1);
  }
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 2,
  );
  const skipEnrich = argv.includes("--skip-enrich");

  const urls = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  console.log(`\n  add-sites-disk · ${urls.length} URLs · concurrency=${concurrency}${skipEnrich ? " · NO ENRICH" : ""}\n`);

  let cursor = 0;
  let ok = 0;
  let skipped = 0;
  let failed = 0;
  const fails: string[] = [];

  async function worker() {
    while (cursor < urls.length) {
      const idx = cursor++;
      const url = urls[idx]!;
      const slug = slugifyHost(url);
      const tag = `[${String(idx + 1).padStart(4, " ")}/${urls.length}]`;
      const dir = join(CAPTURES_DIR, slug);
      const metaPath = join(dir, "meta.json");
      if (existsSync(metaPath)) {
        skipped++;
        if (skipped % 50 === 0) console.log(`${tag} skipped (already captured) ${slug}`);
        continue;
      }
      try {
        console.log(`${tag} ▶ ${slug}  (${url})`);
        const result = await Promise.race([
          capture({ url, slug, siteSlug: slug, pageType: "landing", enrich: !skipEnrich }),
          // 300s: a scroll-stitched fallback on a long page adds a minute or more.
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error("capture timed out (300s)")), 300_000),
          ),
        ]);
        mkdirSync(dir, { recursive: true });
        // Persist just the enrichment + metadata; PNGs are already on disk via saveLocal()
        const sidecar = {
          sourceUrl: result.sourceUrl,
          slug: result.slug,
          siteSlug: result.siteSlug,
          pageType: result.pageType,
          capturedAt: result.capturedAt,
          meta: result.meta,
          tags: result.tags ?? null,
          embeddings: result.embeddings ?? null,
        };
        writeFileSync(metaPath, JSON.stringify(sidecar, null, 2));
        ok++;
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        fails.push(`${slug}: ${msg.slice(0, 100)}`);
        console.log(`${tag} ✗ ${slug}: ${msg.slice(0, 80)}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  console.log("\n══════════════════════════════════════════");
  console.log(`  ok ${ok} · skipped ${skipped} · failed ${failed} · total ${urls.length}`);
  if (fails.length) {
    console.log(`\n  failures (first 20):`);
    for (const f of fails.slice(0, 20)) console.log(`    ${f}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
