/**
 * Merge fresh disk captures into the static seed + site embeddings sidecar.
 *
 * Walks captures/, finds every <slug>/meta.json whose site is NOT yet in
 * packages/db/src/static-screens.json, builds an enriched row from the
 * sidecar metadata + on-disk variant inventory, and appends the landing
 * row's text embedding to packages/db/src/embeddings.bin (with idx.json
 * updated in lockstep).
 *
 *   pnpm tsx src/merge-disk-captures-to-seed.ts --from-file=slugs.txt           dry-run
 *   pnpm tsx src/merge-disk-captures-to-seed.ts --from-file=slugs.txt --apply
 *   ... --site-meta=site-meta.json    {"<siteSlug>": {"title": "Relume", "industry": ["saas", "ai"]}}
 *
 * Scoped by --from-file, sub-pages (<site>--<path>) merge too, as rows of
 * a site whose landing page is in the same batch; unscoped runs still skip
 * them. --site-meta supplies the curated site name (the landing title, and
 * "Name · Page" for sub-pages) and the site-level industry, which every row
 * of a site shares (the 2026-09 audit made industry a per-site property).
 *
 * Idempotent: existing siteSlugs in the seed are never touched. Capture
 * dirs without meta.json are ignored (they weren't run through a disk-only
 * adder or the capture failed partway).
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import {
  isComponent,
  isIndustry,
  isMacrostructure,
  isStyle,
  isVibe,
} from "@inspo/taxonomy";
import { cleanFontList, cleanRampFamily } from "./font-names.js";

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
// it, every capture dir with a meta.json not yet in the seed is merged,
// which silently re-adds sites you deliberately deleted, since their
// meta.json lingers on disk. Scope to a fresh-slug list to stay safe.
const FROM_FILE = process.argv
  .find((a) => a.startsWith("--from-file="))
  ?.split("=")[1];
const ONLY_SLUGS: string[] | null = FROM_FILE
  ? readFileSync(FROM_FILE, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
  : null;

type SiteMeta = { title?: string; industry?: string[] };
const SITE_META_FILE = process.argv
  .find((a) => a.startsWith("--site-meta="))
  ?.split("=")[1];
const SITE_META: Record<string, SiteMeta> = SITE_META_FILE
  ? (JSON.parse(readFileSync(SITE_META_FILE, "utf8")) as Record<string, SiteMeta>)
  : {};

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
    designSystem?: {
      typeRamp?: Array<Record<string, unknown> & { family?: string }>;
      spacingScale?: number[];
      radiusScale?: number[];
      containerWidth?: number | null;
      cssVariables?: Record<string, string>;
    };
    components?: unknown[];
  };
  tags: {
    style?: string[];
    industry?: string[];
    components?: string[];
    vibe?: string[];
    colorWords?: string[];
    macrostructure?: string;
    description?: string;
    searchKeywords?: string[];
  } | null;
  embeddings: { text: number[] } | null;
}

/* ───────────── text hygiene ───────────── */

/** Em and en dashes never ship in archive copy. Built from char codes so
 *  this file itself contains neither. URLs and LQIPs are left alone. */
const DASHES = String.fromCharCode(0x2013, 0x2014);
const DASH_BETWEEN_DIGITS = new RegExp(`(\\d)\\s*[${DASHES}]\\s*(\\d)`, "g");
const DASH_ANYWHERE = new RegExp(`\\s*[${DASHES}]\\s*`, "g");
const undash = (s: string) =>
  s.replace(DASH_BETWEEN_DIGITS, "$1-$2").replace(DASH_ANYWHERE, " - ");
function scrub<T>(v: T, key = ""): T {
  if (typeof v === "string") return (/url$|lqip/i.test(key) ? v : undash(v)) as T;
  if (Array.isArray(v)) return v.map((x) => scrub(x, key)) as T;
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, scrub(x, k)]),
    ) as T;
  }
  return v;
}

/** cssVariables cap per row, the same one revisit-enrich applies:
 *  unbounded writes ballooned rows to 40-80KB and would blow up the seed. */
