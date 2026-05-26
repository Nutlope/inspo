/**
 * Whole-archive enrichment. Reads static-screens.json, groups rows by
 * siteSlug, runs the vision tagger + text embedder ONCE per site (not
 * once per page — sub-pages reuse the parent site's tags), then writes
 * the enriched rows back. Resumable: rows that already carry tags +
 * embeddings are skipped unless --force.
 *
 * Why this exists: the shipped seed has 0 tags / 0 macrostructures /
 * 0 embeddings on 3,640 rows. The MCP's filter + vector-search surface
 * is dead until this runs. The eval (mcp-eval/REPORT.md) measured
 * exactly how much that costs in agent output quality.
 *
 *   pnpm --filter @inspo/worker exec tsx src/enrich-archive.ts             dry-run summary
 *   pnpm --filter @inspo/worker exec tsx src/enrich-archive.ts --go        enrich missing sites
 *   pnpm --filter @inspo/worker exec tsx src/enrich-archive.ts --go --sample=12   smoke test (12 sites)
 *   pnpm --filter @inspo/worker exec tsx src/enrich-archive.ts --go --slug=linear-app
 *   pnpm --filter @inspo/worker exec tsx src/enrich-archive.ts --go --force    re-tag everything
 *   pnpm --filter @inspo/worker exec tsx src/enrich-archive.ts --go --concurrency=6
 *
 * Cost on the default model (Together Gemma + e5-large): well under $1
 * for the full archive at the current 979-site size.
 */

import "./env.js";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { Vibrant } from "node-vibrant/node";
import { tagWithLLM } from "./tag.js";
import { embedText, EMBEDDING_DIMS } from "./embed.js";

type Row = {
  slug: string;
  siteSlug: string;
  title: string;
  sourceUrl: string;
  description?: string;
  palette?: string[];
  tags?: {
    style?: string[];
    industry?: string[];
    components?: string[];
    vibe?: string[];
    macrostructure?: string;
    hallmarkTheme?: string;
  };
  designSystem?: { colorWords?: string[]; [k: string]: unknown };
  [k: string]: unknown;
};

const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? join(process.cwd(), "captures"),
);
const SEED = resolve("../../packages/db/src/static-screens.json");

// Embeddings live in a binary sidecar — 1024-dim Float32 per site
// would be ~67 MB if inlined in the JSON (deal-breaker for the bundled
// fallback). Sidecar = ~4 MB binary + a tiny per-site index, lazy-
// loaded by the vector-search path in PR 7.
const EMBED_BIN = resolve("../../packages/db/src/embeddings.bin");
const EMBED_IDX = resolve("../../packages/db/src/embeddings.idx.json");

function newestHero(slug: string): string | null {
  const dir = join(CAPTURES_DIR, slug);
  let files: string[];
  try {
    files = readdirSync(dir).filter(
      (f) => f.startsWith("desktop-hero-") && f.endsWith(".png"),
    );
  } catch {
    return null;
  }
  if (files.length === 0) return null;
  files.sort(
    (a, b) => statSync(join(dir, b)).mtimeMs - statSync(join(dir, a)).mtimeMs,
  );
  return join(dir, files[0]!);
}

async function paletteOf(png: Buffer): Promise<string[]> {
  try {
    const v = await Vibrant.from(png).getPalette();
    return [
      v.Vibrant?.hex,
      v.DarkVibrant?.hex,
      v.LightVibrant?.hex,
      v.Muted?.hex,
      v.LightMuted?.hex,
    ]
      .filter((x): x is string => Boolean(x))
      .slice(0, 5);
  } catch {
    return [];
  }
}

/** A row "looks enriched" if it has a non-empty macrostructure OR
 *  style tag OR a real description. Used to skip on resume. */
function isEnriched(r: Row): boolean {
  return Boolean(
    r.tags?.macrostructure ||
      (r.tags?.style && r.tags.style.length > 0) ||
      (r.description && r.description.length > 8),
  );
}

