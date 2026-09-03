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
import { ensureCatalogue, ensureSidecarFromUrl } from "@inspo/db";
import { registerTools, SERVER_INSTRUCTIONS } from "./tools";
import { install } from "./install";

// Replaced at build time (scripts/build-npm.mjs) with the published version.
declare const __INSPO_VERSION__: string;
const VERSION =
  typeof __INSPO_VERSION__ === "string" ? __INSPO_VERSION__ : "0.0.0-dev";

const HELP = `
  inspo-mcp v${VERSION}

  A curated archive of real website designs, served over MCP: search,
  study, components, palettes, flows and recommendations for coding
  agents that are about to write UI.

  This is an MCP server, not a CLI. Run bare, it speaks JSON-RPC on
  stdin/stdout and waits for a client - which is why \`npx inspo-mcp\`
  on its own looks like it does nothing. To set it up, run:

    npx -y inspo-mcp install

  That detects your MCP clients (Claude Code, Codex, VS Code, Cursor,
  Windsurf, Claude Desktop, Zed) and writes the config for each.

    install --dry-run          show the plan, write nothing
    install --local            use local stdio instead of the hosted URL
    install --client cursor    target one client (repeatable)
    install -y                 skip the confirmation

  Prefer to wire it yourself? Every client takes one of these:

    url:      https://inspo-three.vercel.app/api/mcp
    command:  npx -y inspo-mcp

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

  if (argv[0] === "install" || argv[0] === "setup") {
    process.exitCode = await install(argv.slice(1), VERSION);
    return;
  }

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

  // Screens first, vectors after. A cold start used to pull 14MB and
  // sit on the initialize handshake for ~1.7s; the two embedding
  // sidecars are 11.6MB of that and only find_similar / recommend read
  // them. Fetch the catalogue alone (~2.3MB brotli), start serving, and
  // warm the vectors in the background - those two tools await this
  // promise, so nothing silently ranks on tag overlap instead.
  await ensureCatalogue(CATALOGUE_URL, { sidecars: false });
  const vectors = ensureSidecarFromUrl(CATALOGUE_URL).catch(() => false);

  const server = new McpServer(
    { name: "inspo", version: VERSION },
    { instructions: SERVER_INSTRUCTIONS },
  );
  registerTools(server, { awaitVectors: () => vectors });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("[inspo-mcp] fatal:", err);
  process.exit(1);
});
