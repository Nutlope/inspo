import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findSite } from "@inspo/db";
import { SiteViewer } from "@/components/site-viewer";
import { SiteActionBar } from "@/components/site-action-bar";

// Runtime-rendered - pre-rendering 1k sites is wasteful at build time.
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
    title: `${site.title} - ${site.pageCount} pages`,
    description: site.hero.description,
  };
}

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await findSite(slug);
  if (!site) notFound();

  const hero = site.hero;

  const host = (() => {
    try {
      return new URL(site.sourceUrl).host.replace(/^www\./, "");
    } catch {
      return site.sourceUrl;
    }
  })();

  return (
    <div>
      {/* Header - site title, designer credit, tags ──────────── */}
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
          </div>
        </div>
      </div>

      {/* Two-pane: DESIGN.md left, screens right ── */}
      <div className="mt-12 pb-24 sm:mt-16">
        <SiteViewer hero={hero} pages={site.pages} />
      </div>

      {/* Sticky action toast - Copy DESIGN.md + quick actions ── */}
      <SiteActionBar slug={hero.slug} sourceUrl={site.sourceUrl} />
    </div>
  );
}
