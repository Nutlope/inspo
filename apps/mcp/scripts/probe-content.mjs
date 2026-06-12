/**
 * Dev utility: call one tool and print a summary of every content
 * block (type, mimeType, byte size) instead of the text payload.
 *
 *   node scripts/probe-content.mjs <tool> '<json-args>' [clientName] ['{"ENV":"..."}']
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
for (const [k, v] of Object.entries(JSON.parse(process.argv[5] || "{}"))) env[k] = v;

const t = new StdioClientTransport({
  command: resolve(root, "node_modules/.bin/tsx"),
  args: [resolve(root, "src/server.ts")],
  env,
});
const c = new Client({ name: process.argv[4] || "probe", version: "0.0.0" });
await c.connect(t);
const res = await c.callTool({
  name: process.argv[2],
  arguments: JSON.parse(process.argv[3] || "{}"),
});
for (const block of res.content) {
  if (block.type === "text") {
    console.log(`text  ${block.text.length} chars`);
  } else if (block.type === "image") {
    console.log(`image ${block.mimeType}  ${Math.round((block.data.length * 3) / 4 / 1024)} KB`);
  } else {
    console.log(block.type);
  }
}
console.log(`isError: ${res.isError ?? false}`);
await c.close();
