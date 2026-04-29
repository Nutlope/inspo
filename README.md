# Inspo

Curated editorial archive of real-website screenshots, accessible to AI coding agents over MCP.

## Stack

- pnpm workspaces + Turborepo
- Next.js 15 (App Router) + Tailwind v4 + shadcn/ui — `apps/web`
- Postgres (Neon) + pgvector via Drizzle — `packages/db`
- Cloudflare Worker MCP server — `apps/mcp` (later)
- Playwright capture worker on Fly.io — `apps/worker` (later)
- CLI installer — `apps/cli` (later)

## Getting started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.
