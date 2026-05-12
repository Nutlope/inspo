/**
 * Batch site-capture runner. Reads a list of site_slugs from a file
 * (one per line, # comments OK) and runs captureSite for each in
 * sequence, persisting individual reports as it goes.
 *
 *   pnpm capture:sites apps/worker/pilot-sites.txt --max=7 --publish
 *
 * Reports land in apps/worker/captures/_reports/sites-<timestamp>.json
 * so a partial run can be reviewed and retried.
 */

import "./env.js";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { captureSite, type SiteCaptureReport } from "./capture-site.js";

async function main() {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error(
      "Usage: pnpm capture:sites <slugs-file> [--max=7] [--concurrency=2] [--publish]",
    );
    process.exit(1);
  }
  const max = Number(argv.find((a) => a.startsWith("--max="))?.split("=")[1] ?? 7);
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 2,
  );
  const publish = argv.includes("--publish");
  const dryRun = argv.includes("--dry-run");

  const slugs = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  console.log(`Running site-capture on ${slugs.length} sites (max=${max}, concurrency=${concurrency}, publish=${publish}, dryRun=${dryRun})\n`);

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const reportDir = path.join(process.cwd(), "apps/worker/captures/_reports");
  mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `sites-${ts}.json`);

  const reports: SiteCaptureReport[] = [];
  const startedAt = Date.now();

  for (const slug of slugs) {
    try {
      const r = await captureSite({ siteSlug: slug, max, concurrency, dryRun, publish });
      reports.push(r);
    } catch (err) {
      console.warn(`✗ ${slug}: ${err instanceof Error ? err.message : err}`);
      reports.push({
        siteSlug: slug,
        rootUrl: "",
        discovered: [],
        skipped: [],
        captured: [
          {
            url: "",
            slug: "",
            pageType: "other",
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          },
        ],
      });
    }
    writeFileSync(
      reportPath,
      JSON.stringify(
        {
          startedAt: new Date(startedAt).toISOString(),
          args: { file, max, concurrency, publish, dryRun },
          reports,
        },
        null,
        2,
      ),
    );
  }

  // Summary.
  const totalCaptured = reports.reduce(
    (acc, r) => acc + r.captured.filter((c) => c.ok).length,
    0,
  );
  const totalFailed = reports.reduce(
    (acc, r) => acc + r.captured.filter((c) => !c.ok).length,
    0,
  );
  const totalSkipped = reports.reduce((acc, r) => acc + r.skipped.length, 0);
  const wallMin = ((Date.now() - startedAt) / 1000 / 60).toFixed(1);

  console.log("\n══════════════════════════════════════════════════════");
  console.log(`Sites:     ${reports.length}`);
  console.log(`Captured:  ${totalCaptured}`);
  console.log(`Skipped:   ${totalSkipped} (already in DB)`);
  console.log(`Failed:    ${totalFailed}`);
  console.log(`Wall time: ${wallMin} min`);
  console.log(`Report:    ${reportPath}`);
  console.log("══════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
