# Deploy

Inspo ships to two surfaces, each picked for the runtime its workload actually needs.

| Surface | Where | Runs on | Why |
|---|---|---|---|
| Gallery + dashboard + hosted MCP | Vercel | `apps/web` | Next.js 16 SSR; the MCP endpoint is a route handler in the same app |
| Capture worker | Fly.io | `apps/worker` | Real Chromium needs a real VM |

Provision once in this order: **Neon, then Vercel, then Fly**. Each step depends on the previous.

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

The gallery is the only piece your users see directly. Deploy first so you can sign in and issue API keys before wiring Fly.

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

## 3. MCP - hosted with the site on Vercel

The hosted MCP is a Next.js Route Handler (`apps/web/src/app/api/mcp/route.ts`), so deploying the gallery deploys the endpoint too: there is no separate service. The route serves the seed bundled into the web build and fetches the embedding sidecar from the CDN once per lambda (`INSPO_CATALOGUE_URL` overrides the store). Optional env on the Vercel project: `TOGETHER_API_KEY` turns on semantic ranking for hosted callers.

After any seed change, re-publish the catalogue sidecar:
```bash
pnpm --filter @inspo/worker exec tsx src/publish-catalogue-to-blob.ts --go
```

Test:
```bash
curl -X POST https://<your-domain>/api/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
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

Every push to main triggers a Vercel build of `apps/web`, which redeploys the site and the hosted MCP endpoint together (the endpoint lives inside the web app, so never ignore `apps/mcp` changes in Vercel build filters).

For the capture worker, add a step that runs `flyctl deploy --config apps/worker/fly.toml --remote-only` with `FLY_API_TOKEN`.

---

## Cost ballpark (low-traffic)

| Surface | Free tier covers | Beyond that |
|---|---|---|
| Vercel | 100 GB-hours / mo | $20 / mo Pro |
| Fly.io | 3× shared 256MB VMs | $0.0000022 / s of `shared-cpu-2x@2gb` (~$15 / mo if always-on) |
| Neon | 0.5 GB storage, 191.9 compute-hours | $19 / mo Launch tier |
| Anthropic | — | ~$0.003 / capture (Sonnet vision call) |
| Voyage | $0.20 / M tokens | — |

Realistic monthly cost while seeding the catalogue (a few hundred captures): **~$0–$25**.
