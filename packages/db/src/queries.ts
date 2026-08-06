/**
 * Public query layer.
 *
 * Every function works in two modes:
 *   1. DATABASE_URL set       - query Postgres via Drizzle
 *   2. DATABASE_URL not set   - return fixture data (dev convenience)
 *
 * Both paths return the exact same `ScreenSummary` / `Collection` shape,
 * so the gallery and MCP server are oblivious to which is in use.
 */

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { ScreenSummary, Collection } from "@inspo/shared";
import type {
  Style,
  Industry,
  Macrostructure,
  Mode,
  CaptureDevice,
} from "@inspo/taxonomy";
import { hasDatabase, useDbReads, getDb } from "./client";
import { cosineSim, loadRowSidecar } from "./vector";
import { isDamaged } from "./quality";
import {
  collections as collectionsT,
  collectionScreens as collectionScreensT,
  screens as screensT,
} from "./schema";
import {
  screens as fixtureScreens,
  collections as collectionsFixture,
} from "./fixtures";
import { pendingScreens as pendingFixture } from "./pending-fixtures";
import { bundledScreens } from "@inspo/db/seed-source";
import referenceManifestJson from "./reference-components.json" with { type: "json" };
import type { ReferenceComponent } from "@inspo/shared";

/**
 * The active catalogue rows used whenever DATABASE_URL is missing, DB
 * reads are off (the default - see client.ts), OR a live Neon query
 * throws. Resolution order:
 *
 *   1. `_injectedScreens` - set at runtime by the edge Worker after it
 *      fetches the catalogue from the CDN (`loadCatalogueFromUrl`).
 *   2. `bundledScreens` - the static seed inlined at build time in Node
 *      (web + stdio MCP). Null in the workerd build (not bundled).
 *   3. demo fixtures - last resort when running outside the monorepo.
 */
let _injectedScreens: typeof fixtureScreens | null = null;

/** Inject the catalogue at runtime. Used by the Cloudflare Worker,
 *  which fetches the seed from the CDN rather than bundling it. No-op
 *  for the bundled-seed path (Node) unless explicitly called. */
export function setCatalogue(rows: unknown[]): void {
  _injectedScreens =
    Array.isArray(rows) && rows.length > 0
      ? (rows as unknown as typeof fixtureScreens)
      : null;
}

function catalogueRows(): typeof fixtureScreens {
  if (_injectedScreens) return _injectedScreens;
  if (Array.isArray(bundledScreens) && bundledScreens.length > 0) {
    return bundledScreens as unknown as typeof fixtureScreens;
  }
  return fixtureScreens;
}

export type ScreenFilter = {
  style?: Style;
  industry?: Industry;
  macrostructure?: Macrostructure;
  mode?: Mode;
  /** "mobile" restricts to rows with a mobile capture pair. "desktop"
   *  is a no-op (every row has a desktop capture). */
  device?: CaptureDevice;
};

/**
 * Sort modes for the home grid.
 *  latest   - most recently captured first (default)
 *  varied   - round-robin one screen per macrostructure, then refill from latest
 *  random   - shuffle on each query (DB: ORDER BY random; fixtures: in-place shuffle)
 *  featured - design-interest score desc: front-loads the most visually
 *             striking work (bold macrostructures/styles + award-winning
 *             captures) so the landing grid reads as a highlight reel.
 */
export type ScreenSort = "latest" | "varied" | "random" | "featured";

/* ─── design-interest scoring (drives the "featured" sort) ───
 *
 * This used to rank on visual loudness - maximalism and brutalism at 8,
 * marquee-hero and type-specimen at 9, vibe "loud" at 5 - which is why
 * the landing grid filled up with anime keyart, full-bleed photography
 * and one maximalist warning modal. Striking, but they are not the
 * thing Inspo is for: an agent studying these learns nothing about how
 * to build a page, because most of them barely are one.
 *
 * It now ranks on *page-ness*. Three signals do the work, checked
 * against known-good references (Stripe, Linear, Ghost, Radix) and
 * known art pages (ponpon-mania, gm-meme, doodles):
 *
 *   components  a real landing page carries nav / hero / features /
 *               pricing / faq / cta / footer. Art pages carry 1-3.
 *   description length is the strongest single separator measured:
 *               ~190 chars on art pages, ~400 on professional ones.
 *               The tagger simply has less to say about a poster.
 *   macrostructure  feature-stack and ecosystem-index ARE landing-page
 *               shapes; photographic and portfolio-grid are galleries.
 *
 * Loud work is not banned - Discord and Sentry still rank - it just no
 * longer wins on loudness alone.
 */
