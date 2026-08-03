/**
 * Master-detail viewer for /sites/[slug] - gallery-style two-pane.
 *
 * Desktop: DESIGN.md (palette, type, fonts, tech, tags, tokens) sticks
 * on the LEFT half while the site's captured pages scroll on the
 * RIGHT - read the system once, scan the screens against it. Mobile
 * stacks: DESIGN.md first, then the screens.
 *
 * Screens use the above-the-fold HERO capture, which is clean at
 * 1440-wide for every site (the full-page captures can carry baked-in
 * horizontal-overflow whitespace on ~1% of sites - that's why the old
 * full-page layout showed dead space). Each screen links to its full
 * /screens/[slug] detail for the scroll + type ramp + similar grid.
 *
 * Server component - no client state needed for the two-pane scroll.
 */

import Link from "next/link";
import type { ScreenSummary } from "@inspo/shared";
import { MACROSTRUCTURE_LABELS, type Macrostructure } from "@inspo/taxonomy";
import { PaletteTable } from "@/components/palette-table";
import { TypeRamp } from "@/components/type-ramp";
import { TagPill } from "@/components/tag-pill";
import { CopyDesignMd } from "@/components/copy-design-md";

const PAGE_TYPE_LABELS: Record<ScreenSummary["pageType"], string> = {
  landing: "Landing",
  pricing: "Pricing",
  features: "Features",
  auth: "Sign up",
  about: "About",
  blog: "Blog",
  changelog: "Changelog",
  docs: "Docs",
  other: "Other",
};

export function SiteViewer({
  hero,
  pages,
}: {
  hero: ScreenSummary;
  pages: ScreenSummary[];
}) {
  const flat = [hero, ...pages.filter((p) => p.slug !== hero.slug)];
  const macroLabel = hero.tags.macrostructure
    ? MACROSTRUCTURE_LABELS[hero.tags.macrostructure as Macrostructure]
    : null;

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-12">
        {/* DESIGN.md - left, sticky ─────────────────────────── */}
        <aside className="lg:col-span-5 lg:sticky lg:top-8 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-2">
          <div className="flex items-baseline justify-between border-b rule pb-3">
            <p className="text-meta">DESIGN.md</p>
            <p className="text-meta text-[var(--color-fg-muted)]">
              {flat.length} page{flat.length === 1 ? "" : "s"}
            </p>
          </div>

          {hero.northstar && (
            <p className="mt-6 font-display text-xl italic leading-snug text-[var(--color-fg-muted)]">
              {hero.northstar}
            </p>
          )}

          {/* Tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {macroLabel && <TagPill label={macroLabel} variant="macro" />}
            {hero.tags.style.slice(0, 4).map((s) => (
              <TagPill key={`s-${s}`} label={s.replace(/-/g, " ")} href={`/screens?style=${s}`} />
            ))}
            {hero.tags.industry.slice(0, 2).map((i) => (
              <TagPill key={`i-${i}`} label={i.replace(/-/g, " ")} href={`/screens?industry=${i}`} />
            ))}
            <TagPill label={hero.mode} />
          </div>

          {/* Palette */}
          {hero.palette.length > 0 && (
            <div className="mt-8">
              <p className="text-meta mb-3">Palette</p>
              <PaletteTable palette={hero.palette} colorWords={hero.designSystem.colorWords} />
            </div>
          )}

          {/* Type ramp */}
          {hero.designSystem.typeRamp.length > 0 && (
            <div className="mt-8">
              <p className="text-meta mb-4">Type ramp</p>
              <TypeRamp ramp={hero.designSystem.typeRamp} />
            </div>
          )}

          {/* Fonts + tech + container */}
          <dl className="mt-8 space-y-5 text-sm">
            {hero.fonts.length > 0 && (
              <div>
                <dt className="text-meta">Typefaces</dt>
                <dd className="mt-1.5 text-[var(--color-fg)]">{hero.fonts.slice(0, 5).join(", ")}</dd>
              </div>
            )}
            {hero.tech.length > 0 && (
              <div>
                <dt className="text-meta">Stack</dt>
                <dd className="mt-1.5 text-[var(--color-fg)]">{hero.tech.slice(0, 6).join(", ")}</dd>
              </div>
            )}
            {hero.designSystem.containerWidth ? (
              <div>
                <dt className="text-meta">Container</dt>
                <dd className="mt-1.5 font-mono text-[var(--color-fg)]">
                  {hero.designSystem.containerWidth}px max
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-8 border-t rule pt-6">
            <CopyDesignMd slug={hero.slug} />
          </div>
        </aside>

        {/* Screens - right, scrolling ───────────────────────── */}
        <div className="lg:col-span-7 space-y-12">
          {flat.map((p, i) => (
            <figure key={p.slug} id={`page-${i}`} className="scroll-mt-8">
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <figcaption className="text-meta">
                  {PAGE_TYPE_LABELS[p.pageType]}
                  <span className="ml-3 tracking-normal text-[var(--color-fg-muted)]">
                    {p.title || "untitled"}
                  </span>
                </figcaption>
                <Link
                  href={`/screens/${p.slug}`}
                  className="text-meta text-[var(--color-fg)] hover:text-[var(--color-link)]"
                >
                  Full page →
                </Link>
              </div>
              <Link
                href={`/screens/${p.slug}`}
                className="block overflow-hidden border rule focus:outline-none"
                style={{
                  background: `linear-gradient(135deg, ${p.palette[0] ?? "#eee"}, ${p.palette[2] ?? p.palette[1] ?? "#ddd"})`,
                }}
              >
                {/* Clean above-the-fold hero capture (1440-wide, no
                    overflow whitespace). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt={`${p.title} - ${PAGE_TYPE_LABELS[p.pageType]}`}
                  className="h-auto w-full"
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                />
              </Link>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
