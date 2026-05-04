/**
 * Audit pass — sends every published row's hero PNG to Together Gemma
 * vision and asks: "is there a cookie banner / chat widget / loading
 * splash visible?". Positives get auto-flagged status='rejected' with a
 * curator note so they drop out of /screens until reviewed.
 *
 * Run:
 *   pnpm --filter @inspo/worker audit             (dry-run, lists flagged)
 *   pnpm --filter @inspo/worker audit --apply      (commits status updates)
 *   pnpm --filter @inspo/worker audit --slugs=a,b  (audit specific slugs only)
 *
 * Cost: ~$0.0003 per row × 1000 rows = ~$0.30. Concurrency 4 keeps wall
 * time under 8 min on a warm Together endpoint.
 */

import "./env.js";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import Together from "together-ai";
import { hasDatabase, getDb, schema } from "@inspo/db";
import { eq } from "drizzle-orm";

const MODEL = process.env.INSPO_VISION_MODEL ?? "google/gemma-3n-E4B-it";
const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? "./captures",
);

type AuditVerdict = {
  hasBanner: boolean;
  reason: string;
};

const SYSTEM_PROMPT =
  "You inspect screenshots of website homepages and decide whether they contain a visible cookie/consent banner, a chat widget pop-up, or a 'loading…' splash that obscures the page. Reply with ONLY a JSON object matching the schema. Be conservative — only flag if the overlay is clearly visible.";

const SCHEMA = {
  type: "object",
  required: ["hasBanner", "reason"],
  properties: {
    hasBanner: { type: "boolean" },
    reason: { type: "string" },
  },
} as const;

async function findHero(slug: string): Promise<string | null> {
  const dir = join(CAPTURES_DIR, slug);
  if (!existsSync(dir)) return null;
  const fs = await import("node:fs");
  const files = await fs.promises.readdir(dir).catch(() => [] as string[]);
  const hero = files.find((f) => f.startsWith("desktop-hero-") && f.endsWith(".png"));
  return hero ? join(dir, hero) : null;
}

async function inspect(client: Together, png: Buffer): Promise<AuditVerdict> {
  const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 200,
    temperature: 0,
    response_format: {
      type: "json_object",
      schema: SCHEMA as unknown as Record<string, unknown>,
    },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: dataUrl } },
          {
            type: "text",
            text: 'Does this screenshot show a cookie banner, chat widget overlay, or loading splash that obscures the page? Reply: {"hasBanner": true|false, "reason": "<one short sentence>"}',
          },
        ],
      },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content ?? "{}";
  let parsed: AuditVerdict;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { hasBanner: false, reason: "(parse failed) " + raw.slice(0, 80) };
  }
  if (typeof parsed.hasBanner !== "boolean")
    parsed = { hasBanner: false, reason: "no boolean returned" };
  if (typeof parsed.reason !== "string") parsed.reason = "(no reason)";
  return parsed;
}

async function main() {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  const slugsArg = argv.find((a) => a.startsWith("--slugs="));
  const slugFilter = slugsArg ? slugsArg.slice(8).split(",") : null;
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 4,
  );

  if (!hasDatabase()) {
    console.error("DATABASE_URL not set — audit needs the live row list.");
    process.exit(1);
  }
  if (!process.env.TOGETHER_API_KEY) {
    console.error("TOGETHER_API_KEY not set — audit needs Together vision.");
    process.exit(1);
  }
  const client = new Together({
    apiKey: process.env.TOGETHER_API_KEY,
    baseURL: process.env.TOGETHER_BASE_URL ?? "https://api.together.ai/v1",
    timeout: 60_000,
  });
  const db = getDb();

  const rows = await db
    .select({ slug: schema.screens.slug, title: schema.screens.title })
    .from(schema.screens)
    .where(eq(schema.screens.status, "published"));
  const list = slugFilter
    ? rows.filter((r) => slugFilter.includes(r.slug))
    : rows;

  console.log(`\n  audit · ${list.length} published rows · apply=${apply}\n`);

  const flagged: Array<{ slug: string; title: string; reason: string }> = [];
  let cursor = 0;
  let done = 0;
  let missingHero = 0;
  let errors = 0;

  async function worker() {
    while (cursor < list.length) {
      const idx = cursor++;
      const row = list[idx];
      const tag = `[${String(idx + 1).padStart(4, " ")}/${list.length}]`;
      try {
        const heroPath = await findHero(row.slug);
        if (!heroPath) {
          missingHero += 1;
          console.log(`${tag} · ${row.slug.padEnd(28)} · no hero on disk — skip`);
          continue;
        }
        const png = readFileSync(heroPath);
        const verdict = await inspect(client, png);
        done += 1;
        if (verdict.hasBanner) {
          flagged.push({ slug: row.slug, title: row.title, reason: verdict.reason });
          console.log(`${tag} ⚠ ${row.slug.padEnd(28)} ${verdict.reason.slice(0, 80)}`);
        } else if (done % 25 === 0) {
          console.log(`${tag}   ${row.slug.padEnd(28)} clean`);
        }
      } catch (err) {
        errors += 1;
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`${tag} ✗ ${row.slug.padEnd(28)} audit error: ${msg.slice(0, 70)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  console.log();
  console.log(`  inspected  ${done}`);
  console.log(`  flagged    ${flagged.length}`);
  console.log(`  no hero    ${missingHero}`);
  console.log(`  errors     ${errors}`);

  if (flagged.length === 0) {
    console.log("\n  no banner-bearing captures detected. nothing to do.\n");
    return;
  }

  console.log();
  if (!apply) {
    console.log("  dry-run. re-run with --apply to flip status to 'rejected'.");
    console.log();
    return;
  }

  for (const f of flagged) {
    await db
      .update(schema.screens)
      .set({
        status: "rejected",
        curatorNote: `auto-flagged by audit: ${f.reason.slice(0, 200)}`,
      })
      .where(eq(schema.screens.slug, f.slug));
  }
  console.log(`  ${flagged.length} rows rejected.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
