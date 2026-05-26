/**
 * Postgres client. Uses Neon's serverless driver so the same code path
 * runs in both Node (web SSR, worker, seed script) and edge runtimes
 * (Cloudflare Workers — for the MCP server).
 *
 * If DATABASE_URL is unset we don't construct a client — the queries
 * module falls back to fixtures so the gallery boots without Neon.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Whether read queries should hit Postgres at all.
 *
 * Default: **no** — the bundled static seed is the source of truth
 * for the curated archive. The whole-archive enrichment in PR 5
 * (tags + descriptions + embeddings sidecar) shipped into the static
 * seed; the DB has never been backfilled, so reads against Postgres
 * return thin / empty rows for most slugs and the MCP returns
 * dramatically worse results.
 *
 * Set `INSPO_USE_DB=1` to opt back into DB reads once the DB has been
 * populated to match (or exceed) the static seed.
 *
 * Note: this only governs READS. Writes (`updateScreenStatus`,
 * `updateScreenCuratorNote`, `persist` in the worker) still hit the
 * DB whenever DATABASE_URL is set — so the curator dashboard +
 * capture pipeline keep working.
 */
export function useDbReads(): boolean {
  return hasDatabase() && process.env.INSPO_USE_DB === "1";
}

export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Either configure Neon, or call queries that fall back to fixtures.",
    );
  }
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

export { schema };
