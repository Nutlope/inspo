/* Hallmark · macrostructure: Marquee Hero · sort: Latest|Most varied|Random */

import Link from "next/link";
import { ScreenTile } from "@/components/screen-tile";
import { HomeSearch } from "@/components/home-search";
import { SortTabs } from "@/components/sort-tabs";
import { HomeChips } from "@/components/home-chips";
import {
  findScreen,
  getAllCollections,
  getAllScreens,
  type ScreenSort,
} from "@inspo/db";

const VALID_SORTS = new Set(["latest", "varied", "random"]);
const GRID_LIMIT = 12;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const sp = await searchParams;
  const sort: ScreenSort = VALID_SORTS.has(sp.sort ?? "")
    ? (sp.sort as ScreenSort)
    : "latest";

  const [allScreens, collections] = await Promise.all([
    getAllScreens({}, sort),
    getAllCollections(),
  ]);
  const totalCount = allScreens.length;
  const grid = allScreens.slice(0, GRID_LIMIT);
  const featuredCollection = collections[0];
  const featured = featuredCollection
    ? await findScreen(featuredCollection.coverScreenSlug)
    : null;

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      {/* HERO ─ marquee-hero macrostructure ──────────────────── */}
      <section className="pt-12 pb-14 sm:pt-20 sm:pb-16">
        <div className="mx-auto max-w-[68rem] text-center">
          <h1 className="font-display mx-auto max-w-[18ch] text-balance text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] tracking-tight">
            A thousand sites we&rsquo;d{" "}
            <em className="italic">actually study</em>.
          </h1>

          <p className="mx-auto mt-7 max-w-[44ch] text-[var(--color-fg-muted)] sm:mt-8">
            Pick a mood, paste a URL, or just scroll. Your coding agent can do
            the same — see <Link href="/mcp" className="underline-offset-4 hover:text-[var(--color-link)] hover:underline">the MCP</Link>.
          </p>

          <div className="mx-auto mt-10 max-w-[42rem] sm:mt-12">
            <HomeSearch />
          </div>

          <div className="mt-6 flex justify-center">
            <SortTabs active={sort} />
          </div>

          <HomeChips />
        </div>
      </section>

      {/* GRID ─────────────────────────────────────────────────── */}
      <section className="border-t rule pt-10 pb-16">
        <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {grid.map((screen, i) => (
            <li key={screen.slug}>
              <ScreenTile screen={screen} index={i + 1} variant="hero" />
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap items-baseline justify-between gap-4 border-t rule pt-6 text-meta">
          <span>
            Showing {grid.length} of {totalCount} ·{" "}
            <span className="text-[var(--color-fg)]">{sortLabel(sort)}</span>
          </span>
          <Link
            href="/screens"
            className="hover:text-[var(--color-link)]"
          >
            See all {totalCount} entries →
          </Link>
        </div>
      </section>

      {/* FEATURED ISSUE ROW ───────────────────────────────────── */}
      {featured && featuredCollection && (
        <section className="border-t rule pt-10 pb-16">
          <Link
            href={`/collections/${featuredCollection.slug}`}
            className="group block"
          >
            <div className="grid grid-cols-1 items-baseline gap-y-4 lg:grid-cols-12 lg:gap-x-10">
              <div className="text-meta lg:col-span-2">
                <p>
                  Issue Nº{featuredCollection.number}
                </p>
                <p className="mt-1">{featuredCollection.date}</p>
              </div>

              <div className="lg:col-span-7">
                <h2 className="font-display text-3xl leading-tight sm:text-4xl">
                  <em className="italic">{featuredCollection.title}</em>
                </h2>
                <p className="mt-3 max-w-[60ch] text-[var(--color-fg-muted)]">
                  {featuredCollection.editorBlurb}
                </p>
              </div>

              <div className="text-meta lg:col-span-3 lg:text-right">
                <p>
                  {featuredCollection.screens.length} plates
                </p>
                <p className="mt-2 transition-colors group-hover:text-[var(--color-link)]">
                  Read the issue →
                </p>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* MCP STRIP ────────────────────────────────────────────── */}
      <section className="border-t rule pt-12 pb-24">
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <p className="text-meta lg:col-span-2">For agents</p>

          <div className="lg:col-span-10">
            <h2 className="font-display max-w-[24ch] text-4xl leading-tight tracking-tight sm:text-5xl">
              Your agent doesn&rsquo;t have taste.{" "}
              <em className="italic">Lend it some.</em>
            </h2>

            <p className="mt-6 max-w-[60ch] text-[var(--color-fg-muted)]">
              One install and Claude Code, Cursor, Codex, and Zed get a new
              tool — <code className="font-mono text-[0.95em] text-[var(--color-fg)]">search_screens</code>. Ask for
              {" "}&ldquo;minimalist editorial agency portfolios&rdquo; and your
              agent gets eight real ones to study before it writes a line.
            </p>

            <pre className="mt-8 overflow-x-auto border rule bg-[color-mix(in_oklab,var(--color-fg)_4%,var(--color-bg))] p-4 font-mono text-sm leading-relaxed">
              <code>{"$ npx inspo init"}</code>
              {"\n"}
              <code className="text-[var(--color-fg-muted)]">
                {"  ✓ detected Claude Code, Cursor"}
              </code>
              {"\n"}
              <code className="text-[var(--color-fg-muted)]">
                {"  ✓ added inspo MCP server"}
              </code>
              {"\n"}
              <code className="text-[var(--color-fg-muted)]">
                {"  → opening browser to authenticate…"}
              </code>
            </pre>

            <p className="text-meta mt-6">
              <Link href="/mcp" className="hover:text-[var(--color-link)]">
                Tool reference + Hallmark integration →
              </Link>
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

function sortLabel(sort: ScreenSort): string {
  switch (sort) {
    case "varied":
      return "most varied";
    case "random":
      return "random";
    default:
      return "latest";
  }
}
