/**
 * Stamp `tags.axes` onto every catalogue row, and drop the retired
 * `tags.hallmarkTheme`.
 *
 * Local computation over `palette`, `fonts` and the row's LQIP, all of
 * which every row already carries, so this is re-runnable and needs no
 * network, no model, and no re-capture. Re-run it after any pass that
 * rewrites palettes, fonts, or captures.
 *
 *   pnpm --filter @inspo/worker exec tsx src/backfill-axes.ts [--dry]
 */

import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { deriveAxes, axesKey } from "@inspo/shared";
import type { Mode } from "@inspo/taxonomy";
import { measurePaperL } from "./measure-paper";

type Row = {
  slug: string;
  palette?: string[];
  fonts?: string[];
  mode?: Mode;
  lqip?: string;
  tags?: Record<string, unknown>;
};

const here = dirname(fileURLToPath(import.meta.url));
const SEED = resolve(here, "../../../packages/db/src/static-screens.json");

const dry = process.argv.includes("--dry");

const rows = JSON.parse(readFileSync(SEED, "utf8")) as Row[];
if (!Array.isArray(rows)) throw new Error("seed is not an array");

const dist = {
  paperBand: new Map<string, number>(),
  displayClass: new Map<string, number>(),
  accentHue: new Map<string, number>(),
};
const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

let noFonts = 0;
let unmeasured = 0;
let modeDisagrees = 0;
for (const r of rows) {
  const paperL = await measurePaperL(r.lqip);
  if (paperL === null) unmeasured++;
  const axes = deriveAxes({
    palette: r.palette ?? [],
    fonts: r.fonts ?? [],
    mode: r.mode ?? "light",
    paperL: paperL ?? undefined,
  });
  if (!axes.displayFace) noFonts++;
  // The tagged `mode` and the measured surface disagree often enough
  // to be worth counting: it is the reason paper band is measured
  // rather than inferred.
  if (paperL !== null && (r.mode === "dark") !== (axes.paperBand === "dark")) {
    modeDisagrees++;
  }
  r.tags = { ...(r.tags ?? {}) };
  delete r.tags.hallmarkTheme;
  r.tags.axes = axes;
  bump(dist.paperBand, axes.paperBand);
  bump(dist.displayClass, axes.displayClass);
  bump(dist.accentHue, axes.accentHue);
}

const pct = (n: number) => `${((n / rows.length) * 100).toFixed(1)}%`;
const show = (label: string, m: Map<string, number>) => {
  const sorted = [...m.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`\n${label}`);
  for (const [k, n] of sorted) console.log(`  ${k.padEnd(24)} ${String(n).padStart(5)}  ${pct(n)}`);
};

console.log(`rows: ${rows.length}`);
console.log(`  no usable font data:  ${noFonts} (${pct(noFonts)})`);
console.log(`  no LQIP to measure:   ${unmeasured} (${pct(unmeasured)})`);
console.log(`  tagged mode disagrees with measured surface: ${modeDisagrees} (${pct(modeDisagrees)})`);
show("paper band", dist.paperBand);
show("display class", dist.displayClass);
show("accent hue", dist.accentHue);

console.log("\nsamples:");
for (const r of rows.slice(0, 8)) {
  console.log(`  ${r.slug.padEnd(34)} ${axesKey((r.tags as { axes: ReturnType<typeof deriveAxes> }).axes)}`);
}

if (dry) {
  console.log("\n--dry: nothing written.");
} else {
  copyFileSync(SEED, `${SEED}.pre-axes-${Date.now()}.bak`);
  // Minified, matching the seed's existing on-disk form. Pretty-printing
  // it adds ~6MB and 600k lines of diff for zero readers: nothing opens
  // this file by hand.
  writeFileSync(SEED, JSON.stringify(rows));
  console.log(`\nwrote ${SEED}`);
}
