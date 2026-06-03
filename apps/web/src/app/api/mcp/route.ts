/**
 * Hosted MCP endpoint — Vercel-friendly.
 *
 * Serves the same Streamable-HTTP MCP as the Cloudflare Worker, but as a
 * Next.js Route Handler so it ships on the existing Vercel deployment —
 * no Cloudflare account needed. Point an MCP client at:
 *
 *   https://<your-domain>/api/mcp
 *
 * Data: the catalogue is the static seed bundled into the web build, so
 * it's always in sync with the deploy (no fetch). The embedding sidecar
 * (`embeddings.bin`) isn't bundled, so we fetch it from the CDN once per
 * lambda — best-effort — to power the vector tools (find_similar /
 * recommend). If that fetch fails, search still works lexically.
 */

import { handleMcpRequest } from "@inspo/mcp/http";
import { ensureSidecarFromUrl } from "@inspo/db";

// The MCP server uses the Node-only Together/Neon SDKs; pin the Node
// runtime. Dynamic (never cached) — every call is a fresh JSON-RPC.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CATALOGUE_URL =
  process.env.INSPO_CATALOGUE_URL ??
  "https://0nme3pk5am3urwa9.public.blob.vercel-storage.com/catalogue";

async function handle(request: Request): Promise<Response> {
  await ensureSidecarFromUrl(CATALOGUE_URL).catch(() => {});
  return handleMcpRequest(request);
}

export async function POST(request: Request): Promise<Response> {
  return handle(request);
}

export async function GET(request: Request): Promise<Response> {
  return handle(request);
}
