/**
 * Persistent disk cache for the catalogue files fetched by
 * ./load-remote.
 *
 * Why this exists: the published npm client (`npx inspo-mcp`) starts a
 * fresh process for every editor session, and ~12K starts/day were each
 * re-downloading the whole ~14MB catalogue with no caching at all — the
 * overwhelming share of the blob store's transfer bill (~$200/mo). The
 * blob CDN answers If-None-Match with a zero-byte 304, so a
 * revalidating disk cache turns every repeat start into ~1KB of
 * headers.
 *
 * Layout (keyed by catalogue base URL, so INSPO_CATALOGUE_URL overrides
 * — self-hosters — never collide with the public catalogue's cache):
 *
 *   <root>/<sha256(base).slice(0,16)>/
 *     static-screens.json, embeddings.bin, ...   (decoded bytes)
 *     meta.json  { "<file>": { etag, fetchedAt } }
 *
 * Root: $XDG_CACHE_HOME/inspo-mcp or ~/.cache/inspo-mcp (POSIX),
 * %LOCALAPPDATA%\inspo-mcp\Cache (win32). Override with INSPO_CACHE_DIR;
 * disable entirely with INSPO_CATALOGUE_CACHE=0|off|false.
 *
 * Design rules: this module NEVER throws — any fs problem (read-only
 * home, restricted sandbox, lambda filesystem) degrades to the plain
 * fetch the callers used before it existed. Writes are tmp-file +
 * rename, so a SIGKILL mid-write can never leave a partial file behind;
 * a corrupt meta.json is treated as empty and self-heals on the next
 * 200. Stored bytes are the DECODED body (undici has already unzipped
 * them); ETag revalidation is unaffected.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

interface CacheEntry {
  etag: string | null;
  /** ms since epoch; informational only — no expiry logic reads it. */
  fetchedAt: number;
}

/* Probed once per process: a cache root we verifiably can write to, or
 * null (disabled / unwritable / any error at all). Vercel lambda
 * filesystems are read-only outside /tmp, and failing closed here is
 * what keeps every non-desktop runtime behaving exactly as it did
 * before this module existed. */
let _root: string | null | undefined;

function cacheRoot(): string | null {
  if (_root !== undefined) return _root;
  _root = resolveRoot();
  return _root;
}

function resolveRoot(): string | null {
  try {
    const off = process.env.INSPO_CATALOGUE_CACHE;
    if (off && /^(0|off|false)$/i.test(off.trim())) return null;
    const override = process.env.INSPO_CACHE_DIR;
    let root: string;
    if (override) {
      root = override;
    } else if (process.platform === "win32") {
      root = join(
        process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"),
        "inspo-mcp",
        "Cache",
      );
    } else {
      root = process.env.XDG_CACHE_HOME
        ? join(process.env.XDG_CACHE_HOME, "inspo-mcp")
        : join(homedir(), ".cache", "inspo-mcp");
    }
    mkdirSync(root, { recursive: true });
    // Probe real writability — mkdir succeeding does not imply we can
    // write inside (and on some sandboxed runtimes both lie).
    const probe = join(root, `.probe-${process.pid}`);
    writeFileSync(probe, "");
    unlinkSync(probe);
    return root;
  } catch {
    return null;
  }
}

/** Cache directory for one catalogue base URL, or null when caching is
 *  disabled/unwritable. Callers treat null as "plain fetch". */
export function catalogueCacheDir(baseUrl: string): string | null {
  const root = cacheRoot();
  if (!root) return null;
  try {
    const key = createHash("sha256")
      .update(baseUrl)
      .digest("hex")
      .slice(0, 16);
    const dir = join(root, key);
    mkdirSync(dir, { recursive: true });
    return dir;
  } catch {
    return null;
  }
}

/* Filenames that may live in the cache. Anything else (odd catalogue
 * URLs, traversal attempts) simply skips the cache. */
const SAFE_NAME = /^[\w.-]+$/;

function splitUrl(url: string): { base: string; name: string } | null {
  try {
    const u = new URL(url);
    const slash = u.pathname.lastIndexOf("/");
    const name = u.pathname.slice(slash + 1);
    if (!name || !SAFE_NAME.test(name)) return null;
    return { base: u.origin + u.pathname.slice(0, slash), name };
  } catch {
    return null;
  }
}

function readMeta(dir: string): Record<string, CacheEntry> {
  try {
    const parsed = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, CacheEntry>)
      : {};
  } catch {
    /* corrupt/half-written meta = empty cache; revalidates and heals */
    return {};
  }
}

/* Same-dir tmp + rename is atomic on every platform we run on, so a
 * reader can never observe a partial file — the worst a SIGKILL
 * mid-write leaves behind is a small orphan tmp file. */
