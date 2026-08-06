/**
 * Fetch result thumbnails so the MCP can return them as native
 * `image` content blocks alongside the JSON text. This is the big
 * ergonomic win for agents: instead of curling each result URL and
 * Reading it (4 extra tool calls per query), the agent sees the
 * thumbnails directly in the tool response.
 *
 * Source URL: prefer a small WebP variant if it exists on blob,
 * otherwise fall back to the PNG thumb (which exists for every
 * captured site). Never AVIF: the model APIs we care about decode
 * PNG/JPEG/WebP only (Anthropic, Moonshot K2.7/MoonViT, Qwen-VL),
 * so an inlined AVIF block is a wasted ~7 KB the model errors on or
 * silently drops. As the encoder backfill uploads variants, WebPs
 * progressively become available and the per-result payload drops
 * from ~50 KB to ~10 KB without code changes.
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

/** Build a small-WebP candidate URL from the PNG thumb URL by
 *  rewriting `.../thumb.png` to `.../thumb.384.webp`. The encoder /
 *  upload-to-blob pipeline ships avif+webp variants with this exact
 *  naming when run; webp is the one every vision API decodes. If the
 *  URL doesn't match the pattern we just return null (caller falls
 *  back to the PNG). */
function webpVariantFor(thumbUrl: string): string | null {
  // Match `/<slug>/thumb.png[?v=...]`. Replace `thumb.png` with
  // `thumb.384.webp` preserving the query string.
  const re = /\/thumb\.png(\?[^#]*)?$/;
  if (!re.test(thumbUrl)) return null;
  return thumbUrl.replace(re, "/thumb.384.webp$1");
}

/**
 * The edge cache, on the runtimes that have one.
 *
 * The LRU above only helps a process that has already served the same
 * query. The hosted Worker is effectively cold per request, so in
 * production it almost never hit - measured 728ms cold against 3ms
 * warm for one `recommend`, a 240x gap that was pure network. This is
 * how a cold isolate gets the warm number.
 *
 * Returns null in Node (stdio, npx), where `caches` does not exist and
 * the LRU is already the right answer.
 */
type EdgeCache = {
  match(req: Request): Promise<Response | undefined>;
  put(req: Request, res: Response): Promise<void>;
};
function edgeCache(): EdgeCache | null {
  const c = (globalThis as { caches?: { default?: EdgeCache } }).caches;
  return c?.default ?? null;
}

async function fetchOne(url: string): Promise<InlineImage | null> {
  const cached = cacheGet(url);
  if (cached) return cached;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const edge = edgeCache();
    // Blob URLs carry a `?v=<timestamp>`, so a given URL is immutable
    // and a hit never needs revalidating.
    const key = new Request(url, { method: "GET" });
    let res = edge ? await edge.match(key) : undefined;

    if (!res) {
      const fresh = await fetch(url, { signal: ctrl.signal });
      if (!fresh.ok) return null;
      if (edge) {
        // Store with an explicit long TTL rather than trusting the
        // origin's headers: the URL is content-versioned, so the only
        // way this entry goes stale is the file being replaced under a
        // new `?v=`, which is a different key.
        const headers = new Headers(fresh.headers);
        headers.set("cache-control", "public, max-age=31536000, immutable");
        try {
          await edge.put(
            key,
            new Response(fresh.clone().body, {
              status: fresh.status,
              statusText: fresh.statusText,
              headers,
            }),
          );
        } catch {
          /* cache.put rejects some responses (size, headers); the fetch
             still succeeded, so carry on uncached. */
        }
      }
      res = fresh;
    }

    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_IMAGE_BYTES) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > MAX_IMAGE_BYTES) return null;
    const mimeType = res.headers.get("content-type") ?? mimeFromUrl(url);
    // Never inline a format the model APIs can't decode (AVIF being the
    // one our blob store actually hosts) — the caller falls back to PNG.
    if (mimeType.includes("avif")) return null;
    let bin = "";
    for (let i = 0; i < buf.byteLength; i++) bin += String.fromCharCode(buf[i]!);
    const block: InlineImage = {
      type: "image",
      data: btoa(bin),
      mimeType,
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
 * Fetch a thumbnail block for a result. Accepts either one URL or an
 * ordered candidate list (smallest/most-efficient first); the first
 * candidate that resolves wins. A bare `.../thumb.png` URL still gets
 * its `.384.webp` sibling synthesized and tried first, so callers that
 * pass a single PNG keep the WebP-preferred behavior.
 */
export async function thumbnailBlock(
  candidates: string | ReadonlyArray<string>,
): Promise<InlineImage | null> {
  const list = typeof candidates === "string" ? [candidates] : [...candidates];
  const expanded: string[] = [];
  for (const url of list) {
    const webpCandidate = url.endsWith(".webp") ? null : webpVariantFor(url);
    if (webpCandidate && !list.includes(webpCandidate))
      expanded.push(webpCandidate);
    expanded.push(url);
  }
  for (const url of expanded) {
    const block = await fetchOne(url);
    if (block) return block;
  }
  return null;
}

/**
 * Fetch many thumbnails in parallel. Returns one block per input entry,
 * with `null` slots for ones that failed/timed out. The caller is
 * expected to filter nulls out.
 */
export async function thumbnailBlocks(
  thumbUrls: ReadonlyArray<string | ReadonlyArray<string>>,
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

/** Total decoded-byte budget for ALL inline images in one response.
 *  Blocks past the budget are dropped in order (the JSON URLs remain,
 *  so the agent can still fetch what was cut). Override with
 *  INSPO_MAX_INLINE_BYTES. */
export const MAX_INLINE_TOTAL_BYTES = (() => {
  const raw = Number(process.env.INSPO_MAX_INLINE_BYTES ?? "");
  return Number.isFinite(raw) && raw > 0 ? raw : 800 * 1024;
})();
