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

/* ─── sidecar-only loader ───
 * For runtimes that bundle the seed (so the catalogue is already in
 * memory via `bundledScreens`) but can't readFileSync `embeddings.bin`
 * — e.g. a Vercel serverless function, where the .bin isn't traced into
 * the lambda. Fetches just the idx + bin from the CDN and injects them
 * so vector tools (find_similar / recommend) work. Best-effort: returns
 * false on any failure and callers degrade to lexical search. */
let _sidecarLoaded: Promise<boolean> | null = null;

async function loadSidecarFromUrl(base: string): Promise<boolean> {
  try {
    const b = base.replace(/\/+$/, "");
    const [idxRes, binRes] = await Promise.all([
      fetch(`${b}/embeddings.idx.json`),
      fetch(`${b}/embeddings.bin`),
    ]);
    if (!idxRes.ok || !binRes.ok) return false;
    const idx = (await idxRes.json()) as {
      slugs: string[];
      dims: number;
      count?: number;
    };
    const bin = await binRes.arrayBuffer();
    return setSidecar(idx, bin);
  } catch {
    return false;
  }
}

export function ensureSidecarFromUrl(base: string): Promise<boolean> {
  if (!_sidecarLoaded) _sidecarLoaded = loadSidecarFromUrl(base);
  return _sidecarLoaded;
}
