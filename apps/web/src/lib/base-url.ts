/**
 * Canonical production origin - single source of truth for metadataBase,
 * the sitemap, robots, the OG image, and the public DESIGN.md route.
 *
 * Resolution order:
 *   1. INSPO_BASE_URL                - set in Vercel once the domain is final.
 *   2. VERCEL_PROJECT_PRODUCTION_URL - Vercel auto-injects the *production*
 *      domain on every deploy, so canonical / OG / sitemap URLs are correct
 *      even before INSPO_BASE_URL is set. (Deliberately NOT VERCEL_URL, which
 *      is the per-deploy preview URL and changes on every push.)
 *   3. localhost                     - dev fallback only.
 *
 * This replaces the old inlined `?? "http://localhost:3737"` defaults that
 * would otherwise poison every absolute URL if INSPO_BASE_URL were unset.
 */
export const BASE_URL =
  process.env.INSPO_BASE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3737");
