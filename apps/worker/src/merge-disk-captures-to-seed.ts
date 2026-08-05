/**
 * Merge fresh disk captures into the static seed + embeddings sidecar.
 *
 * Walks captures/, finds every <slug>/meta.json whose siteSlug is NOT
 * yet in packages/db/src/static-screens.json, builds an enriched row
 * from the sidecar metadata + on-disk variant inventory, and appends
 * the row's text embedding to packages/db/src/embeddings.bin (with
 * idx.json updated in lockstep).
 *
 *   pnpm tsx src/merge-disk-captures-to-seed.ts          dry-run
 *   pnpm tsx src/merge-disk-captures-to-seed.ts --apply
 *
 * Idempotent: existing siteSlugs in the seed are never touched. Capture
 * dirs without meta.json are ignored (they weren't run through the
 * disk-only adder or the capture failed partway).
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..", "..");
const SEED_PATH = join(REPO_ROOT, "packages", "db", "src", "static-screens.json");
const IDX_PATH = join(REPO_ROOT, "packages", "db", "src", "embeddings.idx.json");
const BIN_PATH = join(REPO_ROOT, "packages", "db", "src", "embeddings.bin");
const CAPTURES_DIR = resolve(
  process.env.INSPO_CAPTURES_DIR ?? join(REPO_ROOT, "apps", "worker", "captures"),
);
const BLOB_BASE =
  process.env.INSPO_BLOB_BASE_URL ??
  "https://0nme3pk5am3urwa9.public.blob.vercel-storage.com/captures";

const EMBED_DIMS = 1024;
const APPLY = process.argv.includes("--apply");

// --from-file=path : merge ONLY the slugs listed (one per line). Without
// it, every capture dir with a meta.json not yet in the seed is merged —
// which silently re-adds sites you deliberately deleted, since their
// meta.json lingers on disk. Scope to a fresh-slug list to stay safe.
const FROM_FILE = process.argv
  .find((a) => a.startsWith("--from-file="))
  ?.split("=")[1];
const ONLY_SLUGS: Set<string> | null = FROM_FILE
  ? new Set(
      readFileSync(FROM_FILE, "utf8")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#")),
    )
  : null;

interface SeedRow {
  id: string;
  slug: string;
  siteSlug: string;
  [k: string]: unknown;
}

interface IdxFile {
  slugs: string[];
  dims: number;
  count: number;
}

interface MetaSidecar {
  sourceUrl: string;
  slug: string;
  siteSlug: string;
  pageType: string;
  capturedAt: string;
  meta: {
    palette?: string[];
    fonts?: string[];
    tech?: string[];
    mode?: string;
    pageTitle?: string;
    pageDescription?: string;
    designSystem?: Record<string, unknown>;
  };
  tags: {
    style?: string[];
    industry?: string[];
    components?: string[];
    vibe?: string[];
    macrostructure?: string;
  } | null;
  embeddings: { text: number[] } | null;
}

const VARIANT_WIDTHS = {
  hero: [384, 768, 1440] as const,
  full: [768, 1440] as const,
  thumb: [384] as const,
};

function inspectVariants(captureDir: string) {
  const out = {
    hero: { avif: [] as number[], webp: [] as number[] },
    full: { avif: [] as number[], webp: [] as number[] },
    thumb: { avif: [] as number[], webp: [] as number[] },
    lqip: undefined as string | undefined,
  };
  let files: string[];
  try {
    files = readdirSync(captureDir);
  } catch {
    return out;
  }
  for (const role of ["hero", "full", "thumb"] as const) {
    const prefix = role === "thumb" ? "tablet-hero-" : `desktop-${role}-`;
    const pngs = files
      .filter((f) => f.startsWith(prefix) && f.endsWith(".png"))
      .map((f) => ({ f, m: statSync(join(captureDir, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    if (pngs.length === 0) continue;
    const stem = pngs[0]!.f.slice(0, -".png".length);
    for (const w of VARIANT_WIDTHS[role]) {
      if (files.includes(`${stem}.${w}.avif`)) out[role].avif.push(w);
      if (files.includes(`${stem}.${w}.webp`)) out[role].webp.push(w);
    }
    if (!out.lqip) {
      const lqipPath = join(captureDir, `${stem}.lqip`);
      if (existsSync(lqipPath)) {
        try {
          const raw = readFileSync(lqipPath, "utf8").trim();
          if (raw.startsWith("data:image/avif;base64,") && raw.length < 4096) {
            out.lqip = raw;
          }
        } catch {
          /* ignore */
        }
      }
    }
  }
  return out;
}

