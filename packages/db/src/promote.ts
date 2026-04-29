/**
 * One-off helper: promote a user to curator/admin role by email.
 *
 * Run: tsx packages/db/src/promote.ts <email> <role>
 *
 * Use after you've signed in for the first time (which created your
 * user row) — there's no public flow for self-promotion.
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { user } from "./schema";

config({ path: "../../.env" });
config({ path: "./.env" });

async function main() {
  const [, , email, roleArg] = process.argv;
  if (!email || !["member", "curator", "admin"].includes(roleArg ?? "")) {
    console.error("Usage: tsx packages/db/src/promote.ts <email> <member|curator|admin>");
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const db = drizzle(neon(url));
  const result = await db
    .update(user)
    .set({ role: roleArg as "member" | "curator" | "admin" })
    .where(eq(user.email, email))
    .returning({ email: user.email, role: user.role });

  if (result.length === 0) {
    console.error(`No user with email '${email}'. Have they signed in yet?`);
    process.exit(1);
  }

  console.log(`✓ ${result[0].email} → ${result[0].role}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
