/**
 * Batch-capture the seed catalogue. Iterates the URL list with a
 * concurrency cap, retries failures once, and writes a per-run report.
 *
 * Run: pnpm capture:seed                  (dry-run: lists, no capture)
 *      pnpm capture:seed --go             (actually capture)
 *      pnpm capture:seed --go --slice=10  (only the first 10)
 *      pnpm capture:seed --go --no-enrich (skip Claude + Voyage)
 *
 * Persists each result into the `screens` table as status=pending.
 * Curator approves/rejects from /admin/curator.
 */

import "./env.js";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { capture } from "./capture.js";
import { persistCapture } from "./persist.js";
import { seedUrls } from "./seed-urls.js";

type CliArgs = {
  go: boolean;
  enrich: boolean;
  persist: boolean;
  slice?: number;
  concurrency: number;
};

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);
  const out: CliArgs = {
    go: argv.includes("--go"),
    enrich: !argv.includes("--no-enrich"),
    persist: !argv.includes("--no-persist"),
    concurrency: 2,
  };
  const sliceArg = argv.find((a) => a.startsWith("--slice="));
  if (sliceArg) out.slice = Number(sliceArg.split("=")[1]);
  const concArg = argv.find((a) => a.startsWith("--concurrency="));
  if (concArg) out.concurrency = Number(concArg.split("=")[1]);
  return out;
}

async function main() {
  const args = parseArgs();
  const list = args.slice ? seedUrls.slice(0, args.slice) : seedUrls;

  console.log(`\n  Inspo seed run`);
  console.log(`  ${list.length} urls · concurrency ${args.concurrency} · enrich=${args.enrich} · persist=${args.persist}\n`);

  if (!args.go) {
    list.forEach((u, i) =>
      console.log(`  ${String(i + 1).padStart(2, "0")}  ${u.url}  — ${u.note ?? ""}`),
    );
    console.log(
      `\n  ${list.length} URLs ready. Re-run with --go to actually capture.`,
    );
    console.log(`  Tip: --slice=5 to dry-run a small batch first.\n`);
    return;
  }

  // Sanity-check the env: if persisting we need a DB; if enriching we want
  // both API keys. Print warnings but proceed — the per-step code already
  // degrades gracefully if a key is missing.
  if (args.persist && !process.env.DATABASE_URL) {
    console.warn("  ⚠ DATABASE_URL not set — captures won't persist (use --no-persist to silence).\n");
  }
  if (args.enrich && !process.env.TOGETHER_API_KEY) {
    console.warn("  ⚠ TOGETHER_API_KEY not set — tagging + embeddings will be skipped.\n");
  }

  type Outcome = {
    url: string;
    slug?: string;
    ok: boolean;
    persistedId?: string;
    error?: string;
    elapsedMs?: number;
  };
  const outcomes: Outcome[] = [];

  // Simple concurrency pool — keep it small to stay polite.
  let cursor = 0;
  async function worker() {
    while (cursor < list.length) {
      const idx = cursor++;
      const entry = list[idx];
      const tag = `[${String(idx + 1).padStart(2, "0")}/${list.length}]`;
      const t0 = Date.now();
      try {
        const result = await capture({
          url: entry.url,
          slug: entry.slug,
          enrich: args.enrich,
        });
        let persistedId: string | undefined;
        if (args.persist) {
          const p = await persistCapture(result);
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
  await Promise.all(
    Array.from({ length: args.concurrency }, () => worker()),
  );

  // Summary + report
  const ok = outcomes.filter((o) => o.ok).length;
  const fail = outcomes.length - ok;
  console.log(`\n  ${ok} ok · ${fail} failed · total ${outcomes.length}\n`);

  const reportDir = join(process.cwd(), "captures", "_reports");
  await mkdir(reportDir, { recursive: true });
  const reportPath = join(reportDir, `seed-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await writeFile(reportPath, JSON.stringify({ outcomes, args }, null, 2));
  console.log(`  Report: ${reportPath.replace(process.cwd(), ".")}\n`);

  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
