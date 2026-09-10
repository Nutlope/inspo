# Deploy

Inspo ships to two surfaces, each picked for the runtime its workload actually needs.

| Surface | Where | Runs on | Why |
|---|---|---|---|
| Gallery + hosted MCP | Vercel | `apps/web` | Next.js 16 SSR; the MCP endpoint is a route handler in the same app |
| Capture worker | Fly.io | `apps/worker` | Real Chromium needs a real VM |

The gallery and the MCP read the catalogue from a static seed (`packages/db/src/static-screens.json`), so neither needs a database at query time. Postgres is optional: the capture worker can persist to it, and the curator dashboard reads it.

---

## 1. Postgres (Neon, optional)

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

## 2. Gallery: Vercel

The gallery is the only piece your users see directly, and it serves the hosted MCP endpoint too.

```bash
cd /path/to/inspo
npx vercel link            # follow prompts; pick "apps/web" as root
npx vercel env add BETTER_AUTH_SECRET    production   # any random 32+ chars
npx vercel env add BETTER_AUTH_URL       production   # e.g. https://inspo.example.com
npx vercel env add TOGETHER_API_KEY      production   # optional, see below
npx vercel deploy --prod
```

`vercel.json` at [`apps/web/vercel.json`](apps/web/vercel.json) tells Vercel to build the workspace correctly via `pnpm --filter web... build`.

**Environment variables (production):**

| Variable | Notes |
|---|---|
| `BETTER_AUTH_SECRET` | Required. The app refuses to boot in production without it, even though no sign-in page is exposed today |
| `BETTER_AUTH_URL` | Required, for the same reason: your production origin |
| `INSPO_BASE_URL` | Optional override. Defaults to `https://inspomcp.dev` on Vercel (used by `metadataBase`, sitemap, MCP image URLs) |
| `TOGETHER_API_KEY` | Optional. Turns on semantic ranking for hosted MCP callers and powers `/api/extract` |
| `INSPO_CATALOGUE_URL` | Optional. Where the MCP route fetches the embedding sidecar from; defaults to the public Blob store |
| `DATABASE_URL` | Optional. Only the curator dashboard reads it; everything else reads the static seed |

**About images.** Every row in the static seed carries absolute Vercel Blob URLs for its screenshots and their AVIF/WebP variants, so a fresh deploy shows real images with no extra setup. New captures reach Blob with `pnpm --filter @inspo/worker capture:upload-to-blob` (needs `BLOB_READ_WRITE_TOKEN`).

---

## 3. MCP: hosted with the site on Vercel

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

## 4. Capture worker: Fly.io

The worker needs a real Chromium and persistent disk for raw PNGs. We don't expose an HTTP port: you `fly ssh` in to run captures (or wire it to a queue later).

```bash
cd /path/to/inspo
brew install flyctl
fly auth login
fly launch --config apps/worker/fly.toml --no-deploy
fly secrets set \
  TOGETHER_API_KEY="$TOGETHER_API_KEY" \
  BLOB_READ_WRITE_TOKEN="$BLOB_READ_WRITE_TOKEN" \
  DATABASE_URL="$DATABASE_URL"   # optional
fly deploy --config apps/worker/fly.toml
```

Run a capture:
```bash
fly ssh console --app inspo-worker -C "cd /app/apps/worker && pnpm capture https://linear.app"
```

Captures persist in the mounted `captures` Fly volume; upload them to Vercel Blob with `pnpm --filter @inspo/worker capture:upload-to-blob`. [SEEDING.md](SEEDING.md) walks through the whole path from a URL list to a published catalogue.

---

## 5. Wire up clients

Point any MCP client at `https://<your-domain>/api/mcp`, for example:

```bash
claude mcp add --transport http inspo https://<your-domain>/api/mcp
```

(`npx -y inspo-mcp install` always writes the public inspomcp.dev endpoint.)

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
| Neon (optional) | 0.5 GB storage, 191.9 compute-hours | $19 / mo Launch tier |
| Together AI | Pay as you go | Tagging, autopsies and embeddings cost well under a cent per page |

Realistic monthly cost while seeding the catalogue (a few hundred captures): **~$0 to $25**.