const CSS_VAR_MAX_ENTRIES = 60;
const CSS_VAR_MAX_BYTES = 4096;
const CSS_VAR_PREFERRED =
  /^--(color|colour|font|text|type|radius|rounded|space|spacing|gap|size|bg|background|border|shadow|accent|brand|primary|secondary|surface|ink|paper|fg|foreground)/;
function capCssVariables(vars: Record<string, string>): Record<string, string> {
  const entries = Object.entries(vars).filter(
    ([, v]) => typeof v === "string" && v.length <= 256,
  );
  const preferred = entries.filter(([k]) => CSS_VAR_PREFERRED.test(k));
  const rest = entries.filter(([k]) => !CSS_VAR_PREFERRED.test(k));
  const out: Record<string, string> = {};
  let bytes = 2;
  let count = 0;
  for (const [k, v] of [...preferred, ...rest]) {
    if (count >= CSS_VAR_MAX_ENTRIES) break;
    const cost = k.length + v.length + 6;
    if (bytes + cost > CSS_VAR_MAX_BYTES) continue;
    out[k] = v;
    bytes += cost;
    count++;
  }
  return out;
}

/* ───────────── titles ───────────── */

const PAGE_LABELS: Record<string, string> = {
  pricing: "Pricing",
  features: "Features",
  about: "About",
  blog: "Blog",
  changelog: "Changelog",
  docs: "Docs",
};

function humanize(segment: string): string {
  let s = segment;
  try {
    s = decodeURIComponent(segment);
  } catch {
    /* keep raw */
  }
  return s
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .slice(0, 40);
}

function pageLabel(pageType: string, url: string): string {
  if (PAGE_LABELS[pageType]) return PAGE_LABELS[pageType]!;
  try {
    const seg = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
    return humanize(seg) || "Page";
  } catch {
    return "Page";
  }
}

/** "Linear | The system for product development" becomes "Linear". */
const TITLE_SEPARATOR = new RegExp(`\\s[|·:\\-${DASHES}]\\s`);
function cleanPageTitle(raw: string | undefined): string | null {
  const first = (raw ?? "").split(TITLE_SEPARATOR)[0]?.trim() ?? "";
  return first.length >= 2 && first.length <= 80 ? first : null;
}

/* ───────────── variants on disk ───────────── */

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

/* ───────────── row ───────────── */

function rowFromSidecar(slug: string, meta: MetaSidecar, siteName: string | null) {
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

  const isLanding = slug === meta.siteSlug;
  const name = siteName ?? cleanPageTitle(meta.meta.pageTitle) ?? slug;
  const title = isLanding ? name : `${name} · ${pageLabel(meta.pageType, meta.sourceUrl)}`;

  // Same shape as the May rows (enrich-archive.ts): the tagger's
  // designer-voice description, then its search keywords.
  const tagDesc = (meta.tags?.description ?? "").trim();
  const keywords = (meta.tags?.searchKeywords ?? []).filter(Boolean);
  const description = tagDesc
    ? keywords.length
      ? `${tagDesc}  ·  ${keywords.join(", ")}`
      : tagDesc
    : (meta.meta.pageDescription ?? "");

  const override = SITE_META[meta.siteSlug]?.industry?.filter(isIndustry);
  const tags = {
    style: (meta.tags?.style ?? []).filter(isStyle),
    industry: override?.length
      ? override.slice(0, 3)
      : (meta.tags?.industry ?? []).filter(isIndustry).slice(0, 3),
    components: (meta.tags?.components ?? []).filter(isComponent),
    vibe: (meta.tags?.vibe ?? []).filter(isVibe),
    macrostructure:
      meta.tags?.macrostructure && isMacrostructure(meta.tags.macrostructure)
        ? meta.tags.macrostructure
        : null,
  };

  return scrub({
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
    fonts: cleanFontList(meta.meta.fonts),
    tech: meta.meta.tech ?? [],
    // Provisional: backfill-axes.ts re-derives mode from the measured
    // surface (paperL) and syncs the dark-mode style tag to it.
    mode: meta.meta.mode ?? "light",
    pageType: meta.pageType ?? "landing",
    tags,
    designSystem: {
      typeRamp: (meta.meta.designSystem?.typeRamp ?? []).map((t) => ({
        ...t,
        family: cleanRampFamily(t.family),
      })),
      spacingScale: meta.meta.designSystem?.spacingScale ?? [],
      radiusScale: meta.meta.designSystem?.radiusScale ?? [],
      containerWidth: meta.meta.designSystem?.containerWidth ?? null,
      cssVariables: capCssVariables(meta.meta.designSystem?.cssVariables ?? {}),
      colorWords: meta.tags?.colorWords ?? [],
    },
    components: meta.meta.components ?? [],
    enrichedAt: new Date().toISOString().slice(0, 10),
  });
}

