/* macrostructure: Marquee Hero */

// Runtime-rendered - pre-rendering at build hits Neon hard.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { ScreenTile } from "@/components/screen-tile";
import { HomeCta } from "@/components/home-cta";
import { CopyValue } from "@/components/copy-value";
import { getAllSites, getArchiveStats } from "@inspo/db";

const GRID_LIMIT = 24;

export default async function HomePage() {
  // One tile per site, not per captured screen. The "featured" sort
  // opens with the 24 tiles picked by hand (FRONT_PAGE in
  // packages/db/src/queries.ts), so this grid is exactly that set: a
  // highlight reel, not a changelog.
  const [allSites, stats] = await Promise.all([
    getAllSites({}, "featured"),
    getArchiveStats(),
  ]);
  const totalCount = allSites.length;
  const grid = allSites.slice(0, GRID_LIMIT);

  return (
    <>
      {/* HERO ─ marquee-hero macrostructure ──────────────────────
          The headline used to be "The sites we'd actually study",
          which told a first-time visitor nothing about what this is
          or what it gets them - the deck did all the explaining and
          the search capsule underneath assumed you already knew what
          you were looking for. Both are now doing the opposite job:
          the headline states the mechanism, the deck states the
          payoff, and the CTA points at getting started. ───────── */}
      <section className="px-6 pt-16 pb-12 sm:px-10 sm:pt-24 sm:pb-16">
        <div className="mx-auto max-w-[68rem] text-center">
          <h1 className="font-display mx-auto max-w-[20ch] text-balance text-[length:var(--text-h1)] leading-[0.95] tracking-tight">
            Real websites as{" "}
            <em className="not-italic text-[var(--color-link)]">inspiration</em>{" "}
            for your agent.
          </h1>

          <p className="mx-auto mt-6 max-w-[46ch] text-base text-[var(--color-fg-muted)] sm:text-lg">
            A curated archive of {stats.sites.toLocaleString()} production
            sites. Browse it yourself, or plug it straight into your coding
            agent.
          </p>

          <div className="mt-9 sm:mt-11">
            <HomeCta screenCount={stats.screens} />
          </div>
        </div>
      </section>

      {/* GRID ─ full-bleed, screenshots only. The columns keep piling
          up on wider viewports (auto-fill) so an ultrawide shows six
          or seven abreast with the same tight gutter. ─────────── */}
      <section className="px-2 pb-14 sm:px-3">
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] sm:gap-3">
          {grid.map((site, i) => (
            <li key={site.siteSlug}>
              <ScreenTile
                screen={site}
                index={i + 1}
                variant="hero"
                pageCount={site.pageCount}
                priority={i < 8}
                showCaption={false}
                hoverScroll
              />
            </li>
          ))}
        </ul>

        <div className="mt-10 flex justify-center">
          <Link
            href="/screens"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-fg)] px-7 py-3.5 text-sm text-[var(--color-bg)] transition-[background-color,transform] duration-200 hover:scale-[1.03] hover:bg-[var(--color-link)]"
          >
            Browse all {totalCount.toLocaleString()} sites
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* MCP CARD ─────────────────────────────────────────────── */}
      <section className="px-2 pb-16 sm:px-3">
        <div className="mx-auto max-w-[110rem] rounded-card border rule bg-[color-mix(in_oklab,var(--color-fg)_3%,var(--color-bg))] px-6 py-12 text-center sm:px-10 sm:py-16">
          <p className="text-meta">For coding agents</p>
          <h2 className="font-display mx-auto mt-4 max-w-[24ch] text-balance text-3xl leading-tight tracking-tight sm:text-4xl">
            Your agent doesn&rsquo;t have taste.{" "}
            <em className="not-italic text-[var(--color-link)]">Lend it some.</em>
          </h2>

          <p className="mx-auto mt-5 max-w-[52ch] text-[var(--color-fg-muted)]">
            One line turns this whole archive into an MCP server: ask for a
            vibe and your agent pulls real captures, reference components,
            and each site&rsquo;s DESIGN.md to build from.
          </p>

          <div className="mx-auto mt-8 inline-flex max-w-full items-center gap-3 rounded-full border rule bg-[var(--color-bg)] py-3 pl-6 pr-4">
            <span aria-hidden className="text-[var(--color-fg-muted)]">$</span>
            <code className="truncate text-[var(--color-fg)]">npx -y inspo-mcp install</code>
            <CopyValue value="npx -y inspo-mcp install" label="Copy install command" className="pl-1" />
          </div>

          <p className="mt-7">
            <Link
              href="/mcp"
              className="inline-flex items-center gap-2 rounded-full border rule px-6 py-3 text-sm transition-colors hover:border-[var(--color-link)] hover:text-[var(--color-link)]"
            >
              See what it can do
              <span aria-hidden>→</span>
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
