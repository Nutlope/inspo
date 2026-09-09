/**
 * `npx -y inspo-mcp install` - write the Inspo MCP server into whichever
 * MCP clients are actually on this machine.
 *
 * The homepage hands out a one-line command, so that command has to do
 * something. Without this, `npx -y inspo-mcp` starts a stdio server that
 * prints nothing and waits on stdin, which reads as "the install failed"
 * to everyone who has never launched an MCP server by hand.
 *
 * Two rules keep this safe to run blind:
 *
 *   1. Never hand-edit a config we cannot round-trip. Claude Code, Codex
 *      and VS Code own their config format and ship a CLI to mutate it,
 *      so we shell out. Cursor, Windsurf and Claude Desktop use plain
 *      JSON we can parse and rewrite. Zed's settings.json is JSONC -
 *      rewriting it would strip the user's comments, so Zed gets a
 *      printed snippet instead of a silent edit.
 *   2. Show the plan, then ask. `-y` and non-TTY skip the prompt.
 */

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createInterface } from "node:readline/promises";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";

export const HOSTED_URL = "https://inspomcp.dev/api/mcp";
const SERVER_NAME = "inspo";

/** How the client should reach the server. */
type Mode = "http" | "stdio";

type Outcome =
  | { status: "added"; detail: string }
  | { status: "present"; detail: string }
  | { status: "manual"; detail: string; snippet: string }
  | { status: "failed"; detail: string };

type Client = {
  id: string;
  label: string;
  /** Present on this machine? Only detected clients are touched. */
  detect: () => boolean;
  /** Where the change lands, for the confirmation prompt. */
  target: () => string;
  apply: (mode: Mode, dryRun: boolean) => Outcome;
};

const HOME = homedir();
const IS_WIN = platform() === "win32";

// ── helpers ──────────────────────────────────────────────────────────

/** Config paths are long; the reader only needs the part after ~. */
function tilde(path: string): string {
  return path.startsWith(HOME) ? `~${path.slice(HOME.length)}` : path;
}

function hasBin(bin: string): boolean {
  const probe = IS_WIN ? "where" : "which";
  return spawnSync(probe, [bin], { stdio: "ignore" }).status === 0;
}

function run(bin: string, args: string[]): { ok: boolean; err: string } {
  const r = spawnSync(bin, args, { encoding: "utf8", shell: IS_WIN });
  return {
    ok: r.status === 0,
    err: `${r.stderr ?? ""}${r.stdout ?? ""}`.trim() || `exit ${r.status}`,
  };
}

