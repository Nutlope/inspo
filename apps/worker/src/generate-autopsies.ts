/**
 * Generate a design "autopsy" per screen: a structured ~100-150 word
 * text breakdown of the first-viewport composition (FOLD / TYPE /
 * COLOR / SIGNATURE), written from the hero capture by a vision model.
 *
 * Why: text-only models (MiniMax, DeepSeek) and harnesses that drop
 * MCP image blocks (Cline, OpenCode with non-vision models) never see
 * our screenshots. The autopsy is their visual access: dense enough to
 * rebuild the layout without pixels. Surfaced via formatScreen() in
 * every MCP result, replacing thumbnails in the text-first profile.
 *
 * Writes `autopsy` onto each row in static-screens.json (per ROW, not
 * per site: sub-pages have their own layouts). Idempotent: skips rows
 * that already have one unless --force.
 *
 *   pnpm tsx src/generate-autopsies.ts --sample=8                  print, don't write
 *   pnpm tsx src/generate-autopsies.ts --sample=8 --model=Qwen/... compare models
 *   pnpm tsx src/generate-autopsies.ts --go                        all missing rows
 *   pnpm tsx src/generate-autopsies.ts --go --concurrency=8
 *   pnpm tsx src/generate-autopsies.ts --go --slugs=a,b,c          specific rows
 */

