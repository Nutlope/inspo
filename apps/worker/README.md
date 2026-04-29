# @inspo/worker

The Playwright capture pipeline. Takes a URL, returns three viewports × hero+full PNGs, palette, fonts, tech fingerprint, AI tags, and embeddings.

## Setup

```bash
pnpm install
pnpm --filter @inspo/worker setup    # downloads Chromium (~170MB)
```

Optional API keys (set in repo-root `.env`):

| Var | What happens without it |
|---|---|
| `ANTHROPIC_API_KEY` | Skip AI tagging — captures still produced, no `tags` in output |
| `VOYAGE_API_KEY` | Skip embeddings — `hasEmbeddings: false` |
| `DATABASE_URL` | Skip Postgres persist — captures live as files only |

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
3. **Dismiss banners** — curated cookie selectors → `Accept all`-text buttons → CSS-hide overlays. Domain cache for Claude-suggested fallback (planned).
4. **Stabilize** — `document.fonts.ready`, slow scroll-to-bottom + back, pause animations.
5. **Capture** — three viewports × {hero, full}, content-hashed.
6. **Extract** — palette via node-vibrant, fonts via computed styles, tech via fingerprint table, mode via bg luminance.
7. **Save** — local FS at `captures/<slug>/`. R2 stub for prod.
8. **Tag** — Claude Sonnet 4.6 vision + structured tool-use, validated against the @inspo/taxonomy allow-lists.
9. **Embed** — Voyage `voyage-multimodal-3` (image+description) + `voyage-3-large` (text).
10. **Persist** — upsert into `screens` as status=pending; curator approves in `/admin/curator` (Task 5).

## Files

- `src/capture.ts` — orchestrator
- `src/dismiss.ts` — banner heuristics
- `src/stabilize.ts` — fonts/lazy-load/animation pause
- `src/screenshot.ts` — multi-viewport capture
- `src/extract.ts` — palette/fonts/tech/mode
- `src/storage.ts` — local FS adapter (+ R2 stub)
- `src/tag.ts` — Claude vision + tool-use
- `src/embed.ts` — Voyage REST
- `src/persist.ts` — Drizzle upsert
- `src/cli.ts` — `pnpm capture <url>` entrypoint