const MACRO_WEIGHT: Record<string, number> = {
  // Shapes that only exist because a page has sections to organise.
  "feature-stack": 9,
  "ecosystem-index": 8,
  "bento-grid": 7,
  "split-studio": 7,
  "stat-led": 7,
  workbench: 7,
  "narrative-workflow": 6,
  "component-playground": 6,
  "conversational-faq": 6,
  "long-document": 5,
  "marquee-hero": 5,
  "index-first": 4,
  catalogue: 4,
  "map-diagram": 4,
  specimen: 3,
  "quote-led": 3,
  manifesto: 2,
  letter: 2,
  // Gallery shapes. Often beautiful, rarely instructive about layout.
  "type-specimen": 1,
  "portfolio-grid": 1,
  photographic: 0,
};
const STYLE_WEIGHT: Record<string, number> = {
  swiss: 5,
  minimalism: 4,
  editorial: 4,
  bento: 3,
  monochrome: 3,
  "dark-mode": 3,
  futurist: 2,
  vintage: 1,
  neumorphism: 1,
  glassmorphism: 1,
  claymorphism: 0,
  playful: 0,
  brutalism: 0,
  // Negative on purpose: this tag is what the anime keyart, the meme
  // pages and the warning-modal site all share.
  maximalism: -4,
};
const VIBE_WEIGHT: Record<string, number> = {
  technical: 4,
  serious: 3,
  luxe: 3,
  warm: 2,
  calm: 2,
  cold: 1,
  soft: 1,
  raw: 0,
  playful: 0,
  loud: -3,
};

function maxWeight(keys: string[], table: Record<string, number>): number {
  let best = 0;
  for (const k of keys) best = Math.max(best, table[k] ?? 0);
  return best;
}

/** Small stable jitter in [0,1) from the slug so equal-score rows
 *  don't clump alphabetically. Deterministic across renders. */
