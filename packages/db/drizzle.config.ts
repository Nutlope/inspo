import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load .env from repo root + this package, so either works
config({ path: "../../.env" });
config({ path: "./.env" });

if (!process.env.DATABASE_URL) {
  console.warn(
    "[drizzle.config] DATABASE_URL not set — drizzle-kit will fail until it is.",
  );
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://placeholder",
  },
  strict: true,
  verbose: true,
});
