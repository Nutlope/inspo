# Inspo MCP

**A curated archive of 767 production sites (2,141 captured screens) - queryable over MCP - that gives coding agents visual taste before they write UI.**

Every result is grounded in a real, shipped site: real fonts, frequency-ranked palettes traced to source, detected tech, named macrostructures, component crops, and - now - **desktop + mobile pairs** so an agent learns responsiveness, not just the desktop look.

This is, and stays, a standard **MCP server** - packaging it for one-line install just makes the same server trivially addable to any MCP client (Cursor, Claude Code, Claude Desktop, …). Two transports, same tools:

- **stdio** (`src/server.ts`) - runs locally, reads the bundled static seed (no DB needed).
- **Streamable HTTP** - a Next.js Route Handler (`apps/web/src/app/api/mcp/route.ts`) that ships with the site's Vercel deployment.

## Tools

| Tool | What it does |
|---|---|
| `search_screens(query, style?, industry?, macrostructure?, mode?, vibe?, color?, pageType?, limit?)` | Hybrid lexical + vector search across the archive. Returns palette, fonts, tech, tags, **desktop + mobile** image URLs, inline thumbnails. |
| `recommend(brief, macrostructure?, …)` | One-call moodboard: a macrostructure pick, 5 exemplars, canonical reference JSX, a palette suggestion - and **`heroGuidance`** (compose the hero to fit the first viewport). Start here. |
| `get_design_system(slug, live?)` | Full DESIGN.md for a site - real fonts, palette + CSS vars, type ramp, detected tech. `live:true` supplements thin rows by fetching the source. |
| `study(url)` | Same extraction for **any** live URL (not just the archive) - fonts, palette, CSS vars, tech. |
| `compare(slugs[])` | 2-4 sites side by side: shared style tags, distinct macrostructures, register agreement. |
| `find_by_color(hex, tolerance?, limit?)` | Real sites whose palette sits near a target colour (OKLAB distance). |
| `find_similar(slug, limit?)` | A site's visual + structural neighbours. |
| `find_examples_for_macrostructure(name, limit?)` | Exemplars of one of the 19 named macrostructures (`Bento Grid`, `Specimen`, …). |
| `find_components(type, …)` / `find_reference_components(type?)` / `get_reference_jsx(type, id)` | Real component crops + canonical reference JSX shapes. |
| `get_filters()` | Zero input: lists every accepted filter / enum value (styles, industries, macrostructures, vibes, page types) so the agent can pick valid arguments in one call. |
| `get_site_pages(slug)` | A site's captured pages in reading order. |
| `get_screen(slug)` / `list_collections()` / `get_collection(slug)` | Single record · editor-curated issues. |

Image URLs are absolute (against `INSPO_BASE_URL`, default `https://inspo-three.vercel.app`), so an agent can fetch them or hand them to a vision model directly.

**Baked-in guidance:** the server instructions + `recommend()` carry two composition rules to every agent. `heroGuidance`: *compose the hero to fit the first viewport (~1280×800 / `100svh`) - never overflow it* - which kills the most common "AI-built page" failure (an oversized hero cut off below the fold). And `spacingGuidance`: *separate sections with real block space (production sites run 80-160px between sections) and keep all copy inside a centered, padded column* - which kills the second most common one (sections crammed into one block, text touching the viewport edge). The spacing numbers are measured from the archive, not invented.

## Install (one line per client)

### Hosted (recommended - no clone, no deps)

A hosted endpoint is **live and free** (no auth): `https://inspo-three.vercel.app/api/mcp`. Add it as a remote MCP server:

```bash
# Claude Code
claude mcp add --transport http inspo https://inspo-three.vercel.app/api/mcp
```

```jsonc
// Cursor - ~/.cursor/mcp.json  ·  Claude Desktop - claude_desktop_config.json
{ "mcpServers": { "inspo": { "url": "https://inspo-three.vercel.app/api/mcp" } } }
```

### One command, any client

`inspo-mcp install` detects the MCP clients on the machine (Claude Code,
Codex, VS Code, Cursor, Windsurf, Claude Desktop, Zed) and writes the
config for each, pointed at the hosted endpoint:

```bash
npx -y inspo-mcp install
```

It shows the plan and asks before touching anything. `--dry-run` prints
the plan and writes nothing, `--client <id>` targets one client,
`--local` wires the npx stdio form instead of the hosted URL, and `-y`
skips the prompt. Config files it edits are backed up alongside
(`mcp.json.inspo-backup`); Zed's JSONC settings are printed for you to
paste rather than rewritten, so your comments survive.

