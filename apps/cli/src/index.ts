/**
 * `inspo` CLI: installer for the Inspo MCP server.
 *
 * Usage:
 *   inspo init                  detect clients → write inspo entries
 *   inspo init --bin=<path>     override the path to the MCP server bin
 *   inspo init --url=<url>      override INSPO_BASE_URL (default localhost:3000)
 *   inspo init --key=<apikey>   set INSPO_API_KEY in each env block
 *   inspo init --only=cursor,claude-code   limit to specific clients
 *   inspo status                show what's currently wired
 *   inspo uninstall             remove inspo entries from every client
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import kleur from "kleur";
import {
  CLIENTS,
  detect,
  buildEntry,
  merge,
  type ClientId,
} from "./clients.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function defaultBinPath(): string {
  // When running from inside the repo (pnpm dev), point at the local mcp bin.
  // When installed via npm, the user passes --bin=<path> or sets INSPO_MCP_BIN.
  if (process.env.INSPO_MCP_BIN) return process.env.INSPO_MCP_BIN;
  const localBin = resolve(__dirname, "../../mcp/bin/inspo-mcp.js");
  if (existsSync(localBin)) return localBin;
  // Fallback when published: assume the mcp pkg is npm-installed alongside
  return "@inspo/mcp/bin/inspo-mcp.js";
}

type ParsedFlags = {
  bin?: string;
  url?: string;
  key?: string;
  only?: ClientId[];
};

function parseFlags(argv: string[]): ParsedFlags {
  const out: ParsedFlags = {};
  for (const a of argv) {
    if (a.startsWith("--bin=")) out.bin = a.slice(6);
    else if (a.startsWith("--url=")) out.url = a.slice(6);
    else if (a.startsWith("--key=")) out.key = a.slice(6);
    else if (a.startsWith("--only=")) {
      out.only = a
        .slice(7)
        .split(",")
        .map((s) => s.trim()) as ClientId[];
    }
  }
  return out;
}

function main() {
  const [, , cmd, ...rest] = process.argv;
  const flags = parseFlags(rest);

  switch (cmd) {
    case "init":
      return cmdInit(flags);
    case "status":
      return cmdStatus();
    case "uninstall":
      return cmdUninstall();
    case "help":
    case "--help":
    case "-h":
    case undefined:
      return printHelp();
    default:
      console.error(kleur.red(`unknown command: ${cmd}`));
      printHelp();
      process.exit(1);
  }
}

function printHelp() {
  console.log(`
${kleur.bold("inspo")} - install the Inspo MCP server in every detected coding-agent client

${kleur.bold("Commands")}
  ${kleur.cyan("inspo init")}           detect → write configs
  ${kleur.cyan("inspo status")}         show which clients have inspo wired
  ${kleur.cyan("inspo uninstall")}      remove inspo from every client

${kleur.bold("Init flags")}
  --bin=<path>                  override path to inspo-mcp bin
  --url=<url>                   set INSPO_BASE_URL (default http://localhost:3000)
  --key=<apikey>                set INSPO_API_KEY in each env block
  --only=cursor,claude-code     limit to specific clients

Get an API key: ${kleur.underline("http://localhost:3000/dashboard")}
`);
}

function cmdInit(flags: ParsedFlags) {
  const bin = flags.bin ?? defaultBinPath();
  const url = flags.url ?? process.env.INSPO_BASE_URL ?? "http://localhost:3000";
  const key = flags.key ?? process.env.INSPO_API_KEY;
  const only = flags.only;

  const entry = buildEntry({ binPath: bin, baseUrl: url, apiKey: key });

  console.log(kleur.bold("\n  inspo init"));
  console.log(
    kleur.dim(`  bin: ${bin}\n  url: ${url}\n  key: ${key ? "set" : kleur.yellow("none, get one at /dashboard")}\n`),
  );

  const detected = detect();
  let touched = 0;
  let skipped = 0;
  let missing = 0;

  for (const c of detected) {
    if (only && !only.includes(c.id as ClientId)) continue;

    const tag = `  ${kleur.bold(c.label.padEnd(18))}`;
    if (!c.exists) {
      console.log(`${tag} ${kleur.dim("not detected · " + c.path)}`);
      missing += 1;
      continue;
    }
    try {
      const result = merge(c.id as ClientId, c.path, entry);
      if (result.changed) {
        console.log(`${tag} ${kleur.green("✓ " + result.reason)} · ${kleur.dim(c.path)}`);
        touched += 1;
      } else {
        console.log(`${tag} ${kleur.dim("·  " + result.reason)}`);
        skipped += 1;
      }
    } catch (err) {
      console.log(`${tag} ${kleur.red("✗ " + (err instanceof Error ? err.message : String(err)))}`);
    }
  }

  console.log(`\n  ${kleur.green(touched + " written")} · ${skipped} unchanged · ${missing} not detected`);
  if (!key) {
    console.log(
      `\n  ${kleur.yellow("→")} ${kleur.bold("Issue an API key:")} ${kleur.underline(url + "/dashboard")}`,
    );
    console.log(`     then re-run: ${kleur.cyan("inspo init --key=<key>")}\n`);
  } else {
    console.log(
      `\n  ${kleur.green("→")} restart your client; the agent now has Inspo's tools.\n`,
    );
  }
}

function cmdStatus() {
  console.log(kleur.bold("\n  inspo status\n"));
  for (const c of detect()) {
    const tag = `  ${kleur.bold(c.label.padEnd(18))}`;
    if (!c.exists) {
      console.log(`${tag} ${kleur.dim("not detected")}`);
      continue;
    }
    try {
      const raw = readFileSync(c.path, "utf8");
      const has = raw.includes("inspo");
      console.log(
        `${tag} ${has ? kleur.green("✓ wired") : kleur.dim("·  not wired")} · ${kleur.dim(c.path)}`,
      );
    } catch {
      console.log(`${tag} ${kleur.red("? unreadable")} · ${kleur.dim(c.path)}`);
    }
  }
  console.log();
}

function cmdUninstall() {
  console.log(kleur.bold("\n  inspo uninstall\n"));
  for (const c of detect()) {
    if (!c.exists) continue;
    const tag = `  ${kleur.bold(c.label.padEnd(18))}`;
    try {
      if (c.id === "codex") {
        const raw = readFileSync(c.path, "utf8");
        const stripped = raw.replace(
          /\[mcp_servers\.inspo\][\s\S]*?(?=\n\[|$)/g,
          "",
        );
        if (stripped !== raw) {
          writeFileSync(c.path, stripped, "utf8");
          console.log(`${tag} ${kleur.green("✓ removed")}`);
        } else {
          console.log(`${tag} ${kleur.dim("· not present")}`);
        }
        continue;
      }
      const raw = readFileSync(c.path, "utf8");
      const json = JSON.parse(raw);
      const key = c.id === "zed" ? "context_servers" : "mcpServers";
      if (json[key]?.inspo) {
        delete json[key].inspo;
        writeFileSync(c.path, JSON.stringify(json, null, 2) + "\n", "utf8");
        console.log(`${tag} ${kleur.green("✓ removed")}`);
      } else {
        console.log(`${tag} ${kleur.dim("· not present")}`);
      }
    } catch (err) {
      console.log(
        `${tag} ${kleur.red("✗ " + (err instanceof Error ? err.message : String(err)))}`,
      );
    }
  }
  console.log();
}

main();

// Used to suppress the "imported but unused" warning in some linters.
void CLIENTS;