function atomicWrite(path: string, data: string | Uint8Array): void {
  const tmp = `${path}.tmp-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  writeFileSync(tmp, data);
  renameSync(tmp, path);
}

function writeEntry(
  dir: string,
  name: string,
  bytes: Uint8Array,
  etag: string | null,
): void {
  try {
    atomicWrite(join(dir, name), bytes);
    // Meta AFTER the data file: a crash between them leaves a valid
    // file with a stale/absent etag, which just revalidates into a 200
    // and rewrites both. The reverse order could pair fresh meta with
    // a torn file.
    const meta = readMeta(dir);
    meta[name] = { etag, fetchedAt: Date.now() };
    atomicWrite(join(dir, "meta.json"), JSON.stringify(meta));
  } catch {
    /* caching is best-effort; the caller still gets its bytes */
  }
}

function cachedResponse(bytes: Uint8Array, etag: string | null): Response {
  const headers = new Headers();
  if (etag) headers.set("etag", etag);
  // Copy into a freshly allocated Uint8Array: the DOM BodyInit used by
  // Next.js's tsconfig only accepts ArrayBuffer-backed views, and the
  // Uint8Array<ArrayBufferLike> that readFileSync / Buffer.from produce
  // is rejected there (the plain-Node undici types accept it, which is
  // why @inspo/mcp typechecks either way but apps/web did not). The
  // TypedArray constructor returns Uint8Array<ArrayBuffer>, which both
  // type universes accept as a Response body.
  return new Response(new Uint8Array(bytes), { status: 200, headers });
}

export interface FetchThroughCacheOptions {
  /** Extra request headers (e.g. the client's user-agent). */
  extraHeaders?: Record<string, string>;
  /** How long a cache-HIT revalidation may wait for response headers
   *  before falling back to the stored copy (default 3000ms). Body
   *  streaming after headers arrive is unbounded, so a slow download of
   *  a changed file still completes. Cache-miss fetches are entirely
   *  unbounded — exactly the behavior callers had before this module. */
  revalidateTimeoutMs?: number;
}

/**
 * fetch() with a persistent, revalidating disk cache in front.
 *
 *  - cache hit  → conditional GET (If-None-Match): 304 ⇒ stored bytes;
 *    200 ⇒ atomic replace + served fresh; network error, timeout or any
 *    other status ⇒ the stored copy (stale beats dead).
 *  - cache miss → plain GET; a 200 is written through (best-effort),
 *    any other status returned untouched so callers keep their existing
 *    error semantics.
 *  - cache disabled/unwritable/any fs error ⇒ plain GET, full stop.
 *
 * Never rejects for cache reasons — it rejects only the way a plain
 * fetch would (a cache miss against a dead origin).
 */
export async function fetchThroughCache(
  url: string,
  opts: FetchThroughCacheOptions = {},
): Promise<Response> {
  const split = splitUrl(url);
  const dir = split ? catalogueCacheDir(split.base) : null;
  if (!split || !dir) {
    return fetch(url, { headers: opts.extraHeaders });
  }
  const { name } = split;
  const file = join(dir, name);

  let cached: Buffer | null = null;
  let entry: CacheEntry | null = null;
  try {
    entry = readMeta(dir)[name] ?? null;
    if (entry && existsSync(file)) cached = readFileSync(file);
  } catch {
    cached = null;
  }

  if (cached === null) {
    const res = await fetch(url, { headers: opts.extraHeaders });
    if (!res.ok) return res;
    // Buffer copy: the pooled body buffer must not be aliased into the
    // cache write and the Response at once on some runtimes.
    const bytes = Buffer.from(await res.arrayBuffer());
    writeEntry(dir, name, bytes, res.headers.get("etag"));
    return cachedResponse(bytes, res.headers.get("etag"));
  }

  const headers: Record<string, string> = { ...opts.extraHeaders };
  if (entry?.etag) headers["if-none-match"] = entry.etag;
  const ac = new AbortController();
  const timer = setTimeout(
    () => ac.abort(),
    opts.revalidateTimeoutMs ?? 3000,
  );
  let res: Response;
  try {
    res = await fetch(url, { headers, signal: ac.signal });
  } catch {
    clearTimeout(timer);
    return cachedResponse(cached, entry?.etag ?? null);
  }
  clearTimeout(timer);
  if (res.status === 304) {
    try {
      const meta = readMeta(dir);
      if (meta[name]) {
        meta[name]!.fetchedAt = Date.now();
        atomicWrite(join(dir, "meta.json"), JSON.stringify(meta));
      }
    } catch {
      /* best-effort freshness bookkeeping */
    }
    return cachedResponse(cached, entry?.etag ?? null);
  }
  if (res.ok) {
    const bytes = Buffer.from(await res.arrayBuffer());
    writeEntry(dir, name, bytes, res.headers.get("etag"));
    return cachedResponse(bytes, res.headers.get("etag"));
  }
  // Unexpected status (transient 5xx/429, or the file genuinely gone):
  // stale beats dead for an append-only catalogue.
  return cachedResponse(cached, entry?.etag ?? null);
}

/** Best-effort delete of one cached file + its meta entry. Used when a
 *  caller rejects the bytes as corrupt (e.g. parseSidecar's byte-length
 *  check failed on a cached pair) so the next process revalidates fresh
 *  instead of re-reading poison forever. Never throws. */
export function evictFromCache(baseUrl: string, filename: string): void {
  try {
    const dir = catalogueCacheDir(baseUrl.replace(/\/+$/, ""));
    if (!dir || !SAFE_NAME.test(filename)) return;
    rmSync(join(dir, filename), { force: true });
    const meta = readMeta(dir);
    if (delete meta[filename]) {
      atomicWrite(join(dir, "meta.json"), JSON.stringify(meta));
    }
  } catch {
    /* best-effort */
  }
}
