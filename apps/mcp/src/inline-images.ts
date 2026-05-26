/**
 * Fetch result thumbnails so the MCP can return them as native
 * `image` content blocks alongside the JSON text. This is the big
 * ergonomic win for agents: instead of curling each result URL and
 * Reading it (4 extra tool calls per query), the agent sees the
 * thumbnails directly in the tool response.
 *
 * Source URL: prefer a small AVIF variant if it exists on blob,
 * otherwise fall back to the PNG thumb (which exists for every
 * captured site). Today most rows only have the PNG; once the
 * encoder backfill is uploaded (encode-existing.ts + upload-to-blob),
 * AVIFs progressively become available and the per-result payload
 * drops from ~50 KB to ~5 KB without code changes.
 *
 * Performance budget:
 *   - Parallel fetches across all results in one tool call
 *   - 3 s per-image timeout — drop on slow fetches
 *   - 800 KB hard cap per image — drop oversized
 *   - In-process LRU cache (256 entries, keyed by URL) — repeat
 *     queries return inlines instantly
 *
 * Failure mode is non-fatal: if a fetch fails, we return `null` and
 * the caller drops that image from the response. JSON text always
 * still goes back.
 */

const CACHE_SIZE = 256;
const FETCH_TIMEOUT_MS = 3000;
const MAX_IMAGE_BYTES = 800 * 1024;

export type InlineImage = {
  type: "image";
  data: string; // base64
  mimeType: string;
};

type CacheEntry = { block: InlineImage };
const cache = new Map<string, CacheEntry>();

function cacheGet(url: string): InlineImage | null {
  const hit = cache.get(url);
  if (!hit) return null;
  // LRU touch — re-insert moves it to the tail.
  cache.delete(url);
  cache.set(url, hit);
  return hit.block;
}

function cacheSet(url: string, block: InlineImage) {
  if (cache.size >= CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(url, { block });
}

function mimeFromUrl(url: string): string {
  const path = url.split("?")[0]!.toLowerCase();
  if (path.endsWith(".avif")) return "image/avif";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

/** Build a small-AVIF candidate URL from the PNG thumb URL by
 *  rewriting `.../thumb.png` → `.../thumb.384.avif`. The encoder /
 *  upload-to-blob pipeline (PR 1) ships variants with this exact
 *  naming when run. If the URL doesn't match the pattern we just
 *  return null (caller falls back to the PNG). */
function avifVariantFor(thumbUrl: string): string | null {
  // Match `/<slug>/thumb.png[?v=…]`. Replace `thumb.png` with
  // `thumb.384.avif` preserving the query string.
  const re = /\/thumb\.png(\?[^#]*)?$/;
  if (!re.test(thumbUrl)) return null;
  return thumbUrl.replace(re, "/thumb.384.avif$1");
}

async function fetchOne(url: string): Promise<InlineImage | null> {
  const cached = cacheGet(url);
  if (cached) return cached;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_IMAGE_BYTES) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > MAX_IMAGE_BYTES) return null;
    let bin = "";
    for (let i = 0; i < buf.byteLength; i++) bin += String.fromCharCode(buf[i]!);
    const block: InlineImage = {
      type: "image",
      data: btoa(bin),
      mimeType: res.headers.get("content-type") ?? mimeFromUrl(url),
    };
    cacheSet(url, block);
    return block;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Fetch a thumbnail block for a result. Tries the AVIF variant first
 * (5–10 KB once the backfill is up); falls back to the PNG thumb
 * (~50 KB) which exists for every captured site today. Returns null
 * if neither resolves.
 */
export async function thumbnailBlock(
  thumbUrl: string,
): Promise<InlineImage | null> {
  const avifCandidate = avifVariantFor(thumbUrl);
  if (avifCandidate) {
    const avif = await fetchOne(avifCandidate);
    if (avif) return avif;
  }
  return fetchOne(thumbUrl);
}

/**
 * Fetch many thumbnails in parallel. Returns one block per input URL,
 * with `null` slots for ones that failed/timed out. The caller is
 * expected to filter nulls out.
 */
export async function thumbnailBlocks(
  thumbUrls: ReadonlyArray<string>,
): Promise<Array<InlineImage | null>> {
  return Promise.all(thumbUrls.map((u) => thumbnailBlock(u)));
}

/** Token-cost back-of-envelope so we don't accidentally over-pack a
 *  response. ~1.33 chars per base64 byte. Each image content block
 *  costs roughly its base64 length in tokens (chars / 3). At 50 KB
 *  PNG base64 → ~66 KB string → ~22 K tokens. Tools that return
 *  many results should keep the limit modest (e.g. limit=6) to stay
 *  inside a reasonable response envelope. */
export const MAX_INLINE_PER_CALL = 12;
