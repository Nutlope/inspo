"use client";

import { useMemo, useTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ScreenSummary } from "@inspo/shared";

/**
 * How many tiles to render per page. The /screens archive holds ~1,000
 * sites; rendering them all at once was the page's worst perf bug
 * (~47 MB of PNG thumbs, ~1,000 DOM nodes, ~1,000 client-component
 * hydrations). 60 fills a 3-column grid for 20 rows - enough to scroll
 * through before hitting the pagination control.
 */
const PAGE_SIZE = 60;
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
  type Industry,
  type Macrostructure,
  type Style,
  type Vibe,
} from "@inspo/taxonomy";
import { ScreenTile } from "@/components/screen-tile";
import {
  HEX_FAMILY_THRESHOLD,
  normalizeHex,
  paletteDistance,
} from "@/lib/color";

const isVibe = (v: string): v is Vibe =>
  (VIBES as readonly string[]).includes(v);
const isColorWord = (v: string): v is ColorWord =>
  (COLOR_WORDS as readonly string[]).includes(v);

type Filters = {
  q?: string;
  style?: string;
  industry?: string;
  macro?: string;
  mode?: string;
  mood?: string;
  color?: string;
  /** Perceptual-distance colour anchor (?hex=%23c7402f). Normalised
   *  to `#aabbcc`. Filters to sites with at least one palette colour
   *  within HEX_FAMILY_THRESHOLD in OKLAB. Distinct from `color`,
   *  which is the semantic colorWord filter ("warm", "monochrome"…). */
  hex?: string;
  /** 1-based current page. Drives the slice rendered, not the data
   *  that's filtered (filters always operate on the full set). */
  page?: number;
};

/**
 * Client-side filter + paginated render for /screens. Receives the
 * full list once from the server, filters in-memory on every chip
 * click (no round-trip), but only renders the active page's slice.
 * URL stays in sync via router.replace so the back button and shared
 * links land on the right page.
 *
 * Uses the View Transitions API where available for a browser-native
 * crossfade on filter swaps. Falls back to instant repaint on Safari
 * or any browser without `startViewTransition`.
 */
