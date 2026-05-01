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
 * heroImageKey/fullImageKey/thumbImageKey are written by the worker as
 * `file://…` paths during dev (R2 URLs in prod). Browsers can't load
 * file:// — and the placeholder route already serves real PNGs from disk
 * if they exist — so we only honour the stored key when it's an actual
 * http(s) URL. This means dev "just works", and the moment we wire R2
 * the gallery starts serving from the CDN with no other code change.
 */
function resolveImageUrl(
  storedKey: string | null | undefined,
  slug: string,
  variant: "hero" | "full" | "thumb",
): string {
  if (storedKey && /^https?:\/\//i.test(storedKey)) return storedKey;
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
  const rows = await db
    .select()
    .from(screensT)
    .where(and(...conditions))
    .orderBy(orderClause);

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
  const rows = await db
    .select()
    .from(screensT)
    .where(eq(screensT.slug, slug))
    .limit(1);
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
