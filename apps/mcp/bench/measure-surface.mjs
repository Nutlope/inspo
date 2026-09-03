/**
 * What does merely CONNECTING to Inspo cost?
 *
 * The response-cost bench measures calls. This measures the bill an
 * agent pays before it makes any: the `instructions` string plus every
 * tool's description and JSON schema, all of which sit in the client's
 * system prompt for the whole session. It is the number to watch when
 * adding a tool or a filter - schemas are ~75% of it, because every
 * enum inlines its full vocabulary.
 *
 *   node --max-old-space-size=6144 bench/measure-surface.mjs
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const t = new StdioClientTransport({
  command: "npx", args: ["tsx", "src/server.ts"], cwd: process.cwd(),
  env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=6144" },
});
const c = new Client({ name: "measure", version: "1" }, { capabilities: {} });
await c.connect(t);
const ins = c.getInstructions?.() ?? "";
const { tools } = await c.listTools();
let d = 0, sc = 0;
for (const x of tools) { d += (x.description||"").length; sc += JSON.stringify(x.inputSchema||{}).length; }
const rows = tools.map(x => [x.name, (x.description||"").length, JSON.stringify(x.inputSchema||{}).length]).sort((a,b)=>(b[1]+b[2])-(a[1]+a[2]));
for (const [nm, dd, ss] of rows) console.log(String(dd).padStart(5), String(ss).padStart(6), String(Math.round((dd+ss)/4)).padStart(5), nm);
console.log(JSON.stringify({ instructionsChars: ins.length, instructionsTokens: Math.round(ins.length/4), tools: tools.length, descChars: d, schemaChars: sc, schemaTotalTokens: Math.round((d+sc)/4), alwaysOnTokens: Math.round((ins.length+d+sc)/4) }, null, 2));
await c.close(); process.exit(0);
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const t = new StdioClientTransport({
  command: "npx", args: ["tsx", "src/server.ts"], cwd: process.cwd(),
  env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=6144" },
});
const c = new Client({ name: "measure", version: "1" }, { capabilities: {} });
await c.connect(t);
const ins = c.getInstructions?.() ?? "";
const { tools } = await c.listTools();
let d = 0, sc = 0;
for (const x of tools) { d += (x.description||"").length; sc += JSON.stringify(x.inputSchema||{}).length; }
const rows = tools.map(x => [x.name, (x.description||"").length, JSON.stringify(x.inputSchema||{}).length]).sort((a,b)=>(b[1]+b[2])-(a[1]+a[2]));
for (const [nm, dd, ss] of rows) console.log(String(dd).padStart(5), String(ss).padStart(6), String(Math.round((dd+ss)/4)).padStart(5), nm);
console.log(JSON.stringify({ instructionsChars: ins.length, instructionsTokens: Math.round(ins.length/4), tools: tools.length, descChars: d, schemaChars: sc, schemaTotalTokens: Math.round((d+sc)/4), alwaysOnTokens: Math.round((ins.length+d+sc)/4) }, null, 2));
await c.close(); process.exit(0);
