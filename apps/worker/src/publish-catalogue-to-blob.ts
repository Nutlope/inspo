/**
 * Publish the catalogue data files to Vercel Blob so the hosted MCP
 * (Cloudflare Worker) — and the npx/local MCP — can FETCH them at
 * runtime instead of bundling the ~16MB seed into the Worker script
 * (which busts Cloudflare's bundle-size limit).
 *
 * Uploads, under stable `catalogue/` keys (no random suffix, public):
 *   catalogue/static-screens.json   the curated seed (source of truth)
 *   catalogue/embeddings.idx.json    slug order for the vector sidecar
 *   catalogue/embeddings.bin         Float32 1024-dim vectors
 *   catalogue/umap-2d.json           2D map projection
 *
 * The MCP reads these via `loadCatalogueFromUrl()` in @inspo/db. The
 * base URL it fetches from is `INSPO_CATALOGUE_URL` (defaults to the
 * blob store printed below). Re-run after any seed change so the
 * hosted MCP serves the same catalogue as the web app.
 *
 *   pnpm tsx src/publish-catalogue-to-blob.ts            dry-run
 *   pnpm tsx src/publish-catalogue-to-blob.ts --go       upload
 */

import "./env.js";
import { readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { put } from "@vercel/blob";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const DB_SRC = join(REPO_ROOT, "packages", "db", "src");

const FILES: { file: string; key: string; contentType: string }[] = [
  { file: "static-screens.json", key: "catalogue/static-screens.json", contentType: "application/json" },
  { file: "embeddings.idx.json", key: "catalogue/embeddings.idx.json", contentType: "application/json" },
  { file: "embeddings.bin", key: "catalogue/embeddings.bin", contentType: "application/octet-stream" },
  { file: "umap-2d.json", key: "catalogue/umap-2d.json", contentType: "application/json" },
];

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  const go = process.argv.includes("--go");
  if (go && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN required (it lives in the repo-root .env)");
  }

  console.log(`\n  publish-catalogue-to-blob · go=${go}\n`);
  const urls: string[] = [];
  for (const { file, key, contentType } of FILES) {
    const path = join(DB_SRC, file);
    const buf = readFileSync(path);
    const size = mb(statSync(path).size);
    if (!go) {
      console.log(`  would upload  ${file.padEnd(22)} ${size.padStart(9)}  → ${key}`);
      continue;
    }
    const res = await put(key, buf, {
      access: "public",
      addRandomSuffix: false,
      contentType,
      // Catalogue changes on each seed edit; keep the CDN cache short so
      // re-publishes propagate, but long enough to absorb cold-start bursts.
      cacheControlMaxAge: 60 * 5,
      allowOverwrite: true,
    });
    urls.push(res.url);
    console.log(`  ✓ ${file.padEnd(22)} ${size.padStart(9)}  → ${res.url}`);
  }

  if (go && urls.length) {
    // Derive the base (everything up to and including `/catalogue/`).
    const base = urls[0]!.replace(/\/static-screens\.json.*$/, "");
    console.log(`\n  catalogue base URL (set as INSPO_CATALOGUE_URL):\n    ${base}\n`);
  } else if (!go) {
    console.log("\n  (dry run — pass --go to upload)\n");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
