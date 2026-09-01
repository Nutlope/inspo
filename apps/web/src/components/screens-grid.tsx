"use client";

import {
  useMemo,
  useTransition,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ScreenSummary } from "@inspo/shared";

/**
 * How many tiles to render per page. The /screens archive holds ~1,000
 * sites; rendering them all at once was the page's worst perf bug
 * (~47 MB of PNG thumbs, ~1,000 DOM nodes, ~1,000 client-component
 * hydrations). 60 fills the auto-fill grid for plenty of rows before
 * hitting the pagination control.
 */
const PAGE_SIZE = 60;
import {
  COLOR_WORDS,
  STYLES,
  INDUSTRIES,
  INDUSTRY_LABELS,
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
  /** "mobile" keeps only sites with a mobile capture pair. */
  device?: string;
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
 * full list once from the server, filters in-memory on every pill
 * click (no round-trip), but only renders the active page's slice.
 * URL stays in sync via router.replace so the back button and shared
 * links land on the right page.
 *
 * Filters live in a horizontal pill bar above the grid (each group is
 * a capsule that opens a rounded popover of option pills) so the full
 * page width belongs to the screenshots.
 *
 * Uses the View Transitions API where available for a browser-native
 * crossfade on filter swaps. Falls back to instant repaint on Safari
 * or any browser without `startViewTransition`.
 */
export function ScreensGrid({
  screens,
  initialFilters,
  searchSlot,
}: {
  screens: ScreenSummary[];
  initialFilters: Filters;
  /** Server-rendered search capsule, laid into the filter row
   *  (search left, filter pills right). */
  searchSlot?: React.ReactNode;
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
      device: get("device"),
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
    if (active.device === "mobile") {
      list = list.filter((x) => Boolean(x.mobileImageUrl));
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

  /* ─────── filter pill click - wrap in View Transition ─────── */
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

  const groups: FilterMenuSpec[] = [
    {
      label: "Industry",
      param: "industry",
      options: INDUSTRIES,
      count: (v) =>
        screens.filter((x) => x.tags.industry.includes(v as Industry)).length,
      formatLabel: (v) => INDUSTRY_LABELS[v as Industry] ?? v,
    },
    {
      label: "Style",
      param: "style",
      options: STYLES,
      count: (v) =>
        screens.filter((x) => x.tags.style.includes(v as Style)).length,
    },
    {
      label: "Mood",
      param: "mood",
      options: VIBES,
      count: (v) =>
        screens.filter((x) => x.tags.vibe.includes(v as Vibe)).length,
    },
    {
      label: "Color",
      param: "color",
      options: COLOR_WORDS,
      count: (v) =>
        screens.filter((x) =>
          (x.designSystem.colorWords ?? []).includes(v as ColorWord),
        ).length,
    },
    {
      label: "Structure",
      param: "macro",
      options: MACROSTRUCTURES,
      count: (v) =>
        screens.filter((x) => x.tags.macrostructure === v).length,
      formatLabel: (v) => MACROSTRUCTURE_LABELS[v as Macrostructure] ?? v,
    },
    {
      label: "Mode",
      param: "mode",
      options: MODES,
      count: (v) => screens.filter((x) => x.mode === v).length,
    },
  ];

  const mobileCount = screens.filter((x) => Boolean(x.mobileImageUrl)).length;

  return (
    <div>
      {/* Search + filter row - search capsule left, pills right ── */}
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        {searchSlot && (
          <div className="w-full min-w-[15rem] flex-1 sm:w-auto sm:max-w-[26rem]">
            {searchSlot}
          </div>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-3">
          <FilterBar
            groups={groups}
            active={active}
            onSelect={setFilter}
            mobileCount={mobileCount}
          />

          <p className="text-meta whitespace-nowrap">
            {filteredCount === totalCount
              ? `${totalCount.toLocaleString()} sites`
              : `${filteredCount.toLocaleString()} of ${totalCount.toLocaleString()}`}
            {pageCount > 1 && (
              <span className="ml-2 text-[var(--color-fg-muted)]">
                · page {currentPage} of {pageCount}
              </span>
            )}
          </p>
        </div>
      </div>

      {active.hex && (
        <div className="mb-5 inline-flex flex-wrap items-center gap-3 rounded-full border rule py-2 pl-3 pr-4">
          <span
            aria-hidden
            className="block h-6 w-6 rounded-full border rule"
            style={{ background: active.hex }}
          />
          <p className="text-meta">
            Colour family · <span className="font-mono">{active.hex}</span>
            <span className="ml-2 text-[var(--color-fg-muted)]">
              ({filteredCount.toLocaleString()} match
              {filteredCount === 1 ? "" : "es"})
            </span>
          </p>
          <button
            type="button"
            onClick={() => setFilter("hex", undefined)}
            className="font-mono text-xs tracking-normal hover:text-[var(--color-link)]"
          >
            clear ×
          </button>
        </div>
      )}

      {/* Grid ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-card border rule px-8 py-20 text-center">
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
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] sm:gap-3">
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
                  // Only the first rows of the FIRST page get the
                  // priority hint - beyond that, we lazy-load.
                  priority={currentPage === 1 && i < 8}
                  pageCount={(screen as ScreenSummary & { pageCount?: number }).pageCount}
                  showCaption={false}
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
  );
}

/* ─────────────────── filter pill bar ───────────────────
 *
 * Each big taxonomy group is a capsule button that opens a rounded
 * popover of option pills; Mode rides along the same way, and the
 * mobile-pair filter is a single direct toggle pill. One popover open
 * at a time; outside click and Escape both close.
 */

type FilterMenuSpec = {
  label: string;
  param: keyof Filters;
  options: readonly string[];
  /** Rows matching this option in the full dataset. Options with 0
   *  matches are hidden; groups where everything is 0 show all (the
   *  production static seed ships without per-row tags). */
  count?: (v: string) => number;
  formatLabel?: (v: string) => string;
};

function FilterBar({
  groups,
  active,
  onSelect,
  mobileCount,
}: {
  groups: FilterMenuSpec[];
  active: Filters;
  onSelect: (param: keyof Filters, value: string | undefined) => void;
  mobileCount: number;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={barRef} className="flex flex-wrap items-center gap-2">
      {groups.map((g, gi) => {
        const current = active[g.param] as string | undefined;
        const hasAnyMatches = g.count
          ? g.options.some((o) => g.count!(o) > 0)
          : true;
        const live =
          g.count && hasAnyMatches
            ? g.options.filter((o) => g.count!(o) > 0)
            : [...g.options];
        if (live.length === 0) return null;

        const pretty = (v: string) =>
          g.formatLabel ? g.formatLabel(v) : v.replace(/-/g, " ");
        const isOpen = open === g.label;

        return (
          <div key={g.label} className="relative">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-haspopup="menu"
              onClick={() => setOpen(isOpen ? null : g.label)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm capitalize transition-colors ${
                current
                  ? "border-[var(--color-link)] bg-[color-mix(in_oklab,var(--color-link)_10%,transparent)] text-[var(--color-link)]"
                  : "rule text-[var(--color-fg)] hover:border-[var(--color-fg)]/40 hover:text-[var(--color-link)]"
              }`}
            >
              {current ? pretty(current) : g.label}
              <svg
                aria-hidden
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              >
                <path d="m2 3.5 3 3 3-3" />
              </svg>
            </button>

            {isOpen && (
              <div
                role="menu"
                className={`absolute top-[calc(100%+0.5rem)] z-30 max-h-[19rem] w-max max-w-[min(24rem,80vw)] overflow-y-auto rounded-card border rule bg-[var(--color-bg)] p-3 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.25)] ${
                  gi < groups.length / 2 ? "left-0" : "right-0"
                }`}
              >
                <div className="flex flex-wrap gap-1.5">
                  <OptionPill
                    active={!current}
                    onClick={() => {
                      onSelect(g.param, undefined);
                      setOpen(null);
                    }}
                  >
                    All
                  </OptionPill>
                  {live.map((opt) => (
                    <OptionPill
                      key={opt}
                      active={current === opt}
                      onClick={() => {
                        onSelect(g.param, current === opt ? undefined : opt);
                        setOpen(null);
                      }}
                    >
                      {pretty(opt)}
                    </OptionPill>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {mobileCount > 0 && (
        <button
          type="button"
          aria-pressed={active.device === "mobile"}
          onClick={() =>
            onSelect(
              "device",
              active.device === "mobile" ? undefined : "mobile",
            )
          }
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors ${
            active.device === "mobile"
              ? "border-[var(--color-link)] bg-[color-mix(in_oklab,var(--color-link)_10%,transparent)] text-[var(--color-link)]"
              : "rule text-[var(--color-fg)] hover:border-[var(--color-fg)]/40 hover:text-[var(--color-link)]"
          }`}
        >
          Mobile pairs
        </button>
      )}

      {(active.style ||
        active.industry ||
        active.mood ||
        active.color ||
        active.macro ||
        active.mode ||
        active.device) && (
        <button
          type="button"
          onClick={() => {
            // Clear every taxonomy filter in one go; setFilter only
            // mutates one param per call, so walk them.
            for (const p of [
              "style",
              "industry",
              "mood",
              "color",
              "macro",
              "mode",
              "device",
            ] as (keyof Filters)[]) {
              if (active[p]) onSelect(p, undefined);
            }
          }}
          className="rounded-full px-3 py-2 text-sm text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-link)]"
        >
          Clear ×
        </button>
      )}
    </div>
  );
}

function OptionPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm capitalize transition-colors ${
        active
          ? "border-[var(--color-link)] bg-[var(--color-link)] text-[var(--color-bg)]"
          : "rule text-[var(--color-fg)] hover:border-[var(--color-fg)]/40 hover:text-[var(--color-link)]"
      }`}
    >
      {children}
    </button>
  );
}

/* ─────────────────── Pagination control ───────────────────
 *
 * Editorial-minimal: prev / 1 2 … 7 8 9 … 18 / next, every stop a
 * pill. Uses native <a> via next/link - bookmarkable, back-button
 * respects history, no JS needed for the click itself. Filter state
 * survives because setFilter is the only path that mutates filter
 * params; pagination mutates only `?page=`. */

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
    "inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-full px-3 text-meta border rule transition-colors hover:border-[var(--color-fg)]/40 hover:text-[var(--color-link)]";
  const activeClasses =
    "inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-full px-3 text-meta border border-[var(--color-link)] bg-[color-mix(in_oklab,var(--color-link)_10%,transparent)] text-[var(--color-link)]";
  const disabledClasses =
    "inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-full px-3 text-meta border rule text-[var(--color-fg-muted)]/40 cursor-not-allowed";

  return (
    <nav
      aria-label="Archive pagination"
      className="mt-12 flex flex-wrap items-center justify-center gap-2"
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

      <ul className="flex flex-wrap items-center gap-1.5">
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
