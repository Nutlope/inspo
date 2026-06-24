import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ScreenTile } from "@/components/screen-tile";
import { PaletteStrip } from "@/components/palette-strip";
import { PaletteTable } from "@/components/palette-table";
import { TagPill } from "@/components/tag-pill";
import { TypeRamp } from "@/components/type-ramp";
import { ScaleRuler } from "@/components/spacing-ruler";
import { CopyDesignMd } from "@/components/copy-design-md";
import { ExportBlock } from "@/components/export-block";
import { AgentPromptGuide } from "@/components/agent-prompt-guide";
import { SiteActionBar } from "@/components/site-action-bar";
import { SkeletonTile } from "@/components/skeleton-tile";
import { AddToCompare } from "@/components/add-to-compare";
import { TileImage } from "@/components/tile-image";
import {
  findScreen,
  findSimilar,
  findSite,
  getAllCollections,
  getAllScreens,
} from "@inspo/db";
import type { ScreenSummary } from "@inspo/shared";
import {
  MACROSTRUCTURE_LABELS,
  type Macrostructure,
} from "@inspo/taxonomy";

// Runtime-rendered with on-demand cache; pre-rendering 3,800 pages at
// build is wasteful and slow. The detail-page row size is small enough
// that an SSR/render-on-demand pass is fast (~200ms).
export const dynamic = "force-dynamic";

/**
 * Sub-section header for the design-system breakdown: a small caps label
 * with a hairline rule running to the right edge, so each block (type
 * ramp, spacing, radius…) reads as a deliberate filed section rather
 * than a lone label floating over sparse content.
 */
