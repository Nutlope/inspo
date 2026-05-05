"use client";

import { useMemo, useTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ScreenSummary } from "@inspo/shared";
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
import { ScreenTile } from "@/components/screen-tile";

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
};

/**
 * Client-side filter + swap for /screens. Receives the full list of
 * published screens once (server-side), filters in-memory on every
 * filter chip click — no round trip. URL stays in sync via
 * router.replace so links remain bookmarkable.
 *
 * Uses the View Transitions API where available for a browser-native
 * crossfade on the grid swap. Falls back to instant repaint on Safari
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
    return {
      q: get("q"),
      style: get("style"),
      industry: get("industry"),
      macro: get("macro"),
      mode: get("mode"),
      mood: get("mood"),
      color: get("color"),
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
      list = list.filter((x) => x.designSystem.colorWords.includes(c));
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

  /* ─────── filter chip click — wrap in View Transition ─────── */
  function setFilter(param: keyof Filters, value: string | undefined) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(param, value);
    else next.delete(param);
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
          />
          <FilterGroup
            label="Style"
            options={STYLES}
            param="style"
            current={active.style}
            onSelect={setFilter}
          />
          <FilterGroup
            label="Mood"
            options={VIBES}
            param="mood"
            current={active.mood}
            onSelect={setFilter}
          />
          <FilterGroup
            label="Color"
            options={COLOR_WORDS}
            param="color"
            current={active.color}
            onSelect={setFilter}
          />
          <FilterGroup
            label="Macrostructure"
            options={MACROSTRUCTURES}
            param="macro"
            current={active.macro}
            onSelect={setFilter}
            formatLabel={(v) => MACROSTRUCTURE_LABELS[v as Macrostructure] ?? v}
          />
          <FilterGroup
            label="Mode"
            options={MODES}
            param="mode"
            current={active.mode}
            onSelect={setFilter}
          />
        </div>
      </aside>

      {/* Grid ─────────────────────────────────────────────────── */}
      <div className="lg:col-span-10">
        <div className="mb-6 flex items-baseline justify-between border-b rule pb-4">
          <p className="text-meta">
            {filteredCount === totalCount
              ? `${totalCount.toLocaleString()} sites`
              : `${filteredCount.toLocaleString()} of ${totalCount.toLocaleString()}`}
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
          <ul className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((screen, i) => (
              <li
                key={screen.slug}
                className="screens-grid-item"
                style={{ ["--idx" as string]: Math.min(i, 23) }}
              >
                <ScreenTile
                  screen={screen}
                  index={i + 1}
                  variant="hero"
                  priority={i < 6}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── filter chip group ─────────────────── */

function FilterGroup({
  label,
  options,
  param,
  current,
  onSelect,
  formatLabel,
}: {
  label: string;
  options: readonly string[];
  param: keyof Filters;
  current?: string;
  onSelect: (param: keyof Filters, value: string | undefined) => void;
  formatLabel?: (v: string) => string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-meta">{label}</p>
      <ul className="flex flex-col gap-1.5">
        <li>
          <FilterButton active={!current} onClick={() => onSelect(param, undefined)}>
            All
          </FilterButton>
        </li>
        {options.map((opt) => (
          <li key={opt}>
            <FilterButton
              active={current === opt}
              onClick={() => onSelect(param, opt)}
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
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
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
        <span aria-hidden className="mr-1.5">
          ·
        </span>
      )}
      {children}
    </button>
  );
}
