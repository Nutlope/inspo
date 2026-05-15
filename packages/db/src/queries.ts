/**
 * Public query layer.
 *
 * Every function works in two modes:
 *   1. DATABASE_URL set       — query Postgres via Drizzle
 *   2. DATABASE_URL not set   — return fixture data (dev convenience)
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
} from "@inspo/taxonomy";
import { hasDatabase, getDb } from "./client";
import {
  collections as collectionsT,
  collectionScreens as collectionScreensT,
  screens as screensT,
} from "./schema";
import {
  screens as screensFixture,
  collections as collectionsFixture,
} from "./fixtures";
import { pendingScreens as pendingFixture } from "./pending-fixtures";

export type ScreenFilter = {
  style?: Style;
  industry?: Industry;
  macrostructure?: Macrostructure;
  mode?: Mode;
};

/**
 * Sort modes for the home grid.
 *  latest — most recently captured first (default)
 *  varied — round-robin one screen per macrostructure, then refill from latest
 *  random — shuffle on each query (DB: ORDER BY random; fixtures: in-place shuffle)
 */
export type ScreenSort = "latest" | "varied" | "random";

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
      hallmarkTheme:
        (row.hallmarkTheme as ScreenSummary["tags"]["hallmarkTheme"]) ?? undefined,
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
    return true;
  });
}

/* ──────────────────── screens ──────────────────── */

export async function getAllScreens(
  filter: ScreenFilter = {},
  sort: ScreenSort = "latest",
): Promise<ScreenSummary[]> {
  if (!hasDatabase()) {
    const filtered = applyFiltersFixture(screensFixture, filter);
    if (sort === "varied") return variedOrder(filtered);
    if (sort === "random") return shuffle(filtered);
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
  // taxonomy filters in JS — fine at our seed scale, hot-pathable later.
  // Sort: latest = ORDER BY captured_at; random = ORDER BY random();
  // varied = SQL ordered by latest, then re-grouped in JS (cheap at our
  // scale, swap to a pgvector clustering pass if it ever bites).
  const orderClause =
    sort === "random" ? sql`random()` : desc(screensT.capturedAt);

  // Explicit column projection — SKIP cssVariables (40–80KB per row),
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
      hallmarkTheme: screensT.hallmarkTheme,
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
    return applyFiltersFixture(screensFixture, filter);
  }

  // For now, tags are not normalized in returned shape — but since we
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
  });

  if (sort === "varied") return variedOrder(filtered);
  return filtered;
}

export async function findScreen(slug: string): Promise<ScreenSummary | null> {
  if (!hasDatabase()) {
    return screensFixture.find((s) => s.slug === slug) ?? null;
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
    return screensFixture.find((s) => s.slug === slug) ?? null;
  }
  if (!rows[0]) return null;
  return rowToSummary(rows[0], {
    styles: [],
    industries: [],
    components: [],
    vibes: [],
  });
}

export async function findSimilar(
  slug: string,
  limit = 3,
): Promise<ScreenSummary[]> {
  const all = await getAllScreens();
  const target = all.find((s) => s.slug === slug);
  if (!target) return [];

  return all
    .filter((s) => s.slug !== slug)
    .map((s) => {
      let score = 0;
      if (s.tags.macrostructure === target.tags.macrostructure) score += 4;
      if (s.mode === target.mode) score += 1;
      score +=
        s.tags.industry.filter((i) => target.tags.industry.includes(i)).length *
        2;
      score += s.tags.style.filter((i) => target.tags.style.includes(i)).length;
      return { s, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
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
 * Filters apply to the hero's properties — which is what the user
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
  pages: ScreenSummary[]; // includes hero — sorted by pageType priority
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
  if (!hasDatabase()) {
    const pages = screensFixture.filter((s) => s.siteSlug === siteSlug);
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
    const pages = screensFixture.filter((s) => s.siteSlug === siteSlug);
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
  if (!hasDatabase()) {
    const counts = new Map<string, number>();
    for (const s of screensFixture)
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

export type ComponentHit = {
  screen: ScreenSummary;
  /** Position of the region within screen.components — the URL the crop
   *  service reads. */
  idx: number;
  region: ComponentRegion;
};

/** Browse / search component regions. Filters apply to the parent
 *  screen first; then we explode each screen's components and yield
 *  one hit per matching region.
 *
 *  Optional filters:
 *    type      — only this component type (hero | pricing | …)
 *    macrostructure / mode / style / industry — screen-level filters
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
  if (!hasDatabase()) return collectionsFixture;

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