function SectionRule({ label }: { label: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <p className="text-meta whitespace-nowrap">{label}</p>
      <span
        aria-hidden
        className="h-px flex-1 bg-[color-mix(in_oklab,var(--color-border)_70%,transparent)]"
      />
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const screen = await findScreen(slug);
  if (!screen) return { title: "Not found" };
  return {
    title: screen.title,
    description: screen.description,
  };
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-x-4 border-b rule py-4 first:border-t">
      <dt className="text-meta">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default async function ScreenDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const screen = await findScreen(slug);
  if (!screen) notFound();

  const macroLabel = screen.tags.macrostructure
    ? MACROSTRUCTURE_LABELS[screen.tags.macrostructure as Macrostructure]
    : null;

  return (
    <div>
      {/* Editorial caption ─────────────────────────────────── */}
      <div className="screens-detail-section mx-auto max-w-[120rem] px-6 pt-12 sm:px-10 sm:pt-16" style={{ ["--idx" as string]: 0 }}>
        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="text-meta">
              <Link
                href="/screens"
                className="hover:text-[var(--color-link)]"
              >
                ← Archive
              </Link>
            </p>
            <p className="text-meta mt-2">№ {screen.id}</p>
          </div>

          <div className="lg:col-span-10">
            <Suspense fallback={null}>
              <SiteBacklink slug={screen.slug} />
            </Suspense>

            <h1 className="font-display max-w-[20ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl lg:text-7xl">
              {screen.title}
            </h1>

            {/* Northstar - the design's soul in one line */}
            {screen.northstar && (
              <p className="mt-5 max-w-[44ch] font-display text-xl italic leading-snug text-[var(--color-fg-muted)] lg:text-2xl">
                {screen.northstar}
              </p>
            )}

            {/* Tag pills */}
            <div className="mt-8 flex flex-wrap gap-2">
              {macroLabel && (
                <TagPill label={macroLabel} variant="macro" />
              )}
              {screen.tags.style.map((s) => (
                <TagPill
                  key={s}
                  label={s.replace(/-/g, " ")}
                  href={`/screens?style=${s}`}
                />
              ))}
              {screen.tags.industry.map((i) => (
                <TagPill
                  key={i}
                  label={i.replace(/-/g, " ")}
                  href={`/screens?industry=${i}`}
                />
              ))}
              <TagPill label={screen.mode} />
            </div>
          </div>
        </div>
      </div>

      {/* Hero plate - desktop, paired with the mobile capture when the
          row has been backfilled. The pair is the responsiveness signal:
          one real page at two widths, side by side. ─────────────── */}
      <div className="mx-auto mt-12 max-w-[120rem] px-6 sm:mt-16 sm:px-10">
        <div
          className={
            screen.mobileImageUrl
              ? "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start"
              : ""
          }
        >
          <div className="overflow-hidden border rule">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screen.imageUrl}
              alt={screen.description}
              className="h-auto w-full"
              loading="eager"
              decoding="async"
            />
          </div>
          {screen.mobileImageUrl && (
            <figure className="mx-auto w-full max-w-[15rem]">
              <div className="overflow-hidden border rule">
                <TileImage
                  variants={screen.mobileVariants}
                  fallbackSrc={screen.mobileImageUrl}
                  alt={`${screen.title} - mobile`}
                  sizes="240px"
                  imgClassName="block h-auto w-full"
                />
              </div>
              <figcaption className="text-meta mt-2 text-center">
                Mobile · 375
              </figcaption>
            </figure>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 text-meta">
          <span>
            {screen.mobileImageUrl
              ? "Hero - desktop 1440 × 900 · mobile 375"
              : "Hero - desktop · 1440 × 900"}
          </span>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <AddToCompare slug={screen.slug} title={screen.title} />
            <Link
              href={`/screens/${screen.slug}/history`}
              className="hover:text-[var(--color-link)]"
            >
              See history ↻
            </Link>
            <a
              href={screen.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-link)]"
            >
              Visit source ↗
            </a>
          </div>
        </div>
      </div>

      {/* Spec sheet + full page ───────────────────────────── */}
      <div className="screens-detail-section mx-auto mt-24 max-w-[120rem] px-6 sm:px-10" style={{ ["--idx" as string]: 1 }}>
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-12 lg:gap-x-10">
          {/* Spec sheet */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-8">
              <p className="text-meta">What it&rsquo;s made of</p>
              <dl className="mt-4">
                <MetaRow label="Designer">
                  {screen.designerCredit ?? "-"}
                </MetaRow>
                <MetaRow label="Captured">
                  <time dateTime={screen.capturedAt}>{screen.capturedAt}</time>
                </MetaRow>
                <MetaRow label="Source">
                  <a
                    href={screen.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--color-link)]"
                  >
                    {new URL(screen.sourceUrl).host} ↗
                  </a>
                </MetaRow>
                <MetaRow label="Mode">{screen.mode}</MetaRow>
                {macroLabel && (
                  <MetaRow label="Macrostructure">{macroLabel}</MetaRow>
                )}
                <MetaRow label="Typefaces">
                  <ul className="space-y-1">
                    {screen.fonts.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </MetaRow>
                <MetaRow label="Stack">
                  <ul className="flex flex-wrap gap-x-3 gap-y-1">
                    {screen.tech.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </MetaRow>
                <MetaRow label="Palette">
                  <PaletteStrip palette={screen.palette} size="sm" showHex={false} />
                </MetaRow>
              </dl>

              <Suspense fallback={null}>
                <AppearsIn slug={screen.slug} />
              </Suspense>
            </div>
          </aside>

          {/* Full-page scroll viewer - desktop, with the mobile scroll
              alongside it when the row has a mobile capture. */}
          <div className="lg:col-span-8">
            <p className="text-meta mb-3">
              The whole page, top to bottom
              {screen.mobileFullUrl ? " - desktop & mobile" : ""}
            </p>
            <div
              className={
                screen.mobileFullUrl
                  ? "grid grid-cols-[minmax(0,1fr)_auto] gap-4"
                  : ""
              }
            >
              <div className="max-h-[80vh] overflow-y-auto border rule">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screen.fullPageUrl}
                  alt={`${screen.title} - full page scroll`}
                  className="block w-full"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              {screen.mobileFullUrl && (
                <div className="hidden max-h-[80vh] w-[190px] overflow-y-auto border rule sm:block">
                  <TileImage
                    variants={screen.mobileFullVariants}
                    fallbackSrc={screen.mobileFullUrl}
                    alt={`${screen.title} - mobile full page`}
                    sizes="190px"
                    imgClassName="block h-auto w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Palette band ─────────────────────────────────────── */}
      <div className="screens-detail-section mx-auto mt-24 max-w-[120rem] border-y rule px-6 py-10 sm:px-10" style={{ ["--idx" as string]: 2 }}>
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="text-meta">Palette</p>
            <p className="mt-2 max-w-[24ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
              Click any value to copy. Roles are suggestions, not gospel.
            </p>
          </div>
          <div className="lg:col-span-10">
            <PaletteTable
              palette={screen.palette}
              colorWords={screen.designSystem.colorWords}
            />
          </div>
        </div>
      </div>

      {/* Design system ─────────────────────────────────────── */}
      {(screen.designSystem.typeRamp.length > 0 ||
        screen.designSystem.spacingScale.length > 0 ||
        screen.designSystem.radiusScale.length > 0 ||
        Object.keys(screen.designSystem.cssVariables).length > 0) && (
        <div className="screens-detail-section mx-auto mt-24 max-w-[120rem] px-6 pb-12 sm:px-10" style={{ ["--idx" as string]: 3 }}>
          <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-10">
            <div className="lg:col-span-2">
              <p className="text-meta">How to build one like this</p>
              <p className="mt-2 max-w-[28ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
                Read off the live site. Treat it as reference, not a recipe.
              </p>
              <div className="mt-6">
                <CopyDesignMd slug={screen.slug} />
              </div>
            </div>

            <div className="lg:col-span-10 space-y-14">
              {/* Type ramp */}
              {screen.designSystem.typeRamp.length > 0 && (
                <section>
                  <SectionRule label="Type ramp" />
                  <TypeRamp ramp={screen.designSystem.typeRamp} />
                </section>
              )}

              {/* Spacing */}
              {screen.designSystem.spacingScale.length > 0 && (
                <section>
                  <SectionRule label="Spacing scale" />
                  <ScaleRuler values={screen.designSystem.spacingScale} />
                </section>
              )}

              {/* Radius */}
              {screen.designSystem.radiusScale.length > 0 && (
                <section>
                  <SectionRule label="Radius scale" />
                  <ScaleRuler
                    values={screen.designSystem.radiusScale}
                    capPx={64}
                  />
                </section>
              )}

              {/* Container */}
              {screen.designSystem.containerWidth && (
                <section>
                  <SectionRule label="Container" />
                  <p className="font-display text-2xl">
                    Max content width{" "}
                    <span className="text-[var(--color-link)]">
                      {screen.designSystem.containerWidth}px
                    </span>
                  </p>
                </section>
              )}

              {/* Export - CSS / Tailwind v4 / Markdown tabs */}
              <section>
                <SectionRule label="Export" />
                <ExportBlock
                  slug={screen.slug}
                  palette={screen.palette}
                  cssVariables={screen.designSystem.cssVariables}
                />
              </section>

              {/* Agent prompt - drop-in for Cursor / Claude Code */}
              <AgentPromptGuide
                slug={screen.slug}
                title={screen.title}
                palette={screen.palette}
                fonts={screen.fonts}
                macrostructure={macroLabel ?? null}
              />
            </div>
          </div>
        </div>
      )}

      {/* Similar ──────────────────────────────────────────── */}
      <div className="screens-detail-section mx-auto mt-24 max-w-[120rem] px-6 pb-24 sm:px-10" style={{ ["--idx" as string]: 4 }}>
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-2">
            <p className="text-meta">Sites that feel similar</p>
            <p className="text-meta mt-2 max-w-[20ch]">
              {macroLabel ? "Same macrostructure, different voice." : "Same vibe, different page."}
            </p>
          </div>
          <Suspense fallback={<SimilarSkeleton />}>
            <SimilarGrid slug={screen.slug} />
          </Suspense>
        </div>
      </div>

      {/* Sticky action toast - Copy DESIGN.md + quick actions ── */}
      <SiteActionBar slug={screen.slug} sourceUrl={screen.sourceUrl} />
    </div>
  );
}

async function SimilarGrid({ slug }: { slug: string }) {
  const similar = await findSimilar(slug, 3);
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:col-span-10 lg:grid-cols-3">
      {similar.map((s: ScreenSummary) => (
        <li key={s.slug}>
          <ScreenTile screen={s} variant="hero" />
        </li>
      ))}
    </ul>
  );
}

function SimilarSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:col-span-10 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <SkeletonTile variant="hero" />
        </li>
      ))}
    </ul>
  );
}