/** Reads JSON that may not exist yet; returns {} rather than throwing. */
function readJson(file: string): Record<string, unknown> {
  if (!existsSync(file)) return {};
  const raw = readFileSync(file, "utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

/**
 * Rewrites a JSON config with a backup alongside it. Anything unreadable
 * is left completely alone - a client's config is the user's, and a
 * half-parsed rewrite is worse than a printed snippet.
 */
function patchJson(
  file: string,
  entry: Record<string, unknown>,
  key: string,
  dryRun: boolean,
): Outcome {
  let config: Record<string, unknown>;
  try {
    config = readJson(file);
  } catch {
    return {
      status: "manual",
      detail: `${tilde(file)} is not valid JSON - left untouched`,
      snippet: JSON.stringify({ [key]: { [SERVER_NAME]: entry } }, null, 2),
    };
  }

  const servers = (config[key] ?? {}) as Record<string, unknown>;
  if (servers[SERVER_NAME]) {
    return { status: "present", detail: `already in ${tilde(file)}` };
  }
  if (dryRun) return { status: "added", detail: `would write ${tilde(file)}` };

  servers[SERVER_NAME] = entry;
  config[key] = servers;

  mkdirSync(dirname(file), { recursive: true });
  if (existsSync(file)) copyFileSync(file, `${file}.inspo-backup`);
  writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
  return { status: "added", detail: tilde(file) };
}

/** The stdio form, for clients that cannot take a remote URL. */
const STDIO_ENTRY = { command: "npx", args: ["-y", "inspo-mcp"] };

// ── clients ──────────────────────────────────────────────────────────

const CURSOR_CONFIG = join(HOME, ".cursor", "mcp.json");
const WINDSURF_CONFIG = join(
  HOME,
  ".codeium",
  "windsurf",
  "mcp_config.json",
);
const ZED_CONFIG = join(HOME, ".config", "zed", "settings.json");
const CLAUDE_DESKTOP_CONFIG = IS_WIN
  ? join(process.env.APPDATA ?? join(HOME, "AppData", "Roaming"), "Claude", "claude_desktop_config.json")
  : platform() === "darwin"
    ? join(HOME, "Library", "Application Support", "Claude", "claude_desktop_config.json")
    : join(HOME, ".config", "Claude", "claude_desktop_config.json");

const CLIENTS: Client[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    detect: () => hasBin("claude"),
    target: () => "claude mcp add --scope user",
    apply: (mode, dryRun) => {
      if (run("claude", ["mcp", "get", SERVER_NAME]).ok) {
        return { status: "present", detail: "already registered" };
      }
      const args =
        mode === "http"
          ? ["mcp", "add", "--scope", "user", "--transport", "http", SERVER_NAME, HOSTED_URL]
          : ["mcp", "add", "--scope", "user", SERVER_NAME, "--", "npx", "-y", "inspo-mcp"];
      if (dryRun) return { status: "added", detail: `would run: claude ${args.join(" ")}` };
      const r = run("claude", args);
      return r.ok
        ? { status: "added", detail: "user scope (all projects)" }
        : { status: "failed", detail: r.err };
    },
  },
  {
    id: "codex",
    label: "Codex",
    detect: () => hasBin("codex"),
    target: () => "codex mcp add (~/.codex/config.toml)",
    apply: (mode, dryRun) => {
      if (run("codex", ["mcp", "get", SERVER_NAME]).ok) {
        return { status: "present", detail: "already registered" };
      }
      const args =
        mode === "http"
          ? ["mcp", "add", SERVER_NAME, "--url", HOSTED_URL]
          : ["mcp", "add", SERVER_NAME, "--", "npx", "-y", "inspo-mcp"];
      if (dryRun) return { status: "added", detail: `would run: codex ${args.join(" ")}` };
      const r = run("codex", args);
      return r.ok
        ? { status: "added", detail: "~/.codex/config.toml" }
        : { status: "failed", detail: r.err };
    },
  },
  {
    id: "vscode",
    label: "VS Code",
    detect: () => hasBin("code"),
    target: () => "code --add-mcp (user profile)",
    apply: (mode, dryRun) => {
      const entry =
        mode === "http"
          ? { name: SERVER_NAME, type: "http", url: HOSTED_URL }
          : { name: SERVER_NAME, ...STDIO_ENTRY };
      const payload = JSON.stringify(entry);
      if (dryRun) return { status: "added", detail: `would run: code --add-mcp '${payload}'` };
      // --add-mcp is idempotent: re-adding the same name is a no-op.
      const r = run("code", ["--add-mcp", payload]);
      return r.ok
        ? { status: "added", detail: "user profile" }
        : { status: "failed", detail: r.err };
    },
  },
  {
    id: "cursor",
    label: "Cursor",
    detect: () => existsSync(join(HOME, ".cursor")),
    target: () => tilde(CURSOR_CONFIG),
    apply: (mode, dryRun) =>
      patchJson(
        CURSOR_CONFIG,
        mode === "http" ? { url: HOSTED_URL } : STDIO_ENTRY,
        "mcpServers",
        dryRun,
      ),
  },
  {
    id: "windsurf",
    label: "Windsurf",
    detect: () => existsSync(join(HOME, ".codeium", "windsurf")),
    target: () => tilde(WINDSURF_CONFIG),
    apply: (mode, dryRun) =>
      patchJson(
        WINDSURF_CONFIG,
        // Windsurf names the remote field serverUrl, not url.
        mode === "http" ? { serverUrl: HOSTED_URL } : STDIO_ENTRY,
        "mcpServers",
        dryRun,
      ),
  },
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    detect: () => existsSync(dirname(CLAUDE_DESKTOP_CONFIG)),
    target: () => tilde(CLAUDE_DESKTOP_CONFIG),
    apply: (_mode, dryRun) =>
      // Desktop's config file takes stdio servers; remote ones go
      // through its own connector UI, so always write the npx form.
      patchJson(CLAUDE_DESKTOP_CONFIG, STDIO_ENTRY, "mcpServers", dryRun),
  },
  {
    id: "zed",
    label: "Zed",
    detect: () => existsSync(join(HOME, ".config", "zed")),
    target: () => `${tilde(ZED_CONFIG)} (printed, not written)`,
    apply: (mode) => ({
      status: "manual",
      // settings.json is JSONC; rewriting it would eat the user's comments.
      detail: `paste into ${tilde(ZED_CONFIG)}`,
      snippet: JSON.stringify(
        {
          context_servers: {
            [SERVER_NAME]: mode === "http" ? { url: HOSTED_URL } : STDIO_ENTRY,
          },
        },
        null,
        2,
      ),
    }),
  },
];

