import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ScreensGrid } from "@/components/screens-grid";
import { findByHostname, getAllScreens, getAllSites, isUrl } from "@inspo/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "The full archive — every site we've filed. Browse by hand or query from your agent over MCP.",
};

type SearchParams = {
  q?: string;
  style?: string;
  industry?: string;
  macro?: string;
  mode?: string;
  mood?: string;
  color?: string;
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
 * /screens — fully-client-filtered archive.
 *
 * Server pulls the full screen list once (one Postgres query) and
 * SSRs a thin shell (header + search input). The client `<ScreensGrid>`
 * handles all filter chip clicks in-memory, with View Transitions for
 * the swap. URL stays in sync via router.replace so links remain
 * bookmarkable.
 *
 * URL-paste detection runs server-side — pasting a known host
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
  // image URL, designerCredit, etc — ~400 chars/row × 1000 = 400KB
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
  }));

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      {/* Header — search-only, airy ──────────────────────────── */}
      <section className="pt-10 pb-8 sm:pt-14">
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-12 space-y-4">
            <div className="max-w-[48rem]">
              <SearchBox defaultValue={params.q ?? ""} />
            </div>
            {noUrlMatch && (
              <p className="max-w-[52ch] border-l-2 border-[var(--color-link)] pl-3 text-sm text-[var(--color-fg-muted)]">
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
        </div>
      </section>

      {/* Body — client filter + grid (instant filter, paginated render) ─── */}
      <section className="border-t rule pt-10 pb-24">
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
    </div>
  );
}

/* ───────── Inline form (server component) for /screens search ───────── */

function SearchBox({ defaultValue }: { defaultValue: string }) {
  return (
    <form
      method="GET"
      action="/screens"
      role="search"
      className="
        group flex items-center gap-3 px-4 py-3
        border-b border-[var(--color-border)]/60
        transition-colors duration-200
        hover:border-[var(--color-fg)]/40
        focus-within:border-[var(--color-link)]
      "
    >
      <span
        aria-hidden
        className="
          shrink-0 inline-flex
          text-[var(--color-fg-muted)]
          transition-colors duration-200
          group-focus-within:text-[var(--color-link)]
        "
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
        placeholder="search styles, brands, fonts — or paste a URL"
        autoComplete="off"
        className="flex-1 min-w-0 bg-transparent outline-none font-mono text-base placeholder:text-[var(--color-fg-muted)]"
      />
    </form>
  );
}
