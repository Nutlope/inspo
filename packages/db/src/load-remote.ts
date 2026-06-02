/**
 * Runtime catalogue loader for environments that can't bundle the seed
 * (the Cloudflare Worker) — and, optionally, the npx/local MCP if you'd
 * rather ship a tiny package than inline 16MB.
 *
 * Fetches the three catalogue files published by
 * `apps/worker/src/publish-catalogue-to-blob.ts` and injects them into
 * the query + vector layers:
 *
 *   <base>/static-screens.json  → setCatalogue()   (required)
 *   <base>/embeddings.idx.json  → setSidecar()      (optional — vectors)
 *   <base>/embeddings.bin       ↗
 *
 * `fetch` is available in both the Workers runtime and modern Node, so
 * this module is runtime-agnostic. Vectors are best-effort: if the
 * sidecar is missing/mismatched the catalogue still loads and vector
 * tools degrade to lexical search.
 */

import { setCatalogue } from "./queries";
import { setSidecar } from "./vector";

export interface CatalogueLoadResult {
  screens: number;
  vectors: number;
}

let _loaded: Promise<CatalogueLoadResult> | null = null;

export async function loadCatalogueFromUrl(
  base: string,
): Promise<CatalogueLoadResult> {
  const b = base.replace(/\/+$/, "");
  const [screensRes, idxRes, binRes] = await Promise.all([
    fetch(`${b}/static-screens.json`),
    fetch(`${b}/embeddings.idx.json`),
    fetch(`${b}/embeddings.bin`),
  ]);
  if (!screensRes.ok) {
    throw new Error(
      `catalogue fetch failed: ${screensRes.status} ${b}/static-screens.json`,
    );
  }
  const screens = (await screensRes.json()) as unknown[];
  setCatalogue(screens);

  let vectors = 0;
  if (idxRes.ok && binRes.ok) {
    try {
      const idx = (await idxRes.json()) as {
        slugs: string[];
        dims: number;
        count?: number;
      };
      const bin = await binRes.arrayBuffer();
      if (setSidecar(idx, bin)) vectors = idx.count ?? idx.slugs.length;
    } catch {
      /* vectors are optional — keep lexical search working */
    }
  }
  return { screens: screens.length, vectors };
}

/**
 * Memoized loader — fetches + injects once per isolate, returning the
 * same promise on subsequent calls. The edge Worker calls this on every
 * request; only the first triggers a fetch.
 */
export function ensureCatalogue(base: string): Promise<CatalogueLoadResult> {
  if (!_loaded) _loaded = loadCatalogueFromUrl(base);
  return _loaded;
}