export function ScreensGrid({
  screens,
  initialFilters,
}: {
  screens: ScreenSummary[];
  initialFilters: Filters;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Hydrate from URL on mount + on every search-param change.
  const filters = useMemo<Filters>(() => {
    const get = (k: string) => searchParams.get(k) ?? undefined;
    const pageRaw = searchParams.get("page");
    const pageNum = pageRaw ? Math.max(1, parseInt(pageRaw, 10) || 1) : 1;
    const hexRaw = get("hex");
    return {
      q: get("q"),
      style: get("style"),
      industry: get("industry"),
      macro: get("macro"),
      mode: get("mode"),
      mood: get("mood"),
      color: get("color"),
      hex: hexRaw ? (normalizeHex(hexRaw) ?? undefined) : undefined,
      page: pageNum,
    };
  }, [searchParams]);

  // Use initialFilters on first paint (avoid hydration mismatch in case
  // searchParams isn't yet populated client-side).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const active = hydrated ? filters : initialFilters;

  const filtered = useMemo(() => {
    let list = screens;
    if (active.style && isStyle(active.style)) {
      const s = active.style;
      list = list.filter((x) => x.tags.style.includes(s));
    }
    if (active.industry && isIndustry(active.industry)) {
      const i = active.industry;
      list = list.filter((x) => x.tags.industry.includes(i));
    }
    if (active.macro && isMacrostructure(active.macro)) {
      const m = active.macro;
      list = list.filter((x) => x.tags.macrostructure === m);
    }
    if (active.mode === "light" || active.mode === "dark") {
      const m = active.mode;
      list = list.filter((x) => x.mode === m);
    }
    if (active.mood && isVibe(active.mood)) {
      const m = active.mood;
      list = list.filter((x) => x.tags.vibe.includes(m));
    }
    if (active.color && isColorWord(active.color)) {
      const c = active.color;
      list = list.filter((x) =>
        (x.designSystem.colorWords ?? []).includes(c),
      );
    }
    if (active.hex) {
      // Perceptual filter - a site matches if any of its palette
      // colours sits within HEX_FAMILY_THRESHOLD of the anchor in OKLAB.
      // We compute the per-site score once per render - at 1.2k sites
      // this is ~10ms on a desktop, no need to memoise per palette.
      const anchor = active.hex;
      list = list.filter(
        (x) => paletteDistance(anchor, x.palette) <= HEX_FAMILY_THRESHOLD,
      );
    }
    if (active.q && active.q.trim()) {
      const q = active.q.trim().toLowerCase();
      const tokens = q.split(/\s+/).filter(Boolean);
      list = list.filter((x) => {
        const hay = [
          x.title,
          x.description,
          x.designerCredit ?? "",
          x.tags.style.join(" "),
          x.tags.industry.join(" "),
          x.tags.vibe.join(" "),
          x.tags.macrostructure ?? "",
          x.fonts.join(" "),
          x.tech.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return tokens.every((t) => hay.includes(t));
      });
    }
    return list;
  }, [screens, active]);

  /* ─────── filter chip click - wrap in View Transition ─────── */
  function setFilter(param: keyof Filters, value: string | undefined) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(param, String(value));
    else next.delete(param);
    // Any filter change resets pagination - staying on page 7 makes
    // no sense after narrowing the set to 12 results.
    if (param !== "page") next.delete("page");
    const href = next.toString() ? `/screens?${next.toString()}` : "/screens";

    const nav = () => {
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    };

    type DocWithVT = Document & {
      startViewTransition?: (cb: () => void) => unknown;
    };
    const doc = document as DocWithVT;
    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(nav);
    } else {
      nav();
    }
  }

  const totalCount = screens.length;
  const filteredCount = filtered.length;

  /* ─────── pagination slice ─────── */
  const pageCount = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));
  // Clamp - a filter change may have left `page` past the new end.
  const currentPage = Math.min(active.page ?? 1, pageCount);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  // Build the href for a given page, preserving every other filter.
  function hrefForPage(p: number): string {
    const next = new URLSearchParams(searchParams.toString());
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    return next.toString() ? `/screens?${next.toString()}` : "/screens";
  }

  return (
    <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-x-10">
      {/* Filter rail ──────────────────────────────────────────── */}
      <aside className="lg:col-span-2">
        <div className="space-y-10 lg:sticky lg:top-8">
          <FilterGroup
            label="Industry"
            options={INDUSTRIES}
            param="industry"
            current={active.industry}
            onSelect={setFilter}
            count={(v) => screens.filter((x) => x.tags.industry.includes(v as Industry)).length}
          />
          <FilterGroup
            label="Style"
            options={STYLES}
            param="style"
            current={active.style}
            onSelect={setFilter}
            count={(v) => screens.filter((x) => x.tags.style.includes(v as Style)).length}
          />
          <FilterGroup
            label="Mood"
            options={VIBES}
            param="mood"
            current={active.mood}
            onSelect={setFilter}
            count={(v) => screens.filter((x) => x.tags.vibe.includes(v as Vibe)).length}
          />
          <FilterGroup
            label="Color"
            options={COLOR_WORDS}
            param="color"
            current={active.color}
            onSelect={setFilter}
            count={(v) =>
              screens.filter((x) =>
                (x.designSystem.colorWords ?? []).includes(v as ColorWord),
              ).length
            }
          />
          <FilterGroup
            label="Macrostructure"
            options={MACROSTRUCTURES}
            param="macro"
            current={active.macro}
            onSelect={setFilter}
            count={(v) => screens.filter((x) => x.tags.macrostructure === v).length}
            formatLabel={(v) => MACROSTRUCTURE_LABELS[v as Macrostructure] ?? v}
          />
          <FilterGroup
            label="Mode"
            options={MODES}
            param="mode"
            current={active.mode}
            onSelect={setFilter}
            count={(v) => screens.filter((x) => x.mode === v).length}
          />
        </div>
      </aside>

      {/* Grid ─────────────────────────────────────────────────── */}
      <div className="lg:col-span-10">
        {active.hex && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y rule px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="block h-7 w-7 border rule"
                style={{ background: active.hex }}
              />
              <p className="text-meta">
                Filtering by colour family ·{" "}
                <span className="font-mono uppercase">{active.hex}</span>
                <span className="ml-2 text-[var(--color-fg-muted)]">
                  ({filteredCount.toLocaleString()} match
                  {filteredCount === 1 ? "" : "es"})
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFilter("hex", undefined)}
              className="font-mono text-[10px] uppercase tracking-wider hover:text-[var(--color-link)]"
            >
              clear ×
            </button>
          </div>
        )}
        <div className="mb-6 flex items-baseline justify-between border-b rule pb-4">
          <p className="text-meta">
            {filteredCount === totalCount
              ? `${totalCount.toLocaleString()} sites`
              : `${filteredCount.toLocaleString()} of ${totalCount.toLocaleString()}`}
            {pageCount > 1 && (
              <span className="ml-2 text-[var(--color-fg-muted)]">
                · page {currentPage} of {pageCount}
              </span>
            )}
          </p>
          <p className="text-meta hidden sm:block">
            Sort: <span className="text-[var(--color-fg)]">Latest</span>
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="border rule px-8 py-20 text-center">
            <p className="font-display text-2xl">Nothing matches that.</p>
            <p className="text-meta mt-3">
              Loosen a filter, or scroll{" "}
              <Link
                href="/screens"
                className="text-[var(--color-link)] underline-offset-4 hover:underline"
              >
                the whole archive
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {pageItems.map((screen, i) => (
                <li
                  key={screen.slug}
                  className="screens-grid-item"
                  style={{ ["--idx" as string]: Math.min(i, 23) }}
                >
                  <ScreenTile
                    screen={screen}
                    index={startIdx + i + 1}
                    variant="hero"
                    // Only the first row of the FIRST page gets the
                    // priority hint - beyond that, we lazy-load.
                    priority={currentPage === 1 && i < 6}
                    pageCount={(screen as ScreenSummary & { pageCount?: number }).pageCount}
                    hoverScroll
                  />
                </li>
              ))}
            </ul>

            {pageCount > 1 && (
              <Pagination
                currentPage={currentPage}
                pageCount={pageCount}
                hrefForPage={hrefForPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Pagination control ───────────────────
 *
 * Editorial-minimal: prev / 1 2 … 7 8 9 … 18 / next. Always shows the
 * first + last page plus a window of 3 around the current. Uses native
 * <a> via next/link - bookmarkable, back-button respects history, no
 * JS needed for the click itself. Filter state survives because
 * setFilter is the only path that mutates filter params; pagination
 * mutates only `?page=`. */

function Pagination({
  currentPage,
  pageCount,
  hrefForPage,
}: {
  currentPage: number;
  pageCount: number;
  hrefForPage: (p: number) => string;
}) {
  const items: (number | "ellipsis")[] = [];
  // Page numbers to always render: first, last, current ± 1.
  const window = new Set<number>([1, pageCount, currentPage - 1, currentPage, currentPage + 1]);
  for (let p = 1; p <= pageCount; p++) {
    if (window.has(p)) items.push(p);
    else if (items[items.length - 1] !== "ellipsis") items.push("ellipsis");
  }

  const linkClasses =
    "inline-flex h-9 min-w-[2.25rem] items-center justify-center px-2 text-meta border rule transition-colors hover:border-[var(--color-fg)]/40 hover:text-[var(--color-link)]";
  const activeClasses =
    "inline-flex h-9 min-w-[2.25rem] items-center justify-center px-2 text-meta border border-[var(--color-link)] text-[var(--color-link)]";
  const disabledClasses =
    "inline-flex h-9 min-w-[2.25rem] items-center justify-center px-2 text-meta border rule text-[var(--color-fg-muted)]/40 cursor-not-allowed";

  return (
    <nav
      aria-label="Archive pagination"
      className="mt-16 flex flex-wrap items-center justify-center gap-2 border-t rule pt-8"
    >
      {currentPage > 1 ? (
        <Link href={hrefForPage(currentPage - 1)} className={linkClasses} scroll>
          ← Prev
        </Link>
      ) : (
        <span className={disabledClasses} aria-disabled="true">
          ← Prev
        </span>
      )}

      <ul className="flex flex-wrap items-center gap-1">
        {items.map((it, i) =>
          it === "ellipsis" ? (
            <li
              key={`e-${i}`}
              className="px-1 text-meta text-[var(--color-fg-muted)]"
              aria-hidden
            >
              …
            </li>
          ) : (
            <li key={it}>
              {it === currentPage ? (
                <span className={activeClasses} aria-current="page">
                  {it}
                </span>
              ) : (
                <Link href={hrefForPage(it)} className={linkClasses} scroll>
                  {it}
                </Link>
              )}
            </li>
          ),
        )}
      </ul>

      {currentPage < pageCount ? (
        <Link href={hrefForPage(currentPage + 1)} className={linkClasses} scroll>
          Next →
        </Link>
      ) : (
        <span className={disabledClasses} aria-disabled="true">
          Next →
        </span>
      )}
    </nav>
  );
}

/* ─────────────────── filter chip group ─────────────────── */

function FilterGroup({
  label,
  options,
  param,
  current,
  onSelect,
  count,
  formatLabel,
}: {
  label: string;
  options: readonly string[];
  param: keyof Filters;
  current?: string;
  onSelect: (param: keyof Filters, value: string | undefined) => void;
  /** Returns the number of rows that match this option in the current dataset.
   *  Chips with 0 matches are hidden; groups with no matching chips collapse. */
  count?: (v: string) => number;
  formatLabel?: (v: string) => string;
}) {
  // A unique view-transition name per group so the active marker
  // smoothly slides between buttons when the user switches filters.
  // Names must be unique on the page - scoping by param key gives us
  // one marker per filter group, which is exactly what we want.
  const vtName = `filter-marker-${String(param)}`;
  // Hide-zero-match optimisation only kicks in when the dataset has
  // tag data to filter by. If every chip in this group reports 0
  // (which happens in production where the static seed ships without
  // per-row tags), show all options instead of collapsing the whole
  // group - the filter still works, it just doesn't pre-narrow.
  const hasAnyMatches = count ? options.some((o) => count(o) > 0) : true;
  const live =
    count && hasAnyMatches
      ? options.filter((o) => count(o) > 0)
      : [...options];
  if (live.length === 0) return null;
  return (
    <div className="space-y-3">
      <p className="text-meta">{label}</p>
      <ul className="flex flex-col gap-1.5">
        <li>
          <FilterButton
            active={!current}
            onClick={() => onSelect(param, undefined)}
            vtName={vtName}
          >
            All
          </FilterButton>
        </li>
        {live.map((opt) => (
          <li key={opt}>
            <FilterButton
              active={current === opt}
              onClick={() => onSelect(param, opt)}
              vtName={vtName}
            >
              {formatLabel ? formatLabel(opt) : opt.replace(/-/g, " ")}
            </FilterButton>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
  vtName,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  /** When set + active, the indicator dot carries this
   *  view-transition-name. Browser morphs the dot between positions
   *  during the View Transition kicked off by setFilter(). */
  vtName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block text-left text-sm capitalize transition-colors ${
        active
          ? "text-[var(--color-link)]"
          : "text-[var(--color-fg)] hover:text-[var(--color-link)]"
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="mr-1.5"
          style={vtName ? { viewTransitionName: vtName } : undefined}
        >
          ·
        </span>
      )}
      {children}
    </button>
  );
}
