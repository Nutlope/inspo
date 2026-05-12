/**
 * Multi-page site capture orchestrator.
 *
 * Given a site slug that's already in the DB (its homepage is the
 * starting point), discover up to N additional URLs, capture each,
 * and persist with siteSlug set to the parent site.
 *
 * Skips URLs that are already captured under this site_slug (idempotent
 * — safe to re-run if a previous attempt half-finished).
 *
 *   pnpm capture:site linear-app
 *   pnpm capture:site linear-app --max=6 --concurrency=2
 *   pnpm capture:site linear-app --dry-run     # discovery only, no capture
 */

import "./env.js";
import { hasDatabase, getDb } from "@inspo/db";
import { screens } from "@inspo/db/schema";
import { eq, and } from "drizzle-orm";
import { capture } from "./capture.js";
import { persistCapture } from "./persist.js";
import { discoverUrls } from "./discover.js";

type Opts = {
  siteSlug: string;
  max?: number;
  concurrency?: number;
  dryRun?: boolean;
  publish?: boolean;
};

export type SiteCaptureReport = {
  siteSlug: string;
  rootUrl: string;
  discovered: { url: string; pageType: string }[];
  skipped: string[]; // URLs we already had
  captured: { url: string; slug: string; pageType: string; ok: boolean; error?: string }[];
};

export async function captureSite(opts: Opts): Promise<SiteCaptureReport> {
  const { siteSlug, max = 7, concurrency = 2, dryRun = false, publish = false } = opts;

  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is required for capture-site");
  }
  const db = getDb();

  // 1. Find the existing homepage row for this site.
  const homepage = await db
    .select({
      slug: screens.slug,
      sourceUrl: screens.sourceUrl,
      siteSlug: screens.siteSlug,
    })
    .from(screens)
    .where(eq(screens.slug, siteSlug))
    .limit(1);

  const root = homepage[0];
  if (!root) {
    throw new Error(`No screen with slug='${siteSlug}' in DB`);
  }

  const rootUrl = root.sourceUrl;
  console.log(`\n══ ${siteSlug}  (${rootUrl})`);

  // 2. URLs already captured under this site_slug — skip them.
  const existing = await db
    .select({ sourceUrl: screens.sourceUrl })
    .from(screens)
    .where(eq(screens.siteSlug, siteSlug));
  const seenUrls = new Set(existing.map((r) => normalizeUrl(r.sourceUrl)));

  // 3. Discover candidates.
  const discovered = await discoverUrls(rootUrl, max);
  if (discovered.length === 0) {
    console.log("  ↳ nothing new to capture");
    return { siteSlug, rootUrl, discovered: [], skipped: [], captured: [] };
  }

  const fresh = discovered.filter((d) => !seenUrls.has(normalizeUrl(d.url)));
  const skipped = discovered.filter((d) => seenUrls.has(normalizeUrl(d.url))).map((d) => d.url);

  if (skipped.length > 0) {
    console.log(`  ↳ skipping ${skipped.length} already-captured`);
  }
  console.log(`  ↳ ${fresh.length} fresh URLs:`);
  for (const d of fresh) console.log(`     [${d.pageType}] ${d.url}`);

  if (dryRun) {
    return {
      siteSlug,
      rootUrl,
      discovered: discovered.map((d) => ({ url: d.url, pageType: d.pageType })),
      skipped,
      captured: [],
    };
  }

  // 4. Capture each. Bounded concurrency to be polite to the host.
  const captured: SiteCaptureReport["captured"] = [];
  const queue = [...fresh];
  const workers = Array(Math.max(1, concurrency))
    .fill(0)
    .map(async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) break;
        const childSlug = slugifyChild(siteSlug, next.url);
        try {
          const result = await capture({
            url: next.url,
            slug: childSlug,
            siteSlug,
            pageType: next.pageType,
          });
          await persistCapture(result, publish ? { status: "published" } : {});
          captured.push({
            url: next.url,
            slug: childSlug,
            pageType: next.pageType,
            ok: true,
          });
        } catch (err) {
          captured.push({
            url: next.url,
            slug: childSlug,
            pageType: next.pageType,
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          });
          console.warn(`  ✗ ${next.url}: ${err instanceof Error ? err.message : err}`);
        }
      }
    });
  await Promise.all(workers);

  const ok = captured.filter((c) => c.ok).length;
  console.log(`══ ${siteSlug}: ${ok}/${captured.length} captured\n`);
  return {
    siteSlug,
    rootUrl,
    discovered: discovered.map((d) => ({ url: d.url, pageType: d.pageType })),
    skipped,
    captured,
  };
}

function normalizeUrl(u: string): string {
  try {
    const url = new URL(u);
    url.hash = "";
    url.search = "";
    return url.href.replace(/\/$/, "");
  } catch {
    return u;
  }
}

function slugifyChild(siteSlug: string, url: string): string {
  try {
    const u = new URL(url);
    const pathPart = u.pathname
      .replace(/^\/|\/$/g, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .toLowerCase()
      .replace(/^-+|-+$/g, "");
    return pathPart ? `${siteSlug}--${pathPart}` : siteSlug;
  } catch {
    return `${siteSlug}--page`;
  }
}

/* ──────────────────────── CLI ──────────────────────── */

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    console.log(
      "Usage: pnpm capture:site <site-slug> [--max=7] [--concurrency=2] [--dry-run] [--publish]",
    );
    process.exit(0);
  }
  const siteSlug = argv.find((a) => !a.startsWith("--"));
  if (!siteSlug) {
    console.error("Missing <site-slug>");
    process.exit(1);
  }
  const max = Number(argv.find((a) => a.startsWith("--max="))?.split("=")[1] ?? 7);
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 2,
  );
  const dryRun = argv.includes("--dry-run");
  const publish = argv.includes("--publish");

  const report = await captureSite({ siteSlug, max, concurrency, dryRun, publish });
  console.log("\n— Report");
  console.log(JSON.stringify(report, null, 2));
}

const isCLI =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("/capture-site.ts");
if (isCLI) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
