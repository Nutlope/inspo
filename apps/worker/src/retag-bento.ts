/**
 * Re-tag every site currently labelled `bento-grid` with a stricter
 * "verify the label" prompt — the Tier 1.1 enrichment knocked bento
 * dominance from 63% → 33%, but 33% (1,274 sites) is still over the
 * realistic floor. The first pass anchored on first-position bias;
 * this pass is calibration.
 *
 * Strategy: keep the rubric from tag.ts, but front-load an explicit
 * "this was previously labelled bento-grid — only keep that label if
 * the page genuinely has 4+ small modular tiles in an irregular
 * grid. Otherwise pick the most accurate alternative." Use a fresh
 * Together call per site.
 *
 *   pnpm --filter @inspo/worker exec tsx src/retag-bento.ts          dry-run
 *   pnpm --filter @inspo/worker exec tsx src/retag-bento.ts --go     verify + re-tag
 *   pnpm --filter @inspo/worker exec tsx src/retag-bento.ts --go --concurrency=6
 *   pnpm --filter @inspo/worker exec tsx src/retag-bento.ts --go --limit=200   first N only
 *
 * Updates static-screens.json in place and propagates the new macro
 * to all child rows for each site (children inherit, just like in
 * enrich-archive.ts). Embeddings are NOT regenerated — the
 * description and tags don't change enough to warrant a re-embed.
 */

import "./env.js";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import Together from "together-ai";
import {
  STYLES,
  INDUSTRIES,
  COMPONENTS,
  VIBES,
  COLOR_WORDS,
  MACROSTRUCTURES,
  isMacrostructure,
} from "@inspo/taxonomy";

const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? join(process.cwd(), "captures"),
);
const SEED = resolve("../../packages/db/src/static-screens.json");
const MODEL = process.env.INSPO_VISION_MODEL ?? "google/gemma-3n-E4B-it";

type Row = {
  slug: string;
  siteSlug: string;
  title: string;
  tags?: { macrostructure?: string; [k: string]: unknown };
  [k: string]: unknown;
};

/** Compact macrostructure rubric for the verification prompt. */
const MACRO_DEFS: Record<(typeof MACROSTRUCTURES)[number], string> = {
  "bento-grid": "4+ small modular tiles in an irregular grid (varied sizes). Visual rhythm from tile-size variation. A page with one column, one big image, a code window, or a numbered list is NOT bento.",
  "long-document": "Continuous prose / memo / letter / journal. No marketing structure.",
  "marquee-hero": "One bold statement or visual fills the fold; below it shifts shape.",
  "stat-led": "Hero is a GIANT number / metric / percentage.",
  "workbench": "Product screenshots in frames are the primary content.",
  "conversational-faq": "Bold questions, brief answers. Often accordions.",
  "manifesto": "Polemical large type. Declaration energy.",
  "photographic": "A single huge image dominates each fold. Text is small annotation.",
  "quote-led": "Hero is a pull-quote with attribution.",
  "specimen": "Numbered left-margin labels, huge serif, asymmetric spans, hairline rules.",
  "catalogue": "Uniform grid of variations of the same thing (SKUs, swatches, typefaces).",
  "letter": "First-person opening (\"Dear …\"), intimate prose. No buttons in fold.",
  "index-first": "Page IS a list of links. No hero image.",
  "narrative-workflow": "Numbered stages 1.0 → 2.0 → 3.0. Process timeline.",
  "split-studio": "Diptych — text one side, proof the other, alternating.",
  "feature-stack": "Sticky left pane + scroll-synced right pane of cycling screenshots.",
  "type-specimen": "The TYPEFACE is the design. Foundry/specimen page.",
  "portfolio-grid": "Filterable cards of projects.",
  "map-diagram": "A single large spatial diagram organises the page.",
  "ecosystem-index": "Multiple discovery surfaces — featured / latest / by category.",
  "component-playground": "Interactive code + preview blocks as primary content.",
};

