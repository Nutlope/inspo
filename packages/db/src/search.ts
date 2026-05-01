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
 */

import type { ScreenSummary } from "@inspo/shared";

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
