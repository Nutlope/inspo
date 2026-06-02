/**
 * Inspo MCP server — Cloudflare Worker entry, Streamable HTTP transport.
 *
 * Shape:
 *   POST /mcp   ←  bidirectional MCP messages (Streamable HTTP)
 *   GET  /mcp   ←  optional SSE upgrade (some clients use it)
 *   GET  /      ←  trivial OK so health-checks pass
 *
 * Auth: optional `Authorization: Bearer inspo_<key>` — verified against
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
 * DATABASE_URL is set AND INSPO_USE_DB=1 — off by default.)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { ensureCatalogue } from "@inspo/db";
import { registerTools, SERVER_INSTRUCTIONS } from "./tools.js";
import { verifyApiKeyEdge } from "./auth-edge.js";

// Where the Worker fetches the catalogue from. Overridable per-env via
// `wrangler secret/var INSPO_CATALOGUE_URL`; defaults to the published
// Vercel Blob store. Re-run publish-catalogue-to-blob.ts after seed edits.
const DEFAULT_CATALOGUE_URL =
  "https://0nme3pk5am3urwa9.public.blob.vercel-storage.com/catalogue";

export interface Env {
  DATABASE_URL?: string;
  INSPO_BASE_URL?: string;
  INSPO_CATALOGUE_URL?: string;
  ENFORCE_AUTH?: string;
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

    // Auth — soft for now; flip ENFORCE_AUTH=1 to make required.
    const auth = request.headers.get("authorization") ?? "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    let userId: string | null = null;
    if (bearer) {
      const verified = await verifyApiKeyEdge(bearer);
      if (verified) userId = verified.userId;
    }
    if (env.ENFORCE_AUTH === "1" && !userId) {
      return new Response(
        JSON.stringify({ error: "unauthenticated — pass `Authorization: Bearer inspo_…`" }),
        { status: 401, headers: { "content-type": "application/json" } },
      );
    }

    // The workerd build doesn't bundle the seed — fetch + inject the
    // catalogue (memoized: once per isolate) before any tool runs.
    await ensureCatalogue(env.INSPO_CATALOGUE_URL ?? DEFAULT_CATALOGUE_URL);

    // Build a fresh server per request — keeps state isolated and fits
    // Workers' execution model. The cost is negligible since registration
    // is just function calls.
    const server = new McpServer(
      { name: "inspo", version: "0.0.1" },
      { instructions: SERVER_INSTRUCTIONS },
    );
    registerTools(server);

    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
      enableJsonResponse: true,
    });
    await server.connect(transport);

    return await transport.handleRequest(request);
  },
};
