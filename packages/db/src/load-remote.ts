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
import {
  bundledSidecarDirs,
  loadRowSidecarFromDir,
  loadSiteSidecarFromDir,
  setRowSidecar,
  setSidecar,
} from "./vector";

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
   *  cold start pulls, and only the vector tools read them -
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

/* ─── sidecar-only loaders ───
 * For runtimes that bundle the seed (so the catalogue is already in
 * memory via `bundledScreens`) but can't readFileSync `embeddings.bin`
 * — e.g. a Vercel serverless function, where the .bin isn't traced into
 * the lambda. Fetches just the idx + bin from the CDN and injects them
 * so the vector tools (search_screens / find_similar / recommend) work.
 * Best-effort: returns
 * false on any failure and callers degrade to lexical search.
 *
 * The two sidecars load SEPARATELY. The per-site one (embeddings.*,
 * 3.3MB) powers search_screens' vector blend, so hosted routes await it
 * before serving. The per-row one (embeddings-rows.*, 9.1MB) is read
 * only by find_similar — loading it eagerly cost every
 * lambda +9.1MB and blocked even initialize/tools-list on the bigger
 * fetch, so those two tools pull it lazily via their `awaitVectors`
 * hook instead. A lambda that never serves a vector tool never pays
 * for it. */
let _siteSidecarLoaded: Promise<boolean> | null = null;
let _rowSidecarLoaded: Promise<boolean> | null = null;

/* fetchSidecarPair swallows every failure (network, non-200, malformed)
 * to 0, so an empty result is the ONLY failure signal these loaders
 * get - and it must not stick: a transient CDN blip memoized as `false`
 * would brick vector search for the isolate's whole lifetime. Both
 * loaders therefore reset their memo on an empty result so the next
 * call retries. (While a sidecar is genuinely absent - a publish race
 * - this re-fetches per call: two quick 404s, the right side of the
 * trade-off. The defensive .catch keeps a thrown rejection from
 * sticking if fetchSidecarPair's internals ever change.) */

/** Per-site sidecar (embeddings.*) — the one search_screens reads. */
export function ensureSiteSidecarFromUrl(base: string): Promise<boolean> {
  if (!_siteSidecarLoaded) {
    const b = base.replace(/\/+$/, "");
    _siteSidecarLoaded = fetchSidecarPair(b, "embeddings", setSidecar)
      .then((n) => {
        if (n === 0) {
          _siteSidecarLoaded = null;
          return false;
        }
        return true;
      })
      .catch((e) => {
        _siteSidecarLoaded = null;
        throw e;
      });
  }
  return _siteSidecarLoaded;
}

/** Per-row sidecar (embeddings-rows.*) — only find_similar reads this;
 *  load it on first use, not on every cold start. */
export function ensureRowSidecarFromUrl(base: string): Promise<boolean> {
  if (!_rowSidecarLoaded) {
    const b = base.replace(/\/+$/, "");
    _rowSidecarLoaded = fetchSidecarPair(b, "embeddings-rows", setRowSidecar)
      .then((n) => {
        if (n === 0) {
          _rowSidecarLoaded = null;
          return false;
        }
        return true;
      })
      .catch((e) => {
        _rowSidecarLoaded = null;
        throw e;
      });
  }
  return _rowSidecarLoaded;
}

/** Both sidecars. Kept for callers that want them warmed together
 *  (the stdio/npm server warms them in the background at startup). */
export function ensureSidecarFromUrl(base: string): Promise<boolean> {
  return Promise.all([
    ensureSiteSidecarFromUrl(base),
    ensureRowSidecarFromUrl(base),
  ]).then(([a, b]) => a || b);
}

/* ─── disk-first sidecar loaders (hosted Vercel route) ───
 * The /api/mcp lambda ships the sidecar pair inside its function
 * bundle (apps/web/sidecars, staged by a build-time copy and traced
 * via outputFileTracingIncludes), so a fresh instance reads the
 * 12.9MB from disk in milliseconds instead of re-downloading it from
 * Blob on every cold start - which was the deployment's single
 * largest Blob Data Transfer line item.
 *
 * Disk first, URL fallback: a missing or mis-traced bundle costs the
 * old Blob egress again but never breaks vector search. The memo
 * resets on failure for the same reason the FromUrl loaders do - a
 * miss must not brick the isolate for its whole lifetime. */
let _siteDurable: Promise<boolean> | null = null;
let _rowDurable: Promise<boolean> | null = null;

function diskFirst(
  fromDir: (dir: string) => Map<string, Float32Array> | null,
  fallback: () => Promise<boolean>,
): Promise<boolean> {
  for (const dir of bundledSidecarDirs()) {
    if (fromDir(dir)) return Promise.resolve(true);
  }
  return fallback();
}

/** Per-site sidecar (embeddings.*), preferring the bundled copy over
 *  the CDN fetch. */
export function ensureSiteSidecarDurable(base: string): Promise<boolean> {
  if (!_siteDurable) {
    _siteDurable = diskFirst(loadSiteSidecarFromDir, () =>
      ensureSiteSidecarFromUrl(base),
    )
      .then((ok) => {
        if (!ok) _siteDurable = null;
        return ok;
      })
      .catch((e) => {
        _siteDurable = null;
        throw e;
      });
  }
  return _siteDurable;
}

/** Per-row sidecar (embeddings-rows.*), preferring the bundled copy
 *  over the CDN fetch. */
export function ensureRowSidecarDurable(base: string): Promise<boolean> {
  if (!_rowDurable) {
    _rowDurable = diskFirst(loadRowSidecarFromDir, () =>
      ensureRowSidecarFromUrl(base),
    )
      .then((ok) => {
        if (!ok) _rowDurable = null;
        return ok;
      })
      .catch((e) => {
        _rowDurable = null;
        throw e;
      });
  }
  return _rowDurable;
}
