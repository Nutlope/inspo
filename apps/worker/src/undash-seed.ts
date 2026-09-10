/**
 * Take the em and en dashes out of rows that predate the merge-time
 * scrub. Rows merged since the 2026-09 additions pass through scrub()
 * on the way in; the older archive still carried about 1,100 dashes,
 * mostly in page titles and northstars.
 *
 *   pnpm exec tsx src/undash-seed.ts           dry run: counts + samples
 *   pnpm exec tsx src/undash-seed.ts --apply   rewrite static-screens.json
 *
 * A page title written as "<site> <dash> <page>" takes the separator the
 * merge step writes today ("Amie So · Blog"). Every other dash goes the
 * way scrub() sends it.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hasDash, scrub, undash } from "./undash.js";

const SEED_PATH = join(import.meta.dirname, "..", "..", "..", "packages", "db", "src", "static-screens.json");

type Row = { slug: string; siteSlug: string; title: string; [k: string]: unknown };

const apply = process.argv.includes("--apply");
const rows: Row[] = JSON.parse(readFileSync(SEED_PATH, "utf8"));
const siteTitle = new Map(
  rows.filter((r) => r.slug === r.siteSlug).map((r) => [r.siteSlug, r.title]),
);
const fieldCounts = new Map<string, number>();
const samples: string[] = [];
let changed = 0;

const out = rows.map((row) => {
  if (!hasDash(JSON.stringify(row))) return row;

  let title = row.title;
  const site = siteTitle.get(row.siteSlug);
  if (site && title !== site && title.startsWith(site) && hasDash(title.slice(site.length, site.length + 3))) {
    title = `${site} · ${undash(title.slice(site.length)).replace(/^\s*-\s*/, "")}`;
  }
  const next: Row = scrub({ ...row, title });

  changed++;
  for (const [k, v] of Object.entries(row)) {
    if (JSON.stringify(v) !== JSON.stringify(next[k])) fieldCounts.set(k, (fieldCounts.get(k) ?? 0) + 1);
  }
  if (samples.length < 10 && next.title !== row.title) samples.push(`  ${row.title}  ->  ${next.title}`);
  return next;
});

console.log(`${changed} of ${rows.length} rows change`);
console.log(`by field: ${[...fieldCounts].map(([k, n]) => `${k} ${n}`).join(", ")}`);
console.log(samples.join("\n"));
const left = out.filter((r) => hasDash(JSON.stringify(r))).length;
console.log(`rows with a dash afterwards: ${left}`);

if (apply) {
  // Minified, like every other writer of the seed.
  writeFileSync(SEED_PATH, JSON.stringify(out));
  console.log(`\nwrote ${SEED_PATH}`);
} else {
  console.log("\n(dry run - pass --apply to write)");
}
