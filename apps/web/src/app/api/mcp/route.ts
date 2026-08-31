/**
 * Hosted MCP endpoint - Vercel-friendly.
 *
 * Serves the same Streamable-HTTP MCP as the Cloudflare Worker, but as a
 * Next.js Route Handler so it ships on the existing Vercel deployment -
 * no Cloudflare account needed. Point an MCP client at:
 *
 *   https://<your-domain>/api/mcp
 *
 * Data: the catalogue is the static seed bundled into the web build, so
 * it's always in sync with the deploy (no fetch). The embedding sidecar
 * (`embeddings.bin`) isn't bundled, so we fetch it from the CDN once per
 * lambda - best-effort - to power the vector tools (find_similar /
 * recommend). If that fetch fails, search still works lexically.
 */

import { handleMcpRequest } from "@inspo/mcp/http";
import { ensureSidecarFromUrl } from "@inspo/db";

// The MCP server uses the Node-only Together/Neon SDKs; pin the Node
// runtime. Dynamic (never cached) - every call is a fresh JSON-RPC.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CATALOGUE_URL =
  process.env.INSPO_CATALOGUE_URL ??
  "https://0nme3pk5am3urwa9.public.blob.vercel-storage.com/catalogue";

/** Reject JSON-RPC bodies larger than this before doing any work.
 *  Mirrors the cap the Cloudflare Worker enforced. */
const MAX_BODY_BYTES = 256 * 1024;

/** Per-caller sliding-window rate limit, in memory. Per lambda instance,
 *  so it is a soft brake rather than a hard fence (Vercel WAF rules are
 *  the account-level fence); still enough to stop a single caller from
 *  hammering one warm instance. IPv6 folds to its /64 so one allocation
 *  cannot mint unlimited buckets. */
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function rateLimited(request: Request): boolean {
  let ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0";
  if (ip.includes(":")) ip = ip.split(":").slice(0, 4).join(":") + "::/64";
  const now = Date.now();
  const seen = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  seen.push(now);
  hits.set(ip, seen);
  if (hits.size > 10_000) hits.clear();
  return seen.length > RATE_LIMIT;
}

function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

async function handle(request: Request): Promise<Response> {
  if (rateLimited(request)) {
    return jsonError(429, "rate limit exceeded, slow down");
  }

  // Authoritative body cap: buffer the body through a byte counter (a
  // chunked or lying Content-Length would slip past a header check) and
  // hand the transport a Request rebuilt from the bounded bytes.
  if (request.method === "POST" && request.body) {
    const cl = Number(request.headers.get("content-length"));
    if (Number.isFinite(cl) && cl > MAX_BODY_BYTES) {
      return jsonError(413, "request too large");
    }
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => {});
        return jsonError(413, "request too large");
      }
      chunks.push(value);
    }
    const body = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
      body.set(c, off);
      off += c.byteLength;
    }
    const headers = new Headers(request.headers);
    headers.delete("content-length");
    request = new Request(request.url, { method: request.method, headers, body });
  }

  await ensureSidecarFromUrl(CATALOGUE_URL).catch(() => {});
  return handleMcpRequest(request, {
    // One structured log line per tool call, visible in Vercel logs.
    // Nothing is stored: no IPs, no query text, just tool/ok/duration.
    // (The Cloudflare Worker path writes the same shape to Analytics
    // Engine; the searchLogs table stays unused on purpose - writing
    // Neon from an unauthenticated hot path would add latency and a
    // query-text store we do not want.)
    onToolCall: (m) =>
      console.log(
        JSON.stringify({ evt: "mcp_tool", tool: m.tool, ok: m.ok, ms: m.ms }),
      ),
  });
}

async function safely(request: Request): Promise<Response> {
  try {
    return await handle(request);
  } catch (err) {
    // Log for Vercel observability, never leak internals to the wire.
    console.error("[inspo-mcp] request failed:", err);
    return jsonError(500, "internal error");
  }
}

export async function POST(request: Request): Promise<Response> {
  return safely(request);
}

export async function GET(request: Request): Promise<Response> {
  return safely(request);
}