/* ───────────── main ───────────── */

function main() {
  const rawSeed = readFileSync(SEED_PATH, "utf8");
  const rows: SeedRow[] = JSON.parse(rawSeed);
  const seedSites = new Set(rows.map((r) => r.siteSlug));

  const rawIdx = readFileSync(IDX_PATH, "utf8");
  const idx: IdxFile = JSON.parse(rawIdx);
  const idxSet = new Set(idx.slugs);

  const onDisk = new Set(
    readdirSync(CAPTURES_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
      .map((d) => d.name),
  );
  // Scoped: the listed order (sites stay grouped the way the batch was
  // built). Unscoped: homepage dirs only, as before.
  const dirs = ONLY_SLUGS
    ? ONLY_SLUGS.filter((s) => onDisk.has(s))
    : [...onDisk].filter((s) => !s.includes("--"));

  let withMeta = 0;
  let alreadyInSeed = 0;
  let noMeta = 0;
  let mismatchedSlug = 0;
  let orphanSubpage = 0;
  let noEmbedding = 0;
  let badCapture = 0;
  const badList: string[] = [];
  type Entry = { slug: string; site: string; row: ReturnType<typeof rowFromSidecar>; vec: Float32Array | null };
  const bySite = new Map<string, Entry[]>();

  // Bot-block / error-page detection: if the captured page title looks
  // like a Cloudflare/access-denied/error page, the capture is unusable
  // as a design reference. Skip rather than poison the catalogue.
  const BAD_TITLE = /(access\s*denied|forbidden|cloudflare|just a moment|verify you are human|checking your browser|page not found|404\b|403\b|something went wrong|attention required|under maintenance|sit tight|temporarily unavailable|not supported|browser not supported|unsupported browser|javascript (is )?required|enable javascript|please enable cookies)/i;
  function looksBadCapture(meta: MetaSidecar): string | null {
    const t = (meta.meta.pageTitle ?? "").trim();
    const d = (meta.meta.pageDescription ?? "").trim();
    if (!t && !d && !meta.tags?.description) return "blank title+description";
    if (BAD_TITLE.test(t)) return `bad title: ${t.slice(0, 60)}`;
    if (BAD_TITLE.test(d)) return `bad description: ${d.slice(0, 60)}`;
    return null;
  }

  for (const slug of dirs) {
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
    const isSub = slug.includes("--");
    if (isSub ? !slug.startsWith(`${meta.siteSlug}--`) : meta.siteSlug !== slug) {
      mismatchedSlug++;
      continue;
    }
    if (seedSites.has(meta.siteSlug)) {
      alreadyInSeed++;
      continue;
    }
    const badReason = looksBadCapture(meta);
    if (badReason) {
      badCapture++;
      badList.push(`${slug}: ${badReason}`);
      continue;
    }
    const row = rowFromSidecar(slug, meta, SITE_META[meta.siteSlug]?.title ?? null);
    let vec: Float32Array | null = null;
    if (!isSub) {
      if (meta.embeddings && Array.isArray(meta.embeddings.text) && meta.embeddings.text.length === EMBED_DIMS) {
        vec = Float32Array.from(meta.embeddings.text);
      } else {
        noEmbedding++;
      }
    }
    const list = bySite.get(meta.siteSlug) ?? [];
    list.push({ slug, site: meta.siteSlug, row, vec });
    bySite.set(meta.siteSlug, list);
  }

  // A sub-page only merges alongside its own site's landing row, landing
  // first, then its pages in slug order.
  const toAdd: Entry[] = [];
  for (const [site, entries] of bySite) {
    const landing = entries.find((e) => e.slug === site);
    if (!landing) {
      orphanSubpage += entries.length;
      continue;
    }
    toAdd.push(landing, ...entries.filter((e) => e !== landing).sort((a, b) => a.slug.localeCompare(b.slug)));
  }
  const newSites = toAdd.filter((t) => t.slug === t.site);

  console.log("\n=== MERGE DISK CAPTURES → SEED ===");
  console.log(`capture dirs considered:      ${dirs.length}${ONLY_SLUGS ? " (scoped)" : ""}`);
  console.log(`  with meta.json:             ${withMeta}`);
  console.log(`  already in seed:            ${alreadyInSeed}`);
  console.log(`  slug mismatch (skip):       ${mismatchedSlug}`);
  console.log(`  sub-page without landing:   ${orphanSubpage}`);
  console.log(`  missing meta.json:          ${noMeta}`);
  console.log(`  bad capture (filtered):     ${badCapture}`);
  console.log(`new rows to append:           ${toAdd.length} (${newSites.length} sites)`);
  console.log(`  landing rows w/o embedding: ${noEmbedding}`);
  console.log(`seed:    ${rows.length} → ${rows.length + toAdd.length}`);
  console.log(`sidecar: ${idx.slugs.length} → ${idx.slugs.length + newSites.filter((t) => t.vec).length}`);

  if (badList.length) {
    console.log("\nfiltered bad captures (first 15):");
    for (const b of badList.slice(0, 15)) console.log(`  ${b}`);
  }

  console.log("\nfirst 20 new rows:");
  for (const a of toAdd.slice(0, 20)) {
    const title = String(a.row.title).slice(0, 40).padEnd(42);
    const ind = (a.row.tags.industry ?? []).join("/") || "-";
    const macro = a.row.tags.macrostructure ?? "-";
    console.log(`  ${a.slug.padEnd(40)} ${title} ${ind.padEnd(24)} ${macro}`);
  }

  if (!APPLY) {
    console.log("\n(dry run: pass --apply to write seed + sidecar)");
    return;
  }

  const ts = Date.now();
  writeFileSync(SEED_PATH.replace(/\.json$/, `.pre-merge-${ts}.json`), rawSeed);
  writeFileSync(IDX_PATH.replace(/\.json$/, `.pre-merge-${ts}.json`), rawIdx);

  // Append to seed. Minified, matching the seed's on-disk form.
  const newRows = [...rows, ...toAdd.map((t) => t.row)];
  writeFileSync(SEED_PATH, JSON.stringify(newRows));

  // Append landing-row embeddings to the site-level bin. rebuild-site-
  // embeddings.ts recomputes every site afterwards from the final rows.
  const oldBin = readFileSync(BIN_PATH);
  if (oldBin.byteLength !== idx.slugs.length * EMBED_DIMS * 4) {
    throw new Error(
      `bin size mismatch: ${oldBin.byteLength} != ${idx.slugs.length} × ${EMBED_DIMS} × 4`,
    );
  }
  writeFileSync(BIN_PATH.replace(/\.bin$/, `.pre-merge-${ts}.bin`), oldBin);

  const withVec = newSites.filter((t) => t.vec && !idxSet.has(t.slug));
  const newBin = Buffer.alloc(oldBin.byteLength + withVec.length * EMBED_DIMS * 4);
  oldBin.copy(newBin, 0);
  let offset = oldBin.byteLength;
  const newSlugs = [...idx.slugs];
  for (const t of withVec) {
    for (let i = 0; i < EMBED_DIMS; i++) {
      newBin.writeFloatLE(t.vec![i]!, offset + i * 4);
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
