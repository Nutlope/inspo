/**
 * Shared Streamable-HTTP MCP request handler.
 *
 * One stateless handler reused by every HTTP host: the Cloudflare
 * Worker (`worker.ts`) and the Vercel/Next route
 * (`apps/web/src/app/api/mcp/route.ts`). Keeping it here means the
 * transport wiring lives next to the tools, and web only needs to
 * depend on `@inspo/mcp` (not the MCP SDK directly).
 *
 * Stateless by design: a fresh `McpServer` + transport per request,
 * which fits both the Workers execution model and serverless lambdas.
 * Registration is just function calls, so the per-request cost is
 * negligible.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { registerTools, SERVER_INSTRUCTIONS } from "./tools";
import type { ImagesMode, Profile, RegisterOptions } from "./profile";

/** Stateless HTTP never sees the client's initialize on the instance
 *  serving tools/list, so clientInfo auto-detection can't apply here.
 *  Remote callers opt into the OSS profile via query params instead:
 *  `…/mcp?profile=lite&images=none`. */
export function optionsFromUrl(url: URL): RegisterOptions {
  const p = url.searchParams.get("profile")?.toLowerCase();
  const i = url.searchParams.get("images")?.toLowerCase();
  return {
    ...(p === "lite" || p === "full" ? { profile: p as Profile } : {}),
    ...(i === "none" || i === "thumbs" ? { images: i as ImagesMode } : {}),
  };
}

export async function handleMcpRequest(request: Request): Promise<Response> {
  const server = new McpServer(
    { name: "inspo", version: "0.0.1" },
    { instructions: SERVER_INSTRUCTIONS },
  );
  registerTools(server, optionsFromUrl(new URL(request.url)));

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}
