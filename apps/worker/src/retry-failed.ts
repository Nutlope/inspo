/**
 * Re-capture only the failed entries from the most recent seed run.
 * Useful when you've tweaked the navigation strategy and want to
 * salvage the 24 sites that timed out on networkidle without
 * re-running the 89 that already worked.
 *
 * Run: pnpm --filter @inspo/worker exec tsx src/retry-failed.ts --go
 */

import "./env.js";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { capture } from "./capture.js";
import { persistCapture } from "./persist.js";

type Outcome = {
  url: string;
  slug?: string;
  ok: boolean;
  persistedId?: string;
  error?: string;
  elapsedMs?: number;
};

async function findLatestReport(): Promise<string> {
  const dir = join(process.cwd(), "captures", "_reports");
  const files = await readdir(dir);
  const sorted = files.filter((f) => f.endsWith(".json")).sort();
  if (sorted.length === 0) throw new Error("no seed reports found");
  return join(dir, sorted[sorted.length - 1]);
}

async function main() {
  const args = process.argv.slice(2);
  const go = args.includes("--go");
  const persist = !args.includes("--no-persist");
  const enrich = !args.includes("--no-enrich");
  const publish = args.includes("--publish");
  const concurrency = Number(
    args.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 2,
  );

  const reportPath = await findLatestReport();
  const report = JSON.parse(await readFile(reportPath, "utf8")) as {
    outcomes: Outcome[];
  };
  const failed = report.outcomes.filter((o) => !o.ok);

  console.log(`\n  retry-failed`);
  console.log(`  source: ${reportPath.replace(process.cwd(), ".")}`);
  console.log(`  ${failed.length} failed entries to retry · concurrency ${concurrency}\n`);

  if (failed.length === 0) {
    console.log("  nothing to retry. everything passed last run.\n");
    return;
  }

  for (const f of failed) {
    console.log(`  ✗ ${f.url}  — ${(f.error ?? "").slice(0, 70)}`);
  }

  if (!go) {
    console.log(`\n  Re-run with --go to retry these.\n`);
    return;
  }

  const outcomes: Outcome[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < failed.length) {
      const idx = cursor++;
      const entry = failed[idx];
      const tag = `[${String(idx + 1).padStart(2, "0")}/${failed.length}]`;
      const t0 = Date.now();
      try {
        const result = await capture({ url: entry.url, slug: entry.slug, enrich });
        let persistedId: string | undefined;
        if (persist) {
          // Forward --publish so retries don't downgrade rows previously
          // published by the seed runner. Without this, an idempotent
          // upsert silently flips status='published' back to 'pending'.
          const p = await persistCapture(result, {
            status: publish ? "published" : "pending",
          });
          persistedId = p?.id;
        }
        outcomes.push({
          url: entry.url,
          slug: result.slug,
          ok: true,
          persistedId,
          elapsedMs: Date.now() - t0,
        });
        console.log(
          `${tag} ✓ ${result.slug}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        outcomes.push({
          url: entry.url,
          ok: false,
          error: msg.slice(0, 200),
          elapsedMs: Date.now() - t0,
        });
        console.log(`${tag} ✗ ${entry.url}  — ${msg.slice(0, 80)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const ok = outcomes.filter((o) => o.ok).length;
  const fail = outcomes.length - ok;
  console.log(`\n  ${ok} ok · ${fail} still failing · total ${outcomes.length}\n`);

  // Write a retry report next to the original
  const reportDir = join(process.cwd(), "captures", "_reports");
  await mkdir(reportDir, { recursive: true });
  const out = join(
    reportDir,
    `retry-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await writeFile(out, JSON.stringify({ outcomes }, null, 2));
  console.log(`  Report: ${out.replace(process.cwd(), ".")}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