function tagSchema() {
  // Shuffle the macrostructure enum so the first-position anchor
  // bias doesn't show up again. (Same defence as the original
  // tagger.)
  const ms = [...MACROSTRUCTURES];
  for (let i = ms.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ms[i], ms[j]] = [ms[j]!, ms[i]!];
  }
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      verdict: { type: "string", enum: ["keep_bento", "replace"] },
      macrostructure: { type: "string", enum: ms },
      reason: { type: "string" },
    },
    required: ["verdict", "macrostructure", "reason"],
  };
}

const SYSTEM = [
  "You inspect website screenshots and verify a macrostructure label.",
  "A previous pass tagged this page as macrostructure='bento-grid'. The bento-grid label was over-applied; verify it is genuinely correct.",
  "",
  "DEFINITION OF BENTO GRID (strict): the page MUST have 4+ small modular tiles arranged in an IRREGULAR grid (varied tile sizes — some span 2 columns, some 1, etc.). Visual rhythm comes from size variation.",
  "If the page has ONLY ONE of: a single hero image, a single code window, a single long column, a sticky-pane scroll, a wordmark + paragraph, a numbered list, an alternating two-column rhythm, a giant number, a typographic specimen — it is NOT bento-grid.",
  "",
  "Output { verdict, macrostructure, reason }.",
  "  - verdict='keep_bento' iff you can count 4+ irregular tiles in the screenshot. macrostructure must then be 'bento-grid'.",
  "  - verdict='replace' otherwise. Pick the most accurate alternative from the rubric below.",
  "  - reason: one short sentence citing the visual evidence.",
  "",
  "Macrostructure rubric (re-read carefully before deciding):",
  ...MACROSTRUCTURES.map((m) => `  - ${m}: ${MACRO_DEFS[m]}`),
].join("\n");

function newestHero(slug: string): string | null {
  const dir = join(CAPTURES_DIR, slug);
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.startsWith("desktop-hero-") && f.endsWith(".png"));
  } catch {
    return null;
  }
  if (files.length === 0) return null;
  files.sort((a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs);
  return join(dir, files[0]!);
}

type Verdict = { verdict: "keep_bento" | "replace"; macrostructure: string; reason: string };

