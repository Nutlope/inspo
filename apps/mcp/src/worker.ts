/**
 * Inspo MCP server - Cloudflare Worker entry, Streamable HTTP transport.
 *
 * Shape:
 *   POST /mcp   ←  bidirectional MCP messages (Streamable HTTP)
 *   GET  /mcp   ←  optional SSE upgrade (some clients use it)
 *   GET  /      ←  trivial OK so health-checks pass
 *
 * Auth: optional `Authorization: Bearer inspo_<key>` - verified against
 * the api_keys table. Without auth we currently accept the request to
 * keep onboarding simple; flip `ENFORCE_AUTH=1` once the catalogue has
 * paywalled tiers.
 *
 * Catalogue data: the curated archive is the static seed. The Worker
 * can't bundle the ~16MB seed (Cloudflare script-size cap), so on the
 * first request per isolate it FETCHES the catalogue + embeddings from
 * the CDN (`INSPO_CATALOGUE_URL`) and injects them into @inspo/db via
 * `ensureCatalogue()`. The workerd build of `@inspo/db/seed-source`
 * exports null, so nothing is inlined. (Neon is only consulted if
 * DATABASE_URL is set AND INSPO_USE_DB=1 - off by default.)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { ensureCatalogue } from "@inspo/db";
import { registerTools, SERVER_INSTRUCTIONS } from "./tools";
import { optionsFromUrl } from "./http-handler";
import type { ImagesMode, Profile } from "./profile";
import { verifyApiKeyEdge } from "./auth-edge";

// Where the Worker fetches the catalogue from. Overridable per-env via
// `wrangler secret/var INSPO_CATALOGUE_URL`; defaults to the published
// Vercel Blob store. Re-run publish-catalogue-to-blob.ts after seed edits.
const DEFAULT_CATALOGUE_URL =
  "https://0nme3pk5am3urwa9.public.blob.vercel-storage.com/catalogue";

/** Cloudflare native rate-limit binding (configured in wrangler.toml).
 *  Optional so local dev and typecheck work without it bound. */
interface RateLimiter {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  DATABASE_URL?: string;
  INSPO_BASE_URL?: string;
  INSPO_CATALOGUE_URL?: string;
  ENFORCE_AUTH?: string;
  /** Default profile/images for every request (query params win). */
  INSPO_PROFILE?: string;
  INSPO_IMAGES?: string;
  /** Per-caller rate limiter for the /mcp route (free Workers binding). */
  MCP_LIMITER?: RateLimiter;
  /** Dev escape hatch: allow serving with no rate limiter bound (e.g.
   *  `wrangler dev`, which does not provision the native limiter). */
  ALLOW_NO_LIMITER?: string;
}

/** Reject JSON-RPC bodies larger than this before doing any work. */
const MAX_BODY_BYTES = 256 * 1024;

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Rate-limit key from the edge-trusted client IP only. IPv6 is folded
 *  to its /64 so one allocation can't mint unlimited buckets; the
 *  user-agent is deliberately NOT included (client-controlled, so
 *  rotating it would evade the limit). */
