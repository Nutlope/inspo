# Deploy

Inspo ships to three different surfaces — each picked for the runtime its workload actually needs.

| Surface | Where | Runs on | Why |
|---|---|---|---|
| Gallery + dashboard + admin | Vercel | `apps/web` | Next.js 16 SSR, Edge-compatible runtime |
| MCP server | Cloudflare Workers | `apps/mcp` | Edge-cached, zero cold starts, free egress |
| Capture worker | Fly.io | `apps/worker` | Real Chromium needs a real VM |

Provision once in this order: **Neon → Vercel → Cloudflare → Fly**. Each step depends on the previous.

---

## 1. Postgres (Neon)

1. Create a Neon project at <https://neon.tech>.
2. Copy the **pooled** connection string.
3. In your local `.env`:
   ```
   DATABASE_URL=postgres://…
   ```
4. Bootstrap the schema:
   ```bash
   pnpm db:migrate    # enables pgvector
   pnpm db:push       # pushes Drizzle schema
   pnpm db:seed       # loads the 16 fixtures
   ```

---

## 2. Gallery — Vercel

The gallery is the only piece your users see directly. Deploy first so you can sign in and issue API keys before wiring Cloudflare or Fly.

```bash
cd /path/to/inspo
npx vercel link            # follow prompts; pick "apps/web" as root
npx vercel env add DATABASE_URL          production
npx vercel env add BETTER_AUTH_SECRET    production   # any random 32+ chars
npx vercel env add BETTER_AUTH_URL       production   # e.g. https://inspo.example.com
npx vercel deploy --prod
```

`vercel.json` at [`apps/web/vercel.json`](apps/web/vercel.json) tells Vercel to build the workspace correctly via `pnpm --filter web... build`.

**Required env vars (production):**

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Neon pooled URL |
| `INSPO_BASE_URL` | Your Vercel domain (used by `metadataBase`, sitemap, MCP image URLs) |
| `TOGETHER_API_KEY` | Only needed if `/api/extract` is enabled |
| `BETTER_AUTH_SECRET` | Optional — only if you re-enable the curator/admin auth flow |

**About images.** The site renders fine in production without the local
captures dir — every image route falls back to a palette-gradient SVG
placeholder. To serve real screenshots in prod, upload the
`apps/worker/captures` directory to Vercel Blob or R2 and update the
`hero_image_key` / `full_image_key` / `thumb_image_key` columns in
`screens` with the resulting URLs. The placeholder + component routes
already prefer an `http(s)://` stored key over the local disk.

---

## 3. MCP — Cloudflare Workers

The Worker reads from the same Neon DB the gallery does and verifies bearer keys against the same `api_keys` table. No separate auth setup.

```bash
cd apps/mcp
npx wrangler login
npx wrangler secret put DATABASE_URL          # paste Neon pooled URL
npx wrangler secret put INSPO_BASE_URL        # paste your Vercel URL (used for image-URL absolutization)
npx wrangler deploy
```

To enforce auth:
```bash
npx wrangler secret put ENFORCE_AUTH          # set to "1"
```

Add a custom domain in `wrangler.toml` (`[[routes]]`) if you want `api.inspo.example.com`, otherwise use the workers.dev subdomain wrangler prints.

Test:
```bash
curl https://inspo-mcp.<account>.workers.dev/
# → "inspo-mcp · POST /mcp"

curl -X POST https://inspo-mcp.<account>.workers.dev/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -H 'authorization: Bearer inspo_xxx' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## 4. Capture worker — Fly.io

The worker needs a real Chromium and persistent disk for raw PNGs. We don't expose an HTTP port — you `fly ssh` in to run captures (or wire it to a queue later).

```bash
cd /path/to/inspo
brew install flyctl
fly auth login
fly launch --config apps/worker/fly.toml --no-deploy
fly secrets set \
  DATABASE_URL="$DATABASE_URL" \
  ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  VOYAGE_API_KEY="$VOYAGE_API_KEY"
fly deploy --config apps/worker/fly.toml
```

Run a capture:
```bash
fly ssh console --app inspo-worker -C "cd /app/apps/worker && pnpm capture https://linear.app"
```

Captures persist in the mounted `captures` Fly volume. To replace SVG placeholders with real R2-hosted assets, wire `apps/worker/src/storage.ts` to upload after writeLocal — TODO in v1.1.

---

## 5. Wire up clients

Once everything is live:
```bash
pnpm --filter inspo start init \
  --url=https://inspo.example.com \
  --key=inspo_<your-key>
```

…or have your users do `npx inspo init` after they sign up.

---

## CI / preview deploys

`apps/web/vercel.json` has an `ignoreCommand` so PRs that only touch `apps/worker` or `apps/mcp` don't trigger redundant Vercel builds.

For the MCP, set up GitHub Actions with `cloudflare/wrangler-action`:

```yaml
- uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CF_API_TOKEN }}
    workingDirectory: apps/mcp
    command: deploy
```

For the worker, add a step that runs `flyctl deploy --config apps/worker/fly.toml --remote-only` with `FLY_API_TOKEN`.

---

## Cost ballpark (low-traffic)

| Surface | Free tier covers | Beyond that |
|---|---|---|
| Vercel | 100 GB-hours / mo | $20 / mo Pro |
| Cloudflare Workers | 100k requests / day | $5 / mo + $0.30/M |
| Fly.io | 3× shared 256MB VMs | $0.0000022 / s of `shared-cpu-2x@2gb` (~$15 / mo if always-on) |
| Neon | 0.5 GB storage, 191.9 compute-hours | $19 / mo Launch tier |
| Anthropic | — | ~$0.003 / capture (Sonnet vision call) |
| Voyage | $0.20 / M tokens | — |

Realistic monthly cost while seeding the catalogue (a few hundred captures): **~$0–$25**.
