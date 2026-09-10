/**
 * Generate a one-line "northstar" per site, an evocative 8 to 14 word
 * description of the design's soul (mood + palette + typographic
 * character). gallery ships these ("Rounded midnight marketplace…");
 * they're charming, quotable, and give the detail page + recommend()
 * a human voice.
 *
 * Writes `northstar` onto each landing row in static-screens.json.
 * Idempotent: skips rows that already have one unless --force.
 *
 *   pnpm tsx src/generate-northstars.ts --sample=12      validate quality
 *   pnpm tsx src/generate-northstars.ts --go             all missing
 *   pnpm tsx src/generate-northstars.ts --go --concurrency=4
 *   pnpm tsx src/generate-northstars.ts --go --force     regenerate all
 */

import "./env.js";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import Together from "together-ai";

// gemma-3n-E4B-it, the old default, is no longer served on Together.
const MODEL = process.env.INSPO_VISION_MODEL ?? "google/gemma-4-31B-it";
const CAPTURES_DIR = resolve(process.env.INSPO_CAPTURES_DIR ?? "./captures");
const SEED_PATH = resolve("../../packages/db/src/static-screens.json");

const SYSTEM_PROMPT = `You write a single evocative "northstar" line that captures a website's design soul (its mood, palette, and typographic character) the way a sharp art director would describe it in one breath.

Rules:
- 8 to 14 words. One line. No trailing period needed.
- Concrete and sensory: name the colour mood, the type personality, the spatial feel.
- NO marketing claims, NO the words "website"/"site"/"page", NO company name, NO quotes.
- Never use em dashes or en dashes; use commas.
- Think: "Rounded midnight marketplace, matte black tiles on a white tablecloth." or "Sun-bleached editorial calm, serif headlines drifting over generous warm paper."

Reply with ONLY a JSON object matching the schema.`;

const SCHEMA = {
  type: "object",
  required: ["northstar"],
  properties: { northstar: { type: "string" } },
} as const;

interface Row {
  slug: string;
  siteSlug: string;
  title?: string;
  description?: string;
  northstar?: string;
  palette?: string[];
  tags?: { style?: string[]; vibe?: string[]; macrostructure?: string };
  [k: string]: unknown;
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

async function generate(client: Together, row: Row): Promise<string | null> {
  const hero = newestHero(row.slug);
  if (!hero) return null;
  const dataUrl = `data:image/png;base64,${readFileSync(hero).toString("base64")}`;
  const hint = [
    row.title ? `Title: ${row.title}` : "",
    row.tags?.style?.length ? `Style: ${row.tags.style.join(", ")}` : "",
    row.tags?.vibe?.length ? `Vibe: ${row.tags.vibe.join(", ")}` : "",
    row.palette?.length ? `Palette: ${row.palette.slice(0, 5).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 80,
    temperature: 0.7,
    // Gemma 4 would otherwise spend the whole 80-token budget reasoning.
    // @ts-expect-error Together's reasoning switch is not in the SDK's types yet.
    reasoning: { enabled: false },
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
          { type: "text", text: `${hint}\n\nWrite the northstar.` },
        ],
      },
    ],
  });
  const raw = completion.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as { northstar?: string };
    // House style: no em/en dashes in repo file contents. The prompt
    // forbids them, and this catches the ones the model writes anyway.
    const dashes = new RegExp(`\\s*[${String.fromCharCode(0x2013, 0x2014)}]\\s*`, "g");
    const ns = (parsed.northstar ?? "")
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(dashes, ", ");
    return ns.length >= 4 ? ns : null;
  } catch {
    return null;
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const go = argv.includes("--go");
  const force = argv.includes("--force");
  const sample = Number(argv.find((a) => a.startsWith("--sample="))?.split("=")[1] ?? 0);
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 4,
  );
  if (!process.env.TOGETHER_API_KEY) throw new Error("TOGETHER_API_KEY required");

  const client = new Together({
    apiKey: process.env.TOGETHER_API_KEY,
    baseURL: process.env.TOGETHER_BASE_URL ?? "https://api.together.ai/v1",
    timeout: 60_000,
  });

  const rows: Row[] = JSON.parse(readFileSync(SEED_PATH, "utf8"));
  // One northstar per SITE (landing row). Sub-pages inherit at read time.
  let targets = rows.filter((r) => r.slug === r.siteSlug && (force || !r.northstar));
  if (sample > 0) targets = targets.slice(0, sample);

  console.log(`\n  northstars · model=${MODEL} · ${targets.length} sites · go=${go || sample > 0}\n`);

  let cursor = 0;
  let done = 0;
  let failed = 0;
  const results: { slug: string; northstar: string }[] = [];

  async function worker() {
    while (cursor < targets.length) {
      const r = targets[cursor++]!;
      try {
        const ns = await generate(client, r);
        if (ns) {
          r.northstar = ns;
          results.push({ slug: r.slug, northstar: ns });
          done++;
          if (done <= 20 || done % 50 === 0) console.log(`  ✓ ${r.slug.padEnd(32)} ${ns}`);
        } else {
          failed++;
        }
      } catch (err) {
        failed++;
        console.log(`  ✗ ${r.slug}: ${(err instanceof Error ? err.message : String(err)).slice(0, 60)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  console.log(`\n  generated ${done} · failed ${failed}`);

  // Propagate each site's northstar to its sub-page rows too.
  const bySite = new Map(results.map((x) => [x.slug, x.northstar]));
  for (const r of rows) {
    const ns = bySite.get(r.siteSlug);
    if (ns) r.northstar = ns;
  }

  if (!go && sample === 0) {
    console.log("\n  (no --go and no --sample, nothing written)");
    return;
  }
  if (sample > 0 && !go) {
    console.log("\n  (sample mode, NOT writing to seed; re-run with --go to persist)");
    return;
  }
  writeFileSync(SEED_PATH, JSON.stringify(rows, null, 2) + "\n");
  console.log(`  wrote northstars to ${SEED_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
