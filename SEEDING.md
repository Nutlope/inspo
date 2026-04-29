# Seeding the catalogue

Replace the SVG placeholders with real captures of 50 hand-picked production sites. End-to-end, the run takes ~10–25 minutes and ~$0.20 in API spend (Anthropic + Voyage), depending on how many sites still load with cookie-banner roulette.

## Prerequisites

```bash
pnpm install
pnpm --filter @inspo/worker run playwright:install   # Chromium, ~170MB
```

## 1. Provision API keys

These three vars activate the full pipeline. Each is graceful-fallback — without it the worker still produces captures + metadata, just no AI tags / no embeddings / no DB persist.

Create `.env` at the repo root:

```env
# required for tagging
ANTHROPIC_API_KEY=sk-ant-...                # https://console.anthropic.com
# required for similarity search
VOYAGE_API_KEY=pa-...                       # https://docs.voyageai.com
# required to persist captures into the gallery / MCP
DATABASE_URL=postgres://...                 # Neon — see DEPLOY.md §1
```

If you want Better Auth to issue real API keys for the gallery dashboard:

```env
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
BETTER_AUTH_URL=http://localhost:3000
```

## 2. Bootstrap the database

One-time, against the Neon DB:

```bash
pnpm db:migrate    # enables pgvector
pnpm db:push       # pushes Drizzle schema
pnpm db:seed       # loads the 16 fixture screens (so the gallery has content while real captures are pending)
```

## 3. Curate the URL list

The 50 chosen sites live in [`apps/worker/src/seed-urls.ts`](apps/worker/src/seed-urls.ts). Edit freely — anything in there gets captured by the seed runner. Spread across industries, styles, and Hallmark macrostructures matters more than count.

Dry-run to confirm:

```bash
pnpm capture:seed
# → prints all 50 URLs without capturing
```

## 4. Pilot — capture 5 URLs

```bash
pnpm capture:seed --go --slice=5
```

Walks 5 of the 50 with concurrency 2. Each URL takes ~10–25s. Output:

- PNGs land in `apps/worker/captures/<slug>/`
- Tags + metadata logged to stdout
- JSON report at `apps/worker/captures/_reports/seed-<timestamp>.json`
- DB rows inserted as `status=pending`

Open `http://localhost:3000/admin/curator` to review the queue — sign in once at `/signin`, then `pnpm --filter @inspo/db promote you@example.com curator`.

## 5. Full run

```bash
pnpm capture:seed --go
```

About 10–25 min depending on networks + lazy-load complexity. Failed captures are listed in the final report — re-run them individually:

```bash
pnpm capture https://that-one-stubborn-site.com
```

## 6. Curator pass

For each pending screen at `/admin/curator`:

- **Approve** — promotes `status` to `published`. Now visible in `/screens` and queryable from the MCP.
- **Reject (with note)** — sets `status=rejected`. A future re-capture pass can pick these up.
- **Re-capture** — copies the `pnpm capture <url>` command. Paste into a worker terminal; tweak selector overrides via the worker's banner-dismissal cache (planned in v1.1).

## 7. Tags drift?

Allow-lists in [`packages/taxonomy/src/index.ts`](packages/taxonomy/src/index.ts) are the single source of truth. Claude is instructed to pick only from these enums and we validate every value before insert. If a curator notices a missing tag, add it there — both the worker prompt and the gallery filter rail pick it up automatically.

## What graceful-fallback looks like

| Missing | What still works |
|---|---|
| nothing | Full pipeline: PNGs + palette + fonts + tech + Claude tags + Voyage embeddings + DB persist |
| `ANTHROPIC_API_KEY` | Everything except `tags` (description, alt text, search keywords) |
| `VOYAGE_API_KEY` | Everything except `embeddings` (no visual / text similarity until backfilled) |
| `DATABASE_URL` | Everything except DB persist — captures live as files; review with `cat captures/_reports/...` |

## Cost ballpark

Per capture, when fully enriched:

- Claude Sonnet 4.6 vision tagging — ~$0.003
- Voyage `voyage-multimodal-3` + `voyage-3-large` — ~$0.0005
- Neon — within free tier
- Cloudflare R2 (when wired) — within free tier

50 captures full pipeline: **~$0.18**. Well under the cost of a coffee.
