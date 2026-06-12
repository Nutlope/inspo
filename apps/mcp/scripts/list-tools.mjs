/**
 * Dev utility: boot the stdio server, print the tools/list payload.
 *
 *   node scripts/list-tools.mjs [clientName] ['{"INSPO_PROFILE":"lite"}'] [toolName]
 *
 * clientName is sent as the MCP clientInfo.name so you can exercise the
 * client auto-detection (e.g. "kimi-cli", "opencode", "claude-code").
 * The optional JSON second arg is merged into the child server's env.
 * With a third arg, prints that tool's full inputSchema instead of the
 * summary.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const [k, v] of Object.entries(process.env)) {
  if (k === "DATABASE_URL") continue;
  if (typeof v === "string") env[k] = v;
}
for (const [k, v] of Object.entries(JSON.parse(process.argv[3] || "{}"))) env[k] = v;

const t = new StdioClientTransport({
  command: resolve(root, "node_modules/.bin/tsx"),
  args: [resolve(root, "src/server.ts")],
  env,
});
const c = new Client({ name: process.argv[2] || "schema-dump", version: "0.0.0" });
await c.connect(t);
const { tools } = await c.listTools();
console.log(
  JSON.stringify(
    { count: tools.length, names: tools.map((x) => x.name), totalChars: JSON.stringify(tools).length },
    null,
    1,
  ),
);
const pick = process.argv[4];
if (pick) {
  console.log(JSON.stringify(tools.find((x) => x.name === pick)?.inputSchema, null, 1));
}
await c.close();
