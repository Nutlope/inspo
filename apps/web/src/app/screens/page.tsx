import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ScreensGrid } from "@/components/screens-grid";
import { findByHostname, getAllScreens, getAllSites, isUrl } from "@inspo/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "The full archive - every site we've filed. Browse by hand or query from your agent over MCP.",
};

type SearchParams = {
  q?: string;
  style?: string;
  industry?: string;
  macro?: string;
  mode?: string;
  mood?: string;
  color?: string;
  device?: string;
  /** Perceptual colour-anchor filter (?hex=%23c7402f). Normalised on
   *  the client; on the server we trust whatever URL the user pasted
   *  and let the client sanitise / drop bad inputs. */
  hex?: string;
  /** 1-based page index. Defaults to 1. Drives the visible slice in
   *  <ScreensGrid>; full data is always shipped so client-side filters
   *  still see everything. */
  page?: string;
};

/**
 * /screens - fully-client-filtered archive.
 *
 * Server pulls the full screen list once (one Postgres query) and
 * SSRs a thin shell (header + search input). The client `<ScreensGrid>`
 * handles all filter chip clicks in-memory, with View Transitions for
 * the swap. URL stays in sync via router.replace so links remain
 * bookmarkable.
 *
 * URL-paste detection runs server-side - pasting a known host
 * redirects straight to its detail page.
 */
export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // URL-paste shortcut: pasting an http(s) URL whose hostname matches
  // the catalogue → redirect straight to the screen detail.
  if (params.q && isUrl(params.q)) {
    const all = await getAllScreens();
    const match = findByHostname(all, params.q);
    if (match) redirect(`/screens/${match.slug}`);
  }

  // gallery-style: one tile per SITE, not per captured screen. The hero
  // (landing page) is what shows; pageCount surfaces on the tile. Click
  // routes to /sites/[siteSlug] which expands to all captured pages.
  const allSites = await getAllSites();
  const allScreens = await getAllScreens();
  const noUrlMatch = Boolean(
    params.q && isUrl(params.q) && allScreens.every((s) => !s.sourceUrl.includes(params.q!)),
  );

  // Trim the per-row payload before shipping to the client filter.
  // Earlier this carried description (240 chars), fonts, tech, full
  // image URL, designerCredit, etc - ~400 chars/row × 1000 = 400KB
  // of HTML. The grid only needs the filter surface + the visible
  // pixels. Per-screen detail loads from /screens/[slug] which fetches
  // the full record server-side. ~110 chars/row → ~110KB.
  const compact = allSites.map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    sourceUrl: s.sourceUrl,
    designerCredit: undefined,
    capturedAt: s.capturedAt,
    imageUrl: s.imageUrl,
    fullPageUrl: s.imageUrl, // alias so ScreenSummary stays shaped
    thumbUrl: s.thumbUrl,
    description: "",
    palette: s.palette,
    fonts: [],
    tech: [],
    mode: s.mode,
    tags: s.tags,
    designSystem: {
      typeRamp: [],
      spacingScale: [],
      radiusScale: [],
      containerWidth: null,
      cssVariables: {},
      colorWords: s.designSystem.colorWords,
    },
    siteSlug: s.siteSlug,
    pageType: s.pageType,
    pageCount: s.pageCount,
    components: [],
    // Device filter surface: presence only, the URL itself isn't shown.
    mobileImageUrl: s.mobileImageUrl,
    // The tile's <picture> needs these or every cell falls back to the
    // PNG. Two 384-wide URLs per row costs ~240 chars of payload and
    // saves ~117 KB per visible tile (12 KB WebP vs 129 KB PNG), so it
    // pays for itself on the first screenful. heroVariants stays out:
    // the tile only ever renders the thumb-sized set.
    thumbVariants: s.thumbVariants,
  }));

  return (
    <>
      {/* Header - search-only, airy ──────────────────────────── */}
      <section className="px-4 pt-8 pb-6 sm:pt-10">
        <div className="mx-auto max-w-[48rem] space-y-4">
          <SearchBox defaultValue={params.q ?? ""} />
          {noUrlMatch && (
            <p className="mx-auto max-w-[52ch] rounded-card border rule px-4 py-3 text-sm text-[var(--color-fg-muted)]">
              We don&rsquo;t have{" "}
              <span className="text-[var(--color-fg)]">{params.q}</span> yet. Want us to grab it?{" "}
              <Link
                href={`/extract?url=${encodeURIComponent(params.q ?? "")}`}
                className="text-[var(--color-link)] underline-offset-4 hover:underline"
              >
                Extract it →
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Body - client filter + grid, full-bleed so the screenshots
          own the page edge to edge ───────────────────────────── */}
      <section className="px-2 pb-24 sm:px-3">
        <ScreensGrid
          screens={compact}
          initialFilters={{
            ...params,
            // Parse server-side so the first paint already shows the
            // right slice (no flash of page 1 then re-slice on hydrate).
            page: params.page ? Math.max(1, parseInt(params.page, 10) || 1) : 1,
          }}
        />
      </section>
    </>
  );
}

/* ───────── Inline form (server component) for /screens search ───────── */

function SearchBox({ defaultValue }: { defaultValue: string }) {
  return (
    <form
      method="GET"
      action="/screens"
      role="search"
      className="group flex items-center gap-3 rounded-full border rule bg-[color-mix(in_oklab,var(--color-fg)_3%,var(--color-bg))] px-5 py-3 transition-colors duration-200 hover:border-[var(--color-fg)]/40 focus-within:border-[var(--color-link)]"
    >
      <span
        aria-hidden
        className="shrink-0 inline-flex text-[var(--color-fg-muted)] transition-colors duration-200 group-focus-within:text-[var(--color-link)]"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search styles, brands, fonts - or paste a URL"
        autoComplete="off"
        className="flex-1 min-w-0 bg-transparent outline-none text-base placeholder:text-[var(--color-fg-muted)]"
      />
    </form>
  );
}
