/**
 * Stdio smoke test — boots the MCP server in-process and exercises every
 * tool. Reports a one-line PASS/FAIL per tool. Use `pnpm test:mcp`.
 */

import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverEntry = resolve(__dirname, "server.ts");
const tsxBin = resolve(__dirname, "../node_modules/.bin/tsx");

async function main() {
  const transport = new StdioClientTransport({
    command: tsxBin,
    args: [serverEntry],
  });
  const client = new Client({ name: "smoke", version: "0.0.0" });
  await client.connect(transport);

  const tools = await client.listTools();
  console.log(`tools (${tools.tools.length}):`, tools.tools.map((t) => t.name).join(", "));

  const cases: { name: string; args: Record<string, unknown> }[] = [
    { name: "search_screens", args: { query: "dark editorial agency", limit: 3 } },
    { name: "search_screens", args: { query: "", macrostructure: "bento-grid", limit: 5 } },
    { name: "get_screen", args: { slug: "atelier-mira" } },
    { name: "find_similar", args: { slug: "compass-bento", limit: 3 } },
    { name: "find_examples_for_macrostructure", args: { name: "Bento Grid" } },
    { name: "find_examples_for_macrostructure", args: { name: "specimen", limit: 2 } },
    { name: "list_collections", args: {} },
    { name: "get_collection", args: { slug: "editorial-layouts" } },
    { name: "get_screen", args: { slug: "missing-slug" } }, // expected error path
    { name: "find_examples_for_macrostructure", args: { name: "not-a-real-thing" } }, // expected error path
  ];

  let pass = 0,
    fail = 0;
  for (const c of cases) {
    process.stdout.write(`  • ${c.name}(${JSON.stringify(c.args)}) `);
    try {
      const res = await client.callTool({ name: c.name, arguments: c.args });
      const text = (res.content as Array<{ type: string; text?: string }>)[0]?.text ?? "";
      const obj = text ? JSON.parse(text) : {};
      const summary =
        "count" in obj
          ? `count=${obj.count}`
          : "results" in obj
          ? `results=${(obj.results as unknown[])?.length ?? "?"}`
          : "error" in obj
          ? `error=${(obj.error as string).slice(0, 50)}`
          : Object.keys(obj).slice(0, 4).join(",");
      console.log(`✓ ${summary}`);
      pass++;
    } catch (err) {
      console.log(`✗ ${err instanceof Error ? err.message : String(err)}`);
      fail++;
    }
  }

  console.log(`\n  ${pass} pass · ${fail} fail`);
  await client.close();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
