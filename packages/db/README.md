# @inspo/db

Schema, queries, and seed data for the Inspo archive. The gallery and the MCP server both go through this package.

## Provisioning

The gallery falls back to fixtures when `DATABASE_URL` is unset, so you can boot without a database. To run against real Postgres:

1. Create a Neon project at https://neon.tech (free tier is plenty).
2. Copy the **pooled** connection string into `.env` at the repo root:
   ```
   DATABASE_URL=postgres://…
   ```
3. Enable pgvector + push the schema:
   ```bash
   pnpm --filter @inspo/db db:migrate   # enables pgvector
   pnpm --filter @inspo/db db:push      # pushes schema
   pnpm --filter @inspo/db db:seed      # loads fixtures
   ```
4. Restart the web dev server. The gallery now reads from Postgres.

## Scripts

| Script | What |
|---|---|
| `db:migrate` | One-off — enables `vector` extension (pgvector). |
| `db:push` | Drizzle: push schema directly (best for prototyping). |
| `db:generate` | Drizzle: generate a versioned migration. |
| `db:seed` | Idempotent — upserts every screen + collection from fixtures. |
| `db:studio` | Drizzle Studio at `https://local.drizzle.studio`. |

## Files

- `src/schema.ts` — Drizzle table definitions
- `src/client.ts` — Neon HTTP driver wiring
- `src/queries.ts` — query layer with DB / fixtures fallback
- `src/fixtures.ts` — seed data (single source of truth)
- `src/seed.ts` — idempotent inserter
- `src/migrate.ts` — extension enabler
- `drizzle.config.ts` — drizzle-kit config
