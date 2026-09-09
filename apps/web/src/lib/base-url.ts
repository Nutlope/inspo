/**
 * Canonical production origin - single source of truth for metadataBase,
 * the sitemap, robots, the OG image, and the public DESIGN.md route.
 *
 * The domain is settled, so it is a constant here rather than something
 * every deploy has to be told. Vercel's own injected production URL is
 * deliberately NOT used any more: it is the project's *.vercel.app host,
 * which is now the old address.
 *
 * Resolution order:
 *   1. INSPO_BASE_URL - escape hatch; set it to point a deploy elsewhere.
 *   2. CANONICAL      - on Vercel, the domain Inspo actually lives at.
 *   3. localhost      - dev fallback only.
 */

/** Where Inspo lives. */
export const CANONICAL_ORIGIN = "https://inspomcp.dev";

export const BASE_URL =
  process.env.INSPO_BASE_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? CANONICAL_ORIGIN
    : "http://localhost:3737");
