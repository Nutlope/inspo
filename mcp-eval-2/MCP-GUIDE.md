# Inspo MCP — how to consult it

Inspo is a curated archive of ~1,000 real production website screenshots,
queryable over MCP. The data has been enriched with real palettes, tags,
descriptions, and 1024-dim text embeddings. There are also **68 Hallmark-
stamped reference components** queryable as canonical JSX.

## Calling a tool

From anywhere, run:

```bash
cd /Users/youssef/Inspo-design/apps/mcp && pnpm exec tsx src/call.ts <tool> '<json-args>'
```

It prints a JSON result to stdout. Multi-result tools (search_screens,
find_examples_for_macrostructure, find_similar, find_components,
recommend) ALSO return inline image content blocks — when you call the
MCP, the **thumbnails come back as native image blocks you can see
directly. No need to curl + Read.**

## The headline tool: `recommend(brief)`

If you don't know what to call, call this. It composes search + macrostructure
pick + reference JSX + palette + 5 inline thumbs into one round-trip:

```bash
pnpm exec tsx src/call.ts recommend '{"brief":"calm meditation app for sleep"}'
```

Returns: `{ pick: {macrostructure, rationale}, exemplars: [...5 with palettes and inline thumbs], referenceComponents: [...canonical JSX], paletteSuggestion, tip }`.

Pass `macrostructure` explicitly if you've already picked one (e.g. via Hallmark):

```bash
pnpm exec tsx src/call.ts recommend '{"brief":"dev tool to ship faster","macrostructure":"workbench"}'
```

## All tools

| Tool | Args | Returns |
|---|---|---|
| **`recommend`** | `{brief, macrostructure?, pageType?, mode?, vibe?, color?}` | **One-shot moodboard** — pick + exemplars + reference JSX + palette + inline thumbs |
| `search_screens` | `{query, limit, style?, industry?, macrostructure?, mode?, vibe?, color?, pageType?}` | Hybrid lexical + cosine search; returns matching screens with inline thumbs |
| `find_examples_for_macrostructure` | `{name, limit}` | Real production sites embodying a named Hallmark macrostructure (with inline thumbs) |
| `find_reference_components` | `{type?, macro?}` | The 68 Hallmark-stamped reference components (canonical JSX). Filter by type for full source. |
| `get_reference_jsx` | `{type, id}` | Full canonical JSX source for one reference (includes the Hallmark stamp + JSDoc + export) |
| `study` | `{url}` | Live extraction of any URL: real fonts, palette, CSS variables, tech, DESIGN.md. Use for brands NOT in the catalogue. |
| `get_design_system` | `{slug, live?}` | DESIGN.md for one captured screen. Live-fetches the source URL to merge in real fonts + CSS variables. |
| `get_screen` | `{slug}` | Full record for one screen with inline thumb |
| `find_similar` | `{slug, limit}` | Visual / structural neighbours with inline thumbs |
| `find_components` | `{type, filters, limit}` | Component crops (when populated) |
| `list_collections` / `get_collection` | `{}` / `{slug}` | Editor-curated sets |

## Recipes

**One-shot moodboard from a brief:**
```bash
pnpm exec tsx src/call.ts recommend '{"brief":"editorial agency portfolio","limit":5}'
```

**Brand-specific study (URL not in catalogue):**
```bash
pnpm exec tsx src/call.ts study '{"url":"https://stripe.com"}'
```

**Full DESIGN.md for a captured site (live-merged tokens):**
```bash
pnpm exec tsx src/call.ts get_design_system '{"slug":"linear-app"}'
```

**Canonical JSX for a macrostructure:**
```bash
pnpm exec tsx src/call.ts get_reference_jsx '{"type":"hero","id":"marquee"}'
```

## How the image blocks work

Multi-result tools return text + N image content blocks. **Your vision
model sees these as native image inputs** — no decoding step. The
images come in the same order as the `results` array, so correlate
JSON ↔ image by index. Caps at 12 inline images per call.

## What's good vs. what's still limited

**Good:**
- Hybrid lexical + cosine search is excellent for conceptual queries.
- The 68 reference components are all Hallmark-stamped (state which macrostructure they embody).
- Tag distribution is decent (after Tier 1.1 enrichment).
- Inline images = no curl + Read roundtrips.

**Limited:**
- `find_components` returns thin until the component-extraction pipeline runs.
- Macrostructure tag precision is improved but not perfect (some sites still mislabelled).
- DB reads are disabled by default (`INSPO_USE_DB=1` to re-enable).
