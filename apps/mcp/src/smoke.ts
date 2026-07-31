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

  type Case = {
    name: string;
    args: Record<string, unknown>;
    /** Optional assertion on the parsed JSON payload; return a string to fail. */
    expect?: (obj: Record<string, unknown>) => string | null;
  };
  const noError = (obj: Record<string, unknown>) =>
    "error" in obj ? `unexpected error: ${obj.error}` : null;
  const cases: Case[] = [
    { name: "search_screens", args: { query: "dark editorial agency", limit: 3 }, expect: noError },
    { name: "search_screens", args: { query: "", macrostructure: "bento-grid", limit: 5 }, expect: noError },
    { name: "get_screen", args: { slug: "novu-co" }, expect: noError },
    { name: "find_similar", args: { slug: "novu-co", limit: 3 }, expect: noError },
    {
      name: "find_examples_for_macrostructure",
      args: { name: "Bento Grid" },
      // Exemplar lists must never repeat a site (--archive twins).
      expect: (obj) => {
        const results = (obj.results as Array<{ slug: string }> | undefined) ?? [];
        if (results.length === 0) return "no exemplars";
        const bases = results.map((r) => r.slug.replace(/--archive.*$/, ""));
        return new Set(bases).size === bases.length ? null : "duplicate site in exemplars";
      },
    },
    { name: "find_examples_for_macrostructure", args: { name: "specimen", limit: 2 }, expect: noError },
    { name: "list_collections", args: {} },
    {
      name: "get_collection",
      args: { slug: "editorial-layouts" },
      // The bug this guards: curated slugs drifting out of the catalogue
      // used to silently produce an empty issue.
      expect: (obj) =>
        Array.isArray(obj.screens) && obj.screens.length > 0
          ? null
          : "collection resolved to 0 screens",
    },
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
      const failure = c.expect ? c.expect(obj) : null;
      if (failure) {
        console.log(`✗ ${failure}`);
        fail++;
        continue;
      }
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