async function SiteBacklink({ slug }: { slug: string }) {
  const screen = await findScreen(slug);
  if (!screen) return null;
  // Only show when this site has more than one page captured.
  const site = await findSite(screen.siteSlug);
  if (!site || site.pageCount <= 1) return null;
  const isHero = site.hero.slug === slug;
  return (
    <p className="text-meta mb-3">
      <Link
        href={`/sites/${screen.siteSlug}`}
        className="text-[var(--color-link)] underline-offset-4 hover:underline"
      >
        {isHero
          ? `See all ${site.pageCount} pages of ${site.title} →`
          : `Part of ${site.title} - ${site.pageCount} pages captured →`}
      </Link>
    </p>
  );
}

async function AppearsIn({ slug }: { slug: string }) {
  const allCollections = await getAllCollections();
  const inCollections = allCollections.filter((c) =>
    c.screens.some((entry) => entry.slug === slug),
  );
  if (inCollections.length === 0) return null;
  return (
    <div className="mt-10 space-y-2">
      <p className="text-meta">Appears in</p>
      {inCollections.map((c) => (
        <Link
          key={c.slug}
          href={`/collections/${c.slug}`}
          className="block text-sm hover:text-[var(--color-link)]"
        >
          Issue Nº{c.number} - {c.title} →
        </Link>
      ))}
    </div>
  );
}
