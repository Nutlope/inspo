/**
 * Disk-only recapture — reads the latest disk-audit-*.json, resolves
 * each flagged slug's source URL from static-screens.json (no DB),
 * re-runs the capture pipeline with the current banner-killer, and
 * writes the fresh PNGs to disk (overwriting the bad ones).
 *
 * Blob upload is handled by the separate upload-to-blob script, which
 * already uses deterministic keys — running it after this finishes
 * pushes the clean PNGs out to production with no DB writes.
 *
 *   pnpm --filter @inspo/worker exec tsx src/recapture-flagged-disk.ts          dry-run
 *   pnpm --filter @inspo/worker exec tsx src/recapture-flagged-disk.ts --go      do it
 *   pnpm --filter @inspo/worker exec tsx src/recapture-flagged-disk.ts --go --concurrency=2
 *   pnpm --filter @inspo/worker exec tsx src/recapture-flagged-disk.ts --go --report=path/to/report.json
 */

import "./env.js";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { capture } from "./capture.js";

type Flagged = { slug: string; reason: string };

type StaticRow = { slug: string; sourceUrl: string };

const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? "./captures",
);

function findLatestReport(): string {
  const dir = join(CAPTURES_DIR, "_reports");
  if (!existsSync(dir)) throw new Error(`no reports dir: ${dir}`);
  const files = readdirSync(dir).filter(
    (f) => f.startsWith("disk-audit-") && f.endsWith(".json"),
  );
  if (files.length === 0)
    throw new Error(`no disk-audit-*.json reports in ${dir}`);
  files.sort();
  return join(dir, files[files.length - 1]!);
}

function loadStaticIndex(): Map<string, string> {
  // Static seed lives in packages/db/src/static-screens.json. Read it
  // directly rather than going through the DB query layer — we only
  // need slug → sourceUrl.
  const path = resolve("../../packages/db/src/static-screens.json");
  const raw = readFileSync(path, "utf8");
  const rows = JSON.parse(raw) as StaticRow[];
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.slug && r.sourceUrl) map.set(r.slug, r.sourceUrl);
  }
  return map;
}

async function main() {
  const argv = process.argv.slice(2);
  const go = argv.includes("--go");
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 2,
  );
  const reportArg = argv.find((a) => a.startsWith("--report="));
  const reportPath = reportArg ? reportArg.slice(9) : findLatestReport();

  const flagged: Flagged[] = JSON.parse(readFileSync(reportPath, "utf8"));
  console.log(`\n  recapture · ${flagged.length} flagged · go=${go}`);
  console.log(`  source report: ${reportPath}\n`);

  const idx = loadStaticIndex();

  const targets: Array<{ slug: string; url: string; reason: string }> = [];
  for (const f of flagged) {
    const url = idx.get(f.slug);
    if (!url) {
      console.log(`  ✗ ${f.slug.padEnd(34)} no sourceUrl in static seed`);
      continue;
    }
    targets.push({ slug: f.slug, url, reason: f.reason });
  }

  console.log(`\n  resolved ${targets.length}/${flagged.length} to source URLs\n`);

  if (!go) {
    targets.slice(0, 12).forEach((t) =>
      console.log(`  · ${t.slug.padEnd(34)} → ${t.url}`),
    );
    console.log(`  …`);
    console.log(`\n  dry-run. re-run with --go to capture.\n`);
    return;
  }

  let cursor = 0;
  let done = 0;
  let errors = 0;
  const fails: Array<{ slug: string; error: string }> = [];

  async function worker() {
    while (cursor < targets.length) {
      const i = cursor++;
      const t = targets[i]!;
      const tag = `[${String(i + 1).padStart(4, " ")}/${targets.length}]`;
      try {
        // Site-page sub-slugs ALWAYS share the same site root (the part
        // before "--"); pageType defaults to 'landing' when the slug
        // has no "--" suffix.
        const siteSlug = t.slug.includes("--") ? t.slug.split("--")[0]! : t.slug;
        await capture({
          url: t.url,
          slug: t.slug,
          siteSlug,
          enrich: false, // skip tag + embed; banner-killer is the goal
        });
        done += 1;
        console.log(`${tag} ✓ ${t.slug.padEnd(34)} recaptured`);
      } catch (err) {
        errors += 1;
        const msg = err instanceof Error ? err.message : String(err);
        fails.push({ slug: t.slug, error: msg.slice(0, 200) });
        console.log(`${tag} ✗ ${t.slug.padEnd(34)} ${msg.slice(0, 80)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  console.log();
  console.log(`  recaptured ${done} · failed ${errors}`);
  if (fails.length > 0) {
    const failPath = reportPath.replace(/\.json$/, "-fails.json");
    const fs = await import("node:fs");
    fs.writeFileSync(failPath, JSON.stringify(fails, null, 2));
    console.log(`  failure list → ${failPath}`);
  }
  console.log();
  console.log(`  Next: pnpm --filter @inspo/worker capture:upload-to-blob -- --go`);
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
