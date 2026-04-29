import Link from "next/link";
import type { Metadata } from "next";
import { ScreenTile } from "@/components/screen-tile";
import { Dateline } from "@/components/dateline";
import { getAllScreens } from "@inspo/db";
import {
  STYLES,
  INDUSTRIES,
  MACROSTRUCTURES,
  MACROSTRUCTURE_LABELS,
  MODES,
  isStyle,
  isIndustry,
  isMacrostructure,
  type Macrostructure,
} from "@inspo/taxonomy";

export const metadata: Metadata = {
  title: "Archive",
  description:
    "The full archive — every site we've filed, browsable by industry, style, macrostructure, and mode.",
};

type SearchParams = {
  style?: string;
  industry?: string;
  macro?: string;
  mode?: string;
};

function FilterGroup({
  label,
  options,
  param,
  current,
  formatLabel,
}: {
  label: string;
  options: readonly string[];
  param: keyof SearchParams;
  current?: string;
  formatLabel?: (v: string) => string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-meta">{label}</p>
      <ul className="flex flex-col gap-1.5">
        <li>
          <FilterLink param={param} value={undefined} active={!current}>
            All
          </FilterLink>
        </li>
        {options.map((opt) => (
          <li key={opt}>
            <FilterLink param={param} value={opt} active={current === opt}>
              {formatLabel ? formatLabel(opt) : opt.replace(/-/g, " ")}
            </FilterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterLink({
  param,
  value,
  active,
  children,
}: {
  param: keyof SearchParams;
  value: string | undefined;
  active: boolean;
  children: React.ReactNode;
}) {
  // Build new query string preserving siblings — but as a simple component,
  // for now just toggle the one param. SearchParams preservation lands in
  // the client-side filter rail in a follow-up.
  const href = value ? `/screens?${param}=${encodeURIComponent(value)}` : "/screens";
  return (
    <Link
      href={href}
      className={`block text-sm capitalize transition-colors ${
        active
          ? "text-[var(--color-link)]"
          : "text-[var(--color-fg)] hover:text-[var(--color-link)]"
      }`}
    >
      {active && (
        <span aria-hidden className="mr-1.5">
          ·
        </span>
      )}
      {children}
    </Link>
  );
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filtered = await getAllScreens({
    style: params.style && isStyle(params.style) ? params.style : undefined,
    industry:
      params.industry && isIndustry(params.industry)
        ? params.industry
        : undefined,
    macrostructure:
      params.macro && isMacrostructure(params.macro) ? params.macro : undefined,
    mode:
      params.mode === "light" || params.mode === "dark"
        ? params.mode
        : undefined,
  });
  const totalCount = (await getAllScreens()).length;

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      {/* Header ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-y-8 pt-16 pb-12 sm:pt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-2">
          <Dateline label="The archive" />
        </div>
        <div className="lg:col-span-10">
          <h1 className="font-display max-w-[16ch] text-balance text-5xl leading-[1] tracking-tight sm:text-6xl lg:text-7xl">
            Every site,{" "}
            <em className="italic">filed and credited.</em>
          </h1>
          <p className="mt-8 max-w-[58ch] text-lg text-[var(--color-fg-muted)]">
            {totalCount} entries — browse by hand here, or query the same
            archive from your agent over MCP.{" "}
            <Link
              href="/mcp"
              className="text-[var(--color-fg)] underline-offset-4 hover:text-[var(--color-link)] hover:underline"
            >
              Install instructions →
            </Link>
          </p>
        </div>
      </section>

      {/* Body ───────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-y-12 border-t rule pt-10 lg:grid-cols-12 lg:gap-x-10">
        {/* Filter rail */}
        <aside className="lg:col-span-2">
          <div className="space-y-10 lg:sticky lg:top-8">
            <FilterGroup
              label="Industry"
              options={INDUSTRIES}
              param="industry"
              current={params.industry}
            />
            <FilterGroup
              label="Style"
              options={STYLES}
              param="style"
              current={params.style}
            />
            <FilterGroup
              label="Macrostructure"
              options={MACROSTRUCTURES}
              param="macro"
              current={params.macro}
              formatLabel={(v) =>
                MACROSTRUCTURE_LABELS[v as Macrostructure] ?? v
              }
            />
            <FilterGroup
              label="Mode"
              options={MODES}
              param="mode"
              current={params.mode}
            />
          </div>
        </aside>

        {/* Grid */}
        <div className="lg:col-span-10">
          <div className="mb-6 flex items-baseline justify-between border-b rule pb-4">
            <p className="text-meta">
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            </p>
            <p className="text-meta hidden sm:block">
              Sort: <span className="text-[var(--color-fg)]">Latest</span>
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="border rule px-8 py-20 text-center">
              <p className="font-display text-2xl">Nothing on file —</p>
              <p className="text-meta mt-3">
                Loosen the filters, or try{" "}
                <Link
                  href="/screens"
                  className="text-[var(--color-link)] underline-offset-4 hover:underline"
                >
                  the full archive
                </Link>
                .
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((screen, i) => (
                <li key={screen.slug}>
                  <ScreenTile screen={screen} index={i + 1} variant="hero" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
