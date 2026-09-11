/**
 * Build the per-ROW embedding sidecar powering find_similar's cosine
 * ranking: one 1024-d text vector per captured page, unlike the
 * per-site sidecar that powers search_screens.
 *
 * Text per row: title, pageType, northstar, autopsy, tags, colorWords,
 * fonts, description - the same corpus the archive's language already
 * lives in. Model: the e5-large the whole pipeline uses, so the space
 * matches embedQuery().
 *
 * Outputs (next to the seed):
 *   packages/db/src/embeddings-rows.bin       Float32 row-major
 *   packages/db/src/embeddings-rows.idx.json  {slugs, dims, count}
 *
 *   tsx src/build-row-embeddings.ts                dry-run (count + sample text)
 *   tsx src/build-row-embeddings.ts --go           embed all rows, overwrite
 *   tsx src/build-row-embeddings.ts --go --missing-only   append new rows only
 */

import "./env.js";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import Together from "together-ai";

const MODEL =
  process.env.INSPO_EMBED_MODEL ?? "intfloat/multilingual-e5-large-instruct";
const DIMS = 1024;
const BATCH = 64;

const DB_SRC = resolve("../../packages/db/src");
const SEED = resolve(DB_SRC, "static-screens.json");
const BIN = resolve(DB_SRC, "embeddings-rows.bin");
const IDX = resolve(DB_SRC, "embeddings-rows.idx.json");

interface Row {
  slug: string;
  title?: string;
  pageType?: string;
  northstar?: string;
  autopsy?: string;
  description?: string;
  fonts?: string[];
  designSystem?: { colorWords?: string[] };
  tags?: {
    style?: string[];
    industry?: string[];
    vibe?: string[];
    macrostructure?: string;
  };
  [k: string]: unknown;
}

function rowText(r: Row): string {
  return [
    r.title,
    r.pageType,
    r.northstar,
    r.tags?.macrostructure,
    r.tags?.style?.join(" "),
    r.tags?.vibe?.join(" "),
    r.tags?.industry?.join(" "),
    r.designSystem?.colorWords?.join(" "),
    r.fonts?.join(" "),
    r.description,
    r.autopsy,
  ]
    .filter(Boolean)
    .join(" - ")
    // e5-large hard-stops at 512 tokens and the API rejects the whole
    // batch, not the row. Autopsies run long, so cut on a word boundary
    // well inside the limit: the identifying signal is all up front.
    .slice(0, MAX_CHARS)
    .replace(/\s+\S*$/, "");
}

/**
 * Design vocabulary tokenizes densely (measured ~3.3 chars/token on this
 * corpus, not the usual 4), so 1,700 chars still overran at 514. This
 * leaves headroom under the 512 ceiling.
 */
const MAX_CHARS = 1_500;

async function main() {
  const argv = process.argv.slice(2);
  const go = argv.includes("--go");
  const missingOnly = argv.includes("--missing-only");
  if (!process.env.TOGETHER_API_KEY) throw new Error("TOGETHER_API_KEY required");

  const rows: Row[] = JSON.parse(readFileSync(SEED, "utf8"));

  // Existing sidecar (for --missing-only appends).
  let existingSlugs: string[] = [];
  let existingBin: Buffer | null = null;
  if (missingOnly && existsSync(BIN) && existsSync(IDX)) {
    const idx = JSON.parse(readFileSync(IDX, "utf8")) as {
      slugs: string[];
      dims: number;
    };
    if (idx.dims === DIMS) {
      existingSlugs = idx.slugs;
      existingBin = readFileSync(BIN);
    }
  }
  const have = new Set(existingSlugs);
  const targets = missingOnly ? rows.filter((r) => !have.has(r.slug)) : rows;

  console.log(
    `\n  row embeddings · model=${MODEL} · rows=${rows.length} · to-embed=${targets.length} · go=${go}\n`,
  );
  if (!go) {
    for (const r of targets.slice(0, 3))
      console.log(`  sample [${r.slug}]: ${rowText(r).slice(0, 160)}…\n`);
    console.log("  dry-run. re-run with --go to embed.\n");
    return;
  }
  if (targets.length === 0) {
    console.log("  nothing to embed.\n");
    return;
  }

  if (existsSync(BIN)) {
    const ts = Date.now();
    copyFileSync(BIN, resolve(DB_SRC, `embeddings-rows.pre-${ts}.bin`));
    copyFileSync(IDX, resolve(DB_SRC, `embeddings-rows.pre-${ts}.idx.json`));
    console.log("  snapshotted existing sidecar\n");
  }

  const client = new Together({
    apiKey: process.env.TOGETHER_API_KEY,
    baseURL: process.env.TOGETHER_BASE_URL ?? "https://api.together.ai/v1",
    timeout: 60_000,
  });

  const vectors = new Map<string, Float32Array>();
  if (existingBin) {
    const view = new Float32Array(
      existingBin.buffer,
      existingBin.byteOffset,
      existingBin.byteLength / 4,
    );
    existingSlugs.forEach((slug, i) =>
      vectors.set(slug, view.slice(i * DIMS, (i + 1) * DIMS)),
    );
  }

  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH);
    const inputs = batch.map((r) => rowText(r));
    type EmbeddingResp = { data?: Array<{ embedding?: number[] }> };
    let res: EmbeddingResp | null = null;
    for (let attempt = 1; attempt <= 3 && !res; attempt++) {
      try {
        res = (await client.embeddings.create({
          model: MODEL,
          input: inputs,
        })) as EmbeddingResp;
      } catch (err) {
        if (attempt === 3) throw err;
        await new Promise((r) => setTimeout(r, 2500 * attempt));
      }
    }
    const data = res?.data ?? [];
    if (data.length !== batch.length)
      throw new Error(`batch ${i}: got ${data.length} embeddings for ${batch.length} inputs`);
    batch.forEach((r, j) => {
      const arr = data[j]?.embedding;
      if (!arr || arr.length !== DIMS)
        throw new Error(`bad embedding for ${r.slug}`);
      vectors.set(r.slug, Float32Array.from(arr));
    });
    console.log(`  … ${Math.min(i + BATCH, targets.length)}/${targets.length}`);
  }

  // Write in SEED row order so idx and seed stay aligned mentally
  // (loader keys by slug, order is cosmetic but stable).
  const slugs = rows.map((r) => r.slug).filter((s) => vectors.has(s));
  const bin = Buffer.alloc(slugs.length * DIMS * 4);
  slugs.forEach((slug, i) => {
    const v = vectors.get(slug)!;
    for (let d = 0; d < DIMS; d++) bin.writeFloatLE(v[d]!, (i * DIMS + d) * 4);
  });
  writeFileSync(BIN, bin);
  writeFileSync(
    IDX,
    JSON.stringify({ slugs, dims: DIMS, count: slugs.length }),
  );
  console.log(
    `\n  wrote ${slugs.length} x ${DIMS} vectors (${(bin.length / 1048576).toFixed(1)} MB)\n  ${BIN}\n  ${IDX}\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