async function verifyOne(
  client: Together,
  png: Buffer,
  title: string,
  sourceUrl: string,
): Promise<Verdict | null> {
  const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
  const schema = tagSchema();
  try {
    const res = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 300,
      temperature: 0.1,
      response_format: {
        type: "json_object",
        schema: schema as unknown as Record<string, unknown>,
      },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUrl } },
            {
              type: "text",
              text: `Page: ${sourceUrl}\nTitle: ${title}\n\nVerify or replace the 'bento-grid' label. Return ONE JSON object matching the schema.`,
            },
          ],
        },
      ],
    });
    const text = res.choices?.[0]?.message?.content ?? "";
    if (!text) return null;
    let raw: Verdict;
    try {
      raw = JSON.parse(text);
    } catch {
      const stripped = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "");
      raw = JSON.parse(stripped);
    }
    if (raw.verdict !== "keep_bento" && raw.verdict !== "replace") return null;
    if (typeof raw.macrostructure !== "string" || !isMacrostructure(raw.macrostructure)) return null;
    return raw;
  } catch {
    return null;
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const go = argv.includes("--go");
  const concurrency = Number(argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 4);
  const limit = Number(argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 0);
  if (!process.env.TOGETHER_API_KEY) throw new Error("TOGETHER_API_KEY required");

  const rows = JSON.parse(readFileSync(SEED, "utf8")) as Row[];
  const bySite = new Map<string, Row[]>();
  for (const r of rows) {
    const list = bySite.get(r.siteSlug) ?? [];
    list.push(r);
    bySite.set(r.siteSlug, list);
  }

  // Pick the landing-page row per site and check whether it's bento.
  const candidates: { siteSlug: string; landing: Row; group: Row[] }[] = [];
  for (const [siteSlug, group] of bySite) {
    const landing = group.find((r) => r.slug === siteSlug) ?? group[0]!;
    if (landing.tags?.macrostructure === "bento-grid") {
      candidates.push({ siteSlug, landing, group });
    }
  }
  const sliced = limit > 0 ? candidates.slice(0, limit) : candidates;

  console.log(`\n  retag-bento · ${sliced.length} sites currently labelled bento-grid · go=${go}\n`);
  if (!go) {
    sliced.slice(0, 12).forEach((c) => console.log(`  · ${c.siteSlug}`));
    if (sliced.length > 12) console.log(`  …`);
    console.log("\n  dry-run. re-run with --go to verify.\n");
    return;
  }

  const client = new Together({
    apiKey: process.env.TOGETHER_API_KEY,
    baseURL: process.env.TOGETHER_BASE_URL ?? "https://api.together.ai/v1",
    timeout: 60_000,
  });

  let cursor = 0;
  let kept = 0;
  let replaced = 0;
  let missing = 0;
  let errors = 0;
  const newCounts = new Map<string, number>();
  const startedAt = Date.now();
  let sinceCheckpoint = 0;
  const CHECKPOINT_EVERY = 100;

  async function worker() {
    while (cursor < sliced.length) {
      const i = cursor++;
      const c = sliced[i]!;
      const tag = `[${String(i + 1).padStart(4, " ")}/${sliced.length}]`;
      const heroPath = newestHero(c.siteSlug);
      if (!heroPath) {
        missing += 1;
        continue;
      }
      try {
        const png = readFileSync(heroPath);
        const v = await verifyOne(client, png, String(c.landing.title ?? ""), String(c.landing.sourceUrl ?? ""));
        if (!v) {
          errors += 1;
          continue;
        }
        const newMacro = v.verdict === "keep_bento" ? "bento-grid" : v.macrostructure;
        newCounts.set(newMacro, (newCounts.get(newMacro) ?? 0) + 1);
        if (newMacro === "bento-grid") {
          kept += 1;
        } else {
          replaced += 1;
          // Propagate to every row in this site.
          for (const row of c.group) {
            const tags = (row.tags ?? {}) as Record<string, unknown>;
            tags.macrostructure = newMacro;
            row.tags = tags;
          }
          if (replaced <= 30 || replaced % 25 === 0) {
            console.log(
              `${tag} → ${c.siteSlug.padEnd(36)} ${"bento-grid".padEnd(18)} → ${newMacro.padEnd(18)} (${v.reason.slice(0, 50)})`,
            );
          }
        }
        sinceCheckpoint += 1;
        if (sinceCheckpoint >= CHECKPOINT_EVERY) {
          writeFileSync(SEED, JSON.stringify(rows, null, 0));
          sinceCheckpoint = 0;
          console.log(`       … checkpoint · ${kept + replaced} done · ${replaced} replaced`);
        }
      } catch (err) {
        errors += 1;
        if (errors < 5) console.log(`${tag} ✗ ${c.siteSlug.padEnd(36)} ${err instanceof Error ? err.message.slice(0, 60) : err}`);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  writeFileSync(SEED, JSON.stringify(rows, null, 0));
  const mins = ((Date.now() - startedAt) / 1000 / 60).toFixed(1);
  console.log();
  console.log(`  inspected ${kept + replaced} · kept ${kept} · replaced ${replaced} · missing ${missing} · errors ${errors} · ${mins} min`);
  console.log();
  console.log(`  new macrostructure distribution for the ${kept + replaced} sites:`);
  const sorted = [...newCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [m, n] of sorted) {
    const pct = ((n / (kept + replaced)) * 100).toFixed(0).padStart(3);
    console.log(`    ${pct}%  ${String(n).padStart(4)}  ${m}`);
  }
  // Use vars to satisfy unused-import linters in some configs.
  void STYLES;
  void INDUSTRIES;
  void COMPONENTS;
  void VIBES;
  void COLOR_WORDS;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
