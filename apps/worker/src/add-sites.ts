/**
 * Add a list of brand-new URLs (sites not yet in DB) to the catalogue.
 * For each URL:
 *   1. Capture the homepage and persist as a published site.
 *   2. Run multi-page discovery + capture (same as capture-site.ts).
 *
 *   pnpm capture:add-sites brand-additions.txt --concurrency=2 --max=7
 *
 * Idempotent: if a homepage slug is already in DB the orchestrator just
 * skips to the multi-page step for that site.
 */

import "./env.js";
import { readFileSync } from "node:fs";
import { hasDatabase, getDb } from "@inspo/db";
import { screens } from "@inspo/db/schema";
import { eq } from "drizzle-orm";
import { capture } from "./capture.js";
import { persistCapture } from "./persist.js";
import { captureSite } from "./capture-site.js";

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
    console.error(
      "Usage: pnpm capture:add-sites <urls-file> [--max=7] [--concurrency=2]",
    );
    process.exit(1);
  }
  const max = Number(argv.find((a) => a.startsWith("--max="))?.split("=")[1] ?? 7);
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 2,
  );

  if (!hasDatabase()) throw new Error("DATABASE_URL required");
  const db = getDb();

  const urls = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  console.log(`\n  add-sites · ${urls.length} URLs · max=${max} per site\n`);

  const summary: { url: string; slug: string; ok: boolean; pages: number }[] = [];
  for (const url of urls) {
    const siteSlug = slugifyHost(url);

    // Step 1: homepage capture (skip if already there)
    const existing = await db
      .select({ id: screens.id })
      .from(screens)
      .where(eq(screens.slug, siteSlug))
      .limit(1);

    if (existing[0]) {
      console.log(`\n══ ${siteSlug}  (homepage already in DB)`);
    } else {
      console.log(`\n══ ${siteSlug}  (capturing homepage)`);
      try {
        const result = await Promise.race([
          capture({ url, slug: siteSlug, siteSlug, pageType: "landing" }),
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error("capture timed out (120s)")), 120_000),
          ),
        ]);
        await persistCapture(result, { status: "published" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`  ✗ homepage capture failed: ${msg.slice(0, 80)}`);
        summary.push({ url, slug: siteSlug, ok: false, pages: 0 });
        continue;
      }
    }

    // Step 2: multi-page run
    try {
      const r = await captureSite({
        siteSlug,
        max,
        concurrency,
        publish: true,
      });
      const captured = r.captured.filter((c) => c.ok).length;
      summary.push({ url, slug: siteSlug, ok: true, pages: 1 + captured });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ multi-page failed: ${msg.slice(0, 80)}`);
      summary.push({ url, slug: siteSlug, ok: true, pages: 1 }); // homepage at least
    }
  }

  console.log("\n══════════════════════════════════════════");
  for (const s of summary) {
    const status = s.ok ? "✓" : "✗";
    console.log(`  ${status} ${s.slug.padEnd(35)} ${s.pages} page${s.pages === 1 ? "" : "s"}`);
  }
  const okCount = summary.filter((s) => s.ok).length;
  const totalPages = summary.reduce((acc, s) => acc + s.pages, 0);
  console.log(`\n  ${okCount}/${summary.length} sites added · ${totalPages} pages total`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
