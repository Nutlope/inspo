/**
 * Edge / workerd seed source — intentionally empty.
 *
 * Selected by the "workerd" export condition of `@inspo/db/seed-source`
 * so the ~16MB static seed is NOT bundled into the Cloudflare Worker.
 * The Worker calls `loadCatalogueFromUrl()` at startup, which fetches
 * the catalogue from the CDN and injects it via `setCatalogue()` before
 * any tool handler runs.
 */
export const bundledScreens: unknown[] | null = null;
