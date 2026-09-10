/**
 * Disk-only multi-page capture, the Neon-free counterpart of
 * capture-site.ts. For each site whose homepage is already captured on
 * disk (captures/<site>/meta.json), discover up to N more public pages
 * and capture each into captures/<site>--<path>/ with the same meta.json
 * sidecar add-sites-disk.ts writes, which merge-disk-captures-to-seed.ts
 * then reads.
 *
 *   pnpm exec tsx src/capture-pages-disk.ts <sites-file> [--max=4] [--concurrency=3]
 *
 * Idempotent: a page whose dir already has a meta.json is skipped, so a
 * crashed run resumes where it stopped. Discovery drops sign-in, account
 * and checkout pages before anything is captured (see discover.ts). A
 * per-run report lands in captures/_reports/pages-<timestamp>.json.
 */

import "./env.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { capture } from "./capture.js";
import { discoverUrls, type DiscoveredUrl } from "./discover.js";

const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? join(process.cwd(), "captures"),
);

/** `<site>--<path>`, the slug shape every existing sub-page row uses. */
function childSlug(siteSlug: string, url: string): string {
  const path = new URL(url).pathname
    .replace(/^\/|\/$/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()
    .replace(/^-+|-+$/g, "");
  return path ? `${siteSlug}--${path}`.slice(0, 120) : `${siteSlug}--page`;
}

type Job = {
  site: string;
  url: string;
  pageType: DiscoveredUrl["pageType"];
  slug: string;
};
type Outcome = Job & { ok: boolean; skipped?: boolean; error?: string };

async function main() {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("usage: capture-pages-disk.ts <sites-file> [--max=4] [--concurrency=3]");
    process.exit(1);
  }
  const max = Number(argv.find((a) => a.startsWith("--max="))?.split("=")[1] ?? 4);
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 3,
  );
  const sites = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  // 1. Discover, six sites at a time (a few fetches + one ranker call each).
  const jobs: Job[] = [];
  const discovered: Record<string, DiscoveredUrl[]> = {};
  let di = 0;
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (di < sites.length) {
        const site = sites[di++]!;
        const metaPath = join(CAPTURES_DIR, site, "meta.json");
        if (!existsSync(metaPath)) {
          console.log(`  ⨯ ${site}: no homepage meta.json, skipping`);
          continue;
        }
        const root = (JSON.parse(readFileSync(metaPath, "utf8")) as { sourceUrl: string }).sourceUrl;
        try {
          const found = await discoverUrls(root, max);
          discovered[site] = found;
          const seen = new Set<string>();
          for (const d of found) {
            const slug = childSlug(site, d.url);
            if (seen.has(slug)) continue;
            seen.add(slug);
            jobs.push({ site, url: d.url, pageType: d.pageType, slug });
          }
        } catch (err) {
          console.log(`  ✗ discovery failed for ${site}: ${err instanceof Error ? err.message : String(err)}`);
          discovered[site] = [];
        }
      }
    }),
  );

  console.log(
    `\n  capture-pages-disk · ${sites.length} sites · ${jobs.length} pages · concurrency=${concurrency}\n`,
  );

  // 2. Capture.
  const outcomes: Outcome[] = [];
  let ci = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (ci < jobs.length) {
        const idx = ci++;
        const job = jobs[idx]!;
        const tag = `[${String(idx + 1).padStart(4, " ")}/${jobs.length}]`;
        const dir = join(CAPTURES_DIR, job.slug);
        const metaPath = join(dir, "meta.json");
        if (existsSync(metaPath)) {
          outcomes.push({ ...job, ok: true, skipped: true });
          continue;
        }
        try {
          console.log(`${tag} ▶ ${job.slug}  [${job.pageType}] ${job.url}`);
          const result = await Promise.race([
            capture({ url: job.url, slug: job.slug, siteSlug: job.site, pageType: job.pageType }),
            // 300s: a scroll-stitched fallback on a long page adds a minute or more.
            new Promise<never>((_, rej) =>
              setTimeout(() => rej(new Error("capture timed out (300s)")), 300_000),
            ),
          ]);
          mkdirSync(dir, { recursive: true });
          writeFileSync(
            metaPath,
            JSON.stringify(
              {
                sourceUrl: result.sourceUrl,
                slug: result.slug,
                siteSlug: result.siteSlug,
                pageType: result.pageType,
                capturedAt: result.capturedAt,
                meta: result.meta,
                tags: result.tags ?? null,
                embeddings: result.embeddings ?? null,
              },
              null,
              2,
            ),
          );
          outcomes.push({ ...job, ok: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          outcomes.push({ ...job, ok: false, error: msg.slice(0, 200) });
          console.log(`${tag} ✗ ${job.slug}: ${msg.slice(0, 80)}`);
        }
      }
    }),
  );

  const reportDir = join(CAPTURES_DIR, "_reports");
  mkdirSync(reportDir, { recursive: true });
  const out = join(reportDir, `pages-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(out, JSON.stringify({ sites, discovered, outcomes }, null, 2));
  const captured = outcomes.filter((o) => o.ok && !o.skipped).length;
  const skipped = outcomes.filter((o) => o.skipped).length;
  const failed = outcomes.filter((o) => !o.ok).length;
  console.log(`\n  captured ${captured} · skipped ${skipped} · failed ${failed}`);
  console.log(`  report → ${out}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
