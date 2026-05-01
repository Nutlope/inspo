import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ScreenTile } from "@/components/screen-tile";
import { Dateline } from "@/components/dateline";
import {
  findByHostname,
  getAllScreens,
  isUrl,
  lexicalSearch,
} from "@inspo/db";
import {
  COLOR_WORDS,
  STYLES,
  INDUSTRIES,
  MACROSTRUCTURES,
  MACROSTRUCTURE_LABELS,
  MODES,
  VIBES,
  isStyle,
  isIndustry,
  isMacrostructure,
  type ColorWord,
  type Macrostructure,
  type Vibe,
} from "@inspo/taxonomy";

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
};

function FilterGroup({
  label,
  options,
  param,
  currentValue,
  allParams,
  formatLabel,
}: {
  label: string;
  options: readonly string[];
  param: keyof SearchParams;
  currentValue?: string;
  allParams: SearchParams;
  formatLabel?: (v: string) => string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-meta">{label}</p>
      <ul className="flex flex-col gap-1.5">
        <li>
          <FilterLink
            current={allParams}
            param={param}
            value={undefined}
            active={!currentValue}
          >
            All
          </FilterLink>
        </li>
        {options.map((opt) => (
          <li key={opt}>
            <FilterLink
              current={allParams}
              param={param}
              value={opt}
              active={currentValue === opt}
            >
              {formatLabel ? formatLabel(opt) : opt.replace(/-/g, " ")}
            </FilterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchBox({ current }: { current: SearchParams }) {
  return (
    <form
      method="GET"
      action="/screens"
      className="flex w-full items-stretch border rule"
    >
      <input
        type="search"
        name="q"
        defaultValue={current.q ?? ""}
        placeholder="Search styles, brands, fonts — or paste a URL"
        autoComplete="off"
        className="w-full bg-transparent px-4 py-3 font-mono text-sm outline-none placeholder:text-[var(--color-fg-muted)]"
      />
      {/* Preserve filter siblings across submits */}
      {(["style", "industry", "macro", "mode", "mood", "color"] as const).map(
        (k) =>
          current[k] ? (
            <input key={k} type="hidden" name={k} value={current[k] as string} />
          ) : null,
      )}
      <button
        type="submit"
        className="text-meta border-l rule bg-[var(--color-fg)] px-5 text-[var(--color-bg)] transition-opacity hover:opacity-80"
      >
        Search →
      </button>
    </form>
  );
}

function buildHref(
  current: SearchParams,
  toggle: { param: keyof SearchParams; value: string | undefined },
): string {
  const next = { ...current };
  if (toggle.value === undefined) delete next[toggle.param];
  else next[toggle.param] = toggle.value;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v !== undefined && v !== "") usp.set(k, v);
  }
  const qs = usp.toString();
  return qs ? `/screens?${qs}` : "/screens";
}

function FilterLink({
  current,
  param,
  value,
  active,
  children,
}: {
  current: SearchParams;
  param: keyof SearchParams;
  value: string | undefined;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={buildHref(current, { param, value })}
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

const isVibe = (v: string): v is Vibe =>
  (VIBES as readonly string[]).includes(v);
const isColorWord = (v: string): v is ColorWord =>
  (COLOR_WORDS as readonly string[]).includes(v);

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // URL-paste shortcut: redirect to the matching screen if we know it.
  if (params.q && isUrl(params.q)) {
    const all = await getAllScreens();
    const match = findByHostname(all, params.q);
    if (match) redirect(`/screens/${match.slug}`);
  }

  // Stage 1 — DB filter (style, industry, macrostructure, mode, vibe, color).
  let filtered = await getAllScreens({
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

  // Stage 2 — JS filter for the v2 axes (mood + color word) since they're
  // jsonb arrays not yet promoted into the DB filter signature. Cheap at
  // our seed scale.
  if (params.mood && isVibe(params.mood)) {
    const m = params.mood;
    filtered = filtered.filter((s) => s.tags.vibe.includes(m));
  }
  if (params.color && isColorWord(params.color)) {
    const c = params.color;
    filtered = filtered.filter((s) => s.designSystem.colorWords.includes(c));
  }

  // Stage 3 — lexical query rerank.
  if (params.q && params.q.trim()) {
    filtered = lexicalSearch(filtered, params.q.trim(), 200);
  }

  const totalCount = (await getAllScreens()).length;
  const noUrlMatch = Boolean(
    params.q && isUrl(params.q) && filtered.length === 0,
  );

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

          <div className="mt-10 max-w-[36rem]">
            <SearchBox current={params} />
          </div>

          {noUrlMatch && (
            <div className="mt-6 max-w-[52ch] border-l-2 border-[var(--color-link)] pl-4 text-sm text-[var(--color-fg-muted)]">
              We haven&rsquo;t captured{" "}
              <span className="text-[var(--color-fg)]">{params.q}</span> yet.{" "}
              <Link
                href={`/extract?url=${encodeURIComponent(params.q ?? "")}`}
                className="text-[var(--color-link)] underline-offset-4 hover:underline"
              >
                Extract its design system →
              </Link>
            </div>
          )}
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
              currentValue={params.industry}
              allParams={params}
            />
            <FilterGroup
              label="Style"
              options={STYLES}
              param="style"
              currentValue={params.style}
              allParams={params}
            />
            <FilterGroup
              label="Mood"
              options={VIBES}
              param="mood"
              currentValue={params.mood}
              allParams={params}
            />
            <FilterGroup
              label="Color"
              options={COLOR_WORDS}
              param="color"
              currentValue={params.color}
              allParams={params}
            />
            <FilterGroup
              label="Macrostructure"
              options={MACROSTRUCTURES}
              param="macro"
              currentValue={params.macro}
              allParams={params}
              formatLabel={(v) =>
                MACROSTRUCTURE_LABELS[v as Macrostructure] ?? v
              }
            />
            <FilterGroup
              label="Mode"
              options={MODES}
              param="mode"
              currentValue={params.mode}
              allParams={params}
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
