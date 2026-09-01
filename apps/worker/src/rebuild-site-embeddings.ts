/**
 * Rebuild the per-SITE embedding sidecar (embeddings.idx.json /
 * embeddings.bin) from the current seed, without re-capturing.
 *
 * The site vector was originally computed inside enrich-archive.ts at
 * capture time, from description + keywords + tags + title. When tags
 * change later (e.g. the 2026-09 industry re-audit), the vectors go
 * stale; this script recomposes the same text from each site's landing
 * row and re-embeds it with the pipeline's model.
 *
 *   tsx src/rebuild-site-embeddings.ts          dry-run (sample text)
 *   tsx src/rebuild-site-embeddings.ts --go     embed all sites, overwrite
 */

import "./env.js";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import Together from "together-ai";

const MODEL =
  process.env.INSPO_EMBED_MODEL ?? "intfloat/multilingual-e5-large-instruct";
const DIMS = 1024;
const BATCH = 64;

const DB_SRC = resolve("../../packages/db/src");
const SEED = resolve(DB_SRC, "static-screens.json");
const IDX = resolve(DB_SRC, "embeddings.idx.json");
const BIN = resolve(DB_SRC, "embeddings.bin");

type Row = {
  siteSlug: string;
  title?: string;
  pageType?: string;
  description?: string;
  tags?: {
    style?: string[];
    industry?: string[];
    vibe?: string[];
    macrostructure?: string;
  };
};

function siteText(r: Row): string {
  // description is stored as "prose  ·  keyword, keyword"; recover both.
  const [prose, keywords] = (r.description ?? "").split("·").map((p) => p.trim());
  return [
    prose,
    keywords,
    (r.tags?.style ?? []).join(" "),
    (r.tags?.industry ?? []).join(" "),
    (r.tags?.vibe ?? []).join(" "),
    r.tags?.macrostructure ?? "",
    r.title ?? "",
  ]
    .filter(Boolean)
    .join(" - ");
}

async function main() {
  const go = process.argv.includes("--go");
  const rows = JSON.parse(readFileSync(SEED, "utf8")) as Row[];
  const bySite = new Map<string, Row>();
  for (const r of rows) {
    const prev = bySite.get(r.siteSlug);
    // Prefer the landing row as the site's representative text.
    if (!prev || (prev.pageType !== "landing" && r.pageType === "landing")) {
      bySite.set(r.siteSlug, r);
    }
  }
  const slugs = [...bySite.keys()].sort();
  console.log(`\n  rebuild-site-embeddings · sites=${slugs.length} · go=${go}\n`);
  console.log(`  sample [${slugs[0]}]: ${siteText(bySite.get(slugs[0])!).slice(0, 140)}…\n`);
  if (!go) {
    console.log("  dry-run. re-run with --go to embed.");
    return;
  }

  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) throw new Error("TOGETHER_API_KEY is not set");
  const client = new Together({ apiKey });

  const out = new Float32Array(slugs.length * DIMS);
  for (let i = 0; i < slugs.length; i += BATCH) {
    const batch = slugs.slice(i, i + BATCH);
    const inputs = batch.map((s) => siteText(bySite.get(s)!).slice(0, 8000));
    const res = await client.embeddings.create({ model: MODEL, input: inputs });
    const data = res.data ?? [];
    if (data.length !== batch.length) {
      throw new Error(`batch at ${i}: got ${data.length} embeddings for ${batch.length} inputs`);
    }
    for (let j = 0; j < batch.length; j++) {
      out.set(data[j]!.embedding as number[], (i + j) * DIMS);
    }
    process.stdout.write(`\r  … ${Math.min(i + BATCH, slugs.length)}/${slugs.length}`);
  }
  console.log();

  const stamp = Date.now();
  copyFileSync(IDX, resolve(DB_SRC, `embeddings.idx.pre-retag-${stamp}.json`));
  copyFileSync(BIN, resolve(DB_SRC, `embeddings.pre-retag-${stamp}.bin`));
  writeFileSync(IDX, JSON.stringify({ slugs, dims: DIMS, count: slugs.length }));
  writeFileSync(BIN, Buffer.from(out.buffer));
  console.log(`\n  wrote ${slugs.length} x ${DIMS} vectors (${(out.byteLength / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`  ${BIN}\n  ${IDX}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
