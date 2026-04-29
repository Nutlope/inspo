/**
 * Naive lexical search — substring match across title, description,
 * search keywords, and tag values. Replaced by pgvector cosine
 * retrieval once embeddings are populated (see worker/src/embed.ts).
 */

import type { ScreenSummary } from "@inspo/shared";

export function lexicalSearch(
  screens: ScreenSummary[],
  query: string,
  limit: number,
): ScreenSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return screens.slice(0, limit);
  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = screens.map((s) => {
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
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    for (const t of tokens) {
      if (haystack.includes(t)) score += 1;
      if (s.title.toLowerCase().includes(t)) score += 2;
      if ((s.tags.macrostructure ?? "").toLowerCase().includes(t)) score += 1.5;
    }
    return { s, score };
  });

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}