async function clientKey(request: Request): Promise<string> {
  let ip = request.headers.get("cf-connecting-ip") ?? "0";
  if (ip.includes(":")) ip = ip.split(":").slice(0, 4).join(":") + "::/64";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function bridgeEnv(env: Env) {
  // The query layer reads process.env. Workers have a globalThis.process
  // shim with an empty env; populate the keys we care about.
  const p = (globalThis as { process?: { env?: Record<string, string> } }).process;
  if (p && p.env) {
    if (env.DATABASE_URL) p.env.DATABASE_URL = env.DATABASE_URL;
    if (env.INSPO_BASE_URL) p.env.INSPO_BASE_URL = env.INSPO_BASE_URL;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      bridgeEnv(env);

      const url = new URL(request.url);

      // Health check
      if (request.method === "GET" && url.pathname === "/") {
        return new Response("inspo-mcp · POST /mcp\n", {
          status: 200,
          headers: { "content-type": "text/plain" },
        });
      }

      if (url.pathname !== "/mcp") {
        return new Response("Not found", { status: 404 });
      }

      // Reject oversized request bodies before doing any work.
      const cl = Number(request.headers.get("content-length"));
      if (Number.isFinite(cl) && cl > MAX_BODY_BYTES) {
        return jsonError(413, "request too large");
      }

      // Per-caller rate limit (free Workers binding, keyed on the client
      // IP). Keeps the open, unauthenticated endpoint abuse-resistant.
      if (env.MCP_LIMITER) {
        const key = await clientKey(request);
        const { success } = await env.MCP_LIMITER.limit({ key });
        if (!success) return jsonError(429, "rate limit exceeded, slow down");
      } else if (env.ENFORCE_AUTH !== "1" && env.ALLOW_NO_LIMITER !== "1") {
        // Fail closed: the limiter is the only abuse control on the open
        // path, so refuse to serve open + unlimited if it isn't bound.
        // Set ALLOW_NO_LIMITER=1 for local dev (wrangler dev has no
        // native limiter).
        return jsonError(503, "service unavailable");
      }

      // Auth: soft by default; flip ENFORCE_AUTH=1 to require it.
      const auth = request.headers.get("authorization") ?? "";
      const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      let userId: string | null = null;
      if (bearer) {
        const verified = await verifyApiKeyEdge(bearer);
        if (verified) userId = verified.userId;
      }
      if (env.ENFORCE_AUTH === "1" && !userId) {
        return jsonError(401, "unauthenticated: pass Authorization: Bearer inspo_...");
      }

      // Authoritative body cap: stream the request body through a byte
      // counter (the Content-Length check above is only a fast-path; a
      // chunked or lying Content-Length would otherwise slip past). Hand
      // the transport a Request reconstructed from the bounded bytes.
      let forwarded = request;
      if (request.method === "POST" && request.body) {
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
        forwarded = new Request(request.url, {
          method: request.method,
          headers,
          body,
        });
      }

      // The workerd build doesn't bundle the seed; fetch + inject the
      // catalogue (memoized once per isolate) before any tool runs.
      await ensureCatalogue(env.INSPO_CATALOGUE_URL ?? DEFAULT_CATALOGUE_URL);

      // Build a fresh server per request: isolated state, fits Workers'
      // model, cost is just function calls.
      const server = new McpServer(
        { name: "inspo", version: "0.0.1" },
        { instructions: SERVER_INSTRUCTIONS },
      );

      // Profile resolution for the hosted endpoint. Query params win,
      // then env, then default to the OSS-first lite + images=none: most
      // hosted callers are OSS-model harnesses, and clientInfo isn't
      // visible on the stateless HTTP transport so we cannot auto-detect
      // here. Vision clients opt up with ?profile=full&images=thumbs.
      const fromUrl = optionsFromUrl(url);
      const envProfile = env.INSPO_PROFILE?.toLowerCase();
      const envImages = env.INSPO_IMAGES?.toLowerCase();
      const profile: Profile =
        fromUrl.profile ??
        (envProfile === "lite" || envProfile === "full"
          ? (envProfile as Profile)
          : undefined) ??
        "lite";
      const images: ImagesMode =
        fromUrl.images ??
        (envImages === "none" || envImages === "thumbs"
          ? (envImages as ImagesMode)
          : undefined) ??
        "none";
      registerTools(server, { profile, images });

      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless
        enableJsonResponse: true,
      });
      await server.connect(transport);

      return await transport.handleRequest(forwarded);
    } catch (err) {
      // Log for observability (Cloudflare retains it once [observability]
      // is enabled in wrangler.toml) but never leak stack traces or
      // internals to the wire.
      console.error("[inspo-mcp] worker request failed:", err);
      return jsonError(500, "internal error");
    }
  },
};
