/**
 * Standalone stdio entry for the published `inspo-mcp` npm package
 * (`npx inspo-mcp`).
 *
 * Same 16 tools as the monorepo server (./server.ts), but the catalogue
 * is FETCHED from the CDN at startup rather than bundled - the build
 * (scripts/build-npm.mjs) aliases `@inspo/db/seed-source` to the edge
 * (null) variant, so the ~16MB seed never lands in the published bundle.
 * That keeps `npx inspo-mcp` a small, zero-config download.
 *
 * Config (all optional, set via your MCP client's `env` block):
 *   INSPO_CATALOGUE_URL  - override the catalogue CDN (defaults below)
 *   TOGETHER_API_KEY     - enables query-embedding semantic search;
 *                          without it, find_similar still works
 *                          (precomputed vectors) and search is lexical
 *
 * An MCP server speaks JSON-RPC over stdin/stdout and prints nothing on
 * its own, so a human running `npx inspo-mcp` in a terminal sees a dead
 * prompt. When stdin is a TTY (i.e. no client is piping us anything) we
 * print the install instructions instead of hanging silently; pass
 * --stdio to force the server anyway.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ensureCatalogue } from "@inspo/db";
import { registerTools, SERVER_INSTRUCTIONS } from "./tools";

// Replaced at build time (scripts/build-npm.mjs) with the published version.
declare const __INSPO_VERSION__: string;
const VERSION =
  typeof __INSPO_VERSION__ === "string" ? __INSPO_VERSION__ : "0.0.0-dev";

const HELP = `
  inspo-mcp v${VERSION}

  A curated archive of real website designs, served over MCP: search,
  study, components, palettes, flows and recommendations for coding
  agents that are about to write UI.

  This is an MCP server, not a CLI. It speaks JSON-RPC on stdin/stdout
  and is meant to be launched by an MCP client, not run by hand - which
  is why a bare \`npx inspo-mcp\` looks like it does nothing.

  Add it to a client:

    Claude Code   claude mcp add inspo -- npx -y inspo-mcp
    Codex         codex mcp add inspo -- npx -y inspo-mcp

    Cursor (~/.cursor/mcp.json) · Claude Desktop · VS Code:
      { "mcpServers": { "inspo": { "command": "npx", "args": ["-y", "inspo-mcp"] } } }

  Or skip the download entirely and use the hosted endpoint:

    claude mcp add --transport http inspo https://inspo-three.vercel.app/api/mcp

  Optional env: TOGETHER_API_KEY (query-embedding semantic search),
                INSPO_CATALOGUE_URL (self-hosted catalogue).

  Flags: --help  --version  --stdio (run the server even from a terminal)

  Docs: https://github.com/Nutlope/inspo/tree/main/apps/mcp
`;

const CATALOGUE_URL =
  process.env.INSPO_CATALOGUE_URL ??
  "https://0nme3pk5am3urwa9.public.blob.vercel-storage.com/catalogue";

async function main() {
  const argv = process.argv.slice(2);

  if (argv.includes("--version") || argv.includes("-v")) {
    console.log(VERSION);
    return;
  }

  // A client always pipes stdin; a TTY means a human typed the command.
  // Show them what to do rather than sitting mute on an open stdin.
  const interactive = process.stdin.isTTY && !argv.includes("--stdio");
  if (interactive || argv.includes("--help") || argv.includes("-h")) {
    console.log(HELP);
    return;
  }

  // Fetch + inject the catalogue (seed + embeddings) before serving.
  await ensureCatalogue(CATALOGUE_URL);

  const server = new McpServer(
    { name: "inspo", version: VERSION },
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
