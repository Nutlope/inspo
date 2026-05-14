/**
 * Retry the URL-level failures from captures/_reports/url-retries.json
 * with the latest dismiss.ts + 120s outer timeout. Skips URLs already
 * captured (idempotent on slug).
 *
 *   pnpm capture:retry-urls --go --concurrency=2
 */

import "./env.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { capture } from "./capture.js";
import { persistCapture } from "./persist.js";
import { hasDatabase } from "@inspo/db";

type FailedUrl = { slug: string; url: string; error: string };

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

async function main() {
  const argv = process.argv.slice(2);
  const go = argv.includes("--go");
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 2,
  );

  if (!hasDatabase()) throw new Error("DATABASE_URL required");

  const path = resolve("captures", "_reports", "url-retries.json");
  const all: FailedUrl[] = JSON.parse(readFileSync(path, "utf8"));

  // Dedupe by URL (the report has some duplicates from multiple runs).
  const seen = new Set<string>();
  const queue = all.filter((u) => {
    if (seen.has(u.url)) return false;
    seen.add(u.url);
    return true;
  });

  console.log(`\n  url retries · ${queue.length} unique URLs · go=${go}\n`);
  if (!go) {
    for (const u of queue) console.log(`  ↻ ${u.slug.padEnd(20)} ${u.url}`);
    console.log("\n  dry-run. re-run with --go.\n");
    return;
  }

  const startedAt = Date.now();
  const results: { url: string; ok: boolean; error?: string }[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < queue.length) {
      const idx = cursor++;
      const q = queue[idx]!;
      const childSlug = slugifyChild(q.slug, q.url);
      const tag = `[${String(idx + 1).padStart(3, " ")}/${queue.length}]`;
      console.log(`${tag} ↻ ${childSlug.padEnd(40)} ${q.url}`);
      try {
        const result = await Promise.race([
          capture({
            url: q.url,
            slug: childSlug,
            siteSlug: q.slug,
            pageType: "other",
          }),
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error("capture timed out (120s)")), 120_000),
          ),
        ]);
        await persistCapture(result, { status: "published" });
        results.push({ url: q.url, ok: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`${tag} ✗ ${childSlug.padEnd(40)} ${msg.slice(0, 70)}`);
        results.push({ url: q.url, ok: false, error: msg });
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const ok = results.filter((r) => r.ok).length;
  const min = ((Date.now() - startedAt) / 1000 / 60).toFixed(1);
  console.log(
    `\n  done: ${ok}/${results.length} ok (${results.length - ok} still failing) in ${min} min`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
