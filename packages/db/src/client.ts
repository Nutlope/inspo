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
