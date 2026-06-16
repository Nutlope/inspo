/**
 * Build the publishable `inspo-mcp` npm package.
 *
 * Bundles the stdio server (src/server-npm.ts) + all its workspace deps
 * (@inspo/db query layer, tools, MCP SDK) into a single self-contained
 * ESM file — EXCEPT the ~16MB catalogue seed, which the server fetches
 * from the CDN at runtime. The published artifact is `dist/`:
 *
 *   dist/inspo-mcp.mjs   the bundle (with shebang, executable bin)
 *   dist/package.json    a clean, dependency-free manifest
 *   dist/README.md
 *
 * Publish with:  cd apps/mcp/dist && npm publish   (needs npm auth)
 * Test locally:  node apps/mcp/dist/inspo-mcp.mjs   (speaks MCP on stdio)
 */

import { build } from "esbuild";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MCP_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(MCP_ROOT, "..", "..");
const OUT_DIR = resolve(MCP_ROOT, "dist");
const OUT_FILE = resolve(OUT_DIR, "inspo-mcp.mjs");

const VERSION = "0.1.0";

mkdirSync(OUT_DIR, { recursive: true });

const result = await build({
  entryPoints: [resolve(MCP_ROOT, "src/server-npm.ts")],
  outfile: OUT_FILE,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  banner: { js: "#!/usr/bin/env node" },
  // Some deps reference `require`; provide a shim so the ESM bundle can
  // resolve their internal CommonJS interop.
  define: { "import.meta.vitest": "undefined" },
  alias: {
    // Don't bundle the 16MB seed — the standalone server fetches the
    // catalogue from the CDN at runtime. Force the edge (null) variant.
    "@inspo/db/seed-source": resolve(
      REPO_ROOT,
      "packages/db/src/seed-source.edge.ts",
    ),
  },
  metafile: true,
  logLevel: "info",
});

chmodSync(OUT_FILE, 0o755);

writeFileSync(
  resolve(OUT_DIR, "package.json"),
  `${JSON.stringify(
    {
      name: "inspo-mcp",
      version: VERSION,
      description:
        "A curated archive of real website designs, served as an MCP server: 14 tools for search, study, components, palettes, and recommendations.",
      type: "module",
      bin: { "inspo-mcp": "inspo-mcp.mjs" },
      files: ["inspo-mcp.mjs", "README.md"],
      engines: { node: ">=18" },
      keywords: [
        "mcp",
        "model-context-protocol",
        "design",
        "inspiration",
        "ui",
        "ux",
        "claude",
        "cursor",
      ],
      repository: {
        type: "git",
        url: "git+https://github.com/Luffixos/inspo.git",
        directory: "apps/mcp",
      },
      homepage: "https://github.com/Luffixos/inspo#readme",
      bugs: { url: "https://github.com/Luffixos/inspo/issues" },
      license: "MIT",
    },
    null,
    2,
  )}\n`,
);

copyFileSync(resolve(MCP_ROOT, "README.md"), resolve(OUT_DIR, "README.md"));

// Report the bundle size from the metafile.
const bytes = Object.values(result.metafile.outputs).reduce(
  (n, o) => n + o.bytes,
  0,
);
console.log(
  `\n  built dist/inspo-mcp.mjs (${(bytes / 1024).toFixed(0)} KB) + package.json + README`,
);
console.log("  publish:  cd apps/mcp/dist && npm publish\n");
