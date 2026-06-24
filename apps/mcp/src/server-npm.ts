/**
 * Standalone stdio entry for the published `inspo-mcp` npm package
 * (`npx inspo-mcp`).
 *
 * Same 16 tools as the monorepo server (./server.ts), but the catalogue
 * is FETCHED from the CDN at startup rather than bundled — the build
 * (scripts/build-npm.mjs) aliases `@inspo/db/seed-source` to the edge
 * (null) variant, so the ~16MB seed never lands in the published bundle.
 * That keeps `npx inspo-mcp` a small, zero-config download.
 *
 * Config (all optional, set via your MCP client's `env` block):
 *   INSPO_CATALOGUE_URL  — override the catalogue CDN (defaults below)
 *   TOGETHER_API_KEY     — enables query-embedding semantic search;
 *                          without it, find_similar still works
 *                          (precomputed vectors) and search is lexical
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ensureCatalogue } from "@inspo/db";
import { registerTools, SERVER_INSTRUCTIONS } from "./tools";

const CATALOGUE_URL =
  process.env.INSPO_CATALOGUE_URL ??
  "https://0nme3pk5am3urwa9.public.blob.vercel-storage.com/catalogue";

async function main() {
  // Fetch + inject the catalogue (seed + embeddings) before serving.
  await ensureCatalogue(CATALOGUE_URL);

  const server = new McpServer(
    { name: "inspo", version: "0.0.1" },
    { instructions: SERVER_INSTRUCTIONS },
  );
  registerTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("[inspo-mcp] fatal:", err);
  process.exit(1);
});
