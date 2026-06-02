/**
 * Node / default seed source — the bundled static catalogue.
 *
 * Selected by the "default" (and "node") export condition of
 * `@inspo/db/seed-source`. The web app and the stdio MCP run in Node
 * and get the full ~16MB catalogue inlined at build time, exactly as
 * before this split existed.
 *
 * The Cloudflare Worker resolves the "workerd" condition to
 * `seed-source.edge.ts` instead (which exports `null`), so the seed is
 * NOT bundled into the Worker script — it fetches the catalogue from
 * the CDN at runtime via `loadCatalogueFromUrl()`. That keeps the
 * Worker under Cloudflare's bundle-size cap.
 */
import staticScreensJson from "./static-screens.json" with { type: "json" };

export const bundledScreens: unknown[] | null =
  Array.isArray(staticScreensJson) && (staticScreensJson as unknown[]).length > 0
    ? (staticScreensJson as unknown[])
    : null;
