/**
 * Vision quality pass: score every seed row's HERO capture 0-100 and
 * flag damage (cookie walls, blank loading states, error pages, ...).
 * Writes `qualityScore` + `qualityFlags` into static-screens.json.
 * Consumers gate softly via @inspo/db quality.ts: discovery surfaces
 * down-weight or skip, direct slug access never changes.
 *
 *   tsx src/generate-quality.ts --sample=30              calibration, no write
 *   tsx src/generate-quality.ts --go --concurrency=8
 *     [--force] [--slugs=a,b] [--model=...]
 *
 * Mechanics cloned from generate-autopsies.ts (snapshot, checkpoint
 * every 200, resumable via missing-field targeting) with
 * generate-northstars.ts's JSON-schema response_format.
 */

import "./env.js";
import {
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import Together from "together-ai";

const MODEL =
  process.argv.find((a) => a.startsWith("--model="))?.split("=")[1] ??
  process.env.INSPO_QUALITY_MODEL ??
  "google/gemma-3n-E4B-it";
const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? "./captures",
);
const SEED_PATH = resolve("../../packages/db/src/static-screens.json");

const FLAGS = [
  "cookie-wall",
  "modal",
  "blank-or-loading",
  "broken-images",
  "error-page",
  "cut-off",
  "nsfw",
] as const;

const SYSTEM_PROMPT = `You are a design-archive curator scoring website screenshot captures for a reference library that AI agents study.

Score the CAPTURE quality 0-100:
- 90-100: award-grade composition, clean capture, distinctive design worth studying.
- 70-89: strong, distinctive, clean capture.
- 40-69: competent but generic design, or minor capture blemishes.
- 15-39: badly damaged capture (large cookie banner over content, half-loaded imagery) or near-empty page.
- 0-14: worthless capture: blank/white/loading screen, error page, bot-check page.

Also emit flags (empty array when clean):
- "cookie-wall": a consent banner/overlay covers a MEANINGFUL part of the page.
- "modal": a dialog/newsletter popup covers content.
- "blank-or-loading": mostly empty background, skeletons, or spinners.
- "broken-images": missing-image icons or obvious failed loads.
- "error-page": 404/403/error/bot-check content.
- "cut-off": composition is clearly truncated mid-element at the top.
- "nsfw": adult content.

Judge ONLY what is visible. Reply with ONLY a JSON object matching the schema.`;

const SCHEMA = {
  type: "object",
  required: ["score", "flags"],
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    flags: {
      type: "array",
      items: { type: "string", enum: [...FLAGS] },
    },
    reason: { type: "string" },
  },
} as const;

interface Row {
  slug: string;
  siteSlug: string;
  title?: string;
  imageUrl?: string;
  qualityScore?: number;
  qualityFlags?: string[];
  heroVariants?: { webp?: { w: number; url: string }[] };
  [k: string]: unknown;
}

function localHero(slug: string): { path: string; mime: string } | null {
  const dir = join(CAPTURES_DIR, slug);
  if (!existsSync(dir)) return null;
  let files: string[];
  try {
    files = readdirSync(dir);
  } catch {
    return null;
  }
  const newest = (suffix: string): string | null => {
    let best: { p: string; m: number } | null = null;
    for (const f of files) {
      if (!f.startsWith("desktop-hero-") || !f.endsWith(suffix)) continue;
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
  };
  const webp768 = newest(".768.webp");
  if (webp768) return { path: webp768, mime: "image/webp" };
  const webp1440 = newest(".1440.webp");
  if (webp1440) return { path: webp1440, mime: "image/webp" };
  const png = newest(".png");
  if (png) return { path: png, mime: "image/png" };
  return null;
}

async function heroDataUrl(row: Row): Promise<string | null> {
  const local = localHero(row.slug);
  if (local) {
    return `data:${local.mime};base64,${readFileSync(local.path).toString("base64")}`;
  }
  const remote =
    row.heroVariants?.webp?.find((v) => v.w === 768)?.url ?? row.imageUrl;
  if (!remote) return null;
  try {
    const res = await fetch(remote);
    if (!res.ok) return null;
    const mime = res.headers.get("content-type") ?? "image/png";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

type Verdict = { score: number; flags: string[]; reason?: string };

async function judge(client: Together, row: Row): Promise<Verdict | null> {
  const dataUrl = await heroDataUrl(row);
  if (!dataUrl) return null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 160,
        temperature: 0.2,
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
                text: `${row.title ? `Title: ${row.title}\n` : ""}Score this capture.`,
              },
            ],
          },
        ],
      });
      const raw = completion.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as Partial<Verdict>;
      const score = Number(parsed.score);
      if (!Number.isInteger(score) || score < 0 || score > 100) throw new Error(`bad score ${parsed.score}`);
      const flags = (parsed.flags ?? []).filter((f): f is string =>
        (FLAGS as readonly string[]).includes(f),
      );
      return { score, flags, reason: parsed.reason };
    } catch (err) {
      if (attempt === 3) {
        console.log(
          `  ✗ ${row.slug}: ${(err instanceof Error ? err.message : String(err)).slice(0, 80)}`,
        );
        return null;
      }
      await new Promise((r) => setTimeout(r, 2500 * attempt));
    }
  }
  return null;
}

