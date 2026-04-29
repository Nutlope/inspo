import Link from "next/link";
import { Dateline } from "@/components/dateline";
import { ScreenTile } from "@/components/screen-tile";
import { findScreen, getAllCollections, getAllScreens } from "@inspo/db";
import { site } from "@/lib/site";

export default async function HomePage() {
  const [collections, screens] = await Promise.all([
    getAllCollections(),
    getAllScreens(),
  ]);
  // Pick the cover of the most recent issue as the featured plate.
  const featuredCollection = collections[0];
  const featured = featuredCollection
    ? await findScreen(featuredCollection.coverScreenSlug)
    : null;

  // Contact sheet — the latest 6, excluding the featured one
  const recent = screens
    .filter((s) => s.slug !== featured?.slug)
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      {/* HERO ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-y-10 pt-16 pb-24 sm:pt-24 sm:pb-32 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <Dateline />
        </div>

        <div className="lg:col-span-10">
          <h1 className="text-display max-w-[18ch] text-balance">
            An archive of <em className="italic">websites</em>, served to your
            agent.
          </h1>

          <p className="mt-10 max-w-[52ch] text-lg leading-relaxed text-[var(--color-fg-muted)] sm:text-xl">
            {site.name} is a curated collection of real-world website
            screenshots — palettes, typography, components — readable both by
            you, here, and by the coding agent on your other monitor, over MCP.
          </p>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 text-meta">
            <Link
              href="/screens"
              className="group inline-flex items-center gap-3 text-[var(--color-fg)] transition-colors hover:text-[var(--color-link)]"
            >
              <span aria-hidden className="text-[var(--color-link)]">
                →
              </span>
              Enter the archive
            </Link>
            <Link
              href="/mcp"
              className="group inline-flex items-center gap-3 text-[var(--color-fg)] transition-colors hover:text-[var(--color-link)]"
            >
              <span aria-hidden className="text-[var(--color-link)]">
                →
              </span>
              Install the MCP server
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED PLATE ─────────────────────────────────────── */}
      {featured && featuredCollection && (
        <section className="border-t rule pt-10 pb-24">
          <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
            <p className="text-meta lg:col-span-2">
              Featured Nº{featuredCollection.number}
            </p>

            <div className="lg:col-span-10">
              <Link
                href={`/collections/${featuredCollection.slug}`}
                className="group block"
              >
                <div className="aspect-[16/10] w-full overflow-hidden border rule transition-transform duration-300 group-hover:-translate-y-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featured.imageUrl}
                    alt={featured.description}
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                </div>
                <div className="mt-5 grid grid-cols-1 gap-y-3 lg:grid-cols-12 lg:gap-x-6">
                  <div className="lg:col-span-9">
                    <p className="font-display text-2xl">
                      <em className="italic">{featuredCollection.title}</em>
                      {" — "}
                      <span className="text-[var(--color-fg-muted)]">
                        opens with{" "}
                      </span>
                      <span className="transition-colors group-hover:text-[var(--color-link)]">
                        {featured.title}
                      </span>
                      .
                    </p>
                  </div>
                  <p className="text-meta lg:col-span-3 lg:text-right">
                    Read Issue Nº{featuredCollection.number} →
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CONTACT SHEET ──────────────────────────────────────── */}
      <section className="border-t rule pt-10 pb-24">
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="text-meta">Contact sheet</p>
            <p className="mt-2 max-w-[20ch] text-meta">
              The latest, in the order they were filed.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:col-span-10 lg:grid-cols-3">
            {recent.map((screen, i) => (
              <li key={screen.slug}>
                <ScreenTile screen={screen} index={i + 1} variant="hero" />
              </li>
            ))}
          </ul>

          <div className="lg:col-start-3 lg:col-span-10 lg:mt-4">
            <Link
              href="/screens"
              className="text-meta hover:text-[var(--color-link)]"
            >
              See all {screens.length} entries →
            </Link>
          </div>
        </div>
      </section>

      {/* MCP STRIP ──────────────────────────────────────────── */}
      <section className="border-t rule pt-12 pb-24">
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <p className="text-meta lg:col-span-2">For agents</p>

          <div className="lg:col-span-10">
            <h2 className="font-display max-w-[24ch] text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your coding agent doesn&rsquo;t have taste.{" "}
              <em className="italic">Lend it some.</em>
            </h2>

            <p className="mt-6 max-w-[60ch] text-[var(--color-fg-muted)]">
              Install one MCP server and Claude Code, Cursor, Codex, or Zed
              gain a new tool: <code className="font-mono text-[0.95em] text-[var(--color-fg)]">search_screens</code>. Ask
              for &ldquo;minimalist editorial agency portfolios&rdquo; and the
              agent receives eight curated screenshots, palettes, and component
              breakdowns to reason over before writing a single line.
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
