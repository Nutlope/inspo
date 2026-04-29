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
 * Database access: Neon HTTP driver (works inside the fetch runtime).
 * The query layer in @inspo/db reads `process.env.DATABASE_URL`, so we
 * mirror the binding from Cloudflare's `env.DATABASE_URL` into globalThis
 * before any tool handler runs.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { registerTools, SERVER_INSTRUCTIONS } from "./tools.js";
import { verifyApiKeyEdge } from "./auth-edge.js";

export interface Env {
  DATABASE_URL?: string;
  INSPO_BASE_URL?: string;
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
