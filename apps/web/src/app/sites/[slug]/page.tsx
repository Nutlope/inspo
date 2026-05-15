import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findSite, getMultiPageSites } from "@inspo/db";
import { PaletteStrip } from "@/components/palette-strip";
import { TagPill } from "@/components/tag-pill";
import { ScreenTile } from "@/components/screen-tile";
import { MACROSTRUCTURE_LABELS, type Macrostructure } from "@inspo/taxonomy";
import type { ScreenSummary } from "@inspo/shared";

// Runtime-rendered — pre-rendering 1k sites is wasteful at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await findSite(slug);
  if (!site) return { title: "Not found" };
  return {
    title: `${site.title} — ${site.pageCount} pages`,
    description: site.hero.description,
  };
}

const PAGE_TYPE_LABELS: Record<ScreenSummary["pageType"], string> = {
  landing: "Landing",
  pricing: "Pricing",
  features: "Features",
  auth: "Sign up & sign in",
  about: "About",
  blog: "Blog",
  changelog: "Changelog",
  docs: "Docs",
  other: "Other",
};

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await findSite(slug);
  if (!site) notFound();

  const hero = site.hero;
  const macroLabel = hero.tags.macrostructure
    ? MACROSTRUCTURE_LABELS[hero.tags.macrostructure as Macrostructure]
    : null;

  // Group non-hero pages by pageType (preserves sort order from findSite).
  const groups = new Map<ScreenSummary["pageType"], ScreenSummary[]>();
  for (const page of site.pages) {
    if (page.slug === hero.slug) continue;
    if (!groups.has(page.pageType)) groups.set(page.pageType, []);
    groups.get(page.pageType)!.push(page);
  }
  const host = (() => {
    try {
      return new URL(site.sourceUrl).host.replace(/^www\./, "");
    } catch {
      return site.sourceUrl;
    }
  })();

  return (
    <div>
      {/* Header ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[120rem] px-6 pt-12 sm:px-10 sm:pt-16">
        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="text-meta">
              <Link href="/screens" className="hover:text-[var(--color-link)]">
                ← Archive
              </Link>
            </p>
            <p className="text-meta mt-2">
              {site.pageCount} page{site.pageCount === 1 ? "" : "s"} captured
            </p>
          </div>

          <div className="lg:col-span-10">
            <h1 className="font-display max-w-[20ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl lg:text-7xl">
              {site.title}
            </h1>

            <p className="text-meta mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <a
                href={site.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-fg)] hover:text-[var(--color-link)]"
              >
                {host} ↗
              </a>
              {site.designerCredit && (
                <span>· Designer: {site.designerCredit}</span>
              )}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {macroLabel && <TagPill label={macroLabel} variant="macro" />}
              {hero.tags.style.slice(0, 3).map((s) => (
                <TagPill
                  key={s}
                  label={s.replace(/-/g, " ")}
                  href={`/screens?style=${s}`}
                />
              ))}
              {hero.tags.industry.slice(0, 2).map((i) => (
                <TagPill
                  key={i}
                  label={i.replace(/-/g, " ")}
                  href={`/screens?industry=${i}`}
                />
              ))}
              <TagPill label={hero.mode} />
            </div>
          </div>
        </div>
      </div>

      {/* Hero plate ─────────────────────────────────────────────── */}
      <div className="mx-auto mt-12 max-w-[120rem] px-6 sm:mt-16 sm:px-10">
        <Link href={`/screens/${hero.slug}`} className="group block">
          <div className="overflow-hidden border rule">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.imageUrl}
              alt={hero.description}
              className="h-auto w-full transition-transform duration-[280ms] ease-out group-hover:scale-[1.005]"
              loading="eager"
              decoding="async"
            />
          </div>
          <p className="text-meta mt-3 flex items-baseline justify-between">
            <span>Homepage — 1440 × 900</span>
            <span className="transition-colors group-hover:text-[var(--color-link)]">
              Open this page →
            </span>
          </p>
        </Link>
      </div>

      {/* Palette band — pulled from the homepage extraction ───────── */}
      <div className="mx-auto mt-16 max-w-[120rem] border-y rule px-6 py-10 sm:px-10">
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <p className="text-meta lg:col-span-2">Brand palette</p>
          <div className="lg:col-span-10">
            <PaletteStrip palette={hero.palette} size="lg" />
          </div>
        </div>
      </div>

      {/* Pages grouped by type ─────────────────────────────────── */}
      {groups.size > 0 ? (
        <div className="mx-auto mt-20 max-w-[120rem] space-y-20 px-6 pb-24 sm:px-10">
          {[...groups.entries()].map(([type, pages]) => (
            <section key={type}>
              <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
                <div className="lg:col-span-2">
                  <p className="text-meta">{PAGE_TYPE_LABELS[type]}</p>
                  <p className="text-meta mt-2">
                    {pages.length} page{pages.length === 1 ? "" : "s"}
                  </p>
                </div>
                <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:col-span-10 lg:grid-cols-3">
                  {pages.map((p) => (
                    <li key={p.slug}>
                      <ScreenTile
                        screen={p}
                        variant="hero"
                        showCaption
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-16 max-w-[120rem] px-6 pb-24 sm:px-10">
          <p className="text-meta">
            Only the homepage is captured for this site. More pages may land in
            the next discovery pass.
          </p>
        </div>
      )}
    </div>
  );
}
