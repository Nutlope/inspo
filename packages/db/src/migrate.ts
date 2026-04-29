/**
 * Initialize a fresh Postgres database:
 *   1. enable the `vector` extension (pgvector)
 *   2. push the schema (drizzle-kit push runs separately)
 *
 * Run: pnpm --filter @inspo/db db:migrate
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: "../../.env" });
config({ path: "./.env" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. See .env.example.");
    process.exit(1);
  }

  const sql = neon(url);
  console.log("Enabling pgvector extension…");
  await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
  console.log("Done. Now run: pnpm --filter @inspo/db db:push");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
