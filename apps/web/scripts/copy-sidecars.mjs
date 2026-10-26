/**
 * Stage the embedding sidecars for the /api/mcp lambda.
 *
 * Copies the four sidecar files (per-site + per-row, idx JSON + float32
 * bin) from packages/db/src into <app>/sidecars so Next's output file
 * tracing can include them in the /api/mcp function bundle
 * (see outputFileTracingIncludes in next.config.ts).
 *
 * Why: every cold lambda instance used to re-fetch the two sidecars
 * (~12.9MB) from Vercel Blob on the first vector-tool call - the single
 * biggest Blob Data Transfer line item on this deployment. Bundled
 * files turn that into a ~1ms filesystem read. The copies are build
 * output, never committed: the source of truth stays in packages/db/src,
 * so `re-embed -> deploy` keeps serving what's in git.
 *
 * Runs as part of `pnpm build` in apps/web. Executed from the app
 * directory by npm/pnpm/turbo, so process.cwd() is apps/web.
 */

import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const FILES = [
  "embeddings.bin",
  "embeddings.idx.json",
  "embeddings-rows.bin",
  "embeddings-rows.idx.json",
];

const appRoot = resolve(process.cwd());
const srcDir = resolve(appRoot, "..", "..", "packages", "db", "src");
const destDir = join(appRoot, "sidecars");

mkdirSync(destDir, { recursive: true });

for (const file of FILES) {
  const src = join(srcDir, file);
  try {
    const s = statSync(src);
    if (!s.isFile()) throw new Error("not a file");
    copyFileSync(src, join(destDir, file));
  } catch (err) {
    // Hard-fail the build when a sidecar is missing rather than
    // deploying a lambda that would silently fall back to the Blob
    // fetch (cost, not correctness - but cost we just decided not to
    // pay). If the archive genuinely has no sidecars, commit empty
    // ones or drop them from FILES deliberately.
    throw new Error(
      `copy-sidecars: cannot read ${src} (${err instanceof Error ? err.message : err}). ` +
        `Run the embedder (apps/worker/src/rebuild-site-embeddings.ts / build-row-embeddings.ts) first.`,
    );
  }
}

console.log(`copy-sidecars: staged ${FILES.length} files into ${destDir}`);
