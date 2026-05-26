/**
 * Lexical search — substring match across title, description, search
 * keywords, fonts, palette, css variable keys, designer credit, and
 * every tag value. Used by both the gallery (in `getAllScreens`) and
 * the MCP `search_screens` tool.
 *
 * Scope: this is intentionally a small in-memory ranker; at our seed
 * scale (≤500 rows) the cost of pulling all screens then filtering in
 * JS is sub-millisecond. When the catalogue grows past ~5K rows, swap
 * for a Postgres full-text index + pgvector rerank — same function
 * signature, different inside.
 *
 * `searchScreens` (async) wraps lexical with a vector layer: it
 * embeds the query, looks up each screen's site-level embedding in
 * the on-disk sidecar (written by PR 5), and blends cosine similarity
 * with the lexical score. Degrades cleanly to lexical-only when the
 * sidecar is absent or the embedding call fails.
 */

import type { ScreenSummary } from "@inspo/shared";
import { embedQuery, loadSidecar, cosineSim } from "./vector.js";

const URL_RE = /^https?:\/\//i;

export function isUrl(query: string): boolean {
  return URL_RE.test(query.trim());
}

/** Pull a comparable hostname out of a query that looks like a URL. */
export function hostnameOf(maybeUrl: string): string | null {
  try {
    const u = new URL(maybeUrl.trim());
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Match a query URL against the catalogue by hostname. */
export function findByHostname(
  screens: ScreenSummary[],
  query: string,
): ScreenSummary | null {
  const target = hostnameOf(query);
  if (!target) return null;
  return (
    screens.find((s) => {
      const h = hostnameOf(s.sourceUrl);
      return h === target || (h && (h.endsWith("." + target) || target.endsWith("." + h)));
    }) ?? null
  );
}

export function lexicalSearch(
  screens: ScreenSummary[],
  query: string,
  limit: number,
): ScreenSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return screens.slice(0, limit);
  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = screens.map((s) => {
    const cssVarKeys = Object.keys(s.designSystem?.cssVariables ?? {}).join(" ");
    const colorWords = (s.designSystem?.colorWords ?? []).join(" ");

    const haystack = [
      s.title,
      s.description,
      s.designerCredit ?? "",
      s.tags.style.join(" "),
      s.tags.industry.join(" "),
      s.tags.components.join(" "),
      s.tags.vibe.join(" "),
      s.tags.macrostructure ?? "",
      s.tags.hallmarkTheme ?? "",
      s.fonts.join(" "),
      s.tech.join(" "),
      s.palette.join(" "),
      colorWords,
      cssVarKeys,
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    for (const t of tokens) {
      if (haystack.includes(t)) score += 1;
      if (s.title.toLowerCase().includes(t)) score += 2;
      if ((s.tags.macrostructure ?? "").toLowerCase().includes(t)) score += 1.5;
      if (s.tags.style.some((x) => x.toLowerCase().includes(t))) score += 1;
      if (s.tags.industry.some((x) => x.toLowerCase().includes(t))) score += 1;
      if ((s.designerCredit ?? "").toLowerCase().includes(t)) score += 1.5;
    }
    return { s, score };
  });

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}

/**
 * Hybrid lexical + cosine search.
 *
 * Algorithm:
 *   1. Compute lexical scores across the full filtered set.
 *   2. In parallel, try to embed the query (cached) and load the
 *      sidecar (cached). If either fails, return pure lexical.
 *   3. Take the top-N lexical candidates (default 100), pull each
 *      site's embedding from the sidecar, compute cosine similarity
 *      to the query embedding.
 *   4. Final score = 0.6 × normalised_lexical + 0.4 × cosine_sim.
 *      Boost vector for under-indexed queries (≤2 tokens) where
 *      lexical is unreliable.
 *   5. Sort and slice to `limit`.
 *
 * The blend weights bias slightly toward lexical because keyword
 * matches in titles / tags are usually exact intent (the user knows
 * what brand or style they want), while cosine fills in the cases
 * where the query is conceptual ("calm wellness", "data-heavy
 * dashboard") and no row contains those exact words.
 */
export async function searchScreens(
  screens: ScreenSummary[],
  query: string,
  limit: number,
): Promise<ScreenSummary[]> {
  const q = query.trim().toLowerCase();
  if (!q) return screens.slice(0, limit);

  // Pre-compute lexical scores for everyone (cheap at this scale).
  const tokens = q.split(/\s+/).filter(Boolean);
  type Scored = { s: ScreenSummary; lex: number; cos: number };
  const allScored: Scored[] = screens.map((s) => ({
    s,
    lex: lexicalScore(s, tokens),
    cos: 0,
  }));

  // Kick off the embedding + sidecar lookup concurrently.
  const [qEmbed, sidecar] = await Promise.all([
    embedQuery(q),
    Promise.resolve(loadSidecar()),
  ]);

  if (!qEmbed || !sidecar || sidecar.size === 0) {
    // Pure lexical path. Same one-per-site dedupe as the vector
    // branch so the two return shapes are consistent.
    const ranked = allScored
      .filter((x) => x.lex > 0)
      .sort((a, b) => b.lex - a.lex);
    const seen = new Set<string>();
    const out: ScreenSummary[] = [];
    for (const x of ranked) {
      if (seen.has(x.s.siteSlug)) continue;
      seen.add(x.s.siteSlug);
      out.push(x.s);
      if (out.length >= limit) break;
    }
    return out;
  }

  // Compute cosine for every row that has an embedding in the
  // sidecar (keyed by siteSlug — children inherit their site's
  // embedding from PR 5's propagation).
  let maxLex = 1;
  for (const x of allScored) if (x.lex > maxLex) maxLex = x.lex;
  for (const x of allScored) {
    const vec = sidecar.get(x.s.siteSlug);
    if (vec) x.cos = cosineSim(qEmbed, vec);
  }

  // Vector weight rises as lexical signal thins out — single-word
  // conceptual queries lean on cosine; multi-word brand-y queries
  // lean on lexical.
  const vecWeight = tokens.length <= 2 ? 0.55 : 0.4;
  const lexWeight = 1 - vecWeight;

  const blended = allScored.map((x) => ({
    s: x.s,
    score: lexWeight * (x.lex / maxLex) + vecWeight * Math.max(0, x.cos),
  }));

  // Dedupe by siteSlug: when every sub-page of a site shares the
  // same embedding, vector search would otherwise return 5 sub-pages
  // of one site instead of 5 different sites. Keep the highest-
  // scoring row per site and drop the rest. Agents almost always
  // want one example per brand.
  blended.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: ScreenSummary[] = [];
  for (const x of blended) {
    if (x.score <= 0) continue;
    if (seen.has(x.s.siteSlug)) continue;
    seen.add(x.s.siteSlug);
    out.push(x.s);
    if (out.length >= limit) break;
  }
  return out;
}

/** Extracted lexical scoring used by both `lexicalSearch` and the
 *  hybrid `searchScreens`. Keeps the two ranking paths in lockstep. */
function lexicalScore(s: ScreenSummary, tokens: string[]): number {
  const cssVarKeys = Object.keys(s.designSystem?.cssVariables ?? {}).join(" ");
  const colorWords = (s.designSystem?.colorWords ?? []).join(" ");
  const haystack = [
    s.title,
    s.description,
    s.designerCredit ?? "",
    s.tags.style.join(" "),
    s.tags.industry.join(" "),
    s.tags.components.join(" "),
    s.tags.vibe.join(" "),
    s.tags.macrostructure ?? "",
    s.tags.hallmarkTheme ?? "",
    s.fonts.join(" "),
    s.tech.join(" "),
    s.palette.join(" "),
    colorWords,
    cssVarKeys,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const t of tokens) {
    if (haystack.includes(t)) score += 1;
    if (s.title.toLowerCase().includes(t)) score += 2;
    if ((s.tags.macrostructure ?? "").toLowerCase().includes(t)) score += 1.5;
    if (s.tags.style.some((x) => x.toLowerCase().includes(t))) score += 1;
    if (s.tags.industry.some((x) => x.toLowerCase().includes(t))) score += 1;
    if ((s.designerCredit ?? "").toLowerCase().includes(t)) score += 1.5;
  }
  return score;
}