function newestMtime(captureDir: string): number {
  try {
    return Math.max(
      ...readdirSync(captureDir)
        .map((f) => statSync(join(captureDir, f)).mtimeMs)
        .filter(Number.isFinite),
    );
  } catch {
    return Date.now();
  }
}

function rowFromSidecar(slug: string, meta: MetaSidecar) {
  const mtime = newestMtime(join(CAPTURES_DIR, slug));
  const v = Math.floor(mtime / 1000);
  const capturedAt = new Date(mtime).toISOString().slice(0, 10);
  const imageUrl = `${BLOB_BASE}/${slug}/hero.png?v=${v}`;
  const fullPageUrl = `${BLOB_BASE}/${slug}/full.png?v=${v}`;
  const thumbUrl = `${BLOB_BASE}/${slug}/thumb.png?v=${v}`;
  const variants = inspectVariants(join(CAPTURES_DIR, slug));
  const variantUrls = (role: "hero" | "full" | "thumb") => {
    const avif = variants[role].avif.map((w) => ({
      w,
      url: `${BLOB_BASE}/${slug}/${role}.${w}.avif?v=${v}`,
    }));
    const webp = variants[role].webp.map((w) => ({
      w,
      url: `${BLOB_BASE}/${slug}/${role}.${w}.webp?v=${v}`,
    }));
    if (avif.length === 0 && webp.length === 0) return undefined;
    return { avif, webp };
  };
  const heroV = variantUrls("hero");
  const fullV = variantUrls("full");
  const thumbV = variantUrls("thumb");

  const title = meta.meta.pageTitle?.trim() || slug;
  const description =
    [meta.meta.pageDescription, [meta.tags?.style, meta.tags?.industry, meta.tags?.components]
      .filter(Boolean)
      .flat()
      .filter(Boolean)
      .join(", ")]
      .filter(Boolean)
      .join("  ·  ") || "";

  return {
    id: slug,
    slug,
    siteSlug: meta.siteSlug,
    title,
    sourceUrl: meta.sourceUrl,
    capturedAt,
    imageUrl,
    fullPageUrl,
    thumbUrl,
    ...(heroV ? { heroVariants: heroV } : {}),
    ...(fullV ? { fullVariants: fullV } : {}),
    ...(thumbV ? { thumbVariants: thumbV } : {}),
    ...(variants.lqip ? { lqip: variants.lqip } : {}),
    description,
    palette: (meta.meta.palette ?? []).slice(0, 5),
    fonts: meta.meta.fonts ?? [],
    tech: meta.meta.tech ?? [],
    mode: meta.meta.mode ?? "light",
    pageType: meta.pageType ?? "landing",
    tags: {
      style: meta.tags?.style ?? [],
      industry: meta.tags?.industry ?? [],
      components: meta.tags?.components ?? [],
      vibe: meta.tags?.vibe ?? [],
      macrostructure: meta.tags?.macrostructure ?? null,
    },
    // designSystem from extract() includes type/spacing/radius/cssVars,
    // but NOT colorWords — those come from the tagger and may be
    // absent on disk-only captures. Coalesce to an empty array so
    // downstream consumers (screens-grid, search) can rely on
    // colorWords being an array.
    designSystem: {
      typeRamp: meta.meta.designSystem?.typeRamp ?? [],
      spacingScale: meta.meta.designSystem?.spacingScale ?? [],
      radiusScale: meta.meta.designSystem?.radiusScale ?? [],
      containerWidth: meta.meta.designSystem?.containerWidth ?? null,
      cssVariables: meta.meta.designSystem?.cssVariables ?? {},
      colorWords: (meta.meta.designSystem as { colorWords?: string[] } | undefined)?.colorWords ?? [],
    },
    components: [],
  };
}

