# Seeding the catalogue

Replace the SVG placeholders with real captures of 50 hand-picked production sites. End-to-end, the run takes ~10–25 minutes and a few cents in API spend on **Together AI** (one key, both vision + embeddings), depending on how many sites still load with cookie-banner roulette.

## Prerequisites

```bash
pnpm install
pnpm --filter @inspo/worker run playwright:install   # Chromium, ~170MB
```

## 1. Provision API keys

Two vars activate the full pipeline. Each is graceful-fallback — without it the worker still produces captures + metadata, just no AI tags / no embeddings / no DB persist.

Create `.env` at the repo root:

```env
# Together AI — powers vision tagging (Qwen3-VL) + embeddings (BGE).
# One key, both endpoints. https://api.together.ai
TOGETHER_API_KEY=

# Neon Postgres — see DEPLOY.md §1
DATABASE_URL=postgres://...
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
| nothing | Full pipeline: PNGs + palette + fonts + tech + Together tags + Together embeddings + DB persist |
| `TOGETHER_API_KEY` | Everything except `tags` and `embeddings` |
| `DATABASE_URL` | Everything except DB persist — captures live as files; review with `cat captures/_reports/...` |

## Cost ballpark

Per capture, when fully enriched:

- Qwen3-VL-8B-Instruct vision tagging — ~$0.0003
- BAAI/bge-large-en-v1.5 embedding — ~$0.00002
- Neon — within free tier
- Cloudflare R2 (when wired) — within free tier

50 captures full pipeline: **~$0.02**. Together's open-weights pricing is roughly 10× cheaper than the Anthropic/Voyage path it replaced.
