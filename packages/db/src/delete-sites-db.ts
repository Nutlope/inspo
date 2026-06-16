/**
 * Delete a list of siteSlugs from the Postgres (Neon) `screens` table.
 *
 * The DB is a SUPERSET of static-screens.json (it holds every captured page,
 * not just the published subset), so the seed-side delete-sites.ts in
 * apps/worker is NOT enough to clear a site from the live gallery — this
 * companion prunes the database too. Foreign keys cascade, so removing a
 * screen also clears its screen_tags / collection_screens / captures rows.
 *
 * Before deleting, every matched row is dumped to
 *   packages/db/src/_deleted-sites-<ts>.json
 * so the operation is fully reversible (re-insert from that snapshot).
 *
 *   pnpm --filter @inspo/db exec tsx src/delete-sites-db.ts --slugs=foo,bar          dry-run
 *   pnpm --filter @inspo/db exec tsx src/delete-sites-db.ts --slugs=foo,bar --apply  apply
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: "../../.env" });
config({ path: "./.env" });

function parseSlugs(): string[] {
  const arg = process.argv.find((a) => a.startsWith("--slugs="));
  if (!arg) {
    console.error("usage: delete-sites-db.ts --slugs=foo,bar [--apply]");
    process.exit(1);
  }
  return arg
    .slice("--slugs=".length)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const slugs = parseSlugs();
  const apply = process.argv.includes("--apply");
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const sql = neon(url);

  const counts = await sql`
    SELECT site_slug, count(*)::int AS n FROM screens
    WHERE site_slug = ANY(${slugs}) GROUP BY site_slug ORDER BY site_slug`;
  const total = counts.reduce((a, r) => a + (r.n as number), 0);

  console.log("\n=== DELETE-SITES-DB (Neon) ===");
  console.log(`siteSlugs requested:  ${slugs.length}`);
  console.log(`siteSlugs matched:    ${counts.length}`);
  for (const r of counts) console.log(`  ${r.site_slug}: ${r.n}`);
  console.log(`rows to delete:       ${total}`);
  const missing = slugs.filter((s) => !counts.some((c) => c.site_slug === s));
  if (missing.length) console.log(`NOT in DB:            ${missing.join(", ")}`);

  if (!apply) {
    console.log("\n(dry run — pass --apply to delete)");
    return;
  }

  // Snapshot every row first (recovery point).
  const rows = await sql`SELECT * FROM screens WHERE site_slug = ANY(${slugs})`;
  const ts = Date.now();
  const snapPath = join(import.meta.dirname, `_deleted-sites-${ts}.json`);
  writeFileSync(snapPath, JSON.stringify(rows, null, 2));
  console.log(`\nsnapshot of ${rows.length} rows → ${snapPath}`);

  const deleted = await sql`DELETE FROM screens WHERE site_slug = ANY(${slugs}) RETURNING slug`;
  console.log(`DELETED ${deleted.length} screen rows (FK cascades cleared tags/collections/captures).`);

  const remaining = await sql`SELECT count(*)::int AS n FROM screens WHERE site_slug = ANY(${slugs})`;
  console.log(`remaining rows for these slugs: ${remaining[0].n}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
