/**
 * Strict modal-only audit. Walks the current catalogue's newest
 * desktop-hero per slug and asks a LARGE vision model (Qwen2.5-VL-72B
 * by default — far more reliable than the Gemma-3n edge model the
 * original audit used) a single, tightly-scoped question:
 *
 *   "Is a modal / popup / dialog card overlaying and obscuring the
 *    main page content?"
 *
 * The original audit-disk.ts over-flagged everything (cookie strips,
 * normal heroes, even minimal designs) at ~50% false-positive rate.
 * This pass is precision-oriented: it ONLY wants true blocking
 * overlays (newsletter popups, consent modals with backdrops, age
 * gates, region pickers shown as centered cards). It explicitly does
 * NOT flag: edge cookie bars, sticky nav, normal hero sections,
 * closed chat bubbles.
 *
 * Only audits slugs present in the current static seed (skips orphan
 * capture dirs). Writes a clean candidate list for the operator to
 * eyeball before deletion.
 *
 *   pnpm tsx src/audit-modals-strict.ts                  full run
 *   pnpm tsx src/audit-modals-strict.ts --slugs=a24films-com,...   subset
 *   pnpm tsx src/audit-modals-strict.ts --concurrency=4 --limit=50
 */

import "./env.js";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import Together from "together-ai";

// Larger VL models (Qwen2.5-VL-72B, Llama-4, gemma-3-27b) all require
// dedicated Together endpoints — not serverless on this account. So we
// use the same gemma-3n-E4B as the original audit, but the difference
// here is the PROMPT: one tightly-scoped modal question instead of a
// 10-item kitchen-sink checklist. That alone cuts the false-positive
// rate dramatically (verified on known cases). The flagged set is
// then eyeballed before anything is deleted.
const MODEL =
  process.env.INSPO_MODAL_MODEL ?? "google/gemma-3n-E4B-it";
const CAPTURES_DIR = resolve(process.env.INSPO_CAPTURES_DIR ?? "./captures");
const SEED_PATH = resolve("../../packages/db/src/static-screens.json");

const SYSTEM_PROMPT = `You are inspecting a screenshot of a website homepage.

Answer ONE question: is there a MODAL, POPUP, or DIALOG card overlaying
and obscuring the page content?

Reply hasModal=true ONLY when a distinct card/box floats ON TOP of the
page — typically with a dim/blurred backdrop behind it, often with a
close (×) button. Examples that ARE modals:
  - Newsletter / email signup popups ("Subscribe", "Get our emails")
  - Cookie/consent shown as a centered dialog WITH a backdrop
  - Age gates ("Are you 21+?")
  - Region / language pickers shown as a centered overlay card
  - Promo / discount popups
  - Any centered dialog that dims the rest of the page

Reply hasModal=false for ALL of these:
  - A thin cookie/consent BAR pinned to the top or bottom edge (no backdrop)
  - A normal hero section, even a bold or full-bleed one
  - Sticky navigation bars
  - A small CLOSED chat bubble in a corner
  - Banner strips that don't float over content
  - Genuinely minimal page designs

When unsure, lean false — we only want true blocking overlays.

Reply with ONLY a JSON object matching the schema.`;

const SCHEMA = {
  type: "object",
  required: ["hasModal", "kind", "reason"],
  properties: {
    hasModal: { type: "boolean" },
    kind: {
      type: "string",
      description:
        "If hasModal: one of newsletter|consent|age-gate|region|promo|other. Else empty.",
    },
    reason: { type: "string" },
  },
} as const;

type Verdict = { hasModal: boolean; kind: string; reason: string };

function seedSlugs(): Set<string> {
  const rows = JSON.parse(readFileSync(SEED_PATH, "utf8")) as {
    slug: string;
    siteSlug: string;
  }[];
  // Audit one hero per SITE — sub-pages share the parent's modal state.
  const sites = new Set<string>();
  for (const r of rows) if (r.slug === r.siteSlug) sites.add(r.siteSlug);
  return sites;
}

function newestHero(slug: string): string | null {
  const dir = join(CAPTURES_DIR, slug);
  if (!existsSync(dir)) return null;
  let files: string[];
  try {
    files = readdirSync(dir);
  } catch {
    return null;
  }
  let best: { p: string; m: number } | null = null;
  for (const f of files) {
    if (!f.startsWith("desktop-hero-") || !f.endsWith(".png")) continue;
    const p = join(dir, f);
    let m = 0;
    try {
      m = statSync(p).mtimeMs;
    } catch {
      continue;
    }
    if (!best || m > best.m) best = { p, m };
  }
  return best?.p ?? null;
}

async function inspect(client: Together, png: Buffer): Promise<Verdict> {
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
            text: 'Inspect this screenshot. Reply: {"hasModal": true|false, "kind": "...", "reason": "<one short sentence>"}',
          },
        ],
      },
    ],
  });
  const raw = completion.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as Verdict;
    return {
      hasModal: parsed.hasModal === true,
      kind: typeof parsed.kind === "string" ? parsed.kind : "",
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    };
  } catch {
    return { hasModal: false, kind: "", reason: `(parse failed) ${raw.slice(0, 80)}` };
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const slugsArg = argv.find((a) => a.startsWith("--slugs="));
  const slugFilter = slugsArg ? new Set(slugsArg.slice(8).split(",")) : null;
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 4,
  );
  const limit = Number(argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 0);

  if (!process.env.TOGETHER_API_KEY) {
    console.error("TOGETHER_API_KEY not set.");
    process.exit(1);
  }
  const client = new Together({
    apiKey: process.env.TOGETHER_API_KEY,
    baseURL: process.env.TOGETHER_BASE_URL ?? "https://api.together.ai/v1",
    timeout: 60_000,
  });

  let list = [...seedSlugs()].sort();
  if (slugFilter) list = list.filter((s) => slugFilter.has(s));
  if (limit > 0) list = list.slice(0, limit);

  console.log(`\n  strict-modal audit · model=${MODEL}`);
  console.log(`  ${list.length} sites · concurrency=${concurrency}\n`);

  const flagged: { slug: string; kind: string; reason: string }[] = [];
  let cursor = 0;
  let done = 0;
  let missing = 0;
  let errors = 0;

  async function worker() {
    while (cursor < list.length) {
      const idx = cursor++;
      const slug = list[idx]!;
      const tag = `[${String(idx + 1).padStart(4, " ")}/${list.length}]`;
      try {
        const hero = newestHero(slug);
        if (!hero) {
          missing++;
          continue;
        }
        const v = await inspect(client, readFileSync(hero));
        done++;
        if (v.hasModal) {
          flagged.push({ slug, kind: v.kind, reason: v.reason });
          console.log(`${tag} ⚠ ${slug.padEnd(34)} [${v.kind}] ${v.reason.slice(0, 70)}`);
        } else if (done % 50 === 0) {
          console.log(`${tag}   ${done} inspected · ${flagged.length} flagged`);
        }
      } catch (err) {
        errors++;
        console.log(`${tag} ✗ ${slug}: ${(err instanceof Error ? err.message : String(err)).slice(0, 60)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  console.log(`\n  inspected ${done} · flagged ${flagged.length} · missing ${missing} · errors ${errors}`);
  const reportDir = join(process.cwd(), "captures", "_reports");
  mkdirSync(reportDir, { recursive: true });
  const out = join(
    reportDir,
    `modal-strict-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  writeFileSync(out, JSON.stringify(flagged, null, 2));
  console.log(`  flagged → ${out}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