function main() {
  const rawSeed = readFileSync(SEED_PATH, "utf8");
  const rows: SeedRow[] = JSON.parse(rawSeed);
  const seedSites = new Set(rows.map((r) => r.siteSlug));

  const rawIdx = readFileSync(IDX_PATH, "utf8");
  const idx: IdxFile = JSON.parse(rawIdx);
  const idxSet = new Set(idx.slugs);

  const dirs = readdirSync(CAPTURES_DIR, { withFileTypes: true })
    .filter(
      (d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."),
    )
    .map((d) => d.name)
    .filter((name) => !ONLY_SLUGS || ONLY_SLUGS.has(name));

  let withMeta = 0;
  let alreadyInSeed = 0;
  let noMeta = 0;
  let mismatchedSlug = 0;
  let noEmbedding = 0;
  let badCapture = 0;
  const badList: string[] = [];
  const toAdd: { slug: string; row: ReturnType<typeof rowFromSidecar>; vec: Float32Array | null }[] = [];

  // Bot-block / error-page detection — if the captured page title looks
  // like a Cloudflare/access-denied/error page, the capture is unusable
  // as a design reference. Skip rather than poison the catalogue.
  const BAD_TITLE = /(access\s*denied|forbidden|cloudflare|just a moment|verify you are human|checking your browser|page not found|404\b|403\b|something went wrong|attention required|under maintenance|sit tight|temporarily unavailable|not supported|browser not supported|unsupported browser|javascript (is )?required|enable javascript|please enable cookies)/i;
  function looksBadCapture(meta: MetaSidecar): string | null {
    const t = (meta.meta.pageTitle ?? "").trim();
    const d = (meta.meta.pageDescription ?? "").trim();
    if (!t && !d) return "blank title+description";
    if (BAD_TITLE.test(t)) return `bad title: ${t.slice(0, 60)}`;
    if (BAD_TITLE.test(d)) return `bad description: ${d.slice(0, 60)}`;
    return null;
  }

  for (const slug of dirs) {
    if (slug.includes("--")) continue; // sub-pages of existing sites
    const metaPath = join(CAPTURES_DIR, slug, "meta.json");
    if (!existsSync(metaPath)) {
      noMeta++;
      continue;
    }
    withMeta++;
    let meta: MetaSidecar;
    try {
      meta = JSON.parse(readFileSync(metaPath, "utf8")) as MetaSidecar;
    } catch {
      noMeta++;
      continue;
    }
    if (meta.siteSlug !== slug) {
      mismatchedSlug++;
      continue;
    }
    if (seedSites.has(slug)) {
      alreadyInSeed++;
      continue;
    }
    const badReason = looksBadCapture(meta);
    if (badReason) {
      badCapture++;
      badList.push(`${slug}: ${badReason}`);
      continue;
    }
    const row = rowFromSidecar(slug, meta);
    let vec: Float32Array | null = null;
    if (meta.embeddings && Array.isArray(meta.embeddings.text) && meta.embeddings.text.length === EMBED_DIMS) {
      vec = Float32Array.from(meta.embeddings.text);
    } else {
      noEmbedding++;
    }
    toAdd.push({ slug, row, vec });
  }

  console.log("\n=== MERGE DISK CAPTURES → SEED ===");
  console.log(`capture dirs (homepages):     ${dirs.filter((d) => !d.includes("--")).length}`);
  console.log(`  with meta.json:             ${withMeta}`);
  console.log(`  already in seed:            ${alreadyInSeed}`);
  console.log(`  slug mismatch (skip):       ${mismatchedSlug}`);
  console.log(`  missing meta.json:          ${noMeta}`);
  console.log(`  bad capture (filtered):     ${badCapture}`);
  console.log(`new rows to append:           ${toAdd.length}`);
  console.log(`  with text embedding:        ${toAdd.length - noEmbedding}`);
  console.log(`  without (idx but no vec):   ${noEmbedding}`);
  console.log(`seed:    ${rows.length} → ${rows.length + toAdd.length}`);
  console.log(`sidecar: ${idx.slugs.length} → ${idx.slugs.length + toAdd.filter((t) => t.vec).length}`);

  if (badList.length) {
    console.log("\nfiltered bad captures (first 15):");
    for (const b of badList.slice(0, 15)) console.log(`  ${b}`);
  }

  console.log("\nfirst 15 new sites:");
  for (const a of toAdd.slice(0, 15)) {
    const title = a.row.title.slice(0, 40).padEnd(42);
    const tags = a.row.tags as { style?: string[]; macrostructure?: string | null };
    const style = (tags.style ?? []).slice(0, 2).join("/") || "-";
    const macro = tags.macrostructure ?? "-";
    console.log(`  ${a.slug.padEnd(32)} ${title} ${style.padEnd(28)} ${macro}`);
  }

  if (!APPLY) {
    console.log("\n(dry run — pass --apply to write seed + sidecar)");
    return;
  }

  const ts = Date.now();
  writeFileSync(SEED_PATH.replace(/\.json$/, `.pre-merge-${ts}.json`), rawSeed);
  writeFileSync(IDX_PATH.replace(/\.json$/, `.pre-merge-${ts}.json`), rawIdx);

  // Append to seed
  const newRows = [...rows, ...toAdd.map((t) => t.row)];
  writeFileSync(SEED_PATH, `${JSON.stringify(newRows, null, 2)}\n`);

  // Append embeddings to bin (only for entries with a vector)
  const oldBin = readFileSync(BIN_PATH);
  if (oldBin.byteLength !== idx.slugs.length * EMBED_DIMS * 4) {
    throw new Error(
      `bin size mismatch: ${oldBin.byteLength} != ${idx.slugs.length} × ${EMBED_DIMS} × 4`,
    );
  }
  writeFileSync(BIN_PATH.replace(/\.bin$/, `.pre-merge-${ts}.bin`), oldBin);

  const newVecCount = toAdd.filter((t) => t.vec).length;
  const newBin = Buffer.alloc(oldBin.byteLength + newVecCount * EMBED_DIMS * 4);
  oldBin.copy(newBin, 0);
  let offset = oldBin.byteLength;
  const newSlugs = [...idx.slugs];
  for (const t of toAdd) {
    if (!t.vec) continue;
    if (idxSet.has(t.slug)) continue; // belt+braces: shouldn't happen, but skip dupes
    const float = t.vec;
    for (let i = 0; i < EMBED_DIMS; i++) {
      newBin.writeFloatLE(float[i]!, offset + i * 4);
    }
    offset += EMBED_DIMS * 4;
    newSlugs.push(t.slug);
  }
  writeFileSync(BIN_PATH, newBin);
  writeFileSync(
    IDX_PATH,
    JSON.stringify({ slugs: newSlugs, dims: EMBED_DIMS, count: newSlugs.length }),
  );

  console.log(`\nAPPLIED.`);
  console.log(`  seed:    ${rows.length} → ${newRows.length}`);
  console.log(`  sidecar: ${idx.slugs.length} → ${newSlugs.length}`);
  console.log(`  bin:     ${oldBin.byteLength} → ${newBin.byteLength} bytes`);
  console.log(`  snapshots: *.pre-merge-${ts}.{json,bin}`);
}

main();
