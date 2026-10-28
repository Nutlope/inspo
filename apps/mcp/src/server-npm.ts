/**
 * Standalone stdio entry for the published `inspo-mcp` npm package
 * (`npx inspo-mcp`).
 *
 * Same 15 tools as the monorepo server (./server.ts), but the catalogue
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
import { ensureCatalogue, ensureSiteSidecarFromUrl, ensureRowSidecarFromUrl } from "@inspo/db";
import { registerTools, SERVER_INSTRUCTIONS } from "./tools";
import { install } from "./install";
// Replaced at build time (scripts/build-npm.mjs) with the published version.
import { SERVER_VERSION as VERSION } from "./version";

const HELP = `
  inspo-mcp v${VERSION}

  A curated archive of real website designs, served over MCP: search,
  design systems, components, palettes, page flows and recommendations
  for coding agents that are about to write UI.

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

    url:      https://inspomcp.dev/api/mcp
    command:  npx -y inspo-mcp

  Optional env: TOGETHER_API_KEY (query-embedding semantic search),
                INSPO_CATALOGUE_URL (self-hosted catalogue),
                INSPO_PROFILE=lite|full, INSPO_IMAGES=thumbs|none,
                INSPO_MAX_TOKENS (per-response token ceiling),
                INSPO_CACHE_DIR (catalogue disk cache location;
                INSPO_CATALOGUE_CACHE=0 disables caching).

  Flags: --help  --version  --stdio (run the server even from a terminal)

  Docs: https://github.com/Nutlope/inspo/tree/main/apps/mcp
`;

const CATALOGUE_URL =
  process.env.INSPO_CATALOGUE_URL ??
  "https://0nme3pk5am3urwa9.public.blob.vercel-storage.com/catalogue";

/* Sent on every catalogue request. Meaningless to the blob CDN today
 * (no request logs), but it costs nothing and makes per-version
 * attribution possible if the catalogue ever moves to a host with
 * analytics. */
const USER_AGENT = `inspo-mcp/${VERSION}`;

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

  // Screens first, vectors after — and every fetch through the
  // persistent disk cache (packages/db/src/catalogue-cache.ts): after
  // the first run on a machine, startup revalidates with
  // If-None-Match and an unchanged catalogue costs ~1KB of 304s
  // instead of another ~14MB. That re-download was ~95% of the blob
  // store's transfer bill (~$200/mo) at ~12K client starts/day.
  //
  // Split per sidecar so search_screens (site sidecar, 3.3MB) is warm
  // by the first search, while the row sidecar (9.1MB, read ONLY by
  // find_similar) goes fully lazy: a session that never runs
  // find_similar never downloads 63% of the bytes.
  await ensureCatalogue(CATALOGUE_URL, {
    sidecars: false,
    userAgent: USER_AGENT,
  });
  const siteVectors = ensureSiteSidecarFromUrl(CATALOGUE_URL, {
    userAgent: USER_AGENT,
  }).catch(() => false);

  const server = new McpServer(
    { name: "inspo", version: VERSION },
    { instructions: SERVER_INSTRUCTIONS },
  );
  registerTools(server, {
    awaitSiteVectors: () => siteVectors,
    awaitVectors: () =>
      ensureRowSidecarFromUrl(CATALOGUE_URL, {
        userAgent: USER_AGENT,
      }).catch(() => false),
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("[inspo-mcp] fatal:", err);
  process.exit(1);
});