/** Load existing sidecar (if any) into a slug → Float32Array map. */
function loadSidecar(): Map<string, Float32Array> {
  const out = new Map<string, Float32Array>();
  if (!existsSync(EMBED_BIN) || !existsSync(EMBED_IDX)) return out;
  try {
    const idx = JSON.parse(readFileSync(EMBED_IDX, "utf8")) as {
      slugs: string[];
      dims: number;
    };
    if (idx.dims !== EMBEDDING_DIMS) return out;
    const buf = readFileSync(EMBED_BIN);
    const view = new Float32Array(
      buf.buffer,
      buf.byteOffset,
      buf.byteLength / 4,
    );
    for (let i = 0; i < idx.slugs.length; i++) {
      out.set(
        idx.slugs[i]!,
        view.slice(i * EMBEDDING_DIMS, (i + 1) * EMBEDDING_DIMS),
      );
    }
  } catch {
    /* fresh start */
  }
  return out;
}

/** Write the slug → embedding map back as a binary sidecar. */
function writeSidecar(embeds: Map<string, Float32Array>) {
  const slugs = [...embeds.keys()].sort();
  const buf = new Float32Array(slugs.length * EMBEDDING_DIMS);
  for (let i = 0; i < slugs.length; i++) {
    const v = embeds.get(slugs[i]!);
    if (!v) continue;
    buf.set(v, i * EMBEDDING_DIMS);
  }
  writeFileSync(EMBED_BIN, Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength));
  writeFileSync(
    EMBED_IDX,
    JSON.stringify({ slugs, dims: EMBEDDING_DIMS, count: slugs.length }, null, 0),
  );
}

