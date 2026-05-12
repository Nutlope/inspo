/**
 * Re-capture every pilot child screen (rows whose slug contains "--",
 * our convention for `<site>--<path>` child pages) with the latest
 * banner-killer in dismiss.ts.
 *
 * Use when the dismiss heuristics have been strengthened and the
 * existing child captures need to be redone. Older homepages
 * (slug == site_slug) are NOT touched here — for those use the
 * audit + recapture-flagged path.
 *
 *   pnpm capture:recapture-pilot           dry-run (lists URLs)
 *   pnpm capture:recapture-pilot --go      do the captures
 *   pnpm capture:recapture-pilot --go --concurrency=2 --site=linear-app
 */

import "./env.js";
import { hasDatabase, getDb } from "@inspo/db";
import { screens } from "@inspo/db/schema";
import { and, eq, like } from "drizzle-orm";
import { capture } from "./capture.js";
import { persistCapture } from "./persist.js";

async function main() {
  const argv = process.argv.slice(2);
  const go = argv.includes("--go");
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 2,
  );
  const siteFilter = argv.find((a) => a.startsWith("--site="))?.split("=")[1];

  if (!hasDatabase()) throw new Error("DATABASE_URL required");
  const db = getDb();

  const conds = [like(screens.slug, "%--%"), eq(screens.status, "published")];
  if (siteFilter) {
    conds.push(eq(screens.siteSlug, siteFilter));
  }
  const rows = await db
    .select({
      slug: screens.slug,
      sourceUrl: screens.sourceUrl,
      siteSlug: screens.siteSlug,
      pageType: screens.pageType,
    })
    .from(screens)
    .where(and(...conds));

  console.log(`\n  recapture · ${rows.length} pilot child captures · go=${go}\n`);

  if (!go) {
    for (const r of rows.slice(0, 20)) {
      console.log(`  ↻ ${r.slug.padEnd(40)} ${r.sourceUrl}`);
    }
    if (rows.length > 20) console.log(`  …and ${rows.length - 20} more`);
    console.log("\n  dry-run. re-run with --go to capture.\n");
    return;
  }

  const startedAt = Date.now();
  const results: { slug: string; ok: boolean; error?: string }[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < rows.length) {
      const idx = cursor++;
      const r = rows[idx]!;
      const tag = `[${String(idx + 1).padStart(4, " ")}/${rows.length}]`;
      try {
        console.log(`${tag} ↻ ${r.slug.padEnd(40)} ${r.sourceUrl}`);
        const result = await capture({
          url: r.sourceUrl,
          slug: r.slug,
          siteSlug: r.siteSlug ?? r.slug,
          pageType: (r.pageType ?? "landing") as
            | "landing"
            | "pricing"
            | "features"
            | "auth"
            | "about"
            | "blog"
            | "changelog"
            | "docs"
            | "other",
        });
        await persistCapture(result, { status: "published" });
        results.push({ slug: r.slug, ok: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`${tag} ✗ ${r.slug.padEnd(40)} ${msg.slice(0, 70)}`);
        results.push({ slug: r.slug, ok: false, error: msg });
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;
  const min = ((Date.now() - startedAt) / 1000 / 60).toFixed(1);
  console.log(`\n  recaptured ${ok}/${results.length} (${fail} failed) in ${min} min`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