function slugJitter(slug: string): number {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) h = ((h << 5) + h + slug.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

export function featuredScore(s: ScreenSummary): number {
  // A sub-page hero (pricing, docs, an article) is not what the landing
  // grid is advertising, even when the site itself is excellent.
  if (s.pageType && s.pageType !== "landing") return -50;

  const macro = s.tags.macrostructure ? (MACRO_WEIGHT[s.tags.macrostructure] ?? 2) : 2;
  const style = maxWeight(s.tags.style ?? [], STYLE_WEIGHT);
  const vibe = maxWeight(s.tags.vibe ?? [], VIBE_WEIGHT);

  // Section count. Caps at 6 so a sprawling ecosystem index cannot buy
  // the whole front page on breadth alone.
  const sections = Math.min((s.tags.components ?? []).length, 6) * 2.2;

  // Editorial substance. Measured separator: art pages average ~190
  // chars of description, professional landing pages ~400. Scaled so
  // the useful band (150-500) spans about six points.
  const substance = Math.max(0, Math.min(6, ((s.description ?? "").length - 150) / 58));

  // Award bonus, kept but halved: the 2026-05 gallery harvest is
  // curated for cool, which is exactly the bias being corrected here.
  const award = s.capturedAt >= "2026-05-27" ? 1 : 0;

  const quality =
    typeof s.qualityScore === "number"
      ? Math.max(-2, Math.min(3, (s.qualityScore - 50) / 12))
      : 0;

  // A damaged capture should never front the site.
  const damaged = (s.qualityFlags ?? []).length > 0 ? -8 : 0;

  return (
    macro + style + vibe + sections + substance +
    award + quality + damaged + slugJitter(s.slug)
  );
}

/**
 * Score first, then break up the run.
 *
 * Ranking on page-ness alone returns a wall of the same page: 18 of the
 * first 24 came back `feature-stack`, nearly all of them
 * minimalism/swiss. Each is a good landing page and the grid was
 * still boring, which undersells an archive whose whole pitch is
 * range.
 *
 * So the score decides who is eligible and this decides the running
 * order: walk the ranked list and defer a row whose macrostructure has
 * already appeared twice in the last six. Deferred rows come back as
 * soon as the window clears, so nothing is dropped and a strong row
 * slips a few places at worst.
 */
function featuredOrder(list: ScreenSummary[]): ScreenSummary[] {
  const ranked = [...list].sort((a, b) => featuredScore(b) - featuredScore(a));

  const WINDOW = 6;
  const MAX_PER_WINDOW = 2;
  const out: ScreenSummary[] = [];
  const held: ScreenSummary[] = [];

  const recent = () =>
    out.slice(-WINDOW).map((r) => r.tags.macrostructure ?? "_other");

  const fits = (r: ScreenSummary) => {
    const m = r.tags.macrostructure ?? "_other";
    return recent().filter((x) => x === m).length < MAX_PER_WINDOW;
  };

  for (const row of ranked) {
    // A held row that now fits goes first: it outscored what follows.
    for (let i = 0; i < held.length; i++) {
      if (fits(held[i]!)) {
        out.push(held.splice(i, 1)[0]!);
        i--;
      }
    }
    if (fits(row)) out.push(row);
    else held.push(row);
  }
  // Anything still held (a macrostructure with very few peers) tails on
  // in score order rather than being lost.
  return [...out, ...held];
}

function variedOrder(list: ScreenSummary[]): ScreenSummary[] {
  // Group by macrostructure, take one per group in round-robin until empty.
  const buckets = new Map<string, ScreenSummary[]>();
  for (const s of list) {
    const k = s.tags.macrostructure ?? "_other";
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(s);
  }
  const out: ScreenSummary[] = [];
  while (buckets.size > 0) {
    for (const [k, group] of Array.from(buckets.entries())) {
      const next = group.shift();
      if (next) out.push(next);
      if (group.length === 0) buckets.delete(k);
    }
  }
  return out;
}

function shuffle<T>(list: T[]): T[] {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ──────────────────── helpers ──────────────────── */

function placeholderUrl(slug: string, variant: "hero" | "full" | "thumb") {
  return `/api/placeholder/${slug}/${variant}`;
}

/**
 * Compute the canonical image URL for a (slug, variant) pair.
 *
 *   1. Stored key on the row is an actual http(s) URL → use it
 *      (used when individual rows have been one-off uploaded somewhere).
 *   2. INSPO_BLOB_BASE_URL env var is set → deterministic Vercel-Blob
 *      URL: `<base>/<slug>/<variant>.png`. Keys are stamped at upload
 *      time by capture:upload-to-blob with deterministic paths.
 *   3. Otherwise → /api/placeholder/<slug>/<variant>, which prefers a
 *      real PNG on disk (dev) and falls back to an SVG palette gradient.
 */
function resolveImageUrl(
  storedKey: string | null | undefined,
  slug: string,
  variant: "hero" | "full" | "thumb",
): string {
  if (storedKey && /^https?:\/\//i.test(storedKey)) return storedKey;
  const blobBase = process.env.INSPO_BLOB_BASE_URL;
  if (blobBase) {
    return `${blobBase.replace(/\/$/, "")}/${slug}/${variant}.png`;
  }
  return placeholderUrl(slug, variant);
}

function rowToSummary(row: typeof screensT.$inferSelect, allTags: {
  styles: Style[];
  industries: Industry[];
  components: import("@inspo/taxonomy").Component[];
  vibes: import("@inspo/taxonomy").Vibe[];
}): ScreenSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    sourceUrl: row.sourceUrl,
    designerCredit: row.designerCredit ?? undefined,
    capturedAt: row.capturedAt.toISOString().slice(0, 10),
    imageUrl: resolveImageUrl(row.heroImageKey, row.slug, "hero"),
    fullPageUrl: resolveImageUrl(row.fullImageKey, row.slug, "full"),
    thumbUrl: resolveImageUrl(row.thumbImageKey, row.slug, "thumb"),
    description: row.description,
    palette: row.palette,
    fonts: row.fonts,
    tech: row.tech,
    mode: row.mode,
    tags: {
      style: allTags.styles,
      industry: allTags.industries,
      components: allTags.components,
      vibe: allTags.vibes,
      macrostructure: (row.macrostructure as Macrostructure | null) ?? undefined,
      axes: (row.axes as ScreenSummary["tags"]["axes"]) ?? undefined,
    },
    designSystem: {
      typeRamp: row.typeRamp ?? [],
      spacingScale: row.spacingScale ?? [],
      radiusScale: row.radiusScale ?? [],
      containerWidth: row.containerWidth,
      cssVariables: row.cssVariables ?? {},
      colorWords: row.colorWords ?? [],
    },
    siteSlug: row.siteSlug ?? row.slug,
    pageType: (row.pageType ?? "landing") as ScreenSummary["pageType"],
    components: row.components ?? [],
  };
}

function applyFiltersFixture(
  list: ScreenSummary[],
  filter: ScreenFilter,
): ScreenSummary[] {
  return list.filter((s) => {
    if (filter.style && !s.tags.style.includes(filter.style)) return false;
    if (filter.industry && !s.tags.industry.includes(filter.industry))
      return false;
    if (
      filter.macrostructure &&
      s.tags.macrostructure !== filter.macrostructure
    )
      return false;
    if (filter.mode && s.mode !== filter.mode) return false;
    if (filter.device === "mobile" && !s.mobileImageUrl) return false;
    return true;
  });
}

/* ──────────────────── screens ──────────────────── */

export async function getAllScreens(
  filter: ScreenFilter = {},
  sort: ScreenSort = "latest",
): Promise<ScreenSummary[]> {
  if (!useDbReads()) {
    const filtered = applyFiltersFixture(catalogueRows(), filter);
    if (sort === "varied") return variedOrder(filtered);
    if (sort === "random") return shuffle(filtered);
    if (sort === "featured") return featuredOrder(filtered);
    return filtered;
  }

  const db = getDb();
  const conditions = [eq(screensT.status, "published")];
  if (filter.macrostructure)
    conditions.push(eq(screensT.macrostructure, filter.macrostructure));
  if (filter.mode) conditions.push(eq(screensT.mode, filter.mode));

  // Style + industry are stored as joined tags; for v1 we filter via
  // jsonb tags blob in fixtures and via tag-join in DB. To keep this
  // shippable the DB path applies macrostructure/mode in SQL and the
  // taxonomy filters in JS - fine at our seed scale, hot-pathable later.
  // Sort: latest = ORDER BY captured_at; random = ORDER BY random();
  // varied = SQL ordered by latest, then re-grouped in JS (cheap at our
  // scale, swap to a pgvector clustering pass if it ever bites).
  const orderClause =
    sort === "random" ? sql`random()` : desc(screensT.capturedAt);

  // Explicit column projection - SKIP cssVariables (40-80KB per row),
  // embedding_image, embedding_text (1024-d float arrays). At 3,598
  // rows the SELECT * version was hitting Neon's 64MB HTTP cap. The
  // listing pages don't render cssVariables; the detail page can
  // fetch it on-demand via findScreen.
  let rows;
  try {
    rows = await db
      .select({
      id: screensT.id,
      slug: screensT.slug,
      title: screensT.title,
      sourceUrl: screensT.sourceUrl,
      designerCredit: screensT.designerCredit,
      capturedAt: screensT.capturedAt,
      siteSlug: screensT.siteSlug,
      pageType: screensT.pageType,
      description: screensT.description,
      altText: screensT.altText,
      searchKeywords: screensT.searchKeywords,
      palette: screensT.palette,
      fonts: screensT.fonts,
      tech: screensT.tech,
      mode: screensT.mode,
      macrostructure: screensT.macrostructure,
      axes: screensT.axes,
      typeRamp: screensT.typeRamp,
      spacingScale: screensT.spacingScale,
      radiusScale: screensT.radiusScale,
      containerWidth: screensT.containerWidth,
      colorWords: screensT.colorWords,
      components: screensT.components,
      heroImageKey: screensT.heroImageKey,
      fullImageKey: screensT.fullImageKey,
      thumbImageKey: screensT.thumbImageKey,
      status: screensT.status,
      curatorNote: screensT.curatorNote,
      // omitted: cssVariables, embeddingImage, embeddingText
      cssVariables: sql<Record<string, string>>`'{}'::jsonb`.as(
        "cssVariables",
      ),
      embeddingImage: sql<null>`NULL`.as("embeddingImage"),
      embeddingText: sql<null>`NULL`.as("embeddingText"),
    })
    .from(screensT)
    .where(and(...conditions))
    .orderBy(orderClause);
  } catch (err) {
    // Neon hiccup (data-transfer quota, connection drop). Fall back to
    // the fixture set so every consumer page still ships something.
    console.warn(
      `[db] getAllScreens fell back to fixtures: ${err instanceof Error ? err.message : err}`,
    );
    return applyFiltersFixture(catalogueRows(), filter);
  }

  // For now, tags are not normalized in returned shape - but since we
  // store them in jsonb on the row in the seed flow, return as-is.
  const summaries: ScreenSummary[] = rows.map((r) =>
    rowToSummary(r, {
      styles: (r.searchKeywords as Style[]) ?? [],
      industries: [],
      components: [],
      vibes: [],
    }),
  );

  const filtered = applyFiltersFixture(summaries, {
    style: filter.style,
    industry: filter.industry,
    device: filter.device,
  });

  if (sort === "varied") return variedOrder(filtered);
  if (sort === "featured") return featuredOrder(filtered);
  return filtered;
}

export async function findScreen(slug: string): Promise<ScreenSummary | null> {
  if (!useDbReads()) {
    return catalogueRows().find((s) => s.slug === slug) ?? null;
  }
  const db = getDb();
  let rows;
  try {
    rows = await db
      .select()
      .from(screensT)
      .where(eq(screensT.slug, slug))
      .limit(1);
  } catch (err) {
    console.warn(
      `[db] findScreen fell back to fixtures: ${err instanceof Error ? err.message : err}`,
    );
    return catalogueRows().find((s) => s.slug === slug) ?? null;
  }
  if (!rows[0]) return null;
  return rowToSummary(rows[0], {
    styles: [],
    industries: [],
    components: [],
    vibes: [],
  });
}

export type FindSimilarOptions = {
  limit?: number;
  /** Include other pages of the target's own site (default false). */
  sameSite?: boolean;
};

export type SimilarResult = {
  results: ScreenSummary[];
  /** "embedding" when the per-row vector sidecar ranked the list;
   *  "tags" when it was absent and the tag arithmetic fallback ran. */
  method: "embedding" | "tags";
};

/** Dedupe a scored list to the best row per site, dropping the target's
 *  own site unless sameSite, and damaged captures always. */
function pickSimilar(
  scored: Array<{ s: ScreenSummary; score: number }>,
  target: ScreenSummary,
  limit: number,
  sameSite: boolean,
): ScreenSummary[] {
  scored.sort((a, b) => b.score - a.score);
  const seenSite = new Set<string>();
  const out: ScreenSummary[] = [];
  for (const { s } of scored) {
    if (s.slug === target.slug) continue;
    if (!sameSite && s.siteSlug === target.siteSlug) continue;
    if (isDamaged(s)) continue;
    if (seenSite.has(s.siteSlug)) continue;
    seenSite.add(s.siteSlug);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

function similarByTags(
  all: ScreenSummary[],
  target: ScreenSummary,
  limit: number,
  sameSite: boolean,
): ScreenSummary[] {
  const scored = all.map((s) => {
    let score = 0;
    if (s.tags.macrostructure === target.tags.macrostructure) score += 4;
    if (s.mode === target.mode) score += 1;
    score +=
      s.tags.industry.filter((i) => target.tags.industry.includes(i)).length *
      2;
    score += s.tags.style.filter((i) => target.tags.style.includes(i)).length;
    return { s, score };
  });
  return pickSimilar(scored, target, limit, sameSite);
}

export async function findSimilarDetailed(
  slug: string,
  opts: FindSimilarOptions = {},
): Promise<SimilarResult> {
  const limit = opts.limit ?? 3;
  const sameSite = opts.sameSite ?? false;
  const all = await getAllScreens();
  const target = all.find((s) => s.slug === slug);
  if (!target) return { results: [], method: "tags" };

  // Cosine over per-row vectors when the rows sidecar is present; tags
  // act as a small structural tiebreak on top. Falls back to pure tag
  // arithmetic when the sidecar (or the target's vector) is missing.
  const rows = loadRowSidecar();
  const targetVec = rows?.get(slug);
  if (rows && targetVec) {
    const scored = all
      .filter((s) => rows.has(s.slug))
      .map((s) => {
        let score = cosineSim(targetVec, rows.get(s.slug)!);
        if (s.tags.macrostructure === target.tags.macrostructure)
          score += 0.06;
        if (s.mode === target.mode) score += 0.02;
        score +=
          0.02 *
          Math.min(
            s.tags.style.filter((i) => target.tags.style.includes(i)).length,
            3,
          );
        return { s, score };
      });
    return {
      results: pickSimilar(scored, target, limit, sameSite),
      method: "embedding",
    };
  }
  return {
    results: similarByTags(all, target, limit, sameSite),
    method: "tags",
  };
}

export async function findSimilar(
  slug: string,
  limit = 3,
): Promise<ScreenSummary[]> {
  const { results } = await findSimilarDetailed(slug, { limit });
  return results;
}

/* ──────────────────── sites (grid view) ──────────────────── */

/**
 * One ScreenSummary per site, paired with its captured page count.
 *
 * Used by the home + /screens grid. For sites with a captured landing
 * page (siteSlug equals an existing slug AND that row's pageType is
 * 'landing'), the hero is that row. For sites whose landing wasn't
 * captured (rare), we fall back to the earliest captured row.
 *
 * Filters apply to the hero's properties - which is what the user
 * means by "show me sites that match X" since hero == brand identity.
 */
export type SiteTile = ScreenSummary & { pageCount: number };

export async function getAllSites(
  filter: ScreenFilter = {},
  sort: ScreenSort = "latest",
): Promise<SiteTile[]> {
  // Pull all screens through the existing path (handles filters + fixtures).
  const allScreens = await getAllScreens(filter, sort);

  // Bucket by siteSlug; pick the landing row as the hero (fallback: first).
  const bySite = new Map<string, { hero: ScreenSummary; count: number }>();
  for (const s of allScreens) {
    const key = s.siteSlug;
    const existing = bySite.get(key);
    if (!existing) {
      bySite.set(key, { hero: s, count: 1 });
    } else {
      existing.count += 1;
      // Prefer pageType='landing' over whatever was first.
      if (existing.hero.pageType !== "landing" && s.pageType === "landing") {
        existing.hero = s;
      }
    }
  }
  // Preserve the order of first occurrence (which already obeys `sort`).
  const out: SiteTile[] = [];
  const seen = new Set<string>();
  for (const s of allScreens) {
    if (seen.has(s.siteSlug)) continue;
    seen.add(s.siteSlug);
    const entry = bySite.get(s.siteSlug)!;
    out.push({ ...entry.hero, pageCount: entry.count });
  }
  return out;
}

/* ──────────────────── sites (detail) ──────────────────── */

export type SiteSummary = {
  siteSlug: string;
  title: string;
  designerCredit?: string;
  sourceUrl: string;
  hero: ScreenSummary;
  pages: ScreenSummary[]; // includes hero - sorted by pageType priority
  pageCount: number;
};

const PAGE_TYPE_ORDER: Record<NonNullable<ScreenSummary["pageType"]>, number> = {
  landing: 0,
  pricing: 1,
  features: 2,
  auth: 3,
  about: 4,
  blog: 5,
  changelog: 6,
  docs: 7,
  other: 8,
};

function sortPages(pages: ScreenSummary[]): ScreenSummary[] {
  return [...pages].sort(
    (a, b) =>
      PAGE_TYPE_ORDER[a.pageType] - PAGE_TYPE_ORDER[b.pageType] ||
      a.capturedAt.localeCompare(b.capturedAt),
  );
}

/** All pages of one site, by site_slug. */
export async function findSite(siteSlug: string): Promise<SiteSummary | null> {
  if (!useDbReads()) {
    const pages = catalogueRows().filter((s) => s.siteSlug === siteSlug);
    if (pages.length === 0) return null;
    const sorted = sortPages(pages);
    const hero = sorted.find((p) => p.pageType === "landing") ?? sorted[0]!;
    return {
      siteSlug,
      title: hero.title,
      designerCredit: hero.designerCredit,
      sourceUrl: hero.sourceUrl,
      hero,
      pages: sorted,
      pageCount: sorted.length,
    };
  }

  const db = getDb();
  let rows;
  try {
    rows = await db
      .select()
      .from(screensT)
      .where(
        and(eq(screensT.siteSlug, siteSlug), eq(screensT.status, "published")),
      );
  } catch (err) {
    console.warn(
      `[db] findSite fell back to fixtures: ${err instanceof Error ? err.message : err}`,
    );
    const pages = catalogueRows().filter((s) => s.siteSlug === siteSlug);
    if (pages.length === 0) return null;
    const sorted = sortPages(pages);
    const hero = sorted.find((p) => p.pageType === "landing") ?? sorted[0]!;
    return {
      siteSlug,
      title: hero.title,
      designerCredit: hero.designerCredit,
      sourceUrl: hero.sourceUrl,
      hero,
      pages: sorted,
      pageCount: sorted.length,
    };
  }
  if (rows.length === 0) return null;
  const summaries = rows.map((r) =>
    rowToSummary(r, {
      styles: (r.searchKeywords as Style[]) ?? [],
      industries: [],
      components: [],
      vibes: [],
    }),
  );
  const sorted = sortPages(summaries);
  const hero = sorted.find((p) => p.pageType === "landing") ?? sorted[0]!;
  return {
    siteSlug,
    title: hero.title,
    designerCredit: hero.designerCredit,
    sourceUrl: hero.sourceUrl,
    hero,
    pages: sorted,
    pageCount: sorted.length,
  };
}

/** Every site that has more than one captured page. Used by /sites index
 *  (when we want one) and by the back-link logic on /screens/[slug]. */
export async function getMultiPageSites(): Promise<
  { siteSlug: string; pageCount: number }[]
> {
  if (!useDbReads()) {
    const counts = new Map<string, number>();
    for (const s of catalogueRows())
      counts.set(s.siteSlug, (counts.get(s.siteSlug) ?? 0) + 1);
    return [...counts.entries()]
      .filter(([, c]) => c > 1)
      .map(([siteSlug, pageCount]) => ({ siteSlug, pageCount }));
  }
  const db = getDb();
  const rows = await db
    .select({
      siteSlug: screensT.siteSlug,
      pageCount: sql<number>`count(*)::int`,
    })
    .from(screensT)
    .where(eq(screensT.status, "published"))
    .groupBy(screensT.siteSlug)
    .having(sql`count(*) > 1`);
  return rows
    .filter((r): r is { siteSlug: string; pageCount: number } =>
      Boolean(r.siteSlug),
    )
    .map((r) => ({ siteSlug: r.siteSlug, pageCount: r.pageCount }));
}

/* ──────────────────── components ──────────────────── */

import type { ComponentRegion, ComponentType } from "@inspo/shared";

/** Map the 10 component types to the screen-level tags.components
 *  vocabulary, for the findComponents fallback when no per-element crop
 *  regions exist. 'cta' has no exact tag analogue, so it borrows
 *  hero-with-cta (which carries the primary CTA). */
const TYPE_TO_TAG_COMPONENTS: Record<ComponentType, string[]> = {
  nav: ["sticky-nav"],
  hero: ["hero-with-cta", "hero-fullbleed"],
  pricing: ["pricing-3-col", "pricing-toggle"],
  features: ["feature-trio", "feature-alternating"],
  cta: ["hero-with-cta"],
  testimonial: ["testimonial-quote", "testimonial-wall"],
  "logo-cloud": ["logo-cloud", "marquee-logos"],
  footer: ["footer-compact", "footer-mega-menu"],
  faq: ["faq-accordion"],
  stat: ["stat-strip"],
};

export type ComponentHit = {
  screen: ScreenSummary;
  /** Position of the region within screen.components - the URL the crop
   *  service reads. -1 for tag-based fallback hits (no crop region). */
  idx: number;
  region: ComponentRegion;
  /** True when this came from the tags.components fallback (per-element
   *  crops aren't populated for this site yet). */
  fallback?: boolean;
};

/** Browse / search component regions. Filters apply to the parent
 *  screen first; then we explode each screen's components and yield
 *  one hit per matching region.
 *
 *  Optional filters:
 *    type      - only this component type (hero | pricing | …)
 *    macrostructure / mode / style / industry - screen-level filters
 *
 *  Ordering: latest captured first, then components in the order the
 *  scanner emitted them (hero → pricing → footer …).  */
export async function findComponents(opts: {
  type?: ComponentType;
  macrostructure?: Macrostructure;
  mode?: Mode;
  style?: Style;
  industry?: Industry;
  limit?: number;
}): Promise<ComponentHit[]> {
  const all = await getAllScreens({
    macrostructure: opts.macrostructure,
    mode: opts.mode,
    style: opts.style,
    industry: opts.industry,
  });
  const out: ComponentHit[] = [];
  const limit = opts.limit ?? 60;
  for (const s of all) {
    s.components.forEach((region, idx) => {
      if (opts.type && region.type !== opts.type) return;
      if (out.length >= limit) return;
      out.push({ screen: s, idx, region });
    });
    if (out.length >= limit) break;
  }

  // Fallback: the per-element crop dataset (screen.components regions)
  // isn't populated across the catalogue yet, so the region loop can
  // come back empty. Rather than return nothing for an advertised tool,
  // surface real sites that carry the requested component type via the
  // screen-level tags.components vocabulary - one hit per site, parent
  // page thumb as the image, flagged so callers know there's no crop.
  if (out.length === 0 && opts.type) {
    const seenSite = new Set<string>();
    const pushFallback = (s: ScreenSummary) => {
      seenSite.add(s.siteSlug);
      out.push({
        screen: s,
        idx: -1,
        region: { type: opts.type!, top: 0, left: 0, width: 0, height: 0 },
        fallback: true,
      });
    };
    const tagSet = TYPE_TO_TAG_COMPONENTS[opts.type] ?? [];
    if (tagSet.length) {
      for (const s of all) {
        if (out.length >= limit) break;
        if (s.slug !== s.siteSlug) continue; // one canonical row per site
        if (seenSite.has(s.siteSlug)) continue;
        if (s.tags.components.some((c) => tagSet.includes(c))) pushFallback(s);
      }
    }
    // Second fallback: a captured pricing/features PAGE is itself an
    // exemplar of that component type, even without a crop region or a
    // component tag on the canonical row. This is what makes
    // find_components('pricing') useful across the catalogue.
    const TYPE_TO_PAGE_TYPE: Partial<Record<ComponentType, string>> = {
      pricing: "pricing",
      features: "features",
    };
    const pt = TYPE_TO_PAGE_TYPE[opts.type];
    if (pt) {
      for (const s of all) {
        if (out.length >= limit) break;
        if (seenSite.has(s.siteSlug)) continue;
        if (s.pageType === pt) pushFallback(s);
      }
    }
  }
  return out;
}

/* ──────────────────── curator queue ──────────────────── */

export async function getPendingScreens(): Promise<ScreenSummary[]> {
  if (!hasDatabase()) return pendingFixture;

  const db = getDb();
  const rows = await db
    .select()
    .from(screensT)
    .where(eq(screensT.status, "pending"))
    .orderBy(desc(screensT.capturedAt));
  return rows.map((r) =>
    rowToSummary(r, {
      styles: (r.searchKeywords as Style[]) ?? [],
      industries: [],
      components: [],
      vibes: [],
    }),
  );
}

export async function updateScreenStatus(
  slug: string,
  status: "pending" | "published" | "rejected",
): Promise<void> {
  if (!hasDatabase()) return;
  await getDb()
    .update(screensT)
    .set({ status })
    .where(eq(screensT.slug, slug));
}

export async function updateScreenCuratorNote(
  slug: string,
  note: string,
): Promise<void> {
  if (!hasDatabase()) return;
  await getDb()
    .update(screensT)
    .set({ curatorNote: note })
    .where(eq(screensT.slug, slug));
}

/* ──────────────────── collections ──────────────────── */

export async function getAllCollections(): Promise<Collection[]> {
  if (!useDbReads()) return collectionsFixture;

  const db = getDb();
  const cols = await db
    .select()
    .from(collectionsT)
    .orderBy(asc(collectionsT.number));

  // For each collection, hydrate its ordered screens
  const ids = cols.map((c) => c.id);
  if (ids.length === 0) return [];
  const allEntries = await db
    .select({
      collectionId: collectionScreensT.collectionId,
      screenSlug: screensT.slug,
      span: collectionScreensT.span,
      editorNote: collectionScreensT.editorNote,
      position: collectionScreensT.position,
    })
    .from(collectionScreensT)
    .innerJoin(screensT, eq(screensT.id, collectionScreensT.screenId))
    .where(inArray(collectionScreensT.collectionId, ids))
    .orderBy(
      asc(collectionScreensT.collectionId),
      asc(collectionScreensT.position),
    );

  const coverIds = cols
    .map((c) => c.coverScreenId)
    .filter((v): v is string => Boolean(v));
  const covers = coverIds.length
    ? await db
        .select({ id: screensT.id, slug: screensT.slug })
        .from(screensT)
        .where(inArray(screensT.id, coverIds))
    : [];
  const coverSlugById = new Map(covers.map((c) => [c.id, c.slug]));

  return cols.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    number: c.number,
    date: c.date,
    editorBlurb: c.editorBlurb,
    coverScreenSlug: c.coverScreenId
      ? coverSlugById.get(c.coverScreenId) ?? ""
      : "",
    screens: allEntries
      .filter((e) => e.collectionId === c.id)
      .map((e) => ({
        slug: e.screenSlug,
        editorNote: e.editorNote ?? undefined,
        span: (e.span as 1 | 2 | 3) ?? 2,
      })),
  }));
}

