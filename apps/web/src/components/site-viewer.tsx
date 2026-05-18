"use client";

/**
 * Master-detail viewer for /sites/[slug].
 *
 * Hero plate scrolls naturally in the main column; a sticky thumbnail
 * rail on the right lists every page on the site. Click a thumb to
 * swap which page is "active" in the main viewer — URL syncs via
 * ?page=<slug> so the choice is deep-linkable. Arrow keys cycle
 * between pages without leaving the page.
 *
 * Mobile: the rail collapses into a horizontal scroll strip above the
 * main viewer so the user sees the page-set up front without
 * dragging a column into view.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ScreenSummary } from "@inspo/shared";

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
  // Flat order: hero first, then every other page in the order the
  // server already sorted them.
  const flat = useMemo<ScreenSummary[]>(() => {
    const sub = pages.filter((p) => p.slug !== hero.slug);
    return [hero, ...sub];
  }, [hero, pages]);

  const [activeIdx, setActiveIdx] = useState(0);

  // Hydrate from ?page=<slug> on first mount.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("page");
    if (!initial) return;
    const i = flat.findIndex((p) => p.slug === initial);
    if (i >= 0) setActiveIdx(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync without forcing a re-render.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeIdx === 0) {
      url.searchParams.delete("page");
    } else {
      url.searchParams.set("page", flat[activeIdx]!.slug);
    }
    window.history.replaceState({}, "", url.toString());
  }, [activeIdx, flat]);

  // Arrow-key navigation between pages — only when the focus isn't
  // in an input, so typing in ⌘K or other forms doesn't trigger it.
  const step = useCallback((delta: number) => {
    setActiveIdx((i) => Math.min(flat.length - 1, Math.max(0, i + delta)));
  }, [flat.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        step(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const active = flat[activeIdx]!;

  return (
    <div className="mx-auto max-w-[120rem] px-6 sm:px-10">
      <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-12">
        {/* MAIN VIEWER ──────────────────────────────────────── */}
        <div className="lg:col-span-9 lg:col-start-1 order-2 lg:order-1">
          <div className="overflow-hidden border rule bg-[color-mix(in_oklab,var(--color-fg)_4%,var(--color-bg))]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={active.slug}
              src={active.fullPageUrl ?? active.imageUrl}
              alt={active.description}
              className="h-auto w-full"
              loading="eager"
              decoding="async"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-meta">
            <span>
              {PAGE_TYPE_LABELS[active.pageType]} —{" "}
              <span className="normal-case tracking-normal text-[var(--color-fg-muted)]">
                {active.title || "untitled"}
              </span>
            </span>
            <Link
              href={`/screens/${active.slug}`}
              className="text-[var(--color-fg)] hover:text-[var(--color-link)]"
            >
              Open page detail →
            </Link>
          </div>
        </div>

        {/* THUMBNAIL RAIL — sticky on desktop, horizontal on mobile ─── */}
        <aside
          aria-label="Other pages on this site"
          className="
            lg:col-span-3 lg:col-start-10 order-1 lg:order-2
            lg:sticky lg:top-8 lg:self-start
            lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto
          "
        >
          <div className="flex items-baseline justify-between border-b rule pb-3">
            <p className="text-meta">{flat.length} pages</p>
            <p className="text-meta hidden lg:block normal-case tracking-normal text-[var(--color-fg-muted)]">
              ↑ / ↓ to navigate
            </p>
          </div>

          <ul
            className="
              mt-3 flex gap-3 overflow-x-auto pb-2 -mx-1 px-1
              lg:mx-0 lg:flex-col lg:gap-2 lg:overflow-x-visible lg:px-0 lg:pb-0
            "
          >
            {flat.map((p, i) => (
              <li
                key={p.slug}
                className="shrink-0 w-44 lg:w-auto"
              >
                <button
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  aria-current={i === activeIdx ? "true" : undefined}
                  className={`
                    group w-full text-left
                    flex flex-col lg:flex-row gap-2 lg:gap-3
                    border-l-2 lg:py-2 lg:pl-3 lg:pr-2
                    transition-colors duration-200
                    ${
                      i === activeIdx
                        ? "border-[var(--color-link)]"
                        : "border-transparent hover:border-[var(--color-fg)]/40"
                    }
                  `}
                >
                  <div
                    className={`
                      relative aspect-[4/3] w-full lg:w-20 shrink-0 overflow-hidden
                      border rule
                      transition-opacity duration-200
                      ${i === activeIdx ? "opacity-100" : "opacity-75 group-hover:opacity-100"}
                    `}
                    style={{
                      background: `linear-gradient(135deg, ${p.palette[0] ?? "#eee"}, ${p.palette[2] ?? p.palette[1] ?? "#ddd"})`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.thumbUrl}
                      alt=""
                      className="h-full w-full object-cover object-top"
                      loading={i < 4 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`
                        text-meta truncate
                        ${i === activeIdx ? "text-[var(--color-link)]" : "text-[var(--color-fg)]"}
                      `}
                    >
                      {PAGE_TYPE_LABELS[p.pageType]}
                    </p>
                    <p className="font-mono text-[0.65rem] uppercase tracking-wider truncate text-[var(--color-fg-muted)]">
                      {String(i + 1).padStart(2, "0")} / {String(flat.length).padStart(2, "0")}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
