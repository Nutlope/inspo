/**
 * Targeted cookie-footer auditor for the 1,000 OLD homepages.
 *
 * Why this exists: full-page Gemma audits over-flag (~95% false
 * positives) because the model invents "centered modal dialogs"
 * everywhere. By cropping JUST the bottom 240px of the hero PNG
 * and asking a tight yes/no question, we get accurate signal on
 * the specific issue the user cares about - cookie/consent strips
 * pinned to the bottom of older captures.
 *
 *   pnpm capture:audit-cookie-strips                  dry-run
 *   pnpm capture:audit-cookie-strips --apply          flip flagged → rejected
 *   pnpm capture:audit-cookie-strips --concurrency=6
 *
 * Only inspects rows where slug == site_slug (homepage captures).
 * Writes flagged JSON for capture:recapture-flagged to pick up.
 */

import "./env.js";
import { readFileSync, mkdirSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";
import Together from "together-ai";
import { hasDatabase, getDb, schema } from "@inspo/db";
import { eq, sql, and } from "drizzle-orm";

const MODEL = process.env.INSPO_VISION_MODEL ?? "google/gemma-4-31B-it";
const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? "./captures",
);
const STRIP_HEIGHT = 240; // bottom 240px - where cookie footers live

const SYSTEM_PROMPT = `You inspect a thin horizontal strip cut from the BOTTOM of a website screenshot.

Reply true if the strip contains ANY visible text matching one of:
  • "cookie" / "cookies"
  • "consent"
  • "we use" / "we and our partners"
  • "GDPR" / "CCPA"
  • "privacy choices" / "manage preferences" / "manage cookies"
  • "tracking" (in the cookie sense)
  • An "Accept" / "Allow" / "Reject" button near privacy text

Reply false if the strip is just a footer with navigation links,
social media icons, newsletter signup, copyright line, or design.

Be strict. Cookie UI is what we're hunting; everything else is fine.
Return JSON only: {"hasCookieStrip": true|false, "reason": "<one short sentence>"}`;

const SCHEMA = {
  type: "object",
  required: ["hasCookieStrip", "reason"],
  properties: {
    hasCookieStrip: { type: "boolean" },
    reason: { type: "string" },
  },
} as const;

type Verdict = { hasCookieStrip: boolean; reason: string };

async function findHero(slug: string): Promise<string | null> {
  const dir = join(CAPTURES_DIR, slug);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) =>
    f.startsWith("desktop-hero-") && f.endsWith(".png"),
  );
  return files[0] ? join(dir, files[0]) : null;
}

async function cropBottom(pngPath: string): Promise<Buffer> {
  const img = sharp(pngPath);
  const meta = await img.metadata();
  const w = meta.width ?? 1440;
  const h = meta.height ?? 900;
  const stripH = Math.min(STRIP_HEIGHT, h);
  return img
    .extract({ left: 0, top: h - stripH, width: w, height: stripH })
    .png()
    .toBuffer();
}

async function inspect(client: Together, png: Buffer): Promise<Verdict> {
  const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 150,
    // @ts-expect-error Together's reasoning switch is not in the SDK's types yet.
    reasoning: { enabled: false },
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
            text: 'Check this bottom strip. Reply: {"hasCookieStrip": true|false, "reason": "<what text you saw>"}',
          },
        ],
      },
    ],
  });
  const raw = completion.choices?.[0]?.message?.content ?? "{}";
  let parsed: Verdict;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { hasCookieStrip: false, reason: "parse fail: " + raw.slice(0, 80) };
  }
  if (typeof parsed.hasCookieStrip !== "boolean") {
    parsed = { hasCookieStrip: false, reason: "no boolean returned" };
  }
  if (typeof parsed.reason !== "string") parsed.reason = "(no reason)";
  return parsed;
}

async function main() {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 6,
  );
  const slugsArg = argv.find((a) => a.startsWith("--slugs="));
  const slugFilter = slugsArg ? slugsArg.slice("--slugs=".length).split(",") : null;

  if (!hasDatabase()) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  if (!process.env.TOGETHER_API_KEY) {
    console.error("TOGETHER_API_KEY not set");
    process.exit(1);
  }

  const client = new Together({
    apiKey: process.env.TOGETHER_API_KEY,
    baseURL: process.env.TOGETHER_BASE_URL ?? "https://api.together.ai/v1",
    timeout: 60_000,
  });
  const db = getDb();

  // Only homepages - slug == site_slug. Skip pilot child captures (they
  // were recaptured with the new dismiss.ts earlier).
  const baseRows = await db
    .select({ slug: schema.screens.slug, title: schema.screens.title })
    .from(schema.screens)
    .where(
      and(
        eq(schema.screens.status, "published"),
        sql`slug = site_slug`,
      ),
    );
  const rows = slugFilter
    ? baseRows.filter((r) => slugFilter.includes(r.slug))
    : baseRows;

  console.log(`\n  cookie-strip audit · ${rows.length} homepages · apply=${apply}\n`);

  const flagged: Array<{ slug: string; title: string; reason: string }> = [];
  let cursor = 0;
  let done = 0;
  let missing = 0;
  let errors = 0;

  async function worker() {
    while (cursor < rows.length) {
      const idx = cursor++;
      const row = rows[idx]!;
      const tag = `[${String(idx + 1).padStart(4, " ")}/${rows.length}]`;
      try {
        const heroPath = await findHero(row.slug);
        if (!heroPath) {
          missing += 1;
          if (missing < 8) console.log(`${tag} · ${row.slug.padEnd(28)} no hero on disk`);
          continue;
        }
        const strip = await cropBottom(heroPath);
        const v = await inspect(client, strip);
        done += 1;
        if (v.hasCookieStrip) {
          flagged.push({ slug: row.slug, title: row.title, reason: v.reason });
          console.log(`${tag} ⚠ ${row.slug.padEnd(28)} ${v.reason.slice(0, 80)}`);
        } else if (done % 50 === 0) {
          console.log(`${tag}   ${row.slug.padEnd(28)} clean`);
        }
      } catch (err) {
        errors += 1;
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`${tag} ✗ ${row.slug.padEnd(28)} ${msg.slice(0, 70)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  console.log();
  console.log(`  inspected  ${done}`);
  console.log(`  flagged    ${flagged.length}  (${((flagged.length / Math.max(done, 1)) * 100).toFixed(1)}%)`);
  console.log(`  no hero    ${missing}`);
  console.log(`  errors     ${errors}`);

  if (flagged.length === 0) {
    console.log("\n  no cookie strips detected. nothing to do.\n");
    return;
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const reportDir = join(process.cwd(), "captures", "_reports");
  mkdirSync(reportDir, { recursive: true });
  const reportPath = join(reportDir, `audit-flagged-${ts}.json`);
  writeFileSync(reportPath, JSON.stringify(flagged, null, 2));
  console.log(`\n  flagged list written to ${reportPath}`);

  if (!apply) {
    console.log("\n  dry-run. next: pnpm capture:recapture-flagged --go --concurrency=3\n");
    return;
  }

  for (const f of flagged) {
    await db
      .update(schema.screens)
      .set({
        status: "rejected",
        curatorNote: `auto-flagged cookie strip: ${f.reason.slice(0, 200)}`,
      })
      .where(eq(schema.screens.slug, f.slug));
  }
  console.log(`  ${flagged.length} rows rejected.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