// ── entry point ──────────────────────────────────────────────────────

export async function install(argv: string[], version: string): Promise<number> {
  const dryRun = argv.includes("--dry-run");
  const assumeYes = argv.includes("-y") || argv.includes("--yes");
  const mode: Mode = argv.includes("--local") ? "stdio" : "http";

  const wanted = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--client" && argv[i + 1]) wanted.add(argv[++i].toLowerCase());
  }

  const unknown = [...wanted].filter((w) => !CLIENTS.some((c) => c.id === w));
  if (unknown.length) {
    console.error(
      `  unknown --client ${unknown.join(", ")}\n  known: ${CLIENTS.map((c) => c.id).join(", ")}`,
    );
    return 1;
  }

  const targets = CLIENTS.filter((c) =>
    wanted.size ? wanted.has(c.id) : c.detect(),
  );

  console.log(`\n  inspo-mcp v${version}`);
  console.log(
    mode === "http"
      ? `  hosted endpoint · ${HOSTED_URL}\n`
      : "  local stdio · npx -y inspo-mcp\n",
  );

  if (!targets.length) {
    console.log("  No MCP client detected on this machine.\n");
    console.log("  Looked for: Claude Code, Codex, VS Code, Cursor, Windsurf,");
    console.log("  Claude Desktop and Zed. Add it by hand with either");
    console.log(`    url:      ${HOSTED_URL}`);
    console.log("    command:  npx -y inspo-mcp");
    console.log("  or force one with --client <id>. Full setup:");
    console.log("  https://inspomcp.dev/mcp\n");
    return 0;
  }

  console.log("  Will configure:");
  for (const c of targets) console.log(`    ${c.label.padEnd(15)} ${c.target()}`);
  console.log();

  if (!assumeYes && !dryRun && process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = (await rl.question("  Proceed? [Y/n] ")).trim().toLowerCase();
    rl.close();
    if (answer && answer !== "y" && answer !== "yes") {
      console.log("\n  Cancelled - nothing was written.\n");
      return 0;
    }
    console.log();
  }

  let failed = 0;
  let added = 0;
  const snippets: string[] = [];

  for (const c of targets) {
    let outcome: Outcome;
    try {
      outcome = c.apply(mode, dryRun);
    } catch (err) {
      outcome = { status: "failed", detail: (err as Error).message };
    }

    const mark = { added: "✓", present: "·", manual: "→", failed: "✗" }[
      outcome.status
    ];
    console.log(`  ${mark} ${c.label.padEnd(15)} ${outcome.detail}`);
    if (outcome.status === "failed") failed++;
    if (outcome.status === "added") added++;
    if (outcome.status === "manual") {
      snippets.push(`\n  ${c.label} - ${outcome.detail}\n\n${indent(outcome.snippet)}`);
    }
  }

  for (const s of snippets) console.log(s);

  console.log(
    dryRun
      ? "\n  Dry run - nothing was written.\n"
      : added
        ? "\n  Restart your client to pick up the new server.\n"
        : "\n  Nothing to write.\n",
  );
  return failed ? 1 : 0;
}

function indent(text: string): string {
  return text
    .split("\n")
    .map((l) => `      ${l}`)
    .join("\n");
}
