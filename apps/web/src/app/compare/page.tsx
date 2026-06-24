/**
 * Side-by-side comparison page - /compare?slugs=foo,bar,baz
 *
 * Up to 4 sites in parallel. Each design dimension (palette, type,
 * spacing, macrostructure, tags) renders as a row spanning all
 * columns, so it's easy to compare a single dimension across the
 * lineup at a glance. This is the layout gallery / gallery don't have
 * and the one designers + agents both want.
 *
 * Server-rendered. No client state - the URL is the source of truth,
 * which makes the compare set shareable / re-openable.
 *
 * Sites that can't be found (typo'd slug, deleted row) are skipped
 * silently; the chip stays in the URL but the column is missing,
 * with a small "not in catalogue" note in its place.
 */

import { findScreen } from "@inspo/db";
import { MACROSTRUCTURE_LABELS } from "@inspo/taxonomy";
import type { ScreenSummary } from "@inspo/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { TransitionLink } from "@/components/transition-link";
import { PaletteStrip } from "@/components/palette-strip";
import { TypeRamp } from "@/components/type-ramp";
import { ScaleRuler } from "@/components/spacing-ruler";
import { TagPill } from "@/components/tag-pill";

const MAX_COMPARE = 4;

export const dynamic = "force-dynamic";

interface SearchParams {
  slugs?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { slugs } = await searchParams;
  const list = parseSlugs(slugs);
  if (list.length === 0) return { title: "Compare - Inspo" };
  return {
    title: `Compare: ${list.join(", ")} - Inspo`,
    description: `Side-by-side design-system breakdown for ${list.length} ${list.length === 1 ? "site" : "sites"}.`,
  };
}

function parseSlugs(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE);
}

type Cell =
  | { kind: "ok"; slug: string; screen: ScreenSummary }
  | { kind: "missing"; slug: string };

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { slugs: raw } = await searchParams;
  const slugs = parseSlugs(raw);

  // Fetch in parallel; missing slugs render as a "not in catalogue" cell.
  const cells: Cell[] = await Promise.all(
    slugs.map(async (slug): Promise<Cell> => {
      const screen = await findScreen(slug);
      return screen ? { kind: "ok", slug, screen } : { kind: "missing", slug };
    }),
  );

  if (slugs.length === 0) return <EmptyState />;

  const colsClass =
    cells.length === 1
      ? "lg:grid-cols-1"
      : cells.length === 2
        ? "lg:grid-cols-2"
        : cells.length === 3
          ? "lg:grid-cols-3"
          : "lg:grid-cols-4";

  return (
    <div className="pb-24">
      {/* Masthead ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-[120rem] px-6 pt-10 sm:px-10">
        <p className="text-meta">Compare · {cells.length}/{MAX_COMPARE}</p>
        <h1 className="mt-2 font-display text-h1 leading-[0.95]">
          Side&nbsp;by&nbsp;side
        </h1>
        <p className="mt-3 max-w-prose text-[var(--color-fg-muted)]">
          One row per dimension. Read across to compare a single trait;
          read down for a full picture of a site. Up to {MAX_COMPARE} at
          once - share the URL to share the lineup.
        </p>
      </div>

      {/* Column headers ──────────────────────────────────────── */}
      <div className="mx-auto mt-12 max-w-[120rem] border-y rule px-6 py-6 sm:px-10">
        <div className={`grid grid-cols-1 gap-x-6 gap-y-8 ${colsClass}`}>
          {cells.map((c) => (
            <ColumnHeader key={c.slug} cell={c} />
          ))}
        </div>
      </div>

      {/* Hero row ────────────────────────────────────────────── */}
      <CompareSection label="Hero" cells={cells} colsClass={colsClass}>
        {(cell) =>
          cell.kind === "ok" ? (
            <div className="overflow-hidden border rule">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cell.screen.imageUrl}
                alt={cell.screen.description}
                loading="lazy"
                decoding="async"
                className="h-auto w-full"
              />
            </div>
          ) : (
            <Missing slug={cell.slug} />
          )
        }
      </CompareSection>

      {/* Palette row ─────────────────────────────────────────── */}
      <CompareSection label="Palette" cells={cells} colsClass={colsClass}>
        {(cell) =>
          cell.kind === "ok" ? (
            <PaletteStrip palette={cell.screen.palette} size="md" />
          ) : (
            <Missing slug={cell.slug} />
          )
        }
      </CompareSection>

      {/* Macrostructure + mode row ───────────────────────────── */}
      <CompareSection label="Pattern" cells={cells} colsClass={colsClass}>
        {(cell) =>
          cell.kind === "ok" ? (
            <div className="space-y-3">
              <p className="font-display text-2xl leading-tight">
                {cell.screen.tags.macrostructure
                  ? MACROSTRUCTURE_LABELS[cell.screen.tags.macrostructure]
                  : "-"}
              </p>
              <p className="text-meta">
                {cell.screen.mode === "dark" ? "Dark mode" : "Light mode"}
              </p>
            </div>
          ) : (
            <Missing slug={cell.slug} />
          )
        }
      </CompareSection>

      {/* Type ramp row ───────────────────────────────────────── */}
      <CompareSection label="Type ramp" cells={cells} colsClass={colsClass}>
        {(cell) =>
          cell.kind === "ok" ? (
            cell.screen.designSystem.typeRamp.length > 0 ? (
              <TypeRamp ramp={cell.screen.designSystem.typeRamp} />
            ) : (
              <p className="text-meta">No type ramp captured.</p>
            )
          ) : (
            <Missing slug={cell.slug} />
          )
        }
      </CompareSection>

      {/* Spacing row ─────────────────────────────────────────── */}
      <CompareSection label="Spacing" cells={cells} colsClass={colsClass}>
        {(cell) =>
          cell.kind === "ok" ? (
            cell.screen.designSystem.spacingScale.length > 0 ? (
              <ScaleRuler values={cell.screen.designSystem.spacingScale} />
            ) : (
              <p className="text-meta">No spacing scale captured.</p>
            )
          ) : (
            <Missing slug={cell.slug} />
          )
        }
      </CompareSection>

      {/* Radius row ──────────────────────────────────────────── */}
      <CompareSection label="Radius" cells={cells} colsClass={colsClass}>
        {(cell) =>
          cell.kind === "ok" ? (
            cell.screen.designSystem.radiusScale.length > 0 ? (
              <ScaleRuler
                values={cell.screen.designSystem.radiusScale}
                capPx={64}
              />
            ) : (
              <p className="text-meta">No radius scale captured.</p>
            )
          ) : (
            <Missing slug={cell.slug} />
          )
        }
      </CompareSection>

      {/* Tags row ────────────────────────────────────────────── */}
      <CompareSection label="Tags" cells={cells} colsClass={colsClass}>
        {(cell) =>
          cell.kind === "ok" ? (
            <div className="flex flex-wrap gap-2">
              {cell.screen.tags.style.map((s) => (
                <TagPill
                  key={`s-${s}`}
                  label={s.replace(/-/g, " ")}
                  href={`/screens?style=${s}`}
                />
              ))}
              {cell.screen.tags.industry.map((i) => (
                <TagPill
                  key={`i-${i}`}
                  label={i.replace(/-/g, " ")}
                  href={`/screens?industry=${i}`}
                />
              ))}
              {cell.screen.tags.vibe.map((v) => (
                <TagPill key={`v-${v}`} label={v.replace(/-/g, " ")} />
              ))}
            </div>
          ) : (
            <Missing slug={cell.slug} />
          )
        }
      </CompareSection>

      {/* Outro ───────────────────────────────────────────────── */}
      <div className="mx-auto mt-16 max-w-[120rem] px-6 sm:px-10">
        <Link
          href="/screens"
          className="text-meta hover:text-[var(--color-link)]"
        >
          ← Back to the archive
        </Link>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */

