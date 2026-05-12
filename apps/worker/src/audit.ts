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
  hasModal: boolean;
  reason: string;
};

const SYSTEM_PROMPT = `You inspect website screenshots.

Reply true if ANY overlay, modal, popup, or banner is visibly BLOCKING or
OBSCURING the page content. Flag every one of these:

  1. Cookie / privacy / GDPR consent dialog
  2. Newsletter / email-capture popup ("Subscribe for 10% off")
  3. Promo / discount modal ("Sale ends in...", "Save 20%")
  4. Region / country / currency / language selector overlay
  5. Age gate ("Are you 21+?", "Confirm your age")
  6. Trial / signup / login full-screen splash forcing action before content
  7. Open chat widget (NOT the small closed bubble — an open conversation)
  8. Loading state or empty white page (content hasn't rendered)
  9. Ad / interstitial / paywall overlay
  10. Any centered modal dialog box with a backdrop dimming the page

These are FALSE (not flagged):
  - A small unobtrusive sticky bar at the edge that doesn't block the hero
  - A closed chat BUBBLE in a corner (just the icon, no open conversation)
  - A site that's genuinely minimal in its design language
  - Sticky nav at the top — that's just navigation
  - A cookie sliver pinned to the very bottom that takes <10% of viewport

If you see a centered popup/modal, flag it. If you see a discount banner
covering the hero, flag it. Be strict — when in doubt about whether
something blocks the page, FLAG IT.

Reply with ONLY a JSON object matching the schema.`;

const SCHEMA = {
  type: "object",
  required: ["hasModal", "reason"],
  properties: {
    hasModal: { type: "boolean" },
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
            text: 'Inspect this screenshot. Apply the 10-item checklist from the system prompt. Reply: {"hasModal": true|false, "reason": "<one short sentence; cite which item (1-10) if true>"}',
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
    parsed = { hasModal: false, reason: "(parse failed) " + raw.slice(0, 80) };
  }
  if (typeof parsed.hasModal !== "boolean")
    parsed = { hasModal: false, reason: "no boolean returned" };
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
        if (verdict.hasModal) {
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
    console.log("\n  no modal-bearing captures detected. nothing to do.\n");
    return;
  }

  // Always write the flagged list to a file so it can be reviewed/retried.
  const reportPath = join(
    process.cwd(),
    "captures",
    "_reports",
    `audit-flagged-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  try {
    const fs = await import("node:fs");
    fs.mkdirSync(join(process.cwd(), "captures", "_reports"), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(flagged, null, 2));
    console.log(`\n  flagged list written to ${reportPath}`);
  } catch (err) {
    console.warn(
      `\n  could not write flagged list: ${err instanceof Error ? err.message : err}`,
    );
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
