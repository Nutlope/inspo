# Inspo

A reference layer for AI coding agents: real production websites, queryable from your editor over MCP.

[inspo-three.vercel.app](https://inspo-three.vercel.app)

Inspo ships three things at once, addressable from one server:

1. **Visual range.** 2,141 hand-curated captures across 767 production sites, desktop and mobile, with palettes, type ramps, component breakdowns and a fold-by-fold autopsy on every screen. Your agent gets real designs to study, not generative slop to remix.
2. **Canonical code.** 68 Hallmark-disciplined reference components (heroes, pricing, footers, CTAs, features, nav, testimonials, logo clouds, FAQ, stats). Every example demonstrates one named macrostructure or archetype, stamped with its design provenance.
3. **Design systems on tap.** Every captured site gets a `DESIGN.md` extracted from its DOM: palette as semantic roles, type ramp by role, spacing scale, radius scale, CSS variables, container width. Your agent merges these tokens with the reference structures and the output looks like the brief, not like Inspo.

Most reference tools ship one of these. Inspo ships all three from a single MCP surface, which is what makes the combination useful to an agent that doesn't read your design system the way a human would.

## Install

Free, no account, no auth. The hosted endpoint is `https://inspo-mcp.luffixos.workers.dev/mcp`.

**Claude Code**

```bash
claude mcp add --transport http inspo https://inspo-mcp.luffixos.workers.dev/mcp
```

**Cursor, Windsurf, Codex, Zed and anything else** take either the hosted URL or the same server over stdio:

```bash
npx -y inspo-mcp
```

Per-client config snippets, plus a one-click Cursor deeplink and a live playground, are on [the MCP page](https://inspo-three.vercel.app/mcp).

## The tool surface

Sixteen tools. `recommend` is the one to reach for first: it composes most of the others into a single call.

| Tool | Returns |
|---|---|
| `recommend(brief, filters?)` | The orchestrator. A macrostructure pick plus the shortlist it came from, 5 real exemplars, 1 to 3 reference components, a palette, and an evidence packet measuring what the genre actually looks like. |
| `search_screens(query, filters?)` | Plain-language archive search: screenshots, palettes, fonts, components. |
| `find_similar(slug)` | Nearest design neighbours of a screen, by embedding. |
| `find_by_color(hex)` | Perceptual OKLAB colour search near a brand colour. |
| `find_examples_for_macrostructure(name)` | Real sites embodying one of the 21 named macrostructures. |
| `get_screen(slug)` | One screen's full record: every viewport, the fold-by-fold autopsy. |
| `get_design_system(slug)` | The `DESIGN.md`: fonts, ranked palette, type ramp, spacing, radii, CSS variables. |
| `study(url)` | Extract a design system from any live URL, for brands not in the catalogue. SSRF-guarded. |
| `compare(slugs[])` | Side-by-side breakdown of 2 to 4 sites, plus what they share. |
| `find_components(type)` | Real sites featuring a component type, with crops. |
| `find_reference_components(type?)` | The canonical reference JSX catalogue, stamped by macrostructure. |
| `get_reference_jsx(type, id)` | Full source for one reference component, copy-pasteable. |
| `get_site_pages(siteSlug?)` | A site's captured pages as an ordered flow, landing to pricing to features to auth. |
| `list_collections()` / `get_collection(slug)` | Editor-curated themed issues. |
| `get_filters()` | Every accepted filter and enum value, so the agent never guesses one. |

Clients that read images poorly get a text-first profile automatically, detected at handshake.

## A typical agent run

```
1. agent: "Build a pricing section for a calm B2B SaaS, technical tone."
2. -> recommend("calm B2B SaaS pricing, technical tone")
       returns a macrostructure pick, 5 exemplars with thumbnails,
       reference JSX, a palette, and the genre evidence packet.
3. -> get_design_system("linear-app")
       returns DESIGN.md: Linear's exact type ramp, palette, spacing.
4. agent merges the tokens with the reference structure and writes one file.
```

Two calls to start, every output grounded in real production craft.

## Stack

- **`apps/web`** Next.js 16 (App Router) + Tailwind v4. Gallery, components reference set, MCP install page, curator dashboard.
- **`apps/mcp`** TypeScript MCP server. Exposes the tools above over stdio, HTTP, and a Cloudflare Worker.
- **`apps/worker`** Playwright capture pipeline. Desktop and mobile, palette extraction, type-ramp inference, CSS variable scrape, tag and autopsy passes via Together.
- **`apps/cli`** config-rewriter (unpublished; the hosted URL and `npx inspo-mcp` cover install today).
- **`packages/db`** Drizzle schema, queries, and the static catalogue seed that ships in the bundle so the gallery renders without a DB connection.
- **`packages/taxonomy`** hard allow-lists for style, industry, vibe, colour, plus the three diversification axes (paper band, display class, accent hue band). Shared by worker and web.
- **`packages/shared`** cross-app types and the axis derivation.

The hosted instance runs on Neon + Vercel + Cloudflare. Every dependency has a free tier; the worker runs on any Node host with Chromium.

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

Want to add a reference component? Drop it in [`apps/web/src/components/reference/<type>/<id>.tsx`](apps/web/src/components/reference/), stamp it with its Hallmark macrostructure or archetype, and register it in [`apps/web/src/components/reference/index.ts`](apps/web/src/components/reference/index.ts). Two references in the same type group must differ on at least one structural axis (paper band, display style, accent application, or section count); the diversification rule keeps the page from drifting into colour-swaps of the same template.

## Licence

MIT. Owned and operated by [Together AI](https://www.together.ai). Free for everyone, no tiers, no paywall.

## Pairs with Hallmark

[Hallmark](https://github.com/Luffixos/hallmark) is an anti-slop design skill. With both installed, they split the work rather than negotiate over it: **Inspo designs, Hallmark checks.**

The agent designs the page from Inspo's references (structure, type, palette, composition) and writes the files. Then it invokes Hallmark over what it just wrote. Hallmark recognises a finished page and enters at its slop-test step instead of restarting its own design flow, so the page survives and the check still happens. Its Floor rules are not negotiable, so its corrections get taken rather than argued.

Two things make that check cheaper:

**Install the edit-time lint hook.** Hallmark ships one, and on this path it is the most automatic version available: it lints each `.html` / `.css` file the moment it lands rather than waiting for a sweep at the end, so findings arrive while the file is still fresh.

```bash
node <hallmark-skill-dir>/scripts/install-hook.mjs --global
```

It is advisory, never blocks a write, is idempotent, and comes off with `--remove`. Claude Code only.

**Inspo's output is already shaped for the gates it will meet.** The reference components emit `--color-accent` and `--color-accent-ink` under exactly those names, because they are the only colour tokens Hallmark's linter resolves by name; the accent/ink pairing clears its 4.5:1 contrast check in both light and dark. Component stamps use a `key= value` format that cannot be mistaken for a build stamp, so they never satisfy a gate on a page's behalf. And `HERO_GUIDANCE` names no eyebrow, since gate 54 is Floor and non-waivable: every eyebrow the guidance suggested would have been guaranteed rework.
