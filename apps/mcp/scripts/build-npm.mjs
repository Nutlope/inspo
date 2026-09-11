/**
 * Build the publishable `inspo-mcp` npm package.
 *
 * Bundles the stdio server (src/server-npm.ts) + all its workspace deps
 * (@inspo/db query layer, tools, MCP SDK) into a single self-contained
 * ESM file, EXCEPT the ~16MB catalogue seed, which the server fetches
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
import { createHash } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MCP_ROOT = resolve(__dirname, "..");
const REPO_ROOT = resolve(MCP_ROOT, "..", "..");
const OUT_DIR = resolve(MCP_ROOT, "dist");
const OUT_FILE = resolve(OUT_DIR, "inspo-mcp.mjs");

// Bump before every publish: npm refuses to overwrite a published
// version, and this constant is the only place it is set.
const VERSION = "0.1.14";

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
  define: {
    "import.meta.vitest": "undefined",
    // The CLI reports this in --version and as the MCP serverInfo version.
    __INSPO_VERSION__: JSON.stringify(VERSION),
  },
  alias: {
    // Don't bundle the 16MB seed: the standalone server fetches the
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
        "A curated archive of real website designs, served as an MCP server: 15 tools for search, design systems, palettes, reference components, site page flows, and recommendations.",
      // Ties the npm package to the MCP registry entry
      // (apps/mcp/server.json); the registry validates ownership
      // through this field at `mcp-publisher publish` time.
      mcpName: "io.github.nutlope/inspo",
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
        url: "git+https://github.com/Nutlope/inspo.git",
        directory: "apps/mcp",
      },
      homepage: "https://github.com/Nutlope/inspo#readme",
      bugs: { url: "https://github.com/Nutlope/inspo/issues" },
      license: "MIT",
    },
    null,
    2,
  )}\n`,
);

copyFileSync(resolve(MCP_ROOT, "README.md"), resolve(OUT_DIR, "README.md"));

// Guard against publishing a stale dist. 0.1.10 shipped a bundle built
// BEFORE the installer landed - it passed every eyeball check because
// the version string was already bumped, and `npx inspo-mcp install`
// silently did nothing in production. Assert the surface is present,
// and print a hash so the published tarball can be diffed against this
// build (`pnpm verify:npm`).
const bundle = readFileSync(OUT_FILE, "utf8");
const REQUIRED = ["Will configure", "npx -y inspo-mcp install", "inspo-backup"];
const missing = REQUIRED.filter((m) => !bundle.includes(m));
if (missing.length) {
  console.error(`\n  BUILD IS STALE - bundle is missing: ${missing.join(", ")}`);
  process.exit(1);
}
const sha = createHash("sha256").update(bundle).digest("hex").slice(0, 12);

// Report the bundle size from the metafile.
const bytes = Object.values(result.metafile.outputs).reduce(
  (n, o) => n + o.bytes,
  0,
);
console.log(
  `\n  built dist/inspo-mcp.mjs  v${VERSION}  ${(bytes / 1024).toFixed(0)} KB  sha256:${sha}`,
);
console.log("  publish:  cd apps/mcp/dist && npm publish");
console.log("  then:     pnpm --filter @inspo/mcp verify:npm\n");
