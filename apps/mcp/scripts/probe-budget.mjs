/**
 * Dev utility: call one tool and report what the response actually
 * spends - text chars/tokens, inline image count + KB, how many list
 * entries survived, and the budgetNote if a maxTokens cap trimmed it.
 * Complements probe-content.mjs, which reports block sizes only.
 *
 *   node scripts/probe-budget.mjs <tool> '<json-args>' [clientName] ['{"ENV":"..."}']
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

let textChars = 0;
let imgs = 0;
let imgKb = 0;
for (const b of res.content) {
  if (b.type === "text") textChars += b.text.length;
  else if (b.type === "image") {
    imgs++;
    imgKb += (b.data.length * 3) / 4 / 1024;
  }
}
const body = JSON.parse(res.content.find((b) => b.type === "text").text);
const list =
  body.results ?? body.exemplars ?? body.pages ?? body.screens ?? body.components ?? body.sites;
console.log(
  JSON.stringify(
    {
      textChars,
      approxTextTokens: Math.round(textChars / 4),
      images: imgs,
      imageKb: Math.round(imgKb),
      matched: body.count ?? null,
      returned: Array.isArray(list) ? list.length : null,
      budgetNote: body.budgetNote ?? null,
    },
    null,
    2,
  ),
);
await c.close();
process.exit(0);
