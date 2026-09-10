/**
 * Clean the font family names already in the seed. font-names.ts says
 * what the raw names look like and how they are recovered.
 *
 *   pnpm exec tsx src/normalize-font-names.ts           dry run: counts + every rename
 *   pnpm exec tsx src/normalize-font-names.ts --apply   rewrite static-screens.json
 *
 * Touches `fonts` and `designSystem.typeRamp[].family` only. The CSS
 * variables stay exactly as the source declared them.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cleanFontList, cleanRampFamily } from "./font-names.js";

const SEED_PATH = join(import.meta.dirname, "..", "..", "..", "packages", "db", "src", "static-screens.json");

type Row = {
  slug: string;
  fonts?: string[];
  designSystem?: { typeRamp?: Array<{ family?: string }> };
};

const apply = process.argv.includes("--apply");
const rows: Row[] = JSON.parse(readFileSync(SEED_PATH, "utf8"));
const renames = new Map<string, string>();
let changed = 0;

for (const row of rows) {
  const before = JSON.stringify([row.fonts, row.designSystem?.typeRamp]);
  if (Array.isArray(row.fonts)) {
    for (const raw of row.fonts) {
      const name = cleanFontList([raw])[0] ?? "(dropped)";
      if (name !== raw) renames.set(raw, name);
    }
    row.fonts = cleanFontList(row.fonts);
  }
  for (const entry of row.designSystem?.typeRamp ?? []) {
    if (typeof entry.family !== "string") continue;
    const name = cleanRampFamily(entry.family);
    if (name !== entry.family) renames.set(entry.family, name);
    entry.family = name;
  }
  if (JSON.stringify([row.fonts, row.designSystem?.typeRamp]) !== before) changed++;
}

console.log(`${changed} of ${rows.length} rows change; ${renames.size} distinct names cleaned:`);
for (const [from, to] of [...renames].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`  ${from}  ->  ${to}`);
}
if (apply) {
  // Minified, like every other writer of the seed.
  writeFileSync(SEED_PATH, JSON.stringify(rows));
  console.log(`\nwrote ${SEED_PATH}`);
} else {
  console.log("\n(dry run - pass --apply to write)");
}
