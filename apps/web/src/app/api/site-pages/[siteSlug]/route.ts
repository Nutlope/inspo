/**
 * The pages of one site, for the archive tile's page-pager.
 *
 * Kept out of the /screens HTML payload on purpose. Only 310 of 784
 * sites have more than one page, they average three, and shipping every
 * sibling's image URLs inline would add roughly 90 KB to a document
 * that already carries 1000 rows - all of it dead weight for the
 * majority of visitors, who never touch an arrow.
 *
 * Instead the tile prefetches this on first hover (by which point the
 * user has already signalled interest and is loading the full-page
 * image anyway), so the data is in hand before any arrow is clicked.
 *
 * Response is small - one entry per page, images only - and cacheable
 * for an hour.
 */

import { NextResponse } from "next/server";
import { findSite } from "@inspo/db";
import type { RoleVariants } from "@inspo/shared";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export type SitePage = {
  slug: string;
  pageType: string;
  /** Fold capture, 1440x900. The tile's resting image. */
  imageUrl: string;
  heroVariants?: RoleVariants;
  /** Full-page capture, 1440 wide. What the hover-scroll animates. */
  fullPageUrl: string;
  fullVariants?: RoleVariants;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ siteSlug: string }> },
) {
  const { siteSlug } = await params;
  const site = await findSite(siteSlug);
  if (!site) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const pages: SitePage[] = site.pages.map((p) => ({
    slug: p.slug,
    pageType: p.pageType,
    imageUrl: p.imageUrl,
    heroVariants: p.heroVariants,
    fullPageUrl: p.fullPageUrl,
    fullVariants: p.fullVariants,
  }));

  return NextResponse.json(
    { siteSlug, title: site.title, pages },
    {
      headers: {
        "Cache-Control":
          "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
