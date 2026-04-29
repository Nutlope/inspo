#!/usr/bin/env node
/**
 * Inspo MCP server — local stdio transport.
 *
 * For tool definitions see ./tools.ts (shared with the Cloudflare Worker
 * variant in ./worker.ts). For the Hallmark integration story see /mcp.
 */

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools, SERVER_INSTRUCTIONS } from "./tools.js";

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