async function main() {
  const argv = process.argv.slice(2);
  const go = argv.includes("--go");
  const force = argv.includes("--force");
  const slugFilter = argv.find((a) => a.startsWith("--slug="))?.split("=")[1];
  const sample = Number(
    argv.find((a) => a.startsWith("--sample="))?.split("=")[1] ?? 0,
  );
  const concurrency = Number(
    argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? 4,
  );

  if (!process.env.TOGETHER_API_KEY) {
    throw new Error("TOGETHER_API_KEY required (tagging + embedding).");
  }

  const rows = JSON.parse(readFileSync(SEED, "utf8")) as Row[];
  const embeds = loadSidecar();

  // Group by siteSlug — one tag/embed call per unique site, results
  // propagate to all child --suffixed rows.
  const bySite = new Map<string, Row[]>();
  for (const r of rows) {
    const list = bySite.get(r.siteSlug) ?? [];
    list.push(r);
    bySite.set(r.siteSlug, list);
  }

  // Pick the candidate landing-page row per site (slug === siteSlug,
  // else the first row).
  let candidates: { siteSlug: string; landing: Row; group: Row[] }[] = [];
  for (const [siteSlug, group] of bySite) {
    const landing = group.find((r) => r.slug === siteSlug) ?? group[0]!;
    candidates.push({ siteSlug, landing, group });
  }

  if (slugFilter) {
    candidates = candidates.filter((c) => c.siteSlug === slugFilter);
  }
  if (!force) {
    // Skip sites whose landing is already enriched (resumability).
    candidates = candidates.filter((c) => !isEnriched(c.landing));
  }
  if (sample > 0) {
    candidates = candidates.slice(0, sample);
  }

  console.log(
    `\n  enrich-archive · ${candidates.length} sites to process ` +
      `(of ${bySite.size} total · ${rows.length} rows) · go=${go} · force=${force}\n`,
  );

  if (!go) {
    candidates.slice(0, 8).forEach((c) =>
      console.log(`  · ${c.siteSlug.padEnd(36)} (${c.group.length} pages)`),
    );
    if (candidates.length > 8) console.log(`  …`);
    console.log(`\n  dry-run. re-run with --go to enrich.\n`);
    return;
  }

  let cursor = 0;
  let done = 0;
  let missing = 0;
  let errors = 0;
  const macroCounts = new Map<string, number>();
  const startedAt = Date.now();
  // Periodic checkpoint: write the seed every N completed sites so
  // a kill mid-run doesn't lose work.
  const CHECKPOINT_EVERY = 25;
  let sinceCheckpoint = 0;

  async function worker() {
    while (cursor < candidates.length) {
      const i = cursor++;
      const c = candidates[i]!;
      const tag = `[${String(i + 1).padStart(4, " ")}/${candidates.length}]`;
      const heroPath = newestHero(c.siteSlug);
      if (!heroPath) {
        console.log(`${tag} ✗ ${c.siteSlug.padEnd(36)} no hero png`);
        missing += 1;
        continue;
      }
      try {
        const png = readFileSync(heroPath);
        const [tags, palette] = await Promise.all([
          tagWithLLM({
            heroPng: png,
            pageTitle: String(c.landing.title ?? c.siteSlug),
            pageDescription: "",
            sourceUrl: String(c.landing.sourceUrl ?? ""),
          }),
          paletteOf(png),
        ]);

        // Embed the description + keywords + tag terms. Used by the
        // vector-search swap (PR 7) — generated here so we never
        // need a second pass over the archive.
        const embedSource = [
          tags.description,
          tags.searchKeywords.join(" "),
          tags.style.join(" "),
          tags.industry.join(" "),
          tags.vibe.join(" "),
          tags.macrostructure ?? "",
          String(c.landing.title ?? ""),
        ]
          .filter(Boolean)
          .join(" — ");
        const embedding = await embedText(embedSource).catch(() => null);

        const desc = tags.searchKeywords.length
          ? `${tags.description}  ·  ${tags.searchKeywords.join(", ")}`
          : tags.description;
        const finalPalette = palette.length >= 3 ? palette : c.landing.palette;
        const tagsField = {
          style: tags.style,
          industry: tags.industry,
          components: tags.components,
          vibe: tags.vibe,
          ...(tags.macrostructure ? { macrostructure: tags.macrostructure } : {}),
          ...(tags.hallmarkTheme ? { hallmarkTheme: tags.hallmarkTheme } : {}),
        };

        // Propagate to every row in this site (landing + children).
        for (const row of c.group) {
          row.description = desc;
          if (finalPalette) row.palette = finalPalette;
          row.tags = tagsField;
          const ds = (row.designSystem ?? {}) as Record<string, unknown>;
          ds.colorWords = tags.colorWords;
          row.designSystem = ds as Row["designSystem"];
        }

        // Stash the embedding in the sidecar map (keyed by siteSlug —
        // children share the parent's embedding, just like they share
        // tags). Sidecar is written on checkpoint + at the end.
        if (embedding) {
          embeds.set(c.siteSlug, Float32Array.from(embedding));
        }

        macroCounts.set(
          tags.macrostructure ?? "—",
          (macroCounts.get(tags.macrostructure ?? "—") ?? 0) + 1,
        );
        done += 1;
        sinceCheckpoint += 1;
        console.log(
          `${tag} ✓ ${c.siteSlug.padEnd(36)} ${tags.macrostructure ?? "—".padEnd(18)} · ${tags.style.slice(0, 2).join("/") || "—"}`,
        );

        if (sinceCheckpoint >= CHECKPOINT_EVERY) {
          writeFileSync(SEED, JSON.stringify(rows, null, 0));
          writeSidecar(embeds);
          sinceCheckpoint = 0;
          console.log(`       … checkpoint written (${done} sites · ${embeds.size} embeddings)`);
        }
      } catch (err) {
        errors += 1;
        console.log(
          `${tag} ✗ ${c.siteSlug.padEnd(36)} ${err instanceof Error ? err.message.slice(0, 70) : err}`,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  writeFileSync(SEED, JSON.stringify(rows, null, 0));
  writeSidecar(embeds);
  const mins = ((Date.now() - startedAt) / 1000 / 60).toFixed(1);

  console.log();
  console.log(`  enriched ${done} sites · missing ${missing} · errors ${errors} · ${mins} min`);
  console.log(`  rows in seed: ${rows.length}`);
  console.log(`  embeddings in sidecar: ${embeds.size}`);
  console.log();
  console.log(`  macrostructure distribution this run:`);
  const sorted = [...macroCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [m, n] of sorted) {
    const pct = ((n / done) * 100).toFixed(0).padStart(3);
    console.log(`    ${pct}%  ${String(n).padStart(4)}  ${m}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