import "./env.js";
import {
  copyFileSync,
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import Together from "together-ai";

// Kimi K2.6: natively multimodal, the strongest open-weights design
// model, and (not incidentally) the only strong VLM serverless on our
// Together account. The autopsies that teach OSS models to see are
// themselves written by the best OSS design model.
const MODEL = process.env.INSPO_AUTOPSY_MODEL ?? "moonshotai/Kimi-K2.6";
const CAPTURES_DIR = resolve(process.env.INSPO_CAPTURES_DIR ?? "./captures");
const SEED_PATH = resolve("../../packages/db/src/static-screens.json");

const SYSTEM_PROMPT = `You dissect website screenshots for AI coding agents that CANNOT see images. Your autopsy is the only visual access they get; it must let them rebuild the first viewport's composition without pixels.

Write EXACTLY four labeled lines:
FOLD: the first-viewport composition. Nav (placement + contents). Headline (case treatment, alignment, approximate scale, line count, quote a few words verbatim). Supporting copy. CTA(s) (shape + label). Hero visual (what it is, which fraction of the viewport it occupies, where it sits). How headline and visual balance inside ~1280x800.
TYPE: display face character (serif/sans/mono, weight, width, any quirk) + body face; the scale jump between them; case or tracking signatures.
COLOR: background, text, and accent (reuse hexes from the palette hint when they match what you see); where the accent actually lands (buttons? links? rules? one highlighted word?).
SIGNATURE: the single most distinctive, copyable move on this screen, stated concretely enough to reproduce.

Rules: 100-150 words total. Telegraphic but precise. Name real things you SEE (words, shapes, alignments, counts). No marketing language, no "this design features", no hedging. If text is too small to read, describe its shape instead of guessing.`;

interface Row {
  slug: string;
  siteSlug: string;
  title?: string;
  description?: string;
  autopsy?: string;
  palette?: string[];
  fonts?: string[];
  mode?: string;
  imageUrl?: string;
  heroVariants?: { webp?: { w: number; url: string }[] };
  tags?: { style?: string[]; vibe?: string[]; macrostructure?: string };
  [k: string]: unknown;
}

/** Newest hero capture for a slug, smallest readable variant first:
 *  768 webp (~40 KB upload, text still legible) > 1440 webp > png. */
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

/** Data URL for the row's hero: local file preferred, remote fallback
 *  (768 webp variant, then the full hero PNG). */
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

function looksValid(text: string): boolean {
  return (
    text.length >= 250 &&
    text.length <= 1600 &&
    text.includes("FOLD:") &&
    text.includes("TYPE:") &&
    text.includes("COLOR:") &&
    text.includes("SIGNATURE:")
  );
}

const usage = { in: 0, out: 0 };

async function generate(client: Together, row: Row): Promise<string | null> {
  const dataUrl = await heroDataUrl(row);
  if (!dataUrl) return null;
  const hint = [
    row.title ? `Title: ${row.title}` : "",
    row.mode ? `Mode: ${row.mode}` : "",
    row.tags?.macrostructure ? `Macrostructure: ${row.tags.macrostructure}` : "",
    row.palette?.length ? `Palette: ${row.palette.slice(0, 6).join(", ")}` : "",
    row.fonts?.length ? `Fonts: ${row.fonts.slice(0, 4).join(", ")}` : "",
    row.tags?.vibe?.length ? `Vibe: ${row.tags.vibe.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 420,
        temperature: 0.4,
        // Together serves K2.6 in thinking mode by default; reasoning
        // would eat the whole completion budget before any content.
        // Pass-through param (not in the SDK's types yet).
        ...({ chat_template_kwargs: { thinking: false } } as Record<string, unknown>),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              { type: "text", text: `${hint}\n\nWrite the autopsy.` },
            ],
          },
        ],
      });
      const u = completion.usage;
      usage.in += u?.prompt_tokens ?? 0;
      usage.out += u?.completion_tokens ?? 0;
      const raw = (completion.choices?.[0]?.message?.content ?? "")
        .trim()
        // some models wrap output in a fence or add a preamble line
        .replace(/^```[a-z]*\n?|```$/g, "")
        // house style: no em/en dashes anywhere in repo file contents
        .replace(/\s*[—–]\s*/g, " - ")
        .trim();
      const start = raw.indexOf("FOLD:");
      const text = start > 0 ? raw.slice(start).trim() : raw;
      if (looksValid(text)) return text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt === 2) throw new Error(msg.slice(0, 120));
      await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
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
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 6,
  );
  const onlySlugs = argv
    .find((a) => a.startsWith("--slugs="))
    ?.split("=")[1]
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!process.env.TOGETHER_API_KEY) throw new Error("TOGETHER_API_KEY required");

  const client = new Together({
    apiKey: process.env.TOGETHER_API_KEY,
    baseURL: process.env.TOGETHER_BASE_URL ?? "https://api.together.ai/v1",
    timeout: 120_000,
  });

  const rows: Row[] = JSON.parse(readFileSync(SEED_PATH, "utf8"));
  let targets = rows.filter((r) => force || !r.autopsy);
  if (onlySlugs?.length) targets = targets.filter((r) => onlySlugs.includes(r.slug));
  if (sample > 0) {
    // spread the sample across the catalogue, not just the head
    const step = Math.max(1, Math.floor(targets.length / sample));
    targets = targets.filter((_, i) => i % step === 0).slice(0, sample);
  }

  console.log(
    `\n  autopsies · model=${MODEL} · ${targets.length} rows · write=${go}\n`,
  );

  // Snapshot before the first destructive write, repo convention.
  if (go && targets.length > 0) {
    const backup = SEED_PATH.replace(/\.json$/, `.pre-autopsy-${Date.now()}.json`);
    copyFileSync(SEED_PATH, backup);
    console.log(`  backup: ${backup}\n`);
  }

  let cursor = 0;
  let done = 0;
  let failed = 0;
  const save = () => writeFileSync(SEED_PATH, JSON.stringify(rows, null, 2) + "\n");

  async function worker() {
    while (cursor < targets.length) {
      const r = targets[cursor++]!;
      try {
        const autopsy = await generate(client, r);
        if (autopsy) {
          r.autopsy = autopsy;
          done++;
          if (sample > 0) {
            console.log(`\n━━ ${r.slug} (${r.mode}, ${r.tags?.macrostructure ?? "?"})\n${autopsy}`);
          } else if (done <= 10 || done % 50 === 0) {
            console.log(`  ✓ ${done}/${targets.length} ${r.slug}`);
          }
          if (go && done % 200 === 0) save();
        } else {
          failed++;
          if (failed <= 10) console.log(`  ✗ ${r.slug}: no usable output/image`);
        }
      } catch (err) {
        failed++;
        if (failed <= 10) {
          console.log(
            `  ✗ ${r.slug}: ${(err instanceof Error ? err.message : String(err)).slice(0, 90)}`,
          );
        }
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const estCost = (usage.in * 1.2 + usage.out * 4.5) / 1e6; // K2.6 Together rates
  console.log(
    `\n  generated ${done} · failed ${failed} · tokens in=${usage.in} out=${usage.out} (~$${estCost.toFixed(2)} at K2.6 rates)`,
  );

  if (!go) {
    console.log("  (no --go: nothing written)\n");
    return;
  }
  save();
  console.log(`  wrote autopsies to ${SEED_PATH}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
