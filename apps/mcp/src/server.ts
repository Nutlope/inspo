#!/usr/bin/env node
/**
 * Inspo MCP server — local stdio transport.
 *
 * For tool definitions see ./tools.ts (shared with the Cloudflare Worker
 * variant in ./worker.ts). For the full server story see /mcp.
 */

// Walk up from this file looking for a .env so the server picks up
// secrets (TOGETHER_API_KEY, BLOB_READ_WRITE_TOKEN, …) regardless of
// the cwd it was spawned from. Plain `dotenv/config` only reads ./.
import { config as loadEnv } from "dotenv";
import { existsSync as _envExists } from "node:fs";
import { dirname as _envDirname, resolve as _envResolve } from "node:path";
import { fileURLToPath as _envFileUrl } from "node:url";
{
  let dir = _envDirname(_envFileUrl(import.meta.url));
  for (let depth = 0; depth < 6; depth++) {
    const candidate = _envResolve(dir, ".env");
    if (_envExists(candidate)) {
      loadEnv({ path: candidate });
      break;
    }
    const parent = _envResolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
}
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools, SERVER_INSTRUCTIONS } from "./tools";

const server = new McpServer(
  { name: "inspo", version: "0.0.1" },
  { instructions: SERVER_INSTRUCTIONS },
);
registerTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("[inspo-mcp] fatal:", err);
  process.exit(1);
});
