/**
 * API key issuance + verification.
 *
 * Format: `inspo_<22-char base32>`. We store the SHA-256 hash and the
 * 8-char prefix; the plaintext is shown to the user exactly once on
 * creation. Consumers (the MCP) authenticate by sending the plaintext
 * and we hash + compare on each call.
 */

import { randomBytes, createHash } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { hasDatabase, getDb, schema } from "@inspo/db";

const KEY_PREFIX = "inspo_";

function generateKey(): string {
  // 16 random bytes → 22-char crockford-style base32
  const buf = randomBytes(16);
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let bits = 0,
    value = 0,
    out = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  return KEY_PREFIX + out.slice(0, 22).toLowerCase();
}

function hash(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function listApiKeys(userId: string) {
  if (!hasDatabase()) return [];
  return getDb()
    .select({
      id: schema.apiKeys.id,
      label: schema.apiKeys.label,
      keyPrefix: schema.apiKeys.keyPrefix,
      lastUsedAt: schema.apiKeys.lastUsedAt,
      createdAt: schema.apiKeys.createdAt,
      revokedAt: schema.apiKeys.revokedAt,
    })
    .from(schema.apiKeys)
    .where(
      and(eq(schema.apiKeys.userId, userId), isNull(schema.apiKeys.revokedAt)),
    )
    .orderBy(desc(schema.apiKeys.createdAt));
}

export async function createApiKey(
  userId: string,
  label: string,
): Promise<{ id: string; key: string; prefix: string }> {
  if (!hasDatabase()) {
    throw new Error(
      "DATABASE_URL must be set to issue API keys. See .env.example.",
    );
  }
  const key = generateKey();
  const prefix = key.slice(0, KEY_PREFIX.length + 4); // inspo_xxxx
  const inserted = await getDb()
    .insert(schema.apiKeys)
    .values({
      userId,
      keyHash: hash(key),
      keyPrefix: prefix,
      label: label.slice(0, 60) || "default",
    })
    .returning({ id: schema.apiKeys.id });
  return { id: inserted[0].id, key, prefix };
}

export async function revokeApiKey(userId: string, id: string) {
  if (!hasDatabase()) return;
  await getDb()
    .update(schema.apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.apiKeys.userId, userId), eq(schema.apiKeys.id, id)));
}

export async function verifyApiKey(
  key: string,
): Promise<{ userId: string } | null> {
  if (!hasDatabase()) return null;
  if (!key.startsWith(KEY_PREFIX)) return null;
  const rows = await getDb()
    .select({
      id: schema.apiKeys.id,
      userId: schema.apiKeys.userId,
      revokedAt: schema.apiKeys.revokedAt,
    })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.keyHash, hash(key)))
    .limit(1);
  const row = rows[0];
  if (!row || row.revokedAt) return null;
  // Fire-and-forget update of lastUsedAt
  getDb()
    .update(schema.apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(schema.apiKeys.id, row.id))
    .catch(() => {});
  return { userId: row.userId };
}
