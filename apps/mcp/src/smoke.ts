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
    {
      name: "find_similar",
      args: { slug: "novu-co", limit: 5 },
      // Both ranking paths must dedupe by site and report their method.
      expect: (obj) => {
        if (obj.method !== "embedding" && obj.method !== "tags")
          return `bad method: ${obj.method}`;
        const results = (obj.results as Array<{ slug: string }>) ?? [];
        if (results.length === 0) return "no results";
        const sites = results.map((r) => r.slug.split("--")[0]);
        return new Set(sites).size === sites.length
          ? null
          : "duplicate site among similar results";
      },
    },
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
    {
      name: "search_screens",
      args: { query: "", device: "mobile", limit: 3 },
      // device=mobile must only surface rows with a mobile capture pair.
      expect: (obj) => {
        const results = (obj.results as Array<{ mobile?: string }>) ?? [];
        if (results.length === 0) return "no mobile results";
        return results.every((r) => typeof r.mobile === "string")
          ? null
          : "result without mobile url leaked through device filter";
      },
    },
    {
      name: "get_filters",
      args: {},
      expect: (obj) =>
        Array.isArray(obj.device) && (obj.device as string[]).includes("mobile")
          ? null
          : "get_filters missing device values",
    },
    {
      name: "get_site_pages",
      args: {},
      // Zero-arg directory mode: flow-capable sites (3+ pages).
      expect: (obj) => {
        if (obj.mode !== "directory") return "expected directory mode";
        const sites = (obj.sites as Array<{ pageCount: number }>) ?? [];
        if (sites.length < 10) return `directory too small: ${sites.length}`;
        return sites.every((s) => s.pageCount >= 3)
          ? null
          : "directory contains a site with fewer than 3 pages";
      },
    },
    {
      name: "get_site_pages",
      args: { siteSlug: "linear-app" },
      expect: (obj) => {
        const pages = (obj.pages as Array<{ step?: number }>) ?? [];
        if (pages.length === 0) return "no pages";
        if (typeof obj.sequence !== "string") return "missing sequence";
        return pages.every((p, i) => p.step === i + 1)
          ? null
          : "pages missing 1-based step numbers";
      },
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
