# Inspo MCP — pure usage (no design-skill assist)

Inspo is a curated archive of ~1,000 real production website screenshots,
queryable over MCP. The data is enriched with real palettes,
descriptions, vibe / style tags, and text embeddings. Use it to ground
your design in **what real production sites actually do**.

## Calling a tool

```bash
cd /Users/youssef/Inspo-design/apps/mcp && pnpm exec tsx src/call.ts <tool> '<json-args>'
```

Returns JSON to stdout. For multi-result tools, **the result thumbnails
come back as native image content blocks alongside the JSON** — your
vision model sees them directly. No `curl` + `Read` needed.

## Allowed tools

| Tool | Args | Returns |
|---|---|---|
| `search_screens` | `{query, limit, mode?, vibe?, color?, industry?, style?, pageType?}` | Hybrid lexical + cosine search; matching screens with palettes + descriptions + inline thumbs |
| `find_similar` | `{slug, limit}` | Visual / structural neighbours of one screen, with inline thumbs |
| `get_screen` | `{slug}` | Full record for one screen with inline thumb |
| `get_design_system` | `{slug, live?}` | Live-merged DESIGN.md: palette + real fonts + CSS variables + tech |
| `study` | `{url}` | Live extraction of any URL: real fonts, palette, CSS variables, tech — for brands NOT in the catalogue |
| `list_collections` / `get_collection` | `{}` / `{slug}` | Editor-curated themed sets |
| `find_components` | `{type, limit, …}` | Component crops (sparse data — use sparingly) |

## DO NOT CALL (for this test)

These tools exist but are **off-limits** for this run:
- `recommend`
- `find_reference_components`
- `get_reference_jsx`
- `find_examples_for_macrostructure`

If returned JSON contains `macrostructure`, `hallmarkTheme`, or
`reference_*` fields — **ignore them**. Read only: the screenshots,
the palettes, the descriptions, the fonts, the vibes / styles.

## Recipes

Search by vibe / industry:
```bash
pnpm exec tsx src/call.ts search_screens '{"query":"warm editorial bakery","vibe":"warm","limit":6}'
```

Visual neighbours of one site:
```bash
pnpm exec tsx src/call.ts find_similar '{"slug":"aesop-com","limit":6}'
```

Real type + palette of a captured site:
```bash
pnpm exec tsx src/call.ts get_design_system '{"slug":"resend-com"}'
```

Live extraction of any URL (not in catalogue):
```bash
pnpm exec tsx src/call.ts study '{"url":"https://stripe.com"}'
```

## How to use it well

1. Run 2–4 searches with different framings to triangulate the genre.
2. For each promising result, look at the inline thumb (it comes back
   in the same response).
3. For the top 1–2, pull `get_design_system` for real type + palette.
4. Design from what you saw. Don't copy pixels; absorb the *taste*.