export async function findCollection(
  slug: string,
): Promise<Collection | null> {
  const all = await getAllCollections();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function screensInCollection(slug: string): Promise<
  Array<{
    slug: string;
    editorNote?: string;
    span?: 1 | 2 | 3;
    screen: ScreenSummary;
  }>
> {
  const collection = await findCollection(slug);
  if (!collection) return [];
  const allScreens = await getAllScreens();
  return collection.screens
    .map((entry) => {
      const screen = allScreens.find((s) => s.slug === entry.slug);
      return screen ? { ...entry, screen } : null;
    })
    .filter(<T,>(v: T | null): v is T => v !== null);
}

/* ──────────────────── reference components ────────────────────
 *
 * Read from `reference-components.json` - the manifest built by
 *   pnpm --filter @inspo/web build:reference-manifest
 * from the 68 canonical reference components under
 * apps/web/src/components/reference/<type>/<id>.tsx. Bundled with
 * @inspo/db so the MCP doesn't need the apps/web tree at runtime.
 */

const REFERENCE_COMPONENTS = referenceManifestJson as ReferenceComponent[];

export function getReferenceComponents(filter?: {
  type?: ReferenceComponent["type"];
  /** Case-insensitive substring match against the .macro field -
   *  "marquee" matches "Marquee Hero", "marquee with rail", etc. */
  macroQuery?: string;
}): ReferenceComponent[] {
  let list = REFERENCE_COMPONENTS;
  if (filter?.type) list = list.filter((r) => r.type === filter.type);
  if (filter?.macroQuery) {
    const q = filter.macroQuery.toLowerCase();
    list = list.filter((r) => r.macro.toLowerCase().includes(q));
  }
  return list;
}

export function findReferenceComponent(
  type: ReferenceComponent["type"],
  id: string,
): ReferenceComponent | null {
  return (
    REFERENCE_COMPONENTS.find((r) => r.type === type && r.id === id) ?? null
  );
}