### `npx` (zero-config)

No clone and no hosting - the stdio server (`inspo-mcp`) runs straight
from npm via `npx -y inspo-mcp` and fetches the catalogue from the CDN:

```jsonc
// Claude Code: ~/.claude.json  ·  Cursor: ~/.cursor/mcp.json  ·  Claude Desktop: config
{ "mcpServers": { "inspo": { "command": "npx", "args": ["-y", "inspo-mcp"] } } }
```

Optional `env`: `TOGETHER_API_KEY` (enables query-embedding semantic search) and
`INSPO_CATALOGUE_URL` (point at a self-hosted catalogue).

> Running `npx -y inspo-mcp` by hand looks like it does nothing: an MCP server
> speaks JSON-RPC on stdin/stdout and prints nothing on its own. From a
> terminal it now prints these install instructions instead (`--help`,
> `--version`; `--stdio` forces the server). It is meant to be *launched by a
> client*, so add it with one of:
>
> ```bash
> claude mcp add inspo -- npx -y inspo-mcp
> ```

### Local (stdio, from a clone)

The bin shim boots the TS server via `tsx` - no build step.

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

Restart the client; the agent gains all the tools above.

## MCP registry

The server is described by [`server.json`](./server.json) for the official
MCP registry (name: `io.github.nutlope/inspo`), covering both the npm
stdio package and the hosted streamable-http endpoint. To publish or
update the listing (needs the GitHub account that owns the repo):

```bash
brew install mcp-publisher
cd apps/mcp
mcp-publisher login github
mcp-publisher publish
```

Note: the npm package must be published with the matching `mcpName`
field first (build-npm.mjs stamps it), and `server.json`'s versions
should match the published package version.

Telemetry: the hosted Worker records per-tool usage counts and
durations only (no IPs, no query text). Local stdio/npx servers emit
zero telemetry.

## Open-source models (Kimi K2.7, GLM 5.2, Qwen, DeepSeek V4, MiniMax)

The server ships a second profile tuned to the harnesses OSS models
actually run in. Two independent knobs:

| Env var | Values | What it does |
|---|---|---|
| `INSPO_PROFILE` | `full` (default) / `lite` | `full` exposes 16 tools; `lite` exposes the 9 highest-leverage tools (`recommend`, `search_screens`, `get_screen`, `get_design_system`, `find_examples_for_macrostructure`, `find_reference_components`, `study`, `get_site_pages`, `get_filters`). Small models pick tools more reliably from a short list. |
| `INSPO_IMAGES` | `thumbs` (default) / `none` | `none` returns text-only responses: no inline image blocks. Use it when the harness drops MCP images (Cline, OpenCode with a non-vision model) or the model is text-only (MiniMax, DeepSeek). Each result still carries the `autopsy` text (fold-composition breakdown), `northstar`, palette, and fonts, so the model "sees" through text. On the text-only profile (`images=none`) the list tools return a lean shape (`northstar` + palette + fonts); pass `detail:"full"` or call `get_screen` for the full autopsy. Inline images are PNG / JPEG / WebP (never AVIF). |
| `INSPO_MAX_TOKENS` | unset (default) / an integer, 300-200000 | Hard ceiling on what one tool response may spend. Results are formatted concise, then the ranked tail is dropped, then inline thumbnails, until the response fits; the top result and every scalar field (tips, filters, hero guidance) always survive, and trimmed responses carry a `budgetNote` saying how many entries were dropped. Set this when the context window is tight. Every list tool also takes a per-call `maxTokens` argument, which wins over the env var. |

### Why a budget matters more here than for a text-only MCP

Tool results do not cost you once: they stay in the conversation and are
re-read on every subsequent turn. In our own A/B evaluation, cache reads
ran 3.3x cache writes, so a result pulled early is paid for many times
over. Inline images are the dominant term - one `recommend` call is
~10 KB of text with images off and ~41 KB with thumbnails on - which is
why the cheapest lever is fewer, better-targeted calls, and the second
cheapest is `images=none`. `INSPO_MAX_TOKENS` is the backstop for when
neither is under your control.

