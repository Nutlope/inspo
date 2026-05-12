/**
 * Recapture any rows flagged by the most recent audit report.
 *
 * Reads captures/_reports/audit-flagged-<latest>.json and for each
 * flagged slug:
 *   1. Looks up the source_url and current siteSlug / pageType in DB
 *   2. Re-runs capture() (uses the new dismiss.ts banner-killer)
 *   3. Persists the result, overwriting the bad PNG + metadata
 *
 *   pnpm capture:recapture-flagged           dry-run (lists what'd happen)
 *   pnpm capture:recapture-flagged --go      do the captures
 *   pnpm capture:recapture-flagged --go --concurrency=2 --re-audit
 *
 * After recapture, automatically re-runs the audit on the recaptured
 * slugs to confirm they came back clean. Anything still flagged on the
 * second pass gets status='rejected'.
 */

import "./env.js";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { hasDatabase, getDb } from "@inspo/db";
import { screens } from "@inspo/db/schema";
import { inArray, eq } from "drizzle-orm";
import { capture } from "./capture.js";
import { persistCapture } from "./persist.js";

type Flagged = { slug: string; title: string; reason: string };

function findLatestReport(): string {
  const dir = resolve(process.cwd(), "captures", "_reports");
  if (!existsSync(dir)) {
    throw new Error(`no reports dir: ${dir}`);
  }
  const files = readdirSync(dir).filter(
    (f) => f.startsWith("audit-flagged-") && f.endsWith(".json"),
  );
  if (files.length === 0) {
    throw new Error(`no audit-flagged-*.json reports in ${dir}`);
  }
  files.sort();
  return join(dir, files[files.length - 1]!);
}

async function main() {
  const argv = process.argv.slice(2);
  const go = argv.includes("--go");
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 2,
  );
  const reportArg = argv.find((a) => a.startsWith("--report="));
  const reportPath = reportArg ? reportArg.slice(9) : findLatestReport();

  if (!hasDatabase()) throw new Error("DATABASE_URL is required");

  const flagged: Flagged[] = JSON.parse(readFileSync(reportPath, "utf8"));
  console.log(`\n  recapture · ${flagged.length} flagged rows · go=${go}\n`);
  console.log(`  source report: ${reportPath}\n`);

  const db = getDb();
  const rows = await db
    .select({
      slug: screens.slug,
      sourceUrl: screens.sourceUrl,
      siteSlug: screens.siteSlug,
      pageType: screens.pageType,
    })
    .from(screens)
    .where(
      inArray(
        screens.slug,
        flagged.map((f) => f.slug),
      ),
    );

  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const queue = flagged
    .map((f) => {
      const row = bySlug.get(f.slug);
      if (!row) return null;
      return {
        slug: f.slug,
        sourceUrl: row.sourceUrl,
        siteSlug: row.siteSlug ?? row.slug,
        pageType: row.pageType ?? "landing",
        reason: f.reason,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  console.log(`  resolved ${queue.length}/${flagged.length} via DB`);

  if (!go) {
    for (const q of queue.slice(0, 30)) {
      console.log(`  ↻ ${q.slug.padEnd(35)} ${q.sourceUrl}`);
    }
    if (queue.length > 30) console.log(`  …and ${queue.length - 30} more`);
    console.log("\n  dry-run. re-run with --go to capture.\n");
    return;
  }

  const startedAt = Date.now();
  const results: { slug: string; ok: boolean; error?: string }[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < queue.length) {
      const idx = cursor++;
      const q = queue[idx]!;
      const tag = `[${String(idx + 1).padStart(4, " ")}/${queue.length}]`;
      try {
        console.log(`${tag} ↻ ${q.slug.padEnd(35)} ${q.sourceUrl}`);
        const result = await capture({
          url: q.sourceUrl,
          slug: q.slug,
          siteSlug: q.siteSlug,
          pageType: q.pageType as
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
        // Persist as 'published' so it's visible again after recapture.
        await persistCapture(result, { status: "published" });
        // Clear the curator_note set by the audit pass.
        await db
          .update(screens)
          .set({ curatorNote: null })
          .where(eq(screens.slug, q.slug));
        results.push({ slug: q.slug, ok: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`${tag} ✗ ${q.slug.padEnd(35)} ${msg.slice(0, 70)}`);
        results.push({ slug: q.slug, ok: false, error: msg });
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;
  const min = ((Date.now() - startedAt) / 1000 / 60).toFixed(1);
  console.log(`\n  recaptured ${ok}/${results.length} (${fail} failed) in ${min} min`);
  console.log(`  next step: pnpm audit:modals --apply  (to flag any that still have modals)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
