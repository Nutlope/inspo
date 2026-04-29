# @inspo/worker

The Playwright capture pipeline. Takes a URL, returns three viewports × hero+full PNGs, palette, fonts, tech fingerprint, AI tags, and embeddings.

**Powered by Together AI** — same stack Hallmark runs on. One key, two endpoints (Qwen3-VL for vision, BGE for embeddings), flat per-token pricing.

## Setup

```bash
pnpm install
pnpm --filter @inspo/worker run playwright:install    # downloads Chromium (~170MB)
```

Optional env (set in repo-root `.env`):

| Var | What happens without it |
|---|---|
| `TOGETHER_API_KEY` | Skip both AI tagging AND embeddings — captures still produce PNGs + palette + fonts + tech, no `tags`, no embeddings. |
| `DATABASE_URL` | Skip Postgres persist — captures live as files only. |

## Run

```bash
# smoke test — no API keys needed
pnpm --filter @inspo/worker test:capture

# real URL
pnpm --filter @inspo/worker capture https://linear.app

# with options
pnpm --filter @inspo/worker capture https://linear.app --slug=linear --no-enrich --no-persist
```

Output goes to `apps/worker/captures/<slug>/`.

## Pipeline stages

1. **Launch** — Chromium, realistic UA / locale / timezone, viewport 1440×900.
2. **Navigate** — `waitUntil: 'networkidle'`, 30s timeout.
3. **Dismiss banners** — curated cookie selectors → `Accept all`-text buttons → CSS-hide overlays.
4. **Stabilize** — `document.fonts.ready`, slow scroll-to-bottom + back, pause animations.
5. **Capture** — three viewports × {hero, full}, content-hashed.
6. **Extract** — palette via node-vibrant, fonts via computed styles, tech via fingerprint table, mode via bg luminance.
7. **Save** — local FS at `captures/<slug>/`. R2 stub for prod.
8. **Tag** — Together AI (`Qwen/Qwen3-VL-8B-Instruct`) with JSON-schema response_format, validated against the @inspo/taxonomy allow-lists.
9. **Embed** — Together AI (`BAAI/bge-large-en-v1.5`, 1024-dim) over description + tags + keywords.
10. **Persist** — upsert into `screens` as status=pending; curator approves in `/admin/curator`.

## Files

- `src/capture.ts` — orchestrator
- `src/dismiss.ts` — banner heuristics
- `src/stabilize.ts` — fonts/lazy-load/animation pause
- `src/screenshot.ts` — multi-viewport capture
- `src/extract.ts` — palette/fonts/tech/mode
- `src/storage.ts` — local FS adapter (+ R2 stub)
- `src/tag.ts` — Together AI vision + structured output
- `src/embed.ts` — Together AI embeddings
- `src/persist.ts` — Drizzle upsert
- `src/cli.ts` — `pnpm capture <url>` entrypoint
- `src/seed.ts` — `pnpm capture:seed` batch runner over the 50-URL list
