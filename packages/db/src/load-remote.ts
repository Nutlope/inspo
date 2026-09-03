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
import { setRowSidecar, setSidecar } from "./vector";

export interface CatalogueLoadResult {
  screens: number;
  vectors: number;
  /** Per-row vectors (embeddings-rows.*) powering find_similar. */
  rowVectors: number;
}

let _loaded: Promise<CatalogueLoadResult> | null = null;

type SidecarIdx = { slugs: string[]; dims: number; count?: number };

async function fetchSidecarPair(
  b: string,
  stem: string,
  inject: (idx: SidecarIdx, bin: ArrayBuffer) => boolean,
): Promise<number> {
  try {
    const [idxRes, binRes] = await Promise.all([
      fetch(`${b}/${stem}.idx.json`),
      fetch(`${b}/${stem}.bin`),
    ]);
    if (!idxRes.ok || !binRes.ok) return 0;
    const idx = (await idxRes.json()) as SidecarIdx;
    const bin = await binRes.arrayBuffer();
    return inject(idx, bin) ? (idx.count ?? idx.slugs.length) : 0;
  } catch {
    /* vectors are optional — keep lexical search working */
    return 0;
  }
}

export async function loadCatalogueFromUrl(
  base: string,
  /** Skip the two embedding sidecars. They are 11.6MB of the 14MB a
   *  cold start pulls, and only find_similar / recommend read them -
   *  so a caller that can await them later should not pay for them
   *  before it can answer its first search. `ensureSidecarFromUrl`
   *  loads them separately. */
  opts: { sidecars?: boolean } = {},
): Promise<CatalogueLoadResult> {
  const b = base.replace(/\/+$/, "");
  const withSidecars = opts.sidecars !== false;
  const [screensRes, vectors, rowVectors] = await Promise.all([
    fetch(`${b}/static-screens.json`),
    withSidecars ? fetchSidecarPair(b, "embeddings", setSidecar) : 0,
    withSidecars ? fetchSidecarPair(b, "embeddings-rows", setRowSidecar) : 0,
  ]);
  if (!screensRes.ok) {
    throw new Error(
      `catalogue fetch failed: ${screensRes.status} ${b}/static-screens.json`,
    );
  }
  const screens = (await screensRes.json()) as unknown[];
  setCatalogue(screens);
  return { screens: screens.length, vectors, rowVectors };
}

/**
 * Memoized loader — fetches + injects once per isolate, returning the
 * same promise on subsequent calls. The edge Worker calls this on every
 * request; only the first triggers a fetch.
 */
export function ensureCatalogue(
  base: string,
  opts: { sidecars?: boolean } = {},
): Promise<CatalogueLoadResult> {
  // Reset the memo on rejection so a transient cold-start failure (CDN
  // blip, non-200, DNS hiccup) doesn't permanently brick the isolate:
  // the next request retries instead of re-awaiting a rejected promise.
  if (!_loaded) {
    _loaded = loadCatalogueFromUrl(base, opts).catch((e) => {
      _loaded = null;
      throw e;
    });
  }
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
  const b = base.replace(/\/+$/, "");
  const [vectors, rowVectors] = await Promise.all([
    fetchSidecarPair(b, "embeddings", setSidecar),
    fetchSidecarPair(b, "embeddings-rows", setRowSidecar),
  ]);
  return vectors > 0 || rowVectors > 0;
}

export function ensureSidecarFromUrl(base: string): Promise<boolean> {
  // Same retry-on-failure guard as ensureCatalogue. loadSidecarFromUrl
  // already swallows to `false`, but this keeps a thrown rejection from
  // sticking if its internals ever change.
  if (!_sidecarLoaded) {
    _sidecarLoaded = loadSidecarFromUrl(base).catch((e) => {
      _sidecarLoaded = null;
      throw e;
    });
  }
  return _sidecarLoaded;
}
