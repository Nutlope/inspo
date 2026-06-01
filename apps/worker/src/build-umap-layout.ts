/**
 * Reduce the 1024-dim text embeddings to 2D coordinates with UMAP and
 * write the result as a sidecar JSON that ships next to the seed.
 *
 * Used by the /map page (apps/web/src/app/map). The frontend loads
 * the sidecar + the matching slugs, renders a canvas plot, and
 * shows tile thumbnails on hover. Generating offline keeps the page
 * a no-JS-side-compute affair — 1.2k sites × UMAP in the browser
 * would be a couple of seconds of jank on cold load.
 *
 *   pnpm tsx src/build-umap-layout.ts          dry run, prints stats
 *   pnpm tsx src/build-umap-layout.ts --apply  writes umap-2d.json
 *
 * Output format (packages/db/src/umap-2d.json):
 *   {
 *     "version": "umap-1.4.0",
 *     "generatedAt": "2026-05-29T…",
 *     "dims": 2,
 *     "count": 1220,
 *     "slugs": ["205-tf", ...],
 *     "coords": [[0.31, 0.74], ...]   // normalised to [0,1]
 *   }
 *
 * Stays deterministic across runs by setting a fixed random seed.
 * The same embeddings produce the same layout, which means a
 * re-deploy doesn't shuffle the map without reason.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { UMAP } from "umap-js";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const IDX_PATH = resolve(REPO_ROOT, "packages", "db", "src", "embeddings.idx.json");
const BIN_PATH = resolve(REPO_ROOT, "packages", "db", "src", "embeddings.bin");
const OUT_PATH = resolve(REPO_ROOT, "packages", "db", "src", "umap-2d.json");

const APPLY = process.argv.includes("--apply");

interface IdxFile {
  slugs: string[];
  dims: number;
  count: number;
}

function main() {
  const idx = JSON.parse(readFileSync(IDX_PATH, "utf8")) as IdxFile;
  const bin = readFileSync(BIN_PATH);
  const N = idx.slugs.length;
  const D = idx.dims;
  if (bin.byteLength !== N * D * 4) {
    throw new Error(
      `bin size mismatch: ${bin.byteLength} != ${N} × ${D} × 4`,
    );
  }
  console.log(`loaded ${N} embeddings × ${D} dims`);

  // Float32 view over the buffer. UMAP wants a 2D array of arrays —
  // copy each row out to a plain Array of numbers; this is a small
  // one-off cost and keeps the UMAP impl from spending time on view
  // bookkeeping per neighbour query.
  const view = new Float32Array(bin.buffer, bin.byteOffset, bin.byteLength / 4);
  const data: number[][] = [];
  for (let i = 0; i < N; i++) {
    const row = new Array(D);
    for (let j = 0; j < D; j++) row[j] = view[i * D + j]!;
    data.push(row);
  }

  // Deterministic PRNG so re-runs produce the same layout. UMAP's
  // `random` field expects () => number in [0,1). Use mulberry32
  // seeded by a fixed string hash — picked because it's small,
  // fast, and good enough for layout init / negative sampling.
  const seed = djb2("inspo-umap-1");
  const rng = mulberry32(seed);

  const umap = new UMAP({
    nNeighbors: 15,
    minDist: 0.1,
    spread: 1.0,
    nComponents: 2,
    random: rng,
  });

  console.log("fitting UMAP… (this takes 20-60 s for 1k+ points)");
  const t0 = Date.now();
  const embedding = umap.fit(data);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`done in ${elapsed} s`);

  // Normalise to [0, 1] in each axis so the frontend doesn't need
  // to know the min/max — easier to draw and to swap layouts later
  // without retuning camera defaults.
  let xMin = Infinity,
    xMax = -Infinity,
    yMin = Infinity,
    yMax = -Infinity;
  for (const p of embedding) {
    if (p[0]! < xMin) xMin = p[0]!;
    if (p[0]! > xMax) xMax = p[0]!;
    if (p[1]! < yMin) yMin = p[1]!;
    if (p[1]! > yMax) yMax = p[1]!;
  }
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const coords: [number, number][] = embedding.map((p) => [
    Number(((p[0]! - xMin) / xRange).toFixed(4)),
    Number(((p[1]! - yMin) / yRange).toFixed(4)),
  ]);

  // Sanity: spread check — a degenerate fit (all points piled at a
  // corner) is a sign UMAP was given junk input.
  const meanX = coords.reduce((s, p) => s + p[0], 0) / coords.length;
  const meanY = coords.reduce((s, p) => s + p[1], 0) / coords.length;
  const stdX = Math.sqrt(
    coords.reduce((s, p) => s + (p[0] - meanX) ** 2, 0) / coords.length,
  );
  const stdY = Math.sqrt(
    coords.reduce((s, p) => s + (p[1] - meanY) ** 2, 0) / coords.length,
  );
  console.log(
    `spread check — σx=${stdX.toFixed(3)} σy=${stdY.toFixed(3)} (>0.15 each is healthy)`,
  );

  const out = {
    version: "umap-1.4.0",
    generatedAt: new Date().toISOString(),
    dims: 2,
    count: N,
    slugs: idx.slugs,
    coords,
  };

  if (!APPLY) {
    console.log(`\n(dry run — pass --apply to write ${OUT_PATH})`);
    return;
  }
  writeFileSync(OUT_PATH, JSON.stringify(out));
  const bytes = JSON.stringify(out).length;
  console.log(`wrote ${OUT_PATH} (${(bytes / 1024).toFixed(1)} KB)`);
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

main();