async function main() {
  const argv = process.argv.slice(2);
  const go = argv.includes("--go");
  const force = argv.includes("--force");
  const sample = Number(argv.find((a) => a.startsWith("--sample="))?.split("=")[1] ?? 0);
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 8,
  );
  const slugsArg = argv.find((a) => a.startsWith("--slugs="))?.split("=")[1];
  const only = slugsArg ? new Set(slugsArg.split(",")) : null;
  if (!process.env.TOGETHER_API_KEY) throw new Error("TOGETHER_API_KEY required");

  const client = new Together({
    apiKey: process.env.TOGETHER_API_KEY,
    baseURL: process.env.TOGETHER_BASE_URL ?? "https://api.together.ai/v1",
    timeout: 60_000,
  });

  const rows: Row[] = JSON.parse(readFileSync(SEED_PATH, "utf8"));
  let targets = rows.filter((r) => force || r.qualityScore == null);
  if (only) targets = targets.filter((r) => only.has(r.slug));
  if (sample > 0) targets = targets.slice(0, sample);

  console.log(
    `\n  quality · model=${MODEL} · ${targets.length} rows · go=${go} · concurrency=${concurrency}\n`,
  );
  if (targets.length === 0) return;

  if (go) {
    const snap = SEED_PATH.replace(
      /static-screens\.json$/,
      `static-screens.pre-quality-${Date.now()}.json`,
    );
    copyFileSync(SEED_PATH, snap);
    console.log(`  snapshot: ${snap}\n`);
  }

  let cursor = 0;
  let done = 0;
  let failed = 0;
  let inTokens = 0;
  const dist = new Map<number, number>(); // decile histogram
  const flagged: { slug: string; score: number; flags: string[]; reason?: string }[] = [];

  const save = () => writeFileSync(SEED_PATH, JSON.stringify(rows));

  async function worker() {
    while (cursor < targets.length) {
      const r = targets[cursor++]!;
      const v = await judge(client, r);
      if (!v) {
        failed++;
        continue;
      }
      if (go) {
        r.qualityScore = v.score;
        if (v.flags.length > 0) r.qualityFlags = v.flags;
        else delete r.qualityFlags;
      }
      done++;
      inTokens += 900; // ~768webp image + prompt, rough
      const decile = Math.min(9, Math.floor(v.score / 10));
      dist.set(decile, (dist.get(decile) ?? 0) + 1);
      if (v.flags.length > 0 || sample > 0)
        flagged.push({ slug: r.slug, score: v.score, flags: v.flags, reason: v.reason });
      if (sample > 0)
        console.log(
          `  ${String(v.score).padStart(3)} ${r.slug.padEnd(36)} ${v.flags.join(",") || "-"} ${v.reason ? `· ${v.reason.slice(0, 70)}` : ""}`,
        );
      else if (done % 100 === 0) {
        console.log(`  … ${done}/${targets.length} scored (${failed} failed)`);
        if (go) save();
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  if (go) save();

  console.log(`\n  scored ${done} · failed ${failed}`);
  console.log(
    `  distribution: ${[...Array(10).keys()]
      .map((d) => `${d * 10}s=${dist.get(d) ?? 0}`)
      .join(" ")}`,
  );
  const damaged = flagged.filter((f) =>
    f.flags.some((x) => ["blank-or-loading", "error-page", "broken-images", "nsfw"].includes(x)),
  );
  console.log(`  flagged: ${flagged.length} · damaged: ${damaged.length}`);
  for (const f of damaged.slice(0, 25))
    console.log(`    ${String(f.score).padStart(3)} ${f.slug} [${f.flags.join(",")}]`);
  if (!go) console.log(`\n  dry-run. re-run with --go to write the seed.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
