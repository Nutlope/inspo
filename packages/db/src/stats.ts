/**
 * Live archive stats - the single source of truth for every count the
 * site or MCP prints. Replaces hardcoded copy ("a thousand sites",
 * "twenty-eight components") that drifted from reality.
 */

import { getAllScreens, getReferenceComponents } from "./queries";

export type ArchiveStats = {
  sites: number;
  screens: number;
  references: number;
  withMobile: number;
  multiPageSites: number;
};

export async function getArchiveStats(): Promise<ArchiveStats> {
  const screens = await getAllScreens();
  const pagesPerSite = new Map<string, number>();
  let withMobile = 0;
  for (const s of screens) {
    pagesPerSite.set(s.siteSlug, (pagesPerSite.get(s.siteSlug) ?? 0) + 1);
    if (s.mobileImageUrl) withMobile++;
  }
  let multiPageSites = 0;
  for (const n of pagesPerSite.values()) if (n > 1) multiPageSites++;
  return {
    sites: pagesPerSite.size,
    screens: screens.length,
    references: getReferenceComponents().length,
    withMobile,
    multiPageSites,
  };
}
