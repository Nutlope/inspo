# @inspo/mcp

Local stdio MCP server. Hands real, curated screenshots to coding agents.

## What it exposes

| Tool | What it does |
|---|---|
| `search_screens(query, style?, industry?, macrostructure?, mode?, limit?)` | Lexical search + tag filters. Returns palette, fonts, components, image URLs. |
| `get_screen(slug)` | Full record for one screen. |
| `find_similar(slug, limit?)` | Same-macrostructure neighbours, ranked by industry / style / mode overlap. |
| `find_examples_for_macrostructure(name, limit?)` | **Hallmark-aware.** Pass any of the 21 named macrostructures (`Bento Grid`, `Specimen`, `Manifesto`, …) and get exemplars. Made to be called from inside Hallmark's design flow. |
| `list_collections()` | All editor-curated issues. |
| `get_collection(slug)` | One issue with editor blurb + ordered screens. |

URLs returned are absolute (against `INSPO_BASE_URL`, default `http://localhost:3000`) so an agent can fetch them or pass them to a vision model directly.

## Run

```bash
# directly
pnpm --filter @inspo/mcp start

# smoke test (boots in-process and calls every tool)
pnpm --filter @inspo/mcp test

# launch the MCP Inspector UI
pnpm --filter @inspo/mcp inspect
```

## Install in your agent

The bin shim at `apps/mcp/bin/inspo-mcp.js` boots the TS server via `tsx` so no build step is needed.

### Claude Code

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "inspo": {
      "command": "node",
      "args": ["/Users/you/Inspo-design/apps/mcp/bin/inspo-mcp.js"],
      "env": {
        "INSPO_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "inspo": {
      "command": "node",
      "args": ["/Users/you/Inspo-design/apps/mcp/bin/inspo-mcp.js"]
    }
  }
}
```

Restart the client. The agent now has six new tools.

## Hallmark integration

[Hallmark](https://github.com/Luffixos/hallmark) forces an agent to pick one of 21 named macrostructures before writing code. Inspo's `find_examples_for_macrostructure` is designed to be called at that exact step — the agent gets process from Hallmark, reference from Inspo.

Example agent flow inside Claude Code:

> *User: design a landing page for a developer-tools startup, dev-first vibe.*
> *Agent (following Hallmark):* loads design-context gate → picks macrostructure: `Bento Grid` → calls `find_examples_for_macrostructure("Bento Grid")` → studies four real Bento sites, their palettes, components → only then writes the markup.

## Files

- `src/server.ts` — six-tool stdio server
- `src/format.ts` — wire-format helpers, absolute URL coercion
- `src/search.ts` — lexical search (replaced by pgvector once embeddings populate)
- `src/url.ts` — `INSPO_BASE_URL` resolution
- `src/smoke.ts` — `pnpm test` — exercises every tool in-process
- `bin/inspo-mcp.js` — no-build entrypoint for client configs
