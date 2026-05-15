# Inspo

A reference layer for AI coding agents — a thousand real production sites, queryable from your editor over MCP.

Inspo ships three things at once, addressable from one server:

1. **Visual range** — 1,019 hand-curated production captures (and counting), three viewports each, palettes + type ramps + tech fingerprints extracted. Your agent gets real designs to study, not generative slop to remix.
2. **Canonical code** — 28 Hallmark-disciplined reference components (heroes, pricing, footers, CTAs, features, nav, testimonials, logo clouds, FAQ, stats). Every example demonstrates one named macrostructure or archetype, stamped with its design provenance.
3. **Design systems on tap** — every captured site gets a `DESIGN.md` extracted from its DOM — palette as semantic roles, type ramp by role, spacing scale, radius scale, CSS variables, container width. Your agent merges these tokens with the reference structures and the output looks like the brief, not like Inspo.

Most reference tools ship one of these. Inspo ships all three, queryable from a single MCP surface — which is what makes the combination useful to an agent that doesn't read your design system the way a human would.

## Install for your agent

```bash
npx inspo init
```

Detects Claude Code, Cursor, Codex, and Zed configs and appends the server entry. Authenticates once via the browser. Free, no account required.

## The tool surface

| Tool | Returns |
|---|---|
| `search_screens(query, filters?)` | Image URLs + metadata. Filters: industry, style, mode, mood, color, page type. |
| `get_screen(id)` | A single screen's full record across viewports. |
| `find_similar(id_or_url)` | Visual neighbours of any captured site. |
| `find_examples_for_macrostructure(name)` | Real sites embodying a named Hallmark macrostructure (Bento, Specimen, Manifesto, Workbench…). |
| `find_components(type, filters?)` | Cropped component examples — heroes, pricing, footers — from real production sites. |
| `get_design_system(slug)` | The site's `DESIGN.md` — semantic palette, type ramp, spacing, CSS variables. |
| `list_collections()` / `get_collection(slug)` | Editor-curated themed sets. |

The new layer — reference components — surfaces via the website at [`/components`](https://inspo.design/components) today. The MCP tool that returns reference JSX directly is on the next-pass list.

## A typical agent run

```
1. agent: "Build a pricing section for a calm B2B SaaS, technical tone."
2. → search_screens("pricing dark technical", { mode: "dark" })
       returns 8 captures. Agent picks Linear's.
3. → get_design_system("linear-app")
       returns DESIGN.md — Linear's exact type ramp, palette, spacing.
4. → fetch /components/pricing
       reads the Hallmark-stamped table-comparison reference.
5. agent merges: Linear's tokens + the reference's structure.
       Writes one file, ships.
```

Three calls, ~5KB of context total, every output grounded in real production craft.

## Stack

- **`apps/web`** — Next.js 16 (App Router) + Tailwind v4. Gallery, components reference set, MCP install page, curator dashboard.
- **`apps/mcp`** — TypeScript MCP server. Exposes the tools above over stdio + HTTP.
- **`apps/worker`** — Bun + Playwright capture pipeline. Three viewports, palette extraction, type-ramp inference, CSS variable scrape, tag pass via Together Gemma vision.
- **`apps/cli`** — `npx inspo init` config-rewriter.
- **`packages/db`** — Drizzle schema, queries, static catalogue seed (`static-screens.json`, 3.1MB, ships in the bundle so the gallery renders without a DB connection).
- **`packages/taxonomy`** — Hard allow-lists for style, industry, vibe, color words. Shared by worker (for prompts) and web (for filter rail).
- **`packages/shared`** — Cross-app types.

The hosted instance runs on Neon + Vercel + Cloudflare Blob + Fly.io. Every dependency has a free tier; the worker runs on any Node host with Chromium.

## Self-host

```bash
git clone https://github.com/Luffixos/inspo.git
cd inspo
pnpm install
cp .env.example .env  # add NEON_DATABASE_URL, TOGETHER_API_KEY, blob token
pnpm db:push
pnpm capture:seed     # runs the curated seed list, ~2hr
pnpm dev              # localhost:3737
```

The full runbook is in [`DEPLOY.md`](DEPLOY.md). No telemetry; search logs are anonymised.

## Contribute

Want to add a site? Append it to [`apps/worker/src/seed-urls.ts`](apps/worker/src/seed-urls.ts) and open a PR. The bar: *does this make the archive better for someone building a website?*

Want to add a reference component? Drop it in [`apps/web/src/components/reference/<type>/<id>.tsx`](apps/web/src/components/reference/), stamp it with its Hallmark macrostructure / archetype, and register it in [`apps/web/src/components/reference/index.ts`](apps/web/src/components/reference/index.ts). Two references in the same type group must differ on at least one structural axis (paper band, display style, accent application, or section count) — the diversification rule keeps the page from drifting into colour-swaps of the same template.

## Licence

MIT. Owned and operated by [Together AI](https://www.together.ai). Free for everyone — no tiers, no paywall.

## Pairs with Hallmark

[Hallmark](https://github.com/Luffixos/hallmark) gives the agent a process; Inspo gives it the reference. Hallmark forces the agent through a design-context gate and asks it to pick one of 21 named macrostructures before writing code. With Inspo installed, the same agent can call `find_examples_for_macrostructure("Bento Grid")` at that exact step and get real production sites that embody it, plus the canonical Hallmark-disciplined Bento reference rendered live at `/components/features#bento`.
