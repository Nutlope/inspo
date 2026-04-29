#!/usr/bin/env node
// Bootstrap that loads the TS server via tsx so users can run
// `node /path/to/inspo-mcp.js` from their MCP client config without
// needing a build step. Production builds will swap this for compiled JS.
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
register("tsx/esm", pathToFileURL(__dirname + "/").href);

await import(pathToFileURL(resolve(__dirname, "../src/server.ts")).href);