**Zero-config defaults:** when neither knob is set, the server reads the
client name from the MCP handshake. Kimi CLI, OpenCode, Cline, Roo,
Crush, Goose, Aider, Continue, Droid, and iFlow get `lite` + text-only;
Kilo and Qwen Code get `lite` + thumbnails (their image path works);
everything else (Claude Code, Cursor, ...) keeps `full` + thumbnails.
Env vars always win. The hosted endpoint now defaults to `lite` + `images=none` (OSS-first: the stateless HTTP transport can't read the client name, and most hosted callers are OSS-model harnesses); vision clients opt up with `https://.../mcp?profile=full&images=thumbs`. Text-only OSS models (GLM 5.2, DeepSeek V4) and the harnesses above get `lite` + text automatically.

Schemas are flat (no `$ref`, no `$schema`, no `additionalProperties`)
to satisfy strict validators (Moonshot's API, Together's
function-calling layer, vLLM/xgrammar constrained decoding), and
argument parsing is tolerant: `"Dark"`, `"Bento Grid"`, `limit: "8"`,
out-of-range limits, and bare domains (`stripe.com`) are all accepted.
Slug misses return `didYouMean` suggestions so the model can
self-correct in one step.

```jsonc
// Example: Kimi CLI (~/.kimi/mcp.json), explicit; auto-detection
// would land on the same settings
{
  "mcpServers": {
    "inspo": {
      "command": "npx",
      "args": ["-y", "inspo-mcp"],
      "env": { "INSPO_PROFILE": "lite", "INSPO_IMAGES": "none" }
    }
  }
}
```

## Run / develop

```bash
pnpm --filter @inspo/mcp start            # stdio server
pnpm --filter @inspo/mcp test             # smoke test - boots in-process, calls every tool
pnpm --filter @inspo/mcp inspect          # MCP Inspector UI
```

### Deploy the hosted endpoint

The MCP is exposed as a Next.js Route Handler in the web app, so it ships with
the site's Vercel deployment - deploying `apps/web` deploys the endpoint too.
Once the site is up, point clients at:

```
https://<your-domain>/api/mcp
```

The route serves the seed bundled into the web build and fetches the embedding
sidecar from the CDN once per lambda for the vector tools (`INSPO_CATALOGUE_URL`
overrides the store). Re-run `publish-catalogue-to-blob.ts` after seed changes:

```bash
pnpm --filter @inspo/worker exec tsx src/publish-catalogue-to-blob.ts --go
```

## Security

- **Read-only.** No write/mutate tools; the server only reads the curated catalogue.
- **No secrets in the response surface.** The hosted route reads `DATABASE_URL` / tokens from Vercel environment variables (never returned to clients). `.env` is gitignored; only `.env.example` is tracked.
- **Free + unauthenticated, abuse-resistant.** The hosted endpoint needs no auth or API key; abuse is contained by a per-IP rate limit rather than gating. (Optional self-hosted auth still exists: set `ENFORCE_AUTH=1` + provision `api_keys` to require `Authorization: Bearer inspo_…`.)
- **`study(url)` fetches an arbitrary client-supplied URL server-side** (HTML + linked CSS only, no JS execution). Every URL (and every redirect) is validated by an SSRF guard before fetch: public http(s) named hosts only, no private / loopback / link-local / cloud-metadata or IP-literal targets, ports 80/443 only. The response body is byte-capped while streaming, and the hosted route adds a request body cap plus a per-IP rate limit.

## Publishing `npx inspo-mcp`

The build esbuild-bundles the stdio server into one self-contained file with a
clean, dependency-free `package.json` - the ~16MB seed is **not** bundled (it's
fetched from the CDN at runtime), so the package stays ~1.5MB.

```bash
pnpm --filter @inspo/mcp build:npm   # → apps/mcp/dist/ (inspo-mcp.mjs + package.json)
node apps/mcp/dist/inspo-mcp.mjs     # optional: smoke-test (speaks MCP on stdio)
cd apps/mcp/dist && npm publish       # needs `npm login`; publishes the public package
```

The monorepo `package.json` stays `private` - only the generated `dist/`
artifact is published, so nothing here leaks. Re-run `build:npm` (and
`publish-catalogue-to-blob.ts`) after seed changes, then bump `VERSION` in
`scripts/build-npm.mjs` and re-publish.

## Files

- `src/server.ts` - stdio entry (monorepo)
- `src/server-npm.ts` - standalone stdio entry for the published package (CDN catalogue)
- `src/http-handler.ts` - shared Streamable-HTTP handler (used by the Vercel route)
- `src/tools.ts` - all tool registrations + `HERO_GUIDANCE` (shared by all transports)
- `src/format.ts` - wire format (absolute URLs, inline image blocks, mobile fields)
- `src/call.ts` - one-shot CLI client (`tsx src/call.ts <tool> '<json>'`)
- `src/smoke.ts` - `pnpm test` · `scripts/build-npm.mjs` - `npx` bundle builder