function CompareSection({
  label,
  cells,
  colsClass,
  children,
}: {
  label: string;
  cells: Cell[];
  colsClass: string;
  children: (cell: Cell) => React.ReactNode;
}) {
  return (
    <section className="mx-auto mt-16 max-w-[120rem] px-6 sm:px-10">
      <p className="text-meta mb-5">{label}</p>
      <div className={`grid grid-cols-1 gap-x-6 gap-y-10 ${colsClass}`}>
        {cells.map((c) => (
          <div key={c.slug} className="min-w-0">
            {children(c)}
          </div>
        ))}
      </div>
    </section>
  );
}

function ColumnHeader({ cell }: { cell: Cell }) {
  if (cell.kind === "missing") {
    return (
      <div>
        <p className="text-meta">Not in catalogue</p>
        <p className="font-display text-xl mt-1 break-all">{cell.slug}</p>
      </div>
    );
  }
  const macroLabel = cell.screen.tags.macrostructure
    ? MACROSTRUCTURE_LABELS[cell.screen.tags.macrostructure]
    : null;
  return (
    <div>
      <p className="text-meta">{cell.screen.capturedAt}</p>
      <TransitionLink
        href={`/screens/${cell.slug}`}
        className="block mt-1 font-display text-2xl leading-tight hover:text-[var(--color-link)]"
      >
        {cell.screen.title}
      </TransitionLink>
      <a
        href={cell.screen.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-meta hover:text-[var(--color-link)]"
      >
        {new URL(cell.screen.sourceUrl).host} ↗
      </a>
      {macroLabel && (
        <p className="text-meta mt-2 text-[var(--color-fg-muted)]">
          {macroLabel}
        </p>
      )}
    </div>
  );
}

function Missing({ slug }: { slug: string }) {
  return (
    <div className="rounded-none border rule px-4 py-6 text-[var(--color-fg-muted)]">
      <p className="text-meta">No row for</p>
      <p className="font-mono text-sm mt-1 break-all">{slug}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-[60rem] px-6 py-24 text-center sm:px-10">
      <p className="text-meta">Compare</p>
      <h1 className="mt-4 font-display text-h1 leading-[0.95]">
        Nothing to compare yet
      </h1>
      <p className="mx-auto mt-4 max-w-prose text-[var(--color-fg-muted)]">
        Pick a few sites from the archive, then use the “Add to compare”
        button on each detail page. Up to {MAX_COMPARE} at a time.
      </p>
      <p className="mt-8 text-meta">
        Or jump straight to a comparison by URL:{" "}
        <code className="font-mono">/compare?slugs=linear-app,stripe-com</code>
      </p>
      <div className="mt-12">
        <Link
          href="/screens"
          className="hover:text-[var(--color-link)] underline-offset-4"
        >
          Browse the archive →
        </Link>
      </div>
    </div>
  );
}
