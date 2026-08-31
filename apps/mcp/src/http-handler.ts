/**
 * Shared Streamable-HTTP MCP request handler.
 *
 * One stateless handler for the hosted HTTP transport: the Vercel/Next
 * route (`apps/web/src/app/api/mcp/route.ts`). Keeping it here means the
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
import { parseBudget } from "./budget";

/** Stateless HTTP never sees the client's initialize on the instance
 *  serving tools/list, so clientInfo auto-detection can't apply here.
 *  Remote callers opt into the OSS profile via query params instead:
 *  `…/mcp?profile=lite&images=none`. */
export function optionsFromUrl(url: URL): RegisterOptions {
  const p = url.searchParams.get("profile")?.toLowerCase();
  const i = url.searchParams.get("images")?.toLowerCase();
  const t = parseBudget(url.searchParams.get("maxTokens") ?? undefined);
  return {
    ...(p === "lite" || p === "full" ? { profile: p as Profile } : {}),
    ...(i === "none" || i === "thumbs" ? { images: i as ImagesMode } : {}),
    ...(t ? { maxTokens: t } : {}),
  };
}

export async function handleMcpRequest(
  request: Request,
  extra?: Pick<RegisterOptions, "onToolCall">,
): Promise<Response> {
  const server = new McpServer(
    { name: "inspo", version: "0.0.1" },
    { instructions: SERVER_INSTRUCTIONS },
  );
  // OSS-first hosted default, mirroring the Worker: query > env >
  // lite + images=none. clientInfo isn't visible on the stateless HTTP
  // transport, and most hosted callers are OSS-model harnesses; vision
  // clients opt up with ?profile=full&images=thumbs.
  const fromUrl = optionsFromUrl(new URL(request.url));
  const envProfile = process.env.INSPO_PROFILE?.toLowerCase();
  const envImages = process.env.INSPO_IMAGES?.toLowerCase();
  const profile: Profile =
    fromUrl.profile ??
    (envProfile === "lite" || envProfile === "full" ? (envProfile as Profile) : undefined) ??
    "lite";
  const images: ImagesMode =
    fromUrl.images ??
    (envImages === "none" || envImages === "thumbs" ? (envImages as ImagesMode) : undefined) ??
    "none";
  registerTools(server, {
    profile,
    images,
    maxTokens: fromUrl.maxTokens,
    onToolCall: extra?.onToolCall,
  });

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}
