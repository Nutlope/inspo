/**
 * Vector-search support for the static-seed path. Owns three things:
 *
 *  1. `embedQuery(text)` — embeds the user's natural-language query
 *     into the same 1024-dim space as the per-site embeddings the
 *     archive enrichment (PR 5) wrote into `embeddings.bin`. Uses
 *     Together's `intfloat/multilingual-e5-large-instruct`, the same
 *     model the worker uses for site embeddings, so the spaces match.
 *
 *  2. `loadSidecar()` — reads `embeddings.bin` + `embeddings.idx.json`
 *     from disk on first call and caches the result in module scope.
 *     Returns a `Map<slug, Float32Array>` keyed by **siteSlug** (the
 *     enricher embeds once per site and propagates).
 *
 *  3. `cosineSim()` + tiny LRU caches for both queries and the
 *     parsed sidecar so repeated searches are essentially free after
 *     the first query for any given string.
 *
 * Everything degrades to `null` on missing inputs (no API key, no
 * sidecar on disk, embedding fails, etc.) — callers should fall back
 * to lexical search when that happens.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Together from "together-ai";

export const EMBEDDING_DIMS = 1024;
const EMBED_MODEL =
  process.env.INSPO_EMBED_MODEL ?? "intfloat/multilingual-e5-large-instruct";

// Resolve sidecar paths relative to THIS module, not the caller's cwd.
// Done lazily + guarded: the edge Worker has no filesystem and
// `import.meta.url` is undefined there, which would throw at module load.
// In that runtime the sidecar is injected via setSidecar() instead, so
// returning null here is fine.
function sidecarPaths(stem: string): { bin: string; idx: string } | null {
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    return {
      bin: resolve(dir, `./${stem}.bin`),
      idx: resolve(dir, `./${stem}.idx.json`),
    };
  } catch {
    return null;
  }
}

type SidecarIdx = { slugs: string[]; dims: number; count?: number };

/** Parse an idx + raw bin pair into a slug-keyed vector map. Returns
 *  null on dims/byte-length mismatch so callers degrade gracefully. */
function parseSidecar(
  idx: SidecarIdx,
  bin: ArrayBuffer,
): Map<string, Float32Array> | null {
  if (idx.dims !== EMBEDDING_DIMS) return null;
  if (bin.byteLength !== idx.slugs.length * EMBEDDING_DIMS * 4) return null;
  const view = new Float32Array(bin);
  const map = new Map<string, Float32Array>();
  for (let i = 0; i < idx.slugs.length; i++) {
    map.set(
      idx.slugs[i]!,
      view.slice(i * EMBEDDING_DIMS, (i + 1) * EMBEDDING_DIMS),
    );
  }
  return map;
}

function loadSidecarFromDisk(stem: string): Map<string, Float32Array> | null {
  const paths = sidecarPaths(stem);
  if (!paths || !existsSync(paths.bin) || !existsSync(paths.idx)) return null;
  try {
    const idx = JSON.parse(readFileSync(paths.idx, "utf8")) as SidecarIdx;
    const buf = readFileSync(paths.bin);
    // Copy into a standalone ArrayBuffer (buf may be a pooled slice).
    const ab = buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength,
    );
    return parseSidecar(idx, ab);
  } catch {
    return null;
  }
}

/* ────────────────────── sidecar loader ────────────────────── */

let _sidecar: Map<string, Float32Array> | null = null;

/**
 * Inject the embedding sidecar at runtime, built from a fetched
 * idx JSON + the raw `embeddings.bin` ArrayBuffer. Used by the edge
 * Worker (no filesystem) after `loadCatalogueFromUrl()` fetches both
 * from the CDN. Returns false on a dims mismatch / malformed input so
 * vector tools degrade to lexical search instead of throwing.
 */
export function setSidecar(idx: SidecarIdx, bin: ArrayBuffer): boolean {
  const map = parseSidecar(idx, bin);
  if (!map) return false;
  _sidecar = map;
  return true;
}

export function loadSidecar(): Map<string, Float32Array> | null {
  if (_sidecar) return _sidecar;
  _sidecar = loadSidecarFromDisk("embeddings");
  return _sidecar;
}

/* Per-ROW sidecar (embeddings-rows.*): one vector per screen slug
 * (2,550) instead of one per site (870). Powers find_similar's cosine
 * ranking; the per-site sidecar keeps powering search_screens. */

let _rowSidecar: Map<string, Float32Array> | null = null;

export function setRowSidecar(idx: SidecarIdx, bin: ArrayBuffer): boolean {
  const map = parseSidecar(idx, bin);
  if (!map) return false;
  _rowSidecar = map;
  return true;
}

export function loadRowSidecar(): Map<string, Float32Array> | null {
  if (_rowSidecar) return _rowSidecar;
  _rowSidecar = loadSidecarFromDisk("embeddings-rows");
  return _rowSidecar;
}

/* ────────────────────── embed query (cached) ────────────────────── */

const QUERY_CACHE_MAX = 64;
const queryCache = new Map<string, Float32Array>();

function queryCacheGet(q: string): Float32Array | null {
  const hit = queryCache.get(q);
  if (!hit) return null;
  // LRU touch
  queryCache.delete(q);
  queryCache.set(q, hit);
  return hit;
}
function queryCacheSet(q: string, v: Float32Array) {
  if (queryCache.size >= QUERY_CACHE_MAX) {
    const oldest = queryCache.keys().next().value;
    if (oldest !== undefined) queryCache.delete(oldest);
  }
  queryCache.set(q, v);
}

let _client: Together | null = null;
function client(): Together | null {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) return null;
  if (_client) return _client;
  _client = new Together({
    apiKey,
    baseURL: process.env.TOGETHER_BASE_URL ?? "https://api.together.ai/v1",
    timeout: 15_000,
  });
  return _client;
}

export async function embedQuery(text: string): Promise<Float32Array | null> {
  const q = text.trim();
  if (!q) return null;
  const cached = queryCacheGet(q);
  if (cached) return cached;
  const c = client();
  if (!c) return null;
  try {
    // The Together SDK exposes `embeddings.create`. Returns an array
    // of `{ embedding: number[] }`. We send one input and read the
    // first element.
    type EmbeddingResp = { data?: Array<{ embedding?: number[] }> };
    const res = (await c.embeddings.create({
      model: EMBED_MODEL,
      input: q,
    })) as EmbeddingResp;
    const arr = res.data?.[0]?.embedding;
    if (!arr || arr.length !== EMBEDDING_DIMS) return null;
    const vec = Float32Array.from(arr);
    queryCacheSet(q, vec);
    return vec;
  } catch {
    return null;
  }
}

/* ────────────────────── cosine similarity ────────────────────── */

/** Cosine between two same-length vectors. Returns 0 for degenerate
 *  inputs. Inputs are not assumed to be normalised. */
export function cosineSim(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
