/**
 * Components-only backfill: revisit a captured page, run JUST the DOM
 * scan from components.ts, and UPDATE the row's `components` jsonb.
 *
 * Skips screenshots, palette, tagging, and embeddings — typical site
 * runs in ~8-12 seconds (vs 25-35 for a full recapture).
 *
 *   pnpm extract:components linear-app                  one slug
 *   pnpm extract:components --top=100                   top N homepages by page count
 *   pnpm extract:components --all                       every published row (slow)
 *   pnpm extract:components --concurrency=4 --top=200
 */

import "./env.js";
import { chromium, type BrowserContext } from "playwright";
import {
  blockConsentNetworks,
  preSeedConsentCookies,
  dismissBanners,
} from "./dismiss.js";
import { stabilize } from "./stabilize.js";
import { extractComponents } from "./components.js";
import { getDb, schema, hasDatabase } from "@inspo/db";
import { eq, sql, desc } from "drizzle-orm";

type Target = { slug: string; sourceUrl: string };

async function selectTargets(opts: {
  slug?: string;
  top?: number;
  all?: boolean;
}): Promise<Target[]> {
  const db = getDb();
  if (opts.slug) {
    const rows = await db
      .select({ slug: schema.screens.slug, sourceUrl: schema.screens.sourceUrl })
      .from(schema.screens)
      .where(eq(schema.screens.slug, opts.slug))
      .limit(1);
    return rows;
  }
  if (opts.top) {
    // Top-N sites by number of captured pages — i.e. the sites where
    // multi-page exists and the components are most useful.
    const rows = await db
      .select({
        slug: schema.screens.slug,
        sourceUrl: schema.screens.sourceUrl,
        pageCount: sql<number>`count(*) over (partition by site_slug)::int`,
      })
      .from(schema.screens)
      .where(eq(schema.screens.status, "published"))
      .orderBy(desc(sql`count(*) over (partition by site_slug)`));
    // Dedup by slug, take first N
    const seen = new Set<string>();
    const out: Target[] = [];
    for (const r of rows) {
      if (seen.has(r.slug)) continue;
      seen.add(r.slug);
      out.push({ slug: r.slug, sourceUrl: r.sourceUrl });
      if (out.length >= opts.top) break;
    }
    return out;
  }
  // --all
  const rows = await db
    .select({ slug: schema.screens.slug, sourceUrl: schema.screens.sourceUrl })
    .from(schema.screens)
    .where(eq(schema.screens.status, "published"));
  return rows;
}

async function processOne(
  ctx: BrowserContext,
  t: Target,
): Promise<{ slug: string; ok: boolean; n: number; error?: string }> {
  const page = await ctx.newPage();
  try {
    await new Promise((r) => setTimeout(r, 100 + Math.random() * 400));
    await page.goto(t.sourceUrl, {
      waitUntil: "domcontentloaded",
      timeout: 25_000,
    });
    await page
      .waitForLoadState("networkidle", { timeout: 5_000 })
      .catch(() => {});
    await dismissBanners(page);
    await stabilize(page);
    const components = await extractComponents(page);
    const db = getDb();
    await db
      .update(schema.screens)
      .set({ components })
      .where(eq(schema.screens.slug, t.slug));
    return { slug: t.slug, ok: true, n: components.length };
  } catch (err) {
    return {
      slug: t.slug,
      ok: false,
      n: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const slug = argv.find((a) => !a.startsWith("--"));
  const topArg = argv.find((a) => a.startsWith("--top="))?.split("=")[1];
  const all = argv.includes("--all");
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 4,
  );

  if (!hasDatabase()) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const targets = await selectTargets({
    slug,
    top: topArg ? Number(topArg) : undefined,
    all,
  });
  if (targets.length === 0) {
    console.log("no targets");
    process.exit(0);
  }

  console.log(`\n  components backfill · ${targets.length} sites · concurrency=${concurrency}\n`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    timezoneId: "America/New_York",
  });
  await blockConsentNetworks(ctx);

  const startedAt = Date.now();
  const results: Array<{ slug: string; ok: boolean; n: number; error?: string }> = [];
  let cursor = 0;
  async function worker() {
    while (cursor < targets.length) {
      const idx = cursor++;
      const t = targets[idx]!;
      const tag = `[${String(idx + 1).padStart(4, " ")}/${targets.length}]`;
      // pre-seed cookies per-host
      await preSeedConsentCookies(ctx, t.sourceUrl).catch(() => {});
      const r = await Promise.race([
        processOne(ctx, t),
        new Promise<{ slug: string; ok: false; n: 0; error: string }>((_, rej) =>
          setTimeout(
            () => rej({ slug: t.slug, ok: false, n: 0, error: "timeout (40s)" }),
            40_000,
          ),
        ),
      ]).catch((e) => e as { slug: string; ok: false; n: 0; error: string });
      results.push(r);
      if (r.ok) {
        console.log(`${tag} ✓ ${t.slug.padEnd(35)} ${r.n} regions`);
      } else {
        console.log(`${tag} ✗ ${t.slug.padEnd(35)} ${r.error?.slice(0, 60)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  await ctx.close().catch(() => {});
  await browser.close().catch(() => {});

  const ok = results.filter((r) => r.ok).length;
  const totalRegions = results.reduce((acc, r) => acc + r.n, 0);
  const min = ((Date.now() - startedAt) / 1000 / 60).toFixed(1);
  console.log(
    `\n  done: ${ok}/${results.length} ok, ${totalRegions} regions total, ${min} min`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
