/**
 * Per-client MCP-config detection + merging.
 *
 * Each client describes:
 *   - the path it stores its config at
 *   - the JSON shape (top-level key, server entry shape)
 *   - whether it currently has an "inspo" entry
 *
 * Adding the entry is idempotent — re-running `inspo init` is safe.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

type Detected = {
  id: string;
  label: string;
  path: string;
  exists: boolean;
};

export type ClientId = "claude-code" | "cursor" | "vscode" | "zed" | "codex";

export const CLIENTS: { id: ClientId; label: string; getPath(): string }[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    getPath: () => join(homedir(), ".claude.json"),
  },
  {
    id: "cursor",
    label: "Cursor",
    getPath: () => join(homedir(), ".cursor", "mcp.json"),
  },
  {
    id: "vscode",
    label: "VS Code (Copilot)",
    getPath: () => resolve(process.cwd(), ".vscode", "mcp.json"),
  },
  {
    id: "zed",
    label: "Zed",
    getPath: () => join(homedir(), ".config", "zed", "settings.json"),
  },
  {
    id: "codex",
    label: "Codex",
    getPath: () => join(homedir(), ".codex", "config.toml"),
  },
];

export function detect(): Detected[] {
  return CLIENTS.map((c) => ({
    id: c.id,
    label: c.label,
    path: c.getPath(),
    exists: existsSync(c.getPath()),
  }));
}

/* ─────────────── inspo entry ─────────────── */

export type InspoEntry = {
  command: string;
  args: string[];
  env?: Record<string, string>;
};

export function buildEntry(opts: {
  binPath: string;
  baseUrl: string;
  apiKey?: string;
}): InspoEntry {
  return {
    command: "node",
    args: [opts.binPath],
    env: {
      INSPO_BASE_URL: opts.baseUrl,
      ...(opts.apiKey ? { INSPO_API_KEY: opts.apiKey } : {}),
    },
  };
}

/* ─────────────── merge ─────────────── */

type MergeResult = { changed: boolean; reason: string };

export function merge(
  client: ClientId,
  path: string,
  entry: InspoEntry,
): MergeResult {
  switch (client) {
    case "claude-code":
    case "cursor":
    case "vscode":
      return mergeMcpServers(path, entry);
    case "zed":
      return mergeZed(path, entry);
    case "codex":
      return mergeCodex(path, entry);
  }
}

function readJson(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  try {
    const raw = readFileSync(path, "utf8").trim();
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (err) {
    throw new Error(
      `Couldn't parse ${path} as JSON. Fix the file (or move it aside) and re-run.\n  → ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function writeJson(path: string, obj: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function mergeMcpServers(path: string, entry: InspoEntry): MergeResult {
  const json = readJson(path);
  const servers = (json.mcpServers as Record<string, unknown>) ?? {};
  const before = JSON.stringify(servers.inspo ?? null);
  servers.inspo = entry;
  const after = JSON.stringify(servers.inspo);
  if (before === after) {
    return { changed: false, reason: "already up to date" };
  }
  writeJson(path, { ...json, mcpServers: servers });
  return { changed: true, reason: before === "null" ? "added" : "updated" };
}

function mergeZed(path: string, entry: InspoEntry): MergeResult {
  // Zed's settings.json may be JSONC (comments allowed). For v1 we read as
  // plain JSON; if parsing fails the user can paste the snippet manually.
  const json = readJson(path);
  const servers = (json.context_servers as Record<string, unknown>) ?? {};
  const before = JSON.stringify(servers.inspo ?? null);
  servers.inspo = {
    source: "custom",
    command: entry.command,
    args: entry.args,
    env: entry.env ?? {},
  };
  const after = JSON.stringify(servers.inspo);
  if (before === after) return { changed: false, reason: "already up to date" };
  writeJson(path, { ...json, context_servers: servers });
  return { changed: true, reason: before === "null" ? "added" : "updated" };
}

function mergeCodex(path: string, entry: InspoEntry): MergeResult {
  // TOML — we do a naive append-if-missing rather than a full TOML parse.
  const block = renderCodexBlock(entry);
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (existing.includes("[mcp_servers.inspo]")) {
    return {
      changed: false,
      reason: "already present (re-add manually if outdated)",
    };
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    (existing.endsWith("\n") || existing === "" ? existing : existing + "\n") +
      "\n" +
      block +
      "\n",
    "utf8",
  );
  return { changed: true, reason: "added" };
}

function renderCodexBlock(entry: InspoEntry): string {
  const args = entry.args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(", ");
  const envLines = entry.env
    ? Object.entries(entry.env)
        .map(([k, v]) => `${k} = "${v.replace(/"/g, '\\"')}"`)
        .join("\n")
    : "";
  return [
    "[mcp_servers.inspo]",
    `command = "${entry.command}"`,
    `args = [${args}]`,
    envLines ? `\n[mcp_servers.inspo.env]\n${envLines}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
