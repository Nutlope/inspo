# inspo (CLI)

Detects which coding-agent clients you have installed and idempotently wires the Inspo MCP server into each one.

## Usage

```bash
# from this monorepo:
pnpm --filter inspo start init

# or, when published:
npx inspo init
```

## What it does

Detects:
- Claude Code (`~/.claude.json`)
- Cursor (`~/.cursor/mcp.json`)
- VS Code Copilot (`.vscode/mcp.json` in cwd)
- Zed (`~/.config/zed/settings.json`)
- Codex (`~/.codex/config.toml`)

For each detected client, writes (or updates) an `inspo` entry under `mcpServers` (or `context_servers` for Zed, `[mcp_servers.inspo]` for Codex). Existing entries are merged, not replaced — re-running is safe.

## Flags

| Flag | What |
|---|---|
| `--bin=<path>` | Path to the MCP server bin. Defaults to `apps/mcp/bin/inspo-mcp.js` when run from the repo. |
| `--url=<url>` | Set `INSPO_BASE_URL` in each env block. Default: `http://localhost:3000`. |
| `--key=<apikey>` | Set `INSPO_API_KEY` in each env block. Get one at `/dashboard`. |
| `--only=cursor,claude-code` | Limit to specific clients. |

## Other commands

```bash
inspo status      # show which clients have inspo wired
inspo uninstall   # remove inspo from every client
```
