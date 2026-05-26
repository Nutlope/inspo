/**
 * One-shot MCP client. Boots the real inspo MCP server over stdio,
 * calls a single tool with JSON args, prints the tool's text result,
 * and exits. This is the faithful way for an external agent to consult
 * the MCP — identical code path to a real client (search_screens,
 * find_examples_for_macrostructure, get_design_system, …).
 *
 *   tsx src/call.ts <tool> '<json-args>'
 *
 * Examples:
 *   tsx src/call.ts search_screens '{"query":"calm wellness app","limit":6}'
 *   tsx src/call.ts find_examples_for_macrostructure '{"name":"Bento Grid","limit":4}'
 *   tsx src/call.ts get_screen '{"slug":"linear-app"}'
 *
 * Runs the server with DATABASE_URL stripped so it serves the bundled
 * static seed (which is what self-hosters / the offline fallback use).
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverEntry = resolve(__dirname, "server.ts");
const tsxBin = resolve(__dirname, "../node_modules/.bin/tsx");

async function main() {
  const tool = process.argv[2];
  const argsRaw = process.argv[3] ?? "{}";
  if (!tool) {
    console.error(
      "usage: tsx src/call.ts <tool> '<json-args>'\n" +
        "tools: search_screens, get_screen, get_design_system, find_similar,\n" +
        "       find_examples_for_macrostructure, find_components,\n" +
        "       list_collections, get_collection",
    );
    process.exit(2);
  }
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(argsRaw);
  } catch {
    console.error(`invalid JSON args: ${argsRaw}`);
    process.exit(2);
  }

  // Strip DATABASE_URL so the server uses the bundled static seed.
  const childEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k === "DATABASE_URL") continue;
    if (typeof v === "string") childEnv[k] = v;
  }

  const transport = new StdioClientTransport({
    command: tsxBin,
    args: [serverEntry],
    env: childEnv,
  });
  const client = new Client({ name: "inspo-call", version: "0.0.0" });
  await client.connect(transport);

  try {
    const res = await client.callTool({ name: tool, arguments: args });
    const text =
      (res.content as Array<{ type: string; text?: string }>)
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n") ?? "";
    process.stdout.write(text + "\n");
  } catch (err) {
    console.error(`tool call failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
