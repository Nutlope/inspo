# Inspo MCP

**A curated archive of ~1,300 real production websites — queryable over MCP — that gives coding agents visual taste before they write UI.**

Every result is grounded in a real, shipped site: real fonts, frequency-ranked palettes traced to source, detected tech, named macrostructures, component crops, and — now — **desktop + mobile pairs** so an agent learns responsiveness, not just the desktop look. Works standalone; pairs with the [Hallmark](https://github.com/Luffixos/hallmark) design skill.

This is, and stays, a standard **MCP server** — packaging it for one-line install just makes the same server trivially addable to any MCP client (Cursor, Claude Code, Claude Desktop, …). Two transports, same tools:

- **stdio** (`src/server.ts`) — runs locally, reads the bundled static seed (no DB needed).
- **Streamable HTTP** (`src/worker.ts`) — a Cloudflare Worker for a hosted URL.

## Tools

| Tool | What it does |
|---|---|
| `search_screens(query, style?, industry?, macrostructure?, mode?, vibe?, color?, pageType?, limit?)` | Hybrid lexical + vector search across the archive. Returns palette, fonts, tech, tags, **desktop + mobile** image URLs, inline thumbnails. |
| `recommend(brief, macrostructure?, …)` | One-call moodboard: a macrostructure pick, 5 exemplars, canonical reference JSX, a palette suggestion — and **`heroGuidance`** (compose the hero to fit the first viewport). Start here. |
| `get_design_system(slug, live?)` | Full DESIGN.md for a site — real fonts, palette + CSS vars, type ramp, detected tech. `live:true` supplements thin rows by fetching the source. |
| `study(url)` | Same extraction for **any** live URL (not just the archive) — fonts, palette, CSS vars, tech. |
| `compare(slugs[])` | 2–4 sites side by side: shared style tags, distinct macrostructures, register agreement. |
| `find_by_color(hex, tolerance?, limit?)` | Real sites whose palette sits near a target colour (OKLAB distance). |
| `find_similar(slug, limit?)` | A site's visual + structural neighbours. |
| `find_examples_for_macrostructure(name, limit?)` | Exemplars of one of the 21 Hallmark macrostructures (`Bento Grid`, `Specimen`, …). |
| `find_components(type, …)` / `find_reference_components(type?)` / `get_reference_jsx(type, id)` | Real component crops + Hallmark-stamped canonical JSX shapes. |
| `get_screen(slug)` / `list_collections()` / `get_collection(slug)` | Single record · editor-curated issues. |

Image URLs are absolute (against `INSPO_BASE_URL`, default `https://inspo.design`), so an agent can fetch them or hand them to a vision model directly.

**Baked-in guidance:** the server instructions + `recommend()` tell every agent to *compose the hero to fit the first viewport (~1280×800 / `100svh`) — never overflow it.* That single rule kills the most common "AI-built page" failure (an oversized hero cut off below the fold).

## Install (one line per client)

### Hosted (recommended — no clone, no deps)

Once the Worker is deployed (`pnpm --filter @inspo/mcp worker:deploy` → gives an `https://…workers.dev` URL or your custom domain), add it as a remote MCP server:

```bash
# Claude Code
claude mcp add --transport http inspo https://inspo-mcp.<your-subdomain>.workers.dev/mcp
```

```jsonc
// Cursor — ~/.cursor/mcp.json  ·  Claude Desktop — claude_desktop_config.json
{ "mcpServers": { "inspo": { "url": "https://inspo-mcp.<your-subdomain>.workers.dev/mcp" } } }
```

### Local (stdio, from a clone)

The bin shim boots the TS server via `tsx` — no build step.

```jsonc
// Claude Code: ~/.claude.json  ·  Cursor: ~/.cursor/mcp.json  ·  Claude Desktop: config
{
  "mcpServers": {
    "inspo": {
      "command": "node",
      "args": ["/absolute/path/to/Inspo-design/apps/mcp/bin/inspo-mcp.js"]
    }
  }
}
```

Restart the client; the agent gains all the tools above. (Publishing to npm for a `npx inspo-mcp` one-liner is a follow-up — see *Publishing* below.)

## Run / develop

```bash
pnpm --filter @inspo/mcp start            # stdio server
pnpm --filter @inspo/mcp test             # smoke test — boots in-process, calls every tool
pnpm --filter @inspo/mcp inspect          # MCP Inspector UI
pnpm --filter @inspo/mcp worker:dev       # Cloudflare Worker locally
```

### Deploy the hosted Worker

The Worker **doesn't bundle** the ~16MB catalogue (it would bust Cloudflare's
script-size cap). Instead it fetches the seed + embeddings from a CDN at
runtime (once per isolate), so the deployed script is ~325KB gzipped. Deploy
is two steps:

```bash
# 1. Publish the catalogue to Vercel Blob (re-run after any seed change)
pnpm --filter @inspo/worker exec tsx src/publish-catalogue-to-blob.ts --go
# 2. Deploy the Worker (needs `wrangler login`)
pnpm --filter @inspo/mcp worker:deploy
```

`INSPO_CATALOGUE_URL` (in `wrangler.toml`) points at the published store —
override it to host the data anywhere. The stdio server still reads the
bundled seed, so local installs need no CDN.

## Hallmark integration

Inspo is the **data/reference** layer; [Hallmark](https://github.com/Luffixos/hallmark) is the **process/judgment** layer. An agent following Hallmark picks a macrostructure, then calls `find_examples_for_macrostructure` / `recommend` to ground it in real sites — process from Hallmark, taste from Inspo. Inspo works fine on its own too (see the `/examples` gallery: full pages built with nothing but this MCP).

## Security

- **Read-only.** No write/mutate tools; the server only reads the curated catalogue.
- **No secrets in the response surface.** The Worker reads `DATABASE_URL` / tokens from Cloudflare secrets (never returned to clients). `.env` is gitignored; only `.env.example` is tracked.
- **Auth:** soft by default (`ENFORCE_AUTH=0`). Set `ENFORCE_AUTH=1` + provision `api_keys` to require `Authorization: Bearer inspo_…` on the hosted endpoint before exposing it widely.
- **`study(url)` fetches an arbitrary client-supplied URL server-side** (HTML + linked CSS only, no JS execution). On a public hosted deployment this is a mild SSRF surface — keep it behind auth / a network allowlist if that matters for your environment.

## Publishing (for a true `npx` one-liner)

`package.json` is currently `private`. To ship a standalone `npx inspo-mcp`: bundle `src` + the static seed, drop `private`, add a `prepublishOnly` build, and `npm publish`. (Requires npm auth — left for the maintainer.)

## Files

- `src/server.ts` — stdio entry · `src/worker.ts` — Cloudflare Worker (Streamable HTTP)
- `src/tools.ts` — all tool registrations + `HERO_GUIDANCE` (shared by both transports)
- `src/format.ts` — wire format (absolute URLs, inline image blocks, mobile fields)
- `src/call.ts` — one-shot CLI client (`tsx src/call.ts <tool> '<json>'`)
- `src/smoke.ts` — `pnpm test` · `bin/inspo-mcp.js` — no-build entrypoint
