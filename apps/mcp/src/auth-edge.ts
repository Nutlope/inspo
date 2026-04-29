/**
 * Edge-runtime API-key verification.
 *
 * The `lib/api-keys.ts` in apps/web uses Node's `crypto` for SHA-256.
 * Workers don't have node:crypto by default — use Web Crypto. The hash
 * of `<key>` must match what apps/web wrote on issuance, so we use the
 * same SHA-256 hex.
 */

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { schema } from "@inspo/db";

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyApiKeyEdge(
  key: string,
): Promise<{ userId: string } | null> {
  if (!key.startsWith("inspo_")) return null;
  const url = (globalThis as { process?: { env?: Record<string, string> } })
    .process?.env?.DATABASE_URL;
  if (!url) return null;

  const db = drizzle(neon(url));
  const hash = await sha256Hex(key);

  const rows = await db
    .select({
      id: schema.apiKeys.id,
      userId: schema.apiKeys.userId,
      revokedAt: schema.apiKeys.revokedAt,
    })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.keyHash, hash))
    .limit(1);

  const row = rows[0];
  if (!row || row.revokedAt) return null;

  // Fire-and-forget lastUsedAt update
  db.update(schema.apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(schema.apiKeys.id, row.id))
    .catch(() => {});
  return { userId: row.userId };
}
